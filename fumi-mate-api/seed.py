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

    task1 = Task(
        title="自己紹介作文",
        description="日本語で200字以内の自己紹介を書いてください。",
        difficulty="easy",
        due_date=datetime.utcnow() + timedelta(days=7),
        created_by=teacher.id,
        created_at=datetime.utcnow(),
        is_done=False
    )

    task2 = Task(
        title="意見文：アルバイトについて",
        description="アルバイトのメリット・デメリットについて意見を書いてください。",
        difficulty="medium",
        due_date=datetime.utcnow() + timedelta(days=10),
        created_by=teacher.id,
        created_at=datetime.utcnow(),
        is_done=False
    )

    db.session.add_all([task1, task2])
    db.session.commit()

    return task1, task2


# def seed_questions(task1, task2):
#     print("❓ Seeding questions...")

#     q1 = Question(
#         task_id=task1.id,
#         question_text="あなたの名前、専攻、趣味を書いてください。",
#         question_type="writing",
#         hint="簡単な文でOKです。",
#         sample_answer="はじめまして。私は花です。ITを勉強しています。"
#     )

#     q2 = Question(
#         task_id=task2.id,
#         question_text="アルバイトは学生にとって必要だと思いますか？理由も書いてください。",
#         question_type="essay",
#         hint="〜と思います、〜だと思います を使いましょう。",
#         sample_answer="アルバイトは社会経験になるので必要だと思います。"
#     )

#     db.session.add_all([q1, q2])
#     db.session.commit()


# def seed_submissions(task1, student1):
#     print("📝 Seeding submissions...")

#     submission = Submission(
#         task_id=task1.id,
#         student_id=student1.id,
#         content="はじめまして。私は花です。大学で情報技術を勉強しています。趣味は読書です。",
#         ai_feedback="文法は正確ですが、もう少し詳しく書くと良いです。",
#         ai_score=8.5,
#         teacher_feedback="とても良い自己紹介です。次は理由も書いてみましょう。",
#         teacher_score=9.0,
#         status="reviewed",
#         created_at=datetime.utcnow(),
#         updated_at=datetime.utcnow()
#     )

#     db.session.add(submission)
#     db.session.commit()

#     return submission


# def seed_feedback(submission):
#     print("💬 Seeding feedback...")

#     fb1 = Feedback(
#         submission_id=submission.id,
#         agent_name="AI",
#         result="文法エラーはありません。語彙を増やすとさらに良くなります。",
#         created_at=datetime.utcnow()
#     )

#     fb2 = Feedback(
#         submission_id=submission.id,
#         agent_name="Teacher",
#         result="自然な日本語です。とても読みやすいです。",
#         created_at=datetime.utcnow()
#     )

#     db.session.add_all([fb1, fb2])
#     db.session.commit()


def seed_question_bank():
    print("📚 Seeding Question Bank from Curriculum...")
    data = [
        {
            "genre": "手紙",
            "topic": "Host Family",
            "content": "日本で１週間ホームステイをしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。",
            "level": "N3",
            "required_points": ["感謝", "思い出2つ", "再会"]
        },
        {
            "genre": "意見・感想",
            "topic": "Student Stress",
            "content": "現代の学生が抱えているストレスについて、あなたの考えを書きなさい。どんなストレスがあるのか、具体的な例をあげて説明し、その原因と、ストレスをへらすために学生ができることについても書きましょう。",
            "level": "N2",
            "required_points": ["ストレスの例", "原因", "対策"]
        }
    ]
    
    qb_list = []
    for item in data:
        h = hashlib.md5(item['content'].encode()).hexdigest()
        qb = QuestionBank(
            genre=item['genre'], topic=item['topic'], content=item['content'],
            level=item['level'], required_points=json.dumps(item['required_points']),
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

        # 1. Chạy seed user cũ của bạn
        teacher, student1, student2 = seed_users()
        
        # 2. Chạy seed QuestionBank mới (Dữ liệu từ file Word)
        qb_items = seed_question_bank()

        # 3. Tạo Task liên kết (Sử dụng Model mới TaskQuestion)
        # Lấy câu hỏi đầu tiên trong ngân hàng để giao bài tập
        new_task = Task(
            title=f"Bài tập: {qb_items[0].topic}",
            description="Hãy hoàn thành bài viết theo yêu cầu.",
            difficulty=qb_items[0].level,
            created_by=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(new_task)
        db.session.commit()

        # Nối Task với QuestionBank qua bảng trung gian
        tq = TaskQuestion(task_id=new_task.id, question_bank_id=qb_items[0].id, order=1)
        db.session.add(tq)
        
        # 4. Tạo Submission mẫu và Feedback theo Rubric mới
        # (Sử dụng Model DetailedFeedback thay vì Feedback cũ)
        sub = Submission(
            task_id=new_task.id, 
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
