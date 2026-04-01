from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json
from app.models.task import Task, TaskQuestion
from app.models.question_bank import QuestionBank
from app.models.user import User
from app.models.submission import Submission
from app.extensions import db
from ..ai_services import generate_ai_feedback
from app.utils.permissions import role_required

teacher_bp = Blueprint('teacher', __name__)

def get_current_user_id():
    identity = get_jwt_identity()
    return identity.get("id") if isinstance(identity, dict) else identity

@teacher_bp.route('/students', methods=['GET'])
@jwt_required()
@role_required('teacher')
def get_students():
    """
    Get all students in the system.
    """
    try:
        # Get all users with role 'student'
        students = User.query.filter_by(role='student').all()
        
        students_data = []
        for student in students:
            students_data.append({
                'id': student.id,
                'username': student.username,
                'jlpt_level': student.student_profile.jlpt_level if student.student_profile else None,
                'total_points': student.student_profile.total_points if student.student_profile else 0
            })
        
        return jsonify({
            'success': True,
            'students': students_data,
            'total': len(students_data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching students: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

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
        "questionBankIds": [int, int, ...],
        "studentIds": [int, int, ...] (optional - if empty/null, task is visible to all students)
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
        student_ids = data.get('studentIds', [])  # Optional: list of student IDs to assign

        # Validate question_bank_ids
        if not isinstance(question_bank_ids, list) or len(question_bank_ids) == 0:
            return jsonify({'error': 'questionBankIds must be a non-empty array'}), 400

        # Check if all question_bank_ids exist
        questions = QuestionBank.query.filter(QuestionBank.id.in_(question_bank_ids)).all()
        if len(questions) != len(question_bank_ids):
            return jsonify({'error': 'One or more question_bank_ids do not exist'}), 400

        # Validate student_ids if provided
        if student_ids:
            if not isinstance(student_ids, list):
                return jsonify({'error': 'studentIds must be an array'}), 400
            # Check if all student_ids exist and are students
            students = User.query.filter(User.id.in_(student_ids), User.role == 'student').all()
            if len(students) != len(student_ids):
                return jsonify({'error': 'One or more student IDs do not exist or are not students'}), 400

        # Parse due date
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid dueDate format. Use ISO format.'}), 400

        # Create task with assigned students
        assigned_students_json = json.dumps(student_ids) if student_ids else None
        
        new_task = Task(
            title=title,
            description=description,
            difficulty=difficulty,
            due_date=due_date,
            created_by=user_id,
            assigned_students=assigned_students_json
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

@teacher_bp.route('/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
@role_required('teacher')
def get_task_detail(task_id):
    """
    Get a specific task details with questions and submissions.
    """
    try:
        user_id = get_current_user_id()
        
        # Get task and verify it belongs to current teacher
        task = Task.query.filter_by(id=task_id, created_by=user_id).first()
        
        if not task:
            return jsonify({'error': 'Task not found or access denied'}), 404
        
        # Get questions for this task
        questions_data = []
        for tq in sorted(task.task_questions, key=lambda x: x.order):
            q = tq.question_bank
            questions_data.append({
                'id': q.id,
                'content': q.content,
                'subGenre': {
                    'id': q.sub_genre_id,
                    'nameJp': q.sub_genre.name_jp,
                    'nameVn': q.sub_genre.name_vn
                },
                'subTopic': {
                    'id': q.sub_topic_id,
                    'nameJp': q.sub_topic.name_jp,
                    'nameVn': q.sub_topic.name_vn
                },
                'level': q.level
            })
        
        # Parse assigned students
        assigned_students = []
        if task.assigned_students:
            try:
                assigned_students = json.loads(task.assigned_students)
            except:
                assigned_students = []
        
        task_data = {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'difficulty': task.difficulty,
            'dueDate': task.due_date.isoformat() if task.due_date else None,
            'createdAt': task.created_at.isoformat() if task.created_at else None,
            'isDone': task.is_done,
            'questionCount': len(task.task_questions),
            'questions': questions_data,
            'assignedStudents': assigned_students
        }
        
        return jsonify({
            'success': True,
            'task': task_data
        }), 200
        
    except Exception as e:
        print(f"Error fetching task details: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@teacher_bp.route('/submissions', methods=['GET'])
@jwt_required()
@role_required('teacher')
def get_teacher_submissions():
    """
    Get all submissions for teacher's tasks
    """
    try:
        user_id = get_current_user_id()
        # Get teacher's tasks
        teacher_tasks = Task.query.filter_by(created_by=user_id).all()
        task_ids = [task.id for task in teacher_tasks]
        
        submissions = Submission.query.filter(Submission.task_id.in_(task_ids)).all()
        
        submissions_data = []
        for sub in submissions:
            student = User.query.get(sub.student_id)
            task = Task.query.get(sub.task_id)
            submissions_data.append({
                'id': sub.id,
                'student_id': sub.student_id,
                'student_name': student.username if student else 'Unknown',
                'task_id': sub.task_id,
                'task_title': task.title if task else 'Unknown',
                'content': sub.content[:100] + '...' if sub.content and len(sub.content) > 100 else sub.content,
                'ai_score': sub.ai_score,
                'teacher_score': sub.teacher_score,
                'status': sub.status,
                'submission_time': sub.created_at.isoformat() if sub.created_at else None,
            })
        
        return jsonify({
            'success': True,
            'submissions': submissions_data,
            'total': len(submissions_data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching teacher submissions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@teacher_bp.route('/submissions/<int:submission_id>', methods=['GET'])
@jwt_required()
@role_required('teacher')
def get_submission_detail(submission_id):
    """
    Get detailed submission for grading
    """
    try:
        user_id = get_current_user_id()
        
        sub = Submission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404
        
        task = Task.query.get(sub.task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        student = User.query.get(sub.student_id)
        
        ai_feedback = {}
        if sub.ai_feedback:
            try:
                ai_feedback = json.loads(sub.ai_feedback)
            except:
                ai_feedback = {'feedback_text': sub.ai_feedback}
        
        data = {
            'id': sub.id,
            'student_id': sub.student_id,
            'student_name': student.username if student else 'Unknown',
            'task_id': sub.task_id,
            'task_title': task.title,
            'content': sub.content,
            'ai_score': sub.ai_score,
            'ai_feedback': ai_feedback,
            'teacher_score': sub.teacher_score,
            'teacher_feedback': sub.teacher_feedback,
            'status': sub.status,
            'created_at': sub.created_at.isoformat() if sub.created_at else None,
            'updated_at': sub.updated_at.isoformat() if sub.updated_at else None,
        }
        
        return jsonify({
            'success': True,
            'submission': data
        }), 200
        
    except Exception as e:
        print(f"Error fetching submission detail: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@teacher_bp.route('/submissions/<int:submission_id>/grade', methods=['PATCH'])
@jwt_required()
@role_required('teacher')
def grade_submission(submission_id):
    """
    Grade a submission
    Body: {"teacher_score": int 0-100, "teacher_feedback": str}
    """
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        # 1. Kiểm tra an toàn cả 2 trường dữ liệu
        if not data or 'teacher_score' not in data:
            return jsonify({'error': 'Missing teacher_score'}), 400
            
        teacher_feedback = data.get('teacher_feedback', '')
        if not teacher_feedback:
             return jsonify({'error': 'Missing teacher_feedback'}), 400
        
        sub = Submission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404
        
        task = Task.query.get(sub.task_id)
        
        # 2. LƯU Ý: Đảm bảo user_id hiện tại thực sự là người tạo task. 
        # Nếu mô hình của bạn cho phép giáo viên khác chấm, hãy bỏ điều kiện created_by đi.
        if not task or task.created_by != int(user_id):
            return jsonify({'error': 'Not authorized for this task. You are not the creator.'}), 403
        
        teacher_score = data['teacher_score']
        
        if not isinstance(teacher_score, (int, float)) or teacher_score < 0 or teacher_score > 100:
            return jsonify({'error': 'teacher_score must be number 0-100'}), 400
        
        sub.teacher_score = float(teacher_score)
        sub.teacher_feedback = teacher_feedback
        sub.status = 'teacher_graded'
        sub.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Submission graded successfully',
            'submission': {
                'id': sub.id,
                'teacher_score': sub.teacher_score,
                'teacher_feedback': sub.teacher_feedback,
                'status': sub.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        # In thêm traceback để dễ debug trên server
        import traceback
        print(f"Error grading: {traceback.format_exc()}")
        return jsonify({'error': 'Server error, check backend logs'}), 500