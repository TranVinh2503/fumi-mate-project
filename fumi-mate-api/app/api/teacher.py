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
from app.models.ai_grading_result import AIGradingResult
from app.extensions import db
from app.utils.permissions import role_required
from app.services.gemini_service import get_writing_task_info, grade_writing_submission
from app.services.openai_service import grade_writing_submission_openai

from werkzeug.utils import secure_filename
import os


teacher_bp = Blueprint('teacher', __name__)

def get_current_user_id():
    identity = get_jwt_identity()
    return identity.get("id") if isinstance(identity, dict) else identity


def get_grading_task_type_id(task):
    """Resolve rubric IDs for legacy pre/post-test rows created before task_type_id."""
    if task and task.task_type_id is not None:
        return task.task_type_id
    if task and (task.title or '').strip().lower() in {'pre-test', 'post-test'}:
        return 0
    return None


def teacher_can_access_task(task, user_id):
    if not task:
        return False
    return task.created_by == int(user_id)


def get_configured_ai_grading_providers():
    raw_value = os.getenv('AI_GRADING_PROVIDERS', 'gemini,openai')
    providers = []
    for provider in raw_value.split(','):
        provider = provider.strip().lower()
        if provider in ('gemini', 'openai') and provider not in providers:
            providers.append(provider)
    return providers or ['gemini', 'openai']


def make_failed_ai_result(submission_id, provider, error_reason, latency_ms=0):
    return AIGradingResult(
        submission_id=submission_id,
        provider=provider,
        model=os.getenv('GEMINI_MODEL', 'gemini-2.0-flash') if provider == 'gemini' else os.getenv('OPENAI_MODEL', 'gpt-4.1-mini'),
        prompt_version='rubric_7criteria_v1',
        rubric_version='writing_rubric_2026_7criteria',
        status='failed',
        total_score=None,
        feedback_json=None,
        raw_response=None,
        error_reason=error_reason,
        latency_ms=latency_ms,
        is_selected=False,
    )


def parse_json_text(value, fallback=None):
    if not value:
        return fallback if fallback is not None else {}
    try:
        return json.loads(value)
    except:
        return fallback if fallback is not None else {}


def serialize_ai_grading_result(result):
    feedback = parse_json_text(result.feedback_json, {})
    return {
        'id': result.id,
        'submission_id': result.submission_id,
        'provider': result.provider,
        'model': result.model,
        'prompt_version': result.prompt_version,
        'rubric_version': result.rubric_version,
        'status': result.status,
        'total_score': result.total_score,
        'feedback': feedback,
        'error_reason': result.error_reason,
        'latency_ms': result.latency_ms,
        'is_selected': result.is_selected,
        'created_at': result.created_at.isoformat() if result.created_at else None,
        'updated_at': result.updated_at.isoformat() if result.updated_at else None,
    }


def make_ai_grading_result(submission_id, provider, feedback_data, latency_ms=None):
    raw_response = feedback_data.pop('_raw_response', None)
    service_latency_ms = feedback_data.pop('_latency_ms', None)
    status = 'succeeded'
    grading_method = feedback_data.get('grading_method', '')
    error_reason = feedback_data.get('error_reason')

    if error_reason or 'fallback' in grading_method:
        status = 'fallback'

    if provider == 'gemini':
        model_name = feedback_data.get('model') or os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    else:
        model_name = feedback_data.get('model') or os.getenv('OPENAI_MODEL', 'gpt-4.1-mini')

    return AIGradingResult(
        submission_id=submission_id,
        provider=provider,
        model=model_name,
        prompt_version=feedback_data.get('prompt_version') or 'rubric_7criteria_v1',
        rubric_version=feedback_data.get('rubric_version') or 'writing_rubric_2026_7criteria',
        status=status,
        total_score=float(feedback_data.get('overall_score', feedback_data.get('total_score', 0)) or 0),
        feedback_json=json.dumps(feedback_data, ensure_ascii=False),
        raw_response=raw_response,
        error_reason=error_reason,
        latency_ms=service_latency_ms or latency_ms,
        is_selected=False,
    )

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
                'questionCount': question_count,
                'taskTypeId': task.task_type_id
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
        "studentIds": [int, int, ...] (optional - if empty/null, task is visible to all students),
        "taskTypeId": int (optional, 0-9 from writing_rubric.json)
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
        task_type_id = data.get('taskTypeId', data.get('task_type_id'))

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

        if task_type_id is not None:
            try:
                task_type_id = int(task_type_id)
            except (TypeError, ValueError):
                return jsonify({'error': 'taskTypeId must be an integer from 0 to 9'}), 400
            if task_type_id < 0 or task_type_id > 9:
                return jsonify({'error': 'taskTypeId must be an integer from 0 to 9'}), 400

        # Create task with assigned students
        assigned_students_json = json.dumps(student_ids) if student_ids else None
        
        new_task = Task(
            title=title,
            description=description,
            difficulty=difficulty,
            due_date=due_date,
            created_by=user_id,
            assigned_students=assigned_students_json,
            task_type_id=task_type_id
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
                'questionCount': len(question_bank_ids),
                'taskTypeId': new_task.task_type_id
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
            'assignedStudents': assigned_students,
            'taskTypeId': task.task_type_id
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
                'experimental_group': student.experimental_group if student else None,
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
        if not teacher_can_access_task(task, user_id):
            return jsonify({'error': 'Not authorized for this task'}), 403
        
        student = User.query.get(sub.student_id)
        grading_task_type_id = get_grading_task_type_id(task)
        task_info = get_writing_task_info(grading_task_type_id) if grading_task_type_id is not None else None
        
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
            'experimental_group': student.experimental_group if student else None,
            'task_id': sub.task_id,
            'task_title': task.title,
            'task_type_id': grading_task_type_id,
            'grading_task': task_info,
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
            'ai_grading_results': [
                serialize_ai_grading_result(result)
                for result in sorted(sub.ai_grading_results, key=lambda item: item.created_at or datetime.min, reverse=True)
            ],
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
        if not teacher_can_access_task(task, user_id):
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

CRITERIA_SCORE_LEVELS = {
    '1': {15.0: 'M4', 11.25: 'M3', 7.5: 'M2', 3.75: 'M1'},
    '2': {15.0: 'M4', 11.25: 'M3', 7.5: 'M2', 3.75: 'M1'},
    '3': {15.0: 'M4', 11.25: 'M3', 7.5: 'M2', 3.75: 'M1'},
    '4': {20.0: 'M4', 15.0: 'M3', 10.0: 'M2', 5.0: 'M1'},
    '5': {15.0: 'M4', 11.25: 'M3', 7.5: 'M2', 3.75: 'M1'},
    '6': {10.0: 'M4', 7.5: 'M3', 5.0: 'M2', 2.5: 'M1'},
    '7': {10.0: 'M4', 7.5: 'M3', 5.0: 'M2', 2.5: 'M1'},
}


def grade_from_score(total_score):
    if total_score >= 90:
        return 'A'
    if total_score >= 80:
        return 'B'
    if total_score >= 70:
        return 'C'
    if total_score >= 60:
        return 'D'
    return 'F'


def validate_teacher_grading_payload(data):
    if not isinstance(data, dict):
        return None, 'Dữ liệu chấm điểm không hợp lệ.'

    criteria_scores = data.get('criteria_scores')
    if not isinstance(criteria_scores, dict):
        return None, 'Thiếu criteria_scores cho 7 tiêu chí.'

    normalized_scores = {}
    normalized_levels = {}
    for criterion in CRITERIA:
        criterion_id = criterion['id']
        if criterion_id not in criteria_scores:
            return None, f'Thiếu điểm tiêu chí {criterion_id}.'

        try:
            score = round(float(criteria_scores[criterion_id]), 2)
        except (TypeError, ValueError):
            return None, f'Điểm tiêu chí {criterion_id} phải là số.'

        allowed_scores = CRITERIA_SCORE_LEVELS[criterion_id]
        if score not in allowed_scores:
            allowed_values = ', '.join(str(value).rstrip('0').rstrip('.') for value in allowed_scores.keys())
            return None, f'Điểm tiêu chí {criterion_id} phải thuộc rubric: {allowed_values}.'

        normalized_scores[criterion_id] = score
        normalized_levels[criterion_id] = allowed_scores[score]

    total_score = round(sum(normalized_scores.values()), 2)
    submitted_total = data.get('overall_score', data.get('total_score', total_score))
    try:
        submitted_total = round(float(submitted_total), 2)
    except (TypeError, ValueError):
        return None, 'overall_score phải là số.'

    if submitted_total != total_score:
        return None, f'Tổng điểm không khớp rubric: nhận {submitted_total}, đúng là {total_score}.'

    data['criteria_scores'] = normalized_scores
    data['criteria_levels'] = normalized_levels
    data['overall_score'] = total_score
    data['total_score'] = total_score
    data['grade'] = data.get('grade') or grade_from_score(total_score)
    return data, None


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
        if not teacher_can_access_task(task, user_id):
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

        data, validation_error = validate_teacher_grading_payload(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        # 4. CẬP NHẬT THÔNG TIN CHẤM ĐIỂM
        # Lưu ý: Lúc này data không cần chứa word_file_path nữa vì đã lưu riêng
        data['grading_method'] = 'teacher_manual'
        
        sub.teacher_score = float(data.get('overall_score', 0))
        sub.teacher_feedback = json.dumps(data, ensure_ascii=False) # Chỉ chứa điểm 7 tiêu chí và feedback_text
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


@teacher_bp.route('/submissions/<int:submission_id>/ai-grade', methods=['PATCH'])
@jwt_required()
@role_required('teacher')
def teacher_ai_grade_submission(submission_id):
    """Teacher-triggered AI grading with multiple providers.

    Creates AIGradingResult rows for Gemini/OpenAI and keeps submission.ai_* as a preview/compatibility field.
    The student-facing result is only published after teacher selects one result and calls publish-ai-grade.
    """
    try:
        user_id = get_current_user_id()

        sub = Submission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404

        task = Task.query.get(sub.task_id)
        if not teacher_can_access_task(task, user_id):
            return jsonify({'error': 'Not authorized for this task'}), 403

        student = User.query.get(sub.student_id)
        if not student or (student.experimental_group or '').strip().lower() != 'variant':
            return jsonify({'error': 'Chỉ nhóm AI mới được gọi AI chấm điểm.'}), 403

        # Choose difficulty fallback
        difficulty = getattr(task, 'difficulty', None) or 'N3'
        grading_task_type_id = get_grading_task_type_id(task)
        if grading_task_type_id is None or not get_writing_task_info(grading_task_type_id):
            return jsonify({
                'error': 'Không tìm thấy đề chấm tương ứng với task_type_id. Hãy kiểm tra mapping trước khi gọi AI.'
            }), 400

        body = request.get_json(silent=True) or {}
        requested_providers = body.get('providers') or get_configured_ai_grading_providers()
        if isinstance(requested_providers, str):
            requested_providers = [requested_providers]

        providers = []
        for provider in requested_providers:
            provider = str(provider).strip().lower()
            if provider in ('gemini', 'openai') and provider not in providers:
                providers.append(provider)

        if not providers:
            return jsonify({'error': 'Không có AI provider hợp lệ. Dùng gemini/openai.'}), 400

        created_results = []
        preview_result = None

        for provider in providers:
            start_time = time.monotonic()
            try:
                if provider == 'gemini':
                    feedback_data = grade_writing_submission(
                        grading_task_type_id,
                        sub.content or '',
                        difficulty=difficulty
                    )
                    feedback_data['grading_method'] = feedback_data.get('grading_method') or 'gemini_rubric'
                    feedback_data['overall_score'] = feedback_data.get('total_score') or feedback_data.get('overall_score', 0)
                    feedback_data['provider'] = 'gemini'
                    feedback_data['model'] = feedback_data.get('model') or os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
                    feedback_data['prompt_version'] = feedback_data.get('prompt_version') or 'rubric_7criteria_v1'
                    feedback_data['rubric_version'] = feedback_data.get('rubric_version') or 'writing_rubric_2026_7criteria'
                else:
                    feedback_data = grade_writing_submission_openai(
                        grading_task_type_id,
                        sub.content or '',
                        difficulty=difficulty
                    )

                latency_ms = int((time.monotonic() - start_time) * 1000)
                result = make_ai_grading_result(sub.id, provider, feedback_data, latency_ms=latency_ms)
            except Exception as provider_error:
                latency_ms = int((time.monotonic() - start_time) * 1000)
                result = make_failed_ai_result(sub.id, provider, str(provider_error), latency_ms=latency_ms)

            db.session.add(result)
            db.session.flush()
            created_results.append(result)

            if result.status == 'succeeded' and preview_result is None:
                preview_result = result

        if preview_result is None:
            preview_result = next((result for result in created_results if result.feedback_json), None)

        if preview_result and preview_result.feedback_json:
            preview_feedback = parse_json_text(preview_result.feedback_json, {})
            sub.ai_feedback = json.dumps(preview_feedback, ensure_ascii=False)
            sub.ai_score = float(preview_result.total_score or 0)
        sub.status = 'ai_teacher_graded'
        sub.updated_at = datetime.utcnow()

        db.session.commit()

        serialized_results = [serialize_ai_grading_result(result) for result in created_results]
        selected_preview = serialize_ai_grading_result(preview_result) if preview_result else None

        print(f"[TEACHER-AI-GRADE] submission_id={sub.id} providers={providers} results={[item['status'] for item in serialized_results]}")

        return jsonify({
            'success': True,
            'message': 'AI grading completed. Teacher must select one result before publishing.',
            'submission_id': sub.id,
            'ai_score': sub.ai_score,
            'ai_feedback': selected_preview['feedback'] if selected_preview else None,
            'ai_grading_results': serialized_results,
            'preview_result_id': selected_preview['id'] if selected_preview else None,
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Teacher AI grading error: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@teacher_bp.route('/submissions/<int:submission_id>/publish-ai-grade', methods=['PATCH'])
@jwt_required()
@role_required('teacher')
def publish_ai_grade_submission(submission_id):
    """Publish selected AI grading result for variant group without teacher manual grading."""
    try:
        user_id = get_current_user_id()

        sub = Submission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404

        task = Task.query.get(sub.task_id)
        if not teacher_can_access_task(task, user_id):
            return jsonify({'error': 'Not authorized for this task'}), 403

        student = User.query.get(sub.student_id)
        if not student or (student.experimental_group or '').strip().lower() != 'variant':
            return jsonify({'error': 'Chỉ nhóm AI mới được gửi kết quả AI.'}), 403

        body = request.get_json(silent=True) or {}
        selected_result_id = body.get('selected_result_id')

        selected_result = None
        if selected_result_id:
            selected_result = AIGradingResult.query.filter_by(
                id=int(selected_result_id),
                submission_id=sub.id
            ).first()
            if not selected_result:
                return jsonify({'error': 'Không tìm thấy kết quả AI đã chọn.'}), 404
            if selected_result.status == 'failed' or not selected_result.feedback_json:
                return jsonify({'error': 'Kết quả AI đã chọn bị lỗi, không thể gửi cho sinh viên.'}), 400

            feedback_data = parse_json_text(selected_result.feedback_json, {})
            for result in sub.ai_grading_results:
                result.is_selected = result.id == selected_result.id

            sub.ai_score = float(selected_result.total_score or feedback_data.get('overall_score', feedback_data.get('total_score', 0)) or 0)
            sub.ai_feedback = json.dumps(feedback_data, ensure_ascii=False)
        else:
            if sub.ai_score is None or not sub.ai_feedback:
                return jsonify({'error': 'Chưa có kết quả AI để gửi. Hãy bấm AI Grade trước.'}), 400

        sub.status = 'teacher_graded'
        sub.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Đã gửi kết quả AI cho sinh viên.',
            'submission_id': sub.id,
            'status': sub.status,
            'ai_score': sub.ai_score,
            'selected_result_id': selected_result.id if selected_result else None,
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Publish AI grading error: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500
