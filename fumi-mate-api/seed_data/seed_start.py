from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import hashlib
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.student import StudentProfile
from app.models.teacher import TeacherProfile
from app.models.submission import Submission
from app.models.feedback import Feedback

from app.models.question_bank import QuestionBank
from app.models.task import Task, TaskQuestion
from app.models.detailed_feedback import DetailedFeedback
from app.models.genres import Genre
from app.models.topics import Topic
import json

from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from app.config import Config 

def ensure_database_exists():
    """
    Connect to maintenance DB (postgres) and create fumi_mate if not exists
    """
    db_name = "fumi_mate"

    # DATABASE_URL gốc đang trỏ vào fumi_mate
    # VD: postgresql+psycopg2://postgres:password@localhost:5432/fumi_mate
    base_url = Config.SQLALCHEMY_DATABASE_URI

    # Đổi DB thành 'postgres' để có thể CREATE DATABASE
    admin_url = base_url.rsplit("/", 1)[0] + "/postgres"

    engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")

    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
            {"dbname": db_name}
        ).scalar()

        if not result:
            print(f"🛠 Creating database '{db_name}'...")
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            print("✅ Database created")
        else:
            print(f"✅ Database '{db_name}' already exists")

    engine.dispose()

def seed_users():
    print("👤 Seeding users...")

    teacher_user = User(
        username="sensei_akiko",
        password_hash=generate_password_hash("password123"),
        role="teacher"
    )

    student1_user = User(
        username="student_hana",
        password_hash=generate_password_hash("password123"),
        role="student"
    )

    student2_user = User(
        username="student_taro",
        password_hash=generate_password_hash("password123"),
        role="student"
    )

    db.session.add_all([teacher_user, student1_user, student2_user])
    db.session.commit()  # IDs generated here

    teacher_profile = TeacherProfile(
        user_id=teacher_user.id,
        bio="日本語教師。JLPT N3〜N2対策が専門です。",
        experience_years=5
    )

    student1_profile = StudentProfile(
        user_id=student1_user.id,
        jlpt_level="N4"
    )

    student2_profile = StudentProfile(
        user_id=student2_user.id,
        jlpt_level="N3"
    )

    db.session.add_all([
        teacher_profile,
        student1_profile,
        student2_profile
    ])
    db.session.commit()

    return teacher_user, student1_user, student2_user


def seed_tasks(teacher):
    print("📘 Seeding tasks...")

    # Task 1: Visible to all students (assigned_students = None)
    task1 = Task(
        title="自己紹介作文",
        description="日本語で200字以内の自己紹介を書いてください。",
        difficulty="easy",
        start_date=datetime.utcnow() - timedelta(days=1),
        due_date=datetime.utcnow() + timedelta(days=7),
        created_by=teacher.id,
        created_at=datetime.utcnow(),
        is_done=False,
        assigned_students=None  # Visible to all students
    )

    # Task 2: Start tomorrow
    task2 = Task(
        title="意見文：アルバイトについて",
        description="アルバイトのメリット・デメリットについて意見を書いてください。",
        difficulty="medium",
        start_date=datetime.utcnow() + timedelta(days=1),
        due_date=datetime.utcnow() + timedelta(days=10),
        created_by=teacher.id,
        created_at=datetime.utcnow(),
        is_done=False,
        assigned_students=None  # Visible to all students
    )

    db.session.add_all([task1, task2])
    db.session.commit()

    return task1, task2



def seed_genres():
    print("📚 Seeding Genres...")
    genres_data = [
        Genre(id=1, parent_id=0, name_jp='手紙', name_vn='Thư'),
        Genre(id=2, parent_id=0, name_jp='スピーチ', name_vn='Bài phát biểu'),
        Genre(id=3, parent_id=0, name_jp='意見・感想', name_vn='Ý kiến - Cảm nhận'),
    ]
    for g in genres_data:
        db.session.merge(g)
    db.session.commit()

def seed_topics():
    print("📚 Seeding Topics...")
    topics_data = [
        Topic(id=1, parent_id=0, name_jp='Host Family', name_vn='Gia đình chủ nhà'),
        Topic(id=2, parent_id=0, name_jp='Student Stress', name_vn='Căng thẳng học sinh'),
    ]
    for t in topics_data:
        db.session.merge(t)
    db.session.commit()

def seed_question_bank():
    print("📚 Seeding Question Bank from Curriculum...")
    data = [
        {
            "sub_genre_id": 1,  # 手紙
            "sub_topic_id": 1,  # Host Family
            "content": "日本で１週間ホームステイをしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。",
            "level": 3,  # N3
            "required_points": ["感謝", "思い出2つ", "再会"]
        },
        {
            "sub_genre_id": 3,  # 意見・感想
            "sub_topic_id": 2,  # Student Stress
            "content": "現代の学生が抱えているストレスについて、あなたの考えを書きなさい。どんなストレスがあるのか、具体的な例をあげて説明し、その原因と、ストレスをへらすために学生ができることについても書きましょう。",
            "level": 2,  # N2
            "required_points": ["ストレスの例", "原因", "対策"]
        }
    ]
    
    qb_list = []
    for item in data:
        h = hashlib.md5(item['content'].encode()).hexdigest()
        qb = QuestionBank(
            sub_genre_id=item['sub_genre_id'],
            sub_topic_id=item['sub_topic_id'],
            content=item['content'],
            level=item['level'],
            required_points=json.dumps(item['required_points']),
            similarity_hash=h
        )
        qb_list.append(qb)
    db.session.add_all(qb_list)
    db.session.commit()
    return qb_list

def run_seed():
    ensure_database_exists() 
    app = create_app()
    with app.app_context():
        print("🌱 Rebuilding Database...")
        # Xóa và tạo lại bảng để cập nhật Schema mới (QuestionBank, DetailedFeedback)
        db.drop_all()
        db.create_all()

        # 1. Chạy seed users
        teacher, student1, student2 = seed_users()
        
# 2. Seed genres and topics
        seed_genres()
        seed_topics()
        
        # 3. Chạy seed QuestionBank
        qb_items = seed_question_bank()

        # 4. Chạy seed tasks (tạo 2 task mẫu)
        task1, task2 = seed_tasks(teacher)

        # 5. Tạo Task liên kết với QuestionBank qua bảng trung gian TaskQuestion
        # Gán câu hỏi đầu tiên cho task1
        tq1 = TaskQuestion(task_id=task1.id, question_bank_id=qb_items[0].id, order=1)
        db.session.add(tq1)

        # Gán câu hỏi thứ 2 cho task2 (nếu có)
        if len(qb_items) > 1:
            tq2 = TaskQuestion(task_id=task2.id, question_bank_id=qb_items[1].id, order=1)
            db.session.add(tq2)
        
        db.session.commit()
        
        # 5. Tạo Submission mẫu và DetailedFeedback
        sub = Submission(
            task_id=task1.id, 
            student_id=student1.id,
            content="Bài làm mẫu của sinh viên...",
            version=1,
            status="reviewed"
        )
        db.session.add(sub)
        db.session.commit()

        df = DetailedFeedback(
            submission_id=sub.id,
            task_achievement=22.0, 
            content_organization=19.0,
            vocabulary_expression=17.0, 
            grammar_orthography=20.0
        )
        db.session.add(df)
        db.session.commit()

        print("✅ Seed completed successfully with new QuestionBank and Rubric!")

if __name__ == "__main__":
    run_seed()
