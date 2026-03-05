from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.task import Task, TaskQuestion
from app.models.question_bank import QuestionBank
from app.extensions import db
from ..ai_services import generate_ai_feedback
from app.utils.permissions import role_required

teacher_bp = Blueprint('teacher', __name__)

def get_current_user_id():
    identity = get_jwt_identity()
    return identity.get("id") if isinstance(identity, dict) else identity

@teacher_bp.route('/tasks', methods=['GET'])
@jwt_required()
@role_required('teacher')
def get_teacher_tasks():
    """
    Get all tasks created by the current teacher.
    """
    try:
        user_id = get_current_user_id()
        tasks = Task.query.filter_by(created_by=user_id).all()
        
        tasks_data = []
        for task in tasks:
            question_count = len(task.task_questions)
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'difficulty': task.difficulty,
                'dueDate': task.due_date.isoformat() if task.due_date else None,
                'createdAt': task.created_at.isoformat() if task.created_at else None,
                'isDone': task.is_done,
                'questionCount': question_count
            })
        
        return jsonify({
            'success': True,
            'tasks': tasks_data,
            'total': len(tasks_data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching teacher tasks: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@teacher_bp.route('/tasks', methods=['POST'])
@jwt_required()
@role_required('teacher')
def create_task():
    """
    Create a new task with selected questions from QuestionBank.
    Request body: {
        "title": "string",
        "description": "string",
        "difficulty": "string",
        "dueDate": "string (ISO format)",
        "questionBankIds": [int, int, ...]
    }
    """
    try:
        user_id = get_current_user_id()

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Validate required fields
        required_fields = ['title', 'description', 'difficulty', 'questionBankIds']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        title = data['title']
        description = data['description']
        difficulty = data['difficulty']
        due_date_str = data.get('dueDate')
        question_bank_ids = data['questionBankIds']

        # Validate question_bank_ids
        if not isinstance(question_bank_ids, list) or len(question_bank_ids) == 0:
            return jsonify({'error': 'questionBankIds must be a non-empty array'}), 400

        # Check if all question_bank_ids exist
        questions = QuestionBank.query.filter(QuestionBank.id.in_(question_bank_ids)).all()
        if len(questions) != len(question_bank_ids):
            return jsonify({'error': 'One or more question_bank_ids do not exist'}), 400

        # Parse due date
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid dueDate format. Use ISO format.'}), 400

        # Create task
        new_task = Task(
            title=title,
            description=description,
            difficulty=difficulty,
            due_date=due_date,
            created_by=user_id
        )

        db.session.add(new_task)
        db.session.flush()

        # Create TaskQuestion relationships
        for order, qid in enumerate(question_bank_ids, 1):
            task_question = TaskQuestion(
                task_id=new_task.id,
                question_bank_id=qid,
                order=order
            )
            db.session.add(task_question)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Task created successfully',
            'task': {
                'id': new_task.id,
                'title': new_task.title,
                'description': new_task.description,
                'difficulty': new_task.difficulty,
                'dueDate': new_task.due_date.isoformat() if new_task.due_date else None,
                'createdAt': new_task.created_at.isoformat(),
                'questionCount': len(question_bank_ids)
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating task: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
