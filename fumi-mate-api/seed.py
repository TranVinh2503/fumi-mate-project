from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.student import StudentProfile
from app.models.teacher import TeacherProfile
from app.models.task import Task, Question
from app.models.submission import Submission
from app.models.feedback import Feedback


def seed_users():
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
    db.session.commit()  # ✅ IDs generated here

    teacher_profile = TeacherProfile(
        user_id=teacher_user.id,
        bio="日本語教師。JLPT N3〜N2対策が専門です。",
        experience_years=5
    )

    student1_profile = StudentProfile(
        user_id=student1_user.id,
        jlpt_level="N4",
    )

    student2_profile = StudentProfile(
        user_id=student2_user.id,
    )

    db.session.add_all([
        teacher_profile,
        student1_profile,
        student2_profile
    ])
    db.session.commit()

    return teacher_user, student1_user, student2_user

    teacher = User(
        username="sensei_akiko",
        password_hash=generate_password_hash("password123"),
        role="teacher"
    )

    student1 = User(
        username="student_hana",
        password_hash=generate_password_hash("password123"),
        role="student"
    )

    student2 = User(
        username="student_taro",
        password_hash=generate_password_hash("password123"),
        role="student"
    )

    db.session.add_all([teacher, student1, student2])
    db.session.commit()

    db.session.add(
        TeacherProfile(
            id=teacher.id,
            bio="日本語教師。JLPT N3〜N2対策が専門です。"
        )
    )

    db.session.add_all([
        StudentProfile(
            id=student1.id,
            jlpt_level="N4"
        ),
        StudentProfile(
            id=student2.id,
            jlpt_level="N3"
        )
    ])

    db.session.commit()

    return teacher, student1, student2


def seed_tasks(teacher):
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


def seed_questions(task1, task2):
    q1 = Question(
        task_id=task1.id,
        question_text="あなたの名前、専攻、趣味を書いてください。",
        question_type="writing",
        hint="簡単な文でOKです。",
        sample_answer="はじめまして。私は花です。ITを勉強しています。"
    )

    q2 = Question(
        task_id=task2.id,
        question_text="アルバイトは学生にとって必要だと思いますか？理由も書いてください。",
        question_type="essay",
        hint="〜と思います、〜だと思います を使いましょう。",
        sample_answer="アルバイトは社会経験になるので必要だと思います。"
    )

    db.session.add_all([q1, q2])
    db.session.commit()


def seed_submissions(task1, student1):
    submission = Submission(
        task_id=task1.id,
        student_id=student1.id,
        content="はじめまして。私は花です。大学で情報技術を勉強しています。趣味は読書です。",
        ai_feedback="文法は正確ですが、もう少し詳しく書くと良いです。",
        ai_score=8.5,
        teacher_feedback="とても良い自己紹介です。次は理由も書いてみましょう。",
        teacher_score=9.0,
        status="reviewed",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.session.add(submission)
    db.session.commit()

    return submission


def seed_feedback(submission):
    fb1 = Feedback(
        submission_id=submission.id,
        agent_name="AI",
        result="文法エラーはありません。語彙を増やすとさらに良くなります。",
        created_at=datetime.utcnow()
    )

    fb2 = Feedback(
        submission_id=submission.id,
        agent_name="Teacher",
        result="自然な日本語です。とても読みやすいです。",
        created_at=datetime.utcnow()
    )

    db.session.add_all([fb1, fb2])
    db.session.commit()


def run_seed():
    app = create_app()
    with app.app_context():
        print("🌱 Seeding database...")

        db.drop_all()
        db.create_all()

        teacher, student1, student2 = seed_users()
        task1, task2 = seed_tasks(teacher)
        seed_questions(task1, task2)
        submission = seed_submissions(task1, student1)
        seed_feedback(submission)

        print("✅ Seed completed successfully!")


if __name__ == "__main__":
    run_seed()
