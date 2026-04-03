import sys
import os

# BƯỚC 1: Đưa phần này lên ĐẦU TIÊN, trước mọi dòng import từ app
# Lấy đường dẫn thư mục gốc (fumi-mate-api)
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_path not in sys.path:
    sys.path.insert(0, root_path)
from app.extensions import db
from app.models.task import Task
from app.models.user import User
from app.models.question_bank import QuestionBank
from app.models import Genre, Topic
from datetime import datetime, timedelta
from run import app  # Import app to get extensions
# Tùy thuộc vào cấu trúc của bạn, thường dùng create_app hoặc import trực tiếp app
# Nếu file run.py của bạn có biến 'app', hãy dùng nó
try:
    from run import app 
except ImportError:
    from app import create_app
    app = create_app()
with app.app_context():
    # Teacher
    teacher = User.query.filter_by(username='teacher_admin').first()
    if not teacher:
        print("Create teacher first")
        exit(1)

    # Past due task
    past_due = datetime.utcnow() - timedelta(hours=2)  # 2 hours late test

    task = Task(
        title="Test Late Submission - Due 2 hours ago",
        description="Nộp bài test muộn để kiểm tra tính năng late_minutes",
        difficulty='N4',
        due_date=past_due,
        created_by=teacher.id
    )
    db.session.add(task)
    db.session.flush()

    # Add questions (use existing or create simple)
    question1 = QuestionBank(
        sub_genre_id=1,
        sub_topic_id=1,
        content="Viết về sở thích của bạn (Due past)",
        level=4,
        required_points=10,
        similarity_hash="test_hash_123"  # THÊM DÒNG NÀY
    )
    db.session.add(question1)
    db.session.flush()

    # Link task_question
    from app.models.task import TaskQuestion
    tq = TaskQuestion(task_id=task.id, question_bank_id=question1.id, order=1)
    db.session.add(tq)

    db.session.commit()

    print(f"Created task ID {task.id} with due_date {past_due} for late test")

