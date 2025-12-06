from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, Task, Submission, User
from ..ai_services import generate_ai_feedback

student_bp = Blueprint('student', __name__)

@student_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get all tasks for the current student"""
    current_user = get_jwt_identity()
    user_id = current_user['id']

    # Get user to verify they are a student
    user = User.query.get(user_id)
    if not user or not isinstance(user, Student):
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

    tasks = Task.query.all()

    # Add submission status for each task
    tasks_data = []
    for task in tasks:
        submission = Submission.query.filter_by(task_id=task.id, student_id=user_id).first()
        task_data = {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'difficulty': task.difficulty,
            'dueDate': task.due_date.isoformat() if task.due_date else None,
            'createdAt': task.created_at.isoformat() if task.created_at else None,
            'isDone': submission is not None and submission.status == 'submitted',
            'questions': [
                {
                    'id': q.id,
                    'questionText': q.question_text,
                    'questionType': q.question_type,
                    'hint': q.hint,
                    'sampleAnswer': q.sample_answer
                } for q in task.questions
            ] if task.questions else []
        }
        tasks_data.append(task_data)

    return jsonify({'tasks': tasks_data}), 200

@student_bp.route('/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get a specific task details"""
    current_user = get_jwt_identity()
    user_id = current_user['id']

    user = User.query.get(user_id)
    if not user or not isinstance(user, Student):
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

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
                'id': q.id,
                'questionText': q.question_text,
                'questionType': q.question_type,
                'hint': q.hint,
                'sampleAnswer': q.sample_answer
            } for q in task.questions
        ] if task.questions else [],
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
    current_user = get_jwt_identity()
    user_id = current_user['id']

    user = User.query.get(user_id)
    if not user or not isinstance(user, Student):
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

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
def get_submission_detail(submission_id):
    """Get detailed submission with AI feedback"""
    current_user = get_jwt_identity()
    user_id = current_user['id']

    user = User.query.get(user_id)
    if not user or not isinstance(user, Student):
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404

    # Ensure student owns this submission
    if submission.student_id != user_id:
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
def submit_test(task_id):
    """Submit or save a test"""
    current_user = get_jwt_identity()
    user_id = current_user['id']

    user = User.query.get(user_id)
    if not user or not isinstance(user, Student):
        return jsonify({'error': 'Unauthorized. Student access required.'}), 403

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
