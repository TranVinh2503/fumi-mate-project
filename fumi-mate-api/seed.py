
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.student import StudentProfile
from app.models.teacher import TeacherProfile
from app.models.class_model import Class
from app.models.submission import Submission
from app.models.feedback import Feedback
from app.models.question_bank import QuestionBank
from app.models.task import Task, TaskQuestion
from app.models.detailed_feedback import DetailedFeedback
from sqlalchemy import create_engine, text
from app.config import Config 

def ensure_database_exists():
    """Connect to maintenance DB (postgres) and create fumi_mate if not exists"""
    db_name = "fumi_mate"
    base_url = Config.SQLALCHEMY_DATABASE_URI
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
    db.session.commit()

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

    db.session.add_all([teacher_profile, student1_profile, student2_profile])
    db.session.commit()

    return teacher_user, student1_user, student2_user, teacher_profile, student1_profile, student2_profile

def seed_classes(teacher_profile):
    print("🏫 Seeding classes...")
    
    # Create a class for N3 level students
    class1 = Class(
        name="N3 Conversation Class",
        created_at=datetime.utcnow()
    )
    
    # Create another class for N4 level students  
    class2 = Class(
        name="N4 Grammar Class",
        created_at=datetime.utcnow()
    )
    
    db.session.add_all([class1, class2])
    db.session.commit()
    
    return class1, class2

def assign_students_to_classes(student1_profile, student2_profile, class1, class2):
    print("👨‍🎓 Assigning students to classes...")
    
    # student_hana is N4 level, assign to N4 Grammar Class
    student1_profile.class_id = class2.id
    student1_profile.jlpt_level = "N4"
    
    # student_taro is N3 level, assign to N3 Conversation Class
    student2_profile.class_id = class1.id
    student2_profile.jlpt_level = "N3"
    
    db.session.commit()
    
    print(f"   - student_hana (N4) -> {class2.name}")
    print(f"   - student_taro (N3) -> {class1.name}")

def seed_question_bank():
    print("📚 Seeding Question Bank from Curriculum...")
    data = [
        {
            "question_text": "日本で１週間ホームスティはお世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。",
            "question_type": "essay",
            "hint": "感謝、思い出2つ、再会について書きましょう",
            "sample_answer": "Dear Host Family,\n\nThank you so much for your hospitality during my one-week stay in Japan...",
            "difficulty": "N3"
        },
        {
            "question_text": "現代の学生が抱えているストレスについて、あなたの考えを書きなさい。どんなストレスがあるのか、具体的な例をあげて説明し、その原因と、ストレスをへらすために学生ができることについても書きましょう。",
            "question_type": "essay",
            "hint": "ストレスの例、原因、対策について書きましょう",
            "sample_answer": "現代の学生は様々なストレスに直面しています...",
            "difficulty": "N2"
        }
    ]
    
    qb_list = []
    for item in data:
        qb = QuestionBank(
            question_text=item['question_text'],
            question_type=item['question_type'],
            hint=item.get('hint'),
            sample_answer=item.get('sample_answer'),
            difficulty=item['difficulty']
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
        
        # First close all connections and drop the database
        db.session.close_all()
        db.engine.dispose()
        
        # Create a new engine to drop tables
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            # Drop all tables with CASCADE
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        
        engine.dispose()
        
        # Now create all tables
        db.create_all()
        print("✅ Database tables recreated")

        # 1. Seed users and profiles
        teacher, student1, student2, teacher_profile, student1_profile, student2_profile = seed_users()
        
        # 2. Seed classes
        class1, class2 = seed_classes(teacher_profile)
        
        # 3. Assign students to classes
        assign_students_to_classes(student1_profile, student2_profile, class1, class2)
        
        # 4. Seed QuestionBank
        qb_items = seed_question_bank()

        # 5. Create Tasks linked to classes
        # Task for N3 class (student_taro)
        task1 = Task(
            title="Host Family Letter",
            description="Write a letter to your host family expressing gratitude.",
            difficulty="N3",
            class_id=class1.id,
            created_by=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(task1)
        db.session.commit()
        
        # Link Task1 with QuestionBank
        tq1 = TaskQuestion(task_id=task1.id, question_bank_id=qb_items[0].id, order=1)
        db.session.add(tq1)
        
        # Task for N4 class (student_hana)
        task2 = Task(
            title="Self Introduction",
            description="Write a self-introduction essay (200 characters).",
            difficulty="N4",
            class_id=class2.id,
            created_by=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=5)
        )
        db.session.add(task2)
        db.session.commit()
        
        # Link Task2 with QuestionBank (use N2 question for challenge)
        tq2 = TaskQuestion(task_id=task2.id, question_bank_id=qb_items[1].id, order=1)
        db.session.add(tq2)
        
        db.session.commit()

        # 6. Create sample Submission for student_taro
        sub = Submission(
            task_id=task1.id, 
            student_id=student2.id,
            content="Dear Host Family,\n\nThank you so much for your hospitality during my one-week stay in Japan...",
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

        print("✅ Seed completed successfully!")
        print(f"   - Created teacher: sensei_akiko (password: password123)")
        print(f"   - Created students: student_hana, student_taro (password: password123)")
        print(f"   - Created 2 classes: N3 Conversation Class, N4 Grammar Class")
        print(f"   - Assigned student_hana -> N4 Grammar Class")
        print(f"   - Assigned student_taro -> N3 Conversation Class")
        print(f"   - Created 2 questions in QuestionBank")
        print(f"   - Created 2 Tasks (one per class)")
        print(f"   - Created 1 sample submission with feedback")

if __name__ == "__main__":
    run_seed()


