from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..ai_services import generate_ai_feedback
from app.utils.permissions import role_required
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.task import Task, TaskQuestion
from app.models import User, StudentProfile, Submission
from app.extensions import db
import json

student_bp = Blueprint('student', __name__)
def get_current_user_id():
    identity = get_jwt_identity()
    return identity.get("id") if isinstance(identity, dict) else identity

def is_submission_published(submission):
    """Only expose grading results to students after teacher confirms/sends."""
    return submission.status == 'teacher_graded'

def has_teacher_result(submission):
    return (
        submission.teacher_score is not None
        or bool(submission.teacher_feedback)
        or bool(submission.word_file_path)
    )

def parse_feedback_text(feedback_text):
    if not feedback_text:
        return {}
    try:
        return json.loads(feedback_text)
    except:
        return {'feedback_text': feedback_text}

def student_visible_grading_fields(submission, experimental_group):
    """Return the result students are allowed to see.

    Transitional rule:
    - If a submission already has a real teacher result, show that result regardless of user group.
    - Otherwise, only show group-specific results after the teacher publishes/sends.
    """
    if has_teacher_result(submission):
        teacher_feedback = parse_feedback_text(submission.teacher_feedback)

        return {
            'aiScore': None,
            'teacherScore': submission.teacher_score,
            'aiFeedback': {},
            'teacherFeedback': teacher_feedback,
            'word_file_path': submission.word_file_path,
        }

    if not is_submission_published(submission):
        return {
            'aiScore': None,
            'teacherScore': None,
            'aiFeedback': {},
            'teacherFeedback': {},
            'word_file_path': None,
        }

    if experimental_group == 'control':
        return {
            'aiScore': None,
            'teacherScore': None,
            'aiFeedback': {},
            'teacherFeedback': {},
            'word_file_path': None,
        }

    ai_feedback = parse_feedback_text(submission.ai_feedback)

    return {
        'aiScore': submission.ai_score,
        'teacherScore': None,
        'aiFeedback': ai_feedback,
        'teacherFeedback': {},
        'word_file_path': None,
    }

@student_bp.route("/tasks", methods=["GET"]) # Bỏ OPTIONS vì CORS đã lo
@jwt_required()
@role_required("student")
def get_tasks():
    user_id = get_current_user_id()
    
    # Sử dụng .get() và ép kiểu int cho ID
    user = User.query.get(int(user_id))
    print("user",user)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    now = datetime.utcnow()
    tasks = Task.query.filter(
        db.or_(
            Task.start_date <= now,
            Task.start_date.is_(None)
        )
    ).all()
    tasks_data = []

    for task in tasks:
        submission = Submission.query.filter_by(
            task_id=task.id,
            student_id=user_id
        ).first()

        # Get questions from task_questions relationship
        questions = [tq.question_bank for tq in sorted(task.task_questions, key=lambda x: x.order)]

        tasks_data.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "difficulty": task.difficulty,
            "taskTypeId": task.task_type_id,
            "dueDate": task.due_date.isoformat() if task.due_date else None,
"isDone": submission is not None and submission.status != "draft",
            "attemptCount": submission.attempt_count if submission else 1,
            "questions": [
                {
                    "id": q.id,
                    "questionText": q.content,
                    "questionType": q.sub_genre.name_jp,
                    "hint": q.sub_topic.name_jp,
                } for q in questions
            ]
        })

    return jsonify({"tasks": tasks_data}), 200

@student_bp.route('/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
@role_required("student")
def get_task(task_id):
    """Get a specific task details"""
    user_id = get_current_user_id()

    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Get existing submission if any
    submission = Submission.query.filter_by(task_id=task.id, student_id=user_id).first()

    # Get questions from task_questions relationship
    questions = [tq.question_bank for tq in sorted(task.task_questions, key=lambda x: x.order)]

    task_data = {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'difficulty': task.difficulty,
        'taskTypeId': task.task_type_id,
        'dueDate': task.due_date.isoformat() if task.due_date else None,
        'createdAt': task.created_at.isoformat() if task.created_at else None,
        'questions': [
            {
                'id': q.id,
                'questionText': q.content,
                'questionType': q.sub_genre.name_jp,
                'hint': q.sub_topic.name_jp,
                'sampleAnswer': None
            } for q in questions
        ],
        'submission': {
            'id': submission.id,
            'content': submission.content,
            'status': submission.status,
            'createdAt': submission.created_at.isoformat() if submission.created_at else None,
            'updatedAt': submission.updated_at.isoformat() if submission.updated_at else None
        } if submission else None
    }

    return jsonify({'task': task_data}), 200

@student_bp.route('/submissions', methods=['GET'])
@jwt_required()
def get_submissions():
    """Get all submissions for the current student"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role != 'student':
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

    submissions = Submission.query.filter_by(student_id=user_id).all()

    submissions_data = []
    for sub in submissions:
        task_obj = Task.query.get(sub.task_id) if sub.task_id else None
        visible_grading = student_visible_grading_fields(sub, user.experimental_group)
        submissions_data.append({
            'id': sub.id,
            'experimental_group': user.experimental_group,
            'task': {
                'id': task_obj.id if task_obj else None,
                'title': task_obj.title if task_obj else None
            } if task_obj else None,
            'content': sub.content,
            'status': sub.status,
            'aiScore': visible_grading['aiScore'],
            'teacherScore': visible_grading['teacherScore'],
            'attemptCount': sub.attempt_count,
            'aiFeedback': visible_grading['aiFeedback'],
            'teacherFeedback': visible_grading['teacherFeedback'],
            'lateMinutes': sub.late_minutes,
            'createdAt': sub.created_at.isoformat() if sub.created_at else None,
            'updatedAt': sub.updated_at.isoformat() if sub.updated_at else None
        })

    return jsonify({'submissions': submissions_data}), 200

@student_bp.route('/submissions/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission_detail(submission_id):
    # ... (giữ nguyên phần kiểm tra user và submission) ...
    user_id = get_jwt_identity()
    submission = Submission.query.get(submission_id)
    if not submission or submission.student_id != int(user_id):
        return jsonify({'error': 'Unauthorized or not found'}), 404

    task_obj = Task.query.get(submission.task_id) if submission.task_id else None
    visible_grading = student_visible_grading_fields(submission, submission.student.experimental_group)
    
    submission_data = {
        'id': submission.id,
        'experimental_group': submission.student.experimental_group,
        'task': {
            'id': task_obj.id if task_obj else None,
            'title': task_obj.title if task_obj else None,
            'description': task_obj.description if task_obj else None
        } if task_obj else None,
        'content': submission.content,
        'status': submission.status,
        'aiScore': visible_grading['aiScore'],
        'teacherScore': visible_grading['teacherScore'],
        'aiFeedback': visible_grading['aiFeedback'],
        'teacherFeedback': visible_grading['teacherFeedback'],
        'word_file_path': visible_grading['word_file_path'],
        'createdAt': submission.created_at.isoformat() if submission.created_at else None,
        'updatedAt': submission.updated_at.isoformat() if submission.updated_at else None
    }

    return jsonify({'submission': submission_data}), 200

@student_bp.route('/submissions/<int:submission_id>/grade', methods=['PATCH'])
@jwt_required()
def grade_submission(submission_id):
    """Re-grade submission with AI if variant group"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role != 'student':
        return jsonify({'error': 'Unauthorized.'}), 403

    submission = Submission.query.get(submission_id)
    if not submission or submission.student_id != int(user_id):
        return jsonify({'error': 'Not found.'}), 404

    if submission.student.experimental_group != 'variant':
        return jsonify({'error': 'AI grading only for variant group.'}), 403

    task = Task.query.get(submission.task_id)
    if not task or task.task_type_id is None:
        return jsonify({'error': 'Task missing task_type_id.'}), 400

    try:
        print(f"[RE-GRADE] Task type: {task.task_type_id}, Content len: {len(submission.content)}")
        ai_feedback_data = generate_ai_feedback(submission.content, task=task)
        submission.ai_feedback = json.dumps(ai_feedback_data)
        submission.ai_score = ai_feedback_data.get('overall_score', ai_feedback_data.get('total_score', 0))
        submission.status = 'ai_graded'
        submission.updated_at = datetime.utcnow()
        db.session.commit()
        print(f"[RE-GRADE] Success: {submission.ai_score} ({ai_feedback_data.get('grading_method', 'unknown')})")
        return jsonify({'message': 'Graded successfully', 'ai_score': submission.ai_score}), 200
    except Exception as e:
        print(f"[RE-GRADE] Failed: {e}")
        return jsonify({'error': 'Grading failed.'}), 500

    # Ensure student owns this submission
    if submission.student_id != int(user_id):
        return jsonify({'error': 'Unauthorized. You can only view your own submissions.'}), 403

    # Parse AI feedback JSON
    ai_feedback = {}
    if submission.ai_feedback:
        try:
            ai_feedback = json.loads(submission.ai_feedback)
        except:
            ai_feedback = {'feedback_text': submission.ai_feedback}

    task_obj = Task.query.get(submission.task_id) if submission.task_id else None
    submission_data = {
        'id': submission.id,
        'experimental_group': submission.student.experimental_group,
        'task': {
            'id': task_obj.id if task_obj else None,
            'title': task_obj.title if task_obj else None,
            'description': task_obj.description if task_obj else None
        } if task_obj else None,
        'content': submission.content,
        'status': submission.status,
        'aiScore': submission.ai_score,
        'teacherScore': submission.teacher_score,
        'aiFeedback': ai_feedback,
        'teacherFeedback': submission.teacher_feedback,
        'createdAt': submission.created_at.isoformat() if submission.created_at else None,
        'updatedAt': submission.updated_at.isoformat() if submission.updated_at else None
    }

    return jsonify({'submission': submission_data}), 200


# @student_bp.route('/submit-test/<int:task_id>', methods=['POST'])
# @jwt_required()
# def submit_test(task_id):
#     """Submit or save a test"""
#     user_id = get_jwt_identity()
#     user = User.query.get(int(user_id))
#     if not user or user.role != 'student':
#         return jsonify({'error': 'Unauthorized. Student access required.'}), 403

#     data = request.get_json()
#     if not data or 'content' not in data:
#         return jsonify({'error': 'Content is required'}), 400

#     content = data['content']
#     action = data.get('action', 'submit')  # 'save' or 'submit'

#     # Check if submission already exists
#     submission = Submission.query.filter_by(task_id=task_id, student_id=user_id).order_by(Submission.id.desc()).first()

#     if submission and submission.status == 'teacher_graded' and submission.attempt_count >= 2:
#         return jsonify({'error': 'Maximum 2 attempts reached'}), 409

#     if submission and submission.status == 'submitted':
#         return jsonify({'error': 'Already submitted, waiting for grading'}), 409

#     if not submission:
#         submission = Submission(
#             task_id=task_id,
#             student_id=user_id,
#             content=content,
#             status='draft'
#         )
#         db.session.add(submission)
#     else:
#         submission.content = content

#     # Handle save vs submit
#     if action == 'submit':
#         if submission and submission.status == 'teacher_graded' and submission.attempt_count < 2:
#             submission.attempt_count += 1
#         # Đặt mặc định là 'submitted' cho control group hoặc lỡ AI lỗi
#         submission.status = 'submitted'

#     # A/B test: AI only for variant group (safe student load)
#     student = User.query.get(submission.student_id)
#     if student and student.experimental_group == 'variant':
#         try:
#             task = Task.query.get(task_id)
#             print(f"[SUBMIT-TEST] Variant AI - Task: {task.task_type_id if task else None}")
#             ai_feedback_data = generate_ai_feedback(content, task=task, difficulty=task.difficulty or 'N5')
#             submission.ai_feedback = json.dumps(ai_feedback_data)
#             submission.ai_score = ai_feedback_data.get('overall_score', ai_feedback_data.get('total_score', 0))
#             print(f"[SUBMIT-TEST] Variant AI score: {submission.ai_score}")
            
#             # 👉 THÊM ĐOẠN NÀY: Nếu nộp bài và AI chấm thành công, đổi status thành ai_graded
#             if action == 'submit':
#                 submission.status = 'ai_graded'
                
#         except Exception as e:
#             print(f"[SUBMIT-TEST] Variant AI failed: {e}")
#             submission.ai_feedback = json.dumps({
#                 'feedback_text': 'AI grading error - waiting teacher',
#                 'overall_score': 0,
#                 'grading_method': 'ai_error'
#             })
#             # Nếu AI lỗi, status vẫn giữ nguyên là 'submitted' để chờ giáo viên
#     else:
#         print(f"[SUBMIT-TEST] Control/unknown group - skip AI, wait teacher")
#         submission.ai_feedback = json.dumps({
#             'feedback_text': 'Control group - Đợi giáo viên chấm điểm',
#             'overall_score': None,
#             'grading_method': 'control_wait_teacher'
#         })
#         # Control group không có AI, giữ nguyên status 'submitted'

#     submission.updated_at = datetime.utcnow()
#     if action == 'submit':
#         task = Task.query.get(task_id)
#         if task and task.due_date and datetime.utcnow() > task.due_date:
#             delta = datetime.utcnow() - task.due_date
#             submission.late_minutes = max(0, delta.total_seconds() / 60.0)
#         else:
#             submission.late_minutes = 0.0
#     db.session.commit()

#     message = 'Draft saved successfully' if action == 'save' else 'Test submitted successfully'

#     return jsonify({
#         'message': message,
#         'submission': {
#             'id': submission.id,
#             'status': submission.status,
#             'aiScore': submission.ai_score
#         }
#     }), 200

@student_bp.route('/submit-test/<int:task_id>', methods=['POST'])
@jwt_required()
def submit_test(task_id):
    """Submit or save a test"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role != 'student':
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'error': 'Content is required'}), 400

    content = data['content']
    action = data.get('action', 'submit')  # 'save' or 'submit'

    # Check if submission already exists
    submission = Submission.query.filter_by(task_id=task_id, student_id=user_id).order_by(Submission.id.desc()).first()

    if submission and submission.status == 'teacher_graded' and submission.attempt_count >= 2:
        return jsonify({'error': 'Maximum 2 attempts reached'}), 409

    if submission and submission.status == 'submitted':
        return jsonify({'error': 'Already submitted, waiting for grading'}), 409

    # Create new draft or update existing submission
    if not submission:
        submission = Submission(
            task_id=task_id,
            student_id=user_id,
            content=content,
            status='draft'
        )
        db.session.add(submission)
    else:
        submission.content = content

    # Handle save vs submit
    if action == 'submit':
        if submission and submission.status == 'teacher_graded' and submission.attempt_count < 2:
            submission.attempt_count += 1
        
        # Chỉ chuyển trạng thái thành chờ chấm điểm
        submission.status = 'submitted'

    # Tính toán thời gian nộp trễ (nếu có)
    submission.updated_at = datetime.utcnow()
    if action == 'submit':
        task = Task.query.get(task_id)
        if task and task.due_date and datetime.utcnow() > task.due_date:
            delta = datetime.utcnow() - task.due_date
            submission.late_minutes = max(0, delta.total_seconds() / 60.0)
        else:
            submission.late_minutes = 0.0

        if user.experimental_group == 'variant' and task and task.task_type_id is not None:
            try:
                ai_feedback_data = generate_ai_feedback(
                    content,
                    task=task,
                    difficulty=task.difficulty or 'N3'
                )
                submission.ai_feedback = json.dumps(ai_feedback_data, ensure_ascii=False)
                submission.ai_score = ai_feedback_data.get('overall_score', ai_feedback_data.get('total_score', 0))
                submission.status = 'ai_graded'
            except Exception as e:
                print(f"[SUBMIT-TEST] AI grading failed: {e}")
            
    db.session.commit()

    message = 'Draft saved successfully' if action == 'save' else 'Test submitted successfully'

    return jsonify({
        'message': message,
        'submission': {
            'id': submission.id,
            'status': submission.status,
            'aiScore': submission.ai_score
        }
    }), 200
