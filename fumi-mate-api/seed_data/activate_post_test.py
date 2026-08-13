import argparse
import json
import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.question_bank import QuestionBank
from app.models.task import Task, TaskQuestion
from app.models.user import User


POST_TEST_TITLE = 'Post-test'
POST_TEST_HASH = 'timeline_hash_Post-test'
DEFAULT_TEACHER_USERNAME = 'teacher_admin'


def load_pre_post_task():
    json_path = os.path.join(os.path.dirname(__file__), '../../docs/writing_tasks.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    task = next(
        (item for item in data.get('tasks', []) if item.get('topic_code') == 'pre_post_test'),
        None
    )
    if not task:
        raise RuntimeError('Không tìm thấy pre_post_test trong docs/writing_tasks.json')
    return task


def resolve_teacher(username):
    query = User.query.filter_by(role='teacher')
    if username:
        query = query.filter_by(username=username)
    teacher = query.first()
    if not teacher:
        raise RuntimeError('Không tìm thấy tài khoản giáo viên để gán Post-test')
    return teacher


def parse_date(value, fallback):
    if not value:
        return fallback
    return datetime.fromisoformat(value)


def activate_post_test(start_date=None, due_date=None, teacher_username=DEFAULT_TEACHER_USERNAME):
    task_data = load_pre_post_task()
    teacher = resolve_teacher(teacher_username)
    now = datetime.utcnow()
    start_date = start_date or now
    due_date = due_date or (start_date + timedelta(days=7))

    question = QuestionBank.query.filter_by(similarity_hash=POST_TEST_HASH).first()
    requirements_payload = {
        'timeline': POST_TEST_TITLE,
        'requirements': task_data.get('requirements', {})
    }

    if not question:
        question = QuestionBank(
            sub_genre_id=1,
            sub_topic_id=1,
            content=task_data.get('title') or task_data.get('prompt_ja'),
            level=3,
            required_points=json.dumps(requirements_payload, ensure_ascii=False),
            similarity_hash=POST_TEST_HASH
        )
        db.session.add(question)
    else:
        question.content = task_data.get('title') or task_data.get('prompt_ja')
        question.required_points = json.dumps(requirements_payload, ensure_ascii=False)
        question.level = 3

    task = Task.query.filter_by(title=POST_TEST_TITLE).first()
    if not task:
        task = Task(title=POST_TEST_TITLE)
        db.session.add(task)

    task.description = task_data.get('prompt_ja', '')[:100] + '...'
    task.difficulty = 'N3'
    task.task_type_id = int(task_data['id'])
    task.start_date = start_date
    task.due_date = due_date
    task.created_by = teacher.id
    task.is_done = False
    task.assigned_students = None

    db.session.flush()

    existing_link = TaskQuestion.query.filter_by(task_id=task.id, question_bank_id=question.id).first()
    if not existing_link:
        TaskQuestion.query.filter_by(task_id=task.id).delete()
        db.session.add(TaskQuestion(task_id=task.id, question_bank_id=question.id, order=1))

    db.session.commit()
    return task, teacher


def main():
    parser = argparse.ArgumentParser(description='Create or activate Post-test for students.')
    parser.add_argument('--start-date', help='ISO date/datetime. Default: now UTC.')
    parser.add_argument('--due-date', help='ISO date/datetime. Default: start date + 7 days.')
    parser.add_argument(
        '--teacher-username',
        default=DEFAULT_TEACHER_USERNAME,
        help=f'Teacher username to own the task. Default: {DEFAULT_TEACHER_USERNAME}.'
    )
    args = parser.parse_args()

    start_date = parse_date(args.start_date, None)
    due_date = parse_date(args.due_date, None)

    app = create_app()
    with app.app_context():
        task, teacher = activate_post_test(
            start_date=start_date,
            due_date=due_date,
            teacher_username=args.teacher_username
        )
        print(
            f"Post-test active: id={task.id}, teacher={teacher.username}, "
            f"start={task.start_date.isoformat()}, due={task.due_date.isoformat()}, "
            f"task_type_id={task.task_type_id}"
        )


if __name__ == '__main__':
    main()
