import json
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.task import Task, TaskQuestion
from app.models.question_bank import QuestionBank
from datetime import datetime

def seed_timeline_tasks():
    json_path = os.path.join(os.path.dirname(__file__), '../../docs/writing_tasks.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    writing_tasks = data['writing_tasks']
    pre_post_test = writing_tasks['pre_post_test']
    
    # Timeline data
    timeline = [
        {'name': 'Pre-test',  'start': '2026-03-26', 'due': '2026-03-26', 'prompt': pre_post_test['prompt_ja']},
        {'name': 'Test 1',    'start': '2026-04-13', 'due': '2026-04-19', 'category': 'letter'},
        {'name': 'Test 2',    'start': '2026-04-20', 'due': '2026-04-26', 'category': 'speech'},
        {'name': 'Test 3',    'start': '2026-04-27', 'due': '2026-05-03', 'category': 'opinion'},
        {'name': 'Test 4',    'start': '2026-05-04', 'due': '2026-05-10', 'category': 'letter'},
        {'name': 'Test 5',    'start': '2026-05-11', 'due': '2026-05-17', 'category': 'speech'},
        {'name': 'Test 6',    'start': '2026-05-18', 'due': '2026-05-24', 'category': 'opinion'},
        {'name': 'Test 7',    'start': '2026-05-25', 'due': '2026-05-31', 'category': 'letter'},
        {'name': 'Test 8',    'start': '2026-06-01', 'due': '2026-06-07', 'category': 'speech'},
        {'name': 'Test 9',    'start': '2026-06-08', 'due': '2026-06-14', 'category': 'opinion'},
        {'name': 'Post-test', 'start': '2026-06-15', 'due': '2026-06-21', 'prompt': pre_post_test['prompt_ja']},
    ]
    
    teacher = User.query.filter_by(role='teacher').first()
    if not teacher:
        print("No teacher, skip")
        return
    
    categories = ['letter', 'speech', 'opinion']
    
    for i, item in enumerate(timeline):
        title = f"{item['name']}"
        prompt = item.get('prompt')
        
        if not prompt:
            cat = item['category']
            cat_index = categories.index(cat)
            task_list = writing_tasks[cat]
            task_data = task_list[i % len(task_list)] if len(task_list) > 0 else {'topic': 'General task'}
            prompt = task_data.get('prompt_ja', task_data['topic'])
        
        task = Task(
            title=title,
            description=prompt[:100] + '...',
            difficulty='N3',
            start_date=datetime.fromisoformat(item['start']),
            due_date=datetime.fromisoformat(item['due']),
            created_by=teacher.id
        )
        db.session.add(task)
        db.session.flush()
        
        # Create question if not exists
        h = f"timeline_hash_{title}"
        q = QuestionBank.query.filter_by(similarity_hash=h).first()
        if not q:
            q = QuestionBank(
                sub_genre_id=1, # essay/letter etc
                sub_topic_id=1,
                content=prompt,
                level=3,
                required_points=json.dumps({'timeline': item['name']}),
                similarity_hash=h
            )
            db.session.add(q)
            db.session.flush()
        
        tq = TaskQuestion(task_id=task.id, question_bank_id=q.id, order=1)
        db.session.add(tq)
        print(f"Seeded {title} ({item['start']} to {item['due']})")
    
    db.session.commit()
    print("✅ Timeline tasks seeded (11 tasks)")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        # Delete existing timeline tasks first
        tasks = Task.query.filter(Task.title.like('%Test %'), Task.title.like('%Pre%'), Task.title.like('%Post%')).all()
        for t in tasks:
            db.session.delete(t)
        db.session.commit()
        seed_timeline_tasks()

