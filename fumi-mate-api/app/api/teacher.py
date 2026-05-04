from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import time
from datetime import datetime
import json
from app.models.task import Task, TaskQuestion
from app.models.question_bank import QuestionBank
from app.models.user import User
from app.models.submission import Submission
from app.extensions import db
from app.utils.permissions import role_required
from app.services.gemini_service import grade_writing_submission
from werkzeug.utils import secure_filename
import os


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
                'attemptCount': sub.attempt_count,
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
            'attemptCount': sub.attempt_count,
            'lateMinutes': sub.late_minutes,
            'status': sub.status,
            'created_at': sub.created_at.isoformat() if sub.created_at else None,
            'updated_at': sub.updated_at.isoformat() if sub.updated_at else None,
            'word_file_path': sub.word_file_path,
        }
        
        return jsonify({
            'success': True,
            'submission': data
        }), 200
        
    except Exception as e:
        print(f"Error fetching submission detail: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@teacher_bp.route('/submissions/<int:submission_id>/upload-word', methods=['POST'])
@jwt_required()
@role_required('teacher')
def upload_word_correction(submission_id):
    """
    Upload corrected Word file for submission
    """
    try:
        user_id = get_current_user_id()
        
        if 'corrected_file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['corrected_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.docx'):
            return jsonify({'error': 'Only .docx files allowed'}), 400
        
        # Security: secure filename
        filename = secure_filename(file.filename)
        
        sub = Submission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404
        
        task = Task.query.get(sub.task_id)
        if not task or task.created_by != int(user_id):
            return jsonify({'error': 'Not authorized for this submission'}), 403
        
        student = User.query.get(sub.student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        # File size limit 5MB
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > 5 * 1024 * 1024:
            return jsonify({'error': 'File too large (max 5MB)'}), 400
        
        # Create uploads dir
        # Save to public folder
        public_dir = 'fumi-mate-nextjs/public/uploads/submissions'
        os.makedirs(public_dir, exist_ok=True)
        
        # Unique filename
        base_name = f"{submission_id}_{student.username.replace(' ', '_')}_corrected.docx"
        public_filepath = os.path.join(public_dir, base_name)
        file.save(public_filepath)
        
        # Update DB with relative path
        sub.word_file_path = f"/uploads/submissions/{base_name}"
        sub.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Word file uploaded to public folder',
            'public_path': sub.word_file_path
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Upload error: {e}")
        return jsonify({'error': 'Server error during upload'}), 500

# Rubric criteria for validation (7 criteria)
CRITERIA = [
  {'id': '1', 'max': 15},
  {'id': '2', 'max': 15},
  {'id': '3', 'max': 15},
  {'id': '4', 'max': 20},
  {'id': '5', 'max': 15},
  {'id': '6', 'max': 10},
  {'id': '7', 'max': 10},
]
@teacher_bp.route('/submissions/<int:submission_id>/grade', methods=['PATCH'])
@jwt_required()
@role_required('teacher')
def grade_submission(submission_id):
    try:
        user_id = get_current_user_id()
        
        # 1. Lấy dữ liệu văn bản từ FormData (key 'data')
        json_data = request.form.get('data')
        if not json_data:
            return jsonify({'error': 'Missing grading data'}), 400
            
        data = json.loads(json_data)
        
        # 2. Tìm bài nộp và kiểm tra quyền
        sub = Submission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404
        
        task = Task.query.get(sub.task_id)
        if not task or task.created_by != int(user_id):
            return jsonify({'error': 'Not authorized for this task'}), 403

        # 3. XỬ LÝ LƯU FILE VÀO THƯ MỤC STATIC (PUBLIC)
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename != '':
                # Định nghĩa đường dẫn vật lý trên server: app/static/graded/
                upload_path = os.path.join(current_app.root_path, 'static', 'graded')
                
                # Tạo thư mục nếu chưa tồn tại
                if not os.path.exists(upload_path):
                    os.makedirs(upload_path)
                
                # Tạo tên file an toàn để tránh trùng lặp và lỗi font
                filename = secure_filename(f"graded_{submission_id}_{int(time.time())}_{file.filename}")
                file.save(os.path.join(upload_path, filename))
                
                # LƯU ĐƯỜNG DẪN TƯƠNG ĐỐI VÀO THUỘC TÍNH word_file_path CỦA MODEL
                # Kết quả lưu vào DB: /static/graded/graded_254_1714800000_abc.docx
                sub.word_file_path = f"/static/graded/{filename}"

        # 4. CẬP NHẬT THÔNG TIN CHẤM ĐIỂM
        # Lưu ý: Lúc này data không cần chứa word_file_path nữa vì đã lưu riêng
        data['grading_method'] = 'teacher_manual'
        
        sub.teacher_score = float(data.get('overall_score', 0))
        sub.teacher_feedback = json.dumps(data) # Chỉ chứa điểm 7 tiêu chí và feedback_text
        sub.status = 'teacher_graded'
        sub.updated_at = datetime.utcnow()
        print(sub)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Đã chấm điểm và lưu đường dẫn file thành công',
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Teacher grading error: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500