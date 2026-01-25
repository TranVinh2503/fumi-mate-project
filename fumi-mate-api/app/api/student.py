from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json
from ..ai_services import generate_ai_feedback
from app.utils.permissions import role_required
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.task import Task, TaskQuestion
from app.models.user import User
from app.models.submission import Submission
from app.extensions import db

student_bp = Blueprint('student', __name__)

@student_bp.route("/tasks", methods=["GET", "OPTIONS"])
@jwt_required()
@role_required("student")
def get_tasks():
    identity = get_jwt_identity()
    
    # Nếu identity là dict: lấy 'id'. Nếu là string: dùng luôn.
    user_id = identity.get("id") if isinstance(identity, dict) else identity
    print("user_id", user_id)
    # Ép kiểu int để query DB
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    tasks = Task.query.all()
    tasks_data = []

    for task in tasks:
        submission = Submission.query.filter_by(
            task_id=task.id,
            student_id=user_id
        ).first()

        tasks_data.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "difficulty": task.difficulty,
            "dueDate": task.due_date.isoformat() if task.due_date else None,
            "createdAt": task.created_at.isoformat() if task.created_at else None,
            "isDone": submission is not None and submission.status == "submitted",
            "questions": [
                {
                    "id": q.question_bank.id,
                    "questionText": q.question_bank.question_text,
                    "questionType": q.question_bank.question_type,
                    "hint": q.question_bank.hint,
                    "sampleAnswer": q.question_bank.sample_answer,
                }
                for q in sorted(task.task_questions, key=lambda x: x.order)
            ]
        })

    return jsonify({"tasks": tasks_data}), 200

@student_bp.route('/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
@role_required("student")
def get_task(task_id):
    """Get a specific task details"""
    identity = get_jwt_identity()
    user_id = identity.get("id") if isinstance(identity, dict) else identity
    
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Get existing submission if any
    submission = Submission.query.filter_by(task_id=task.id, student_id=user_id).first()

    task_data = {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'difficulty': task.difficulty,
        'dueDate': task.due_date.isoformat() if task.due_date else None,
        'createdAt': task.created_at.isoformat() if task.created_at else None,
        'questions': [
            {
                'id': q.question_bank.id,
                'questionText': q.question_bank.question_text,
                'questionType': q.question_bank.question_type,
                'hint': q.question_bank.hint,
                'sampleAnswer': q.question_bank.sample_answer,
            }
            for q in sorted(task.task_questions, key=lambda x: x.order)
        ] if task.task_questions else [],
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
@role_required("student")
def get_submissions():
    """Get all submissions for the current student"""
    identity = get_jwt_identity()
    user_id = identity.get("id") if isinstance(identity, dict) else identity

    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    submissions = Submission.query.filter_by(student_id=user_id).all()

    submissions_data = []
    for sub in submissions:
        submissions_data.append({
            'id': sub.id,
            'task': {
                'id': sub.task.id,
                'title': sub.task.title
            } if sub.task else None,
            'content': sub.content,
            'status': sub.status,
            'aiScore': sub.ai_score,
            'teacherScore': sub.teacher_score,
            'aiFeedback': sub.ai_feedback,
            'teacherFeedback': sub.teacher_feedback,
            'createdAt': sub.created_at.isoformat() if sub.created_at else None,
            'updatedAt': sub.updated_at.isoformat() if sub.updated_at else None
        })

    return jsonify({'submissions': submissions_data}), 200

@student_bp.route('/submissions/<int:submission_id>', methods=['GET'])
@jwt_required()
@role_required("student")
def get_submission_detail(submission_id):
    """Get detailed submission with AI feedback"""
    identity = get_jwt_identity()
    user_id = identity.get("id") if isinstance(identity, dict) else identity

    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404

    # Ensure student owns this submission
    if str(submission.student_id) != str(user_id):
        return jsonify({'error': 'Unauthorized. You can only view your own submissions.'}), 403

    # Parse AI feedback JSON
    ai_feedback = {}
    if submission.ai_feedback:
        try:
            ai_feedback = json.loads(submission.ai_feedback)
        except:
            ai_feedback = {'feedback_text': submission.ai_feedback}

    submission_data = {
        'id': submission.id,
        'task': {
            'id': submission.task.id,
            'title': submission.task.title,
            'description': submission.task.description
        } if submission.task else None,
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

@student_bp.route('/submit-test/<int:task_id>', methods=['POST'])
@jwt_required()
@role_required("student")
def submit_test(task_id):
    """Submit or save a test"""
    identity = get_jwt_identity()
    user_id = identity.get("id") if isinstance(identity, dict) else identity

    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'error': 'Content is required'}), 400

    content = data['content']
    action = data.get('action', 'submit')  # 'save' or 'submit'

    # Check if submission already exists
    submission = Submission.query.filter_by(task_id=task_id, student_id=user_id).first()

    if submission and submission.status == 'submitted':
        return jsonify({'error': 'You have already submitted this test'}), 409

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
        submission.status = 'submitted'

        # Generate AI feedback
        try:
            task = Task.query.get(task_id)
            ai_feedback_data = generate_ai_feedback(content, task.difficulty if task else 'N5')
            submission.ai_feedback = json.dumps(ai_feedback_data)
            submission.ai_score = ai_feedback_data.get('overall_score', 0)
        except Exception as e:
            print(f"AI feedback generation failed: {e}")
            submission.ai_feedback = json.dumps({'feedback_text': 'AI feedback generation failed', 'overall_score': 0})

    submission.updated_at = datetime.utcnow()
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

