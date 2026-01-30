#!/usr/bin/env python3
"""
Database Query Tool - Query all data from Fumi-Mate database

Usage:
    python query_all_data.py [--json]

Options:
    --json    Output in JSON format
    --help    Show this help message

Examples:
    python query_all_data.py                    # Print all tables
    python query_all_data.py --json > data.json # Export to JSON
"""

import os
import sys
import json
from datetime import datetime

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app import create_app
from app.extensions import db


def format_datetime(value):
    """Format datetime to readable string"""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def query_all_users(session):
    """Query all users"""
    result = session.execute(text('SELECT * FROM "user" ORDER BY id'))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "users",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_tasks(session):
    """Query all tasks"""
    result = session.execute(text("SELECT * FROM task ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "tasks",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_classes(session):
    """Query all classes"""
    result = session.execute(text("SELECT * FROM class ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "classes",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_question_bank(session):
    """Query all questions from question bank"""
    result = session.execute(text("SELECT * FROM question_bank ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "question_bank",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_task_questions(session):
    """Query all task-question relationships"""
    result = session.execute(text("SELECT * FROM task_question ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "task_questions",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_submissions(session):
    """Query all submissions"""
    result = session.execute(text("SELECT * FROM submission ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "submissions",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_detailed_feedback(session):
    """Query all detailed feedback"""
    result = session.execute(text("SELECT * FROM detailed_feedback ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "detailed_feedback",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_student_profiles(session):
    """Query all student profiles with class info"""
    result = session.execute(text("""
        SELECT sp.id, sp.user_id, sp.class_id, sp.jlpt_level, sp.total_points, u.username
        FROM student_profile sp
        JOIN "user" u ON sp.user_id = u.id
        ORDER BY sp.id
    """))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "student_profiles",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def query_all_teacher_profiles(session):
    """Query all teacher profiles"""
    result = session.execute(text("SELECT * FROM teacher_profile ORDER BY id"))
    rows = result.fetchall()
    columns = result.keys()
    return {
        "table": "teacher_profiles",
        "count": len(rows),
        "data": [
            {col: format_datetime(val) for col, val in zip(columns, row)}
            for row in rows
        ]
    }


def get_table_stats(session):
    """Get row counts for all tables"""
    tables = [
        '"user"',
        'task',
        'class',
        'question_bank',
        'task_question',
        'submission',
        'detailed_feedback',
        'student_profile',
        'teacher_profile'
    ]
    
    stats = {}
    for table in tables:
        try:
            result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.fetchone()[0]
            stats[table.replace('"', '')] = count
        except Exception as e:
            stats[table.replace('"', '')] = f"Error: {e}"
    
    return stats


def main():
    """Main function to query all database data"""
    json_output = "--json" in sys.argv or "-j" in sys.argv
    
    app = create_app()
    
    print("=" * 60)
    print("FUMI-MATE DATABASE QUERY TOOL")
    print("=" * 60)
    print()
    
    with app.app_context():
        print("TABLE STATISTICS")
        print("-" * 40)
        stats = get_table_stats(db.session)
        for table, count in stats.items():
            print(f"  {table}: {count}")
        print()
        
        if json_output:
            all_data = {
                "export_date": datetime.now().isoformat(),
                "table_statistics": stats,
                "data": {}
            }
            
            all_data["data"]["users"] = query_all_users(db.session)
            all_data["data"]["tasks"] = query_all_tasks(db.session)
            all_data["data"]["classes"] = query_all_classes(db.session)
            all_data["data"]["question_bank"] = query_all_question_bank(db.session)
            all_data["data"]["task_questions"] = query_all_task_questions(db.session)
            all_data["data"]["submissions"] = query_all_submissions(db.session)
            all_data["data"]["detailed_feedback"] = query_all_detailed_feedback(db.session)
            all_data["data"]["student_profiles"] = query_all_student_profiles(db.session)
            all_data["data"]["teacher_profiles"] = query_all_teacher_profiles(db.session)
            
            print(json.dumps(all_data, indent=2, default=str))
        else:
            print("USERS")
            print("-" * 40)
            users = query_all_users(db.session)
            print(f"  Total: {users['count']}")
            for user in users["data"]:
                print(f"  ID: {user['id']}, Username: {user['username']}, Role: {user['role']}")
            print()
            
            print("TASKS")
            print("-" * 40)
            tasks = query_all_tasks(db.session)
            print(f"  Total: {tasks['count']}")
            for task in tasks["data"]:
                print(f"  ID: {task['id']}, Title: {task['title']}, Class: {task['class_id']}, Difficulty: {task['difficulty']}")
            print()
            
            print("CLASSES")
            print("-" * 40)
            classes = query_all_classes(db.session)
            print(f"  Total: {classes['count']}")
            for cls in classes["data"]:
                print(f"  ID: {cls['id']}, Name: {cls['name']}")
            print()
            
            print("QUESTION BANK")
            print("-" * 40)
            questions = query_all_question_bank(db.session)
            print(f"  Total: {questions['count']}")
            for q in questions["data"]:
                print(f"  ID: {q['id']}, Type: {q['question_type']}, Difficulty: {q['difficulty']}")
            print()
            
            print("TASK QUESTIONS")
            print("-" * 40)
            tq = query_all_task_questions(db.session)
            print(f"  Total: {tq['count']}")
            for item in tq["data"]:
                order_val = item.get('order') or item.get('order_num', 'N/A')
                print(f"  ID: {item['id']}, Task: {item['task_id']}, Question: {item['question_bank_id']}, Order: {order_val}")
            print()
            
            print("SUBMISSIONS")
            print("-" * 40)
            subs = query_all_submissions(db.session)
            print(f"  Total: {subs['count']}")
            for sub in subs["data"]:
                print(f"  ID: {sub['id']}, Task: {sub['task_id']}, Student: {sub['student_id']}, Status: {sub['status']}")
            print()
            
            print("DETAILED FEEDBACK")
            print("-" * 40)
            feedback = query_all_detailed_feedback(db.session)
            print(f"  Total: {feedback['count']}")
            for f in feedback["data"]:
                print(f"  ID: {f['id']}, Submission: {f['submission_id']}, Score: {f.get('task_achievement', 'N/A')}")
            print()
            
            print("STUDENT PROFILES WITH CLASSES")
            print("-" * 40)
            students = query_all_student_profiles(db.session)
            print(f"  Total: {students['count']}")
            for s in students["data"]:
                class_info = f"Class ID: {s['class_id']}" if s['class_id'] else "Not assigned"
                print(f"  ID: {s['id']}, User: {s['username']}, JLPT: {s['jlpt_level']}, {class_info}")
            print()
            
            print("TEACHER PROFILES")
            print("-" * 40)
            teachers = query_all_teacher_profiles(db.session)
            print(f"  Total: {teachers['count']}")
            for t in teachers["data"]:
                print(f"  ID: {t['id']}, User ID: {t['user_id']}")
            print()
            
        print("=" * 60)
        print("Query completed successfully!")
        print("=" * 60)


if __name__ == "__main__":
    main()

