import argparse
import json
import os
import sys
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.ai_grading_result import AIGradingResult
from app.models.submission import Submission
from app.models.task import Task
from app.models.user import User
from app.services.gemini_service import get_writing_task_info
from app.services.openai_service import grade_writing_submission_openai


DEFAULT_STATUSES = ('submitted', 'ai_graded', 'ai_teacher_graded', 'teacher_graded')


def get_grading_task_type_id(task):
    if task and task.task_type_id is not None:
        return task.task_type_id
    if task and (task.title or '').strip().lower() in {'pre-test', 'post-test'}:
        return 0
    return None


def make_ai_grading_result(submission_id, feedback_data, latency_ms=None):
    raw_response = feedback_data.pop('_raw_response', None)
    service_latency_ms = feedback_data.pop('_latency_ms', None)
    grading_method = feedback_data.get('grading_method', '')
    error_reason = feedback_data.get('error_reason')
    status = 'fallback' if error_reason or 'fallback' in grading_method else 'succeeded'

    return AIGradingResult(
        submission_id=submission_id,
        provider='openai',
        model=feedback_data.get('model') or os.getenv('OPENAI_MODEL', 'gpt-4.1-mini'),
        prompt_version=feedback_data.get('prompt_version') or 'rubric_7criteria_v2_strict',
        rubric_version=feedback_data.get('rubric_version') or 'writing_rubric_2026_7criteria',
        status=status,
        total_score=float(feedback_data.get('overall_score', feedback_data.get('total_score', 0)) or 0),
        feedback_json=json.dumps(feedback_data, ensure_ascii=False),
        raw_response=raw_response,
        error_reason=error_reason,
        latency_ms=service_latency_ms or latency_ms,
        is_selected=False,
    )


def make_failed_ai_result(submission_id, error_reason, latency_ms=0):
    return AIGradingResult(
        submission_id=submission_id,
        provider='openai',
        model=os.getenv('OPENAI_MODEL', 'gpt-4.1-mini'),
        prompt_version='rubric_7criteria_v2_strict',
        rubric_version='writing_rubric_2026_7criteria',
        status='failed',
        total_score=None,
        feedback_json=None,
        raw_response=None,
        error_reason=error_reason,
        latency_ms=latency_ms,
        is_selected=False,
    )


def has_openai_result(submission):
    return any(
        result.provider == 'openai' and result.status in ('succeeded', 'fallback')
        for result in submission.ai_grading_results
    )


def query_targets(args):
    query = (
        Submission.query
        .join(User, Submission.student_id == User.id)
        .join(Task, Submission.task_id == Task.id)
        .filter(Submission.content.isnot(None))
        .filter(Submission.status.in_(args.statuses))
    )

    if args.experimental_group != 'all':
        query = query.filter(User.experimental_group == args.experimental_group)

    if args.task_title:
        query = query.filter(Task.title == args.task_title)

    submissions = query.order_by(Submission.id.asc()).all()
    targets = []
    skipped = []

    for submission in submissions:
        task = Task.query.get(submission.task_id)
        task_type_id = get_grading_task_type_id(task)

        if task_type_id is None or not get_writing_task_info(task_type_id):
            skipped.append((submission, 'missing_task_type_id'))
            continue

        if args.only_missing and has_openai_result(submission):
            skipped.append((submission, 'openai_exists'))
            continue

        targets.append((submission, task, task_type_id))

    if args.limit:
        targets = targets[:args.limit]

    return targets, skipped


def run_batch(args):
    targets, skipped = query_targets(args)
    print(f"Targets: {len(targets)} | Skipped: {len(skipped)} | only_missing={args.only_missing}")

    if args.dry_run:
        for submission, task, task_type_id in targets[:20]:
            print(f"DRY submission={submission.id} task={task.title} task_type_id={task_type_id} chars={len(submission.content or '')}")
        if len(targets) > 20:
            print(f"... and {len(targets) - 20} more")
        return

    if not os.getenv('OPENAI_API_KEY'):
        raise RuntimeError('OPENAI_API_KEY not found. Set it before running batch OpenAI grading.')

    succeeded = 0
    fallback = 0
    failed = 0

    for index, (submission, task, task_type_id) in enumerate(targets, start=1):
        print(f"[{index}/{len(targets)}] OpenAI grading submission={submission.id} task={task.title}")
        start_time = time.monotonic()
        try:
            feedback_data = grade_writing_submission_openai(
                task_type_id,
                submission.content or '',
                difficulty=task.difficulty or 'N3',
                timeout_seconds=args.timeout
            )
            latency_ms = int((time.monotonic() - start_time) * 1000)
            result = make_ai_grading_result(submission.id, feedback_data, latency_ms=latency_ms)
        except Exception as error:
            latency_ms = int((time.monotonic() - start_time) * 1000)
            result = make_failed_ai_result(submission.id, str(error), latency_ms=latency_ms)

        db.session.add(result)
        db.session.flush()

        if args.update_preview and result.feedback_json:
            feedback_json = json.loads(result.feedback_json)
            submission.ai_score = float(result.total_score or 0)
            submission.ai_feedback = json.dumps(feedback_json, ensure_ascii=False)
            submission.status = 'ai_teacher_graded'

        db.session.commit()

        if result.status == 'succeeded':
            succeeded += 1
        elif result.status == 'fallback':
            fallback += 1
        else:
            failed += 1

        print(f"  -> {result.status} score={result.total_score} latency_ms={result.latency_ms}")

        if args.sleep_seconds > 0:
            time.sleep(args.sleep_seconds)

    print(f"Done. succeeded={succeeded} fallback={fallback} failed={failed}")


def main():
    parser = argparse.ArgumentParser(description='Batch grade submissions with ChatGPT/OpenAI.')
    parser.add_argument('--dry-run', action='store_true', help='Only print target submissions.')
    parser.add_argument('--limit', type=int, help='Maximum number of submissions to grade.')
    parser.add_argument('--task-title', help='Only grade submissions for this exact task title.')
    parser.add_argument(
        '--experimental-group',
        choices=['all', 'control', 'variant'],
        default='all',
        help='Which student experimental group to grade. Default: all.'
    )
    parser.add_argument('--statuses', nargs='+', default=list(DEFAULT_STATUSES), help='Submission statuses to include.')
    parser.add_argument('--only-missing', action=argparse.BooleanOptionalAction, default=True, help='Skip submissions that already have an OpenAI result.')
    parser.add_argument('--update-preview', action='store_true', help='Also copy OpenAI result into submission.ai_score/ai_feedback.')
    parser.add_argument('--timeout', type=float, default=None, help='OpenAI request timeout seconds.')
    parser.add_argument('--sleep-seconds', type=float, default=0.0, help='Sleep between requests to avoid rate limits.')
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        run_batch(args)


if __name__ == '__main__':
    main()
