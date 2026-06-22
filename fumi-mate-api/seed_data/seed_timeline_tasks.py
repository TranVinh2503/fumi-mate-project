import json
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app
from app.extensions import db
from app.models.task import Task, TaskQuestion
from app.models.question_bank import QuestionBank
from datetime import datetime

def seed_timeline_tasks():
    json_path = os.path.join(os.path.dirname(__file__), '../../docs/writing_tasks.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Lấy danh sách tasks từ cấu trúc JSON mới
    tasks_data = data.get('tasks', [])
    
    # Tìm bài pre_post_test
    pre_post_test = next((t for t in tasks_data if t['topic_code'] == 'pre_post_test'), None)
    if not pre_post_test:
        print("Không tìm thấy bài pre_post_test trong JSON. Dừng seed.")
        return

    # Phân loại các task còn lại vào các nhóm tương ứng
    category_tasks = {
        'letter': [t for t in tasks_data if t['task_type'] == 'letter'],
        'speech': [t for t in tasks_data if t['task_type'] == 'speech'],
        'opinion': [t for t in tasks_data if t['task_type'] == 'opinion']
    }
    
    # Timeline data
    timeline = [
        {'name': 'Pre-test',  'start': '2026-03-26', 'due': '2026-04-12', 'prompt': pre_post_test['prompt_ja'], 'task_data': pre_post_test},
        {'name': 'Test 1',    'start': '2026-04-13', 'due': '2026-04-19', 'category': 'letter'},
        {'name': 'Test 2',    'start': '2026-04-20', 'due': '2026-04-26', 'category': 'speech'},
        {'name': 'Test 3',    'start': '2026-04-27', 'due': '2026-05-03', 'category': 'opinion'},
        {'name': 'Test 4',    'start': '2026-05-04', 'due': '2026-05-10', 'category': 'letter'},
        {'name': 'Test 5',    'start': '2026-05-11', 'due': '2026-05-17', 'category': 'speech'},
        {'name': 'Test 6',    'start': '2026-05-18', 'due': '2026-05-24', 'category': 'opinion'},
        {'name': 'Test 7',    'start': '2026-05-25', 'due': '2026-05-31', 'category': 'letter'},
        {'name': 'Test 8',    'start': '2026-06-01', 'due': '2026-06-07', 'category': 'speech'},
        {'name': 'Test 9',    'start': '2026-06-08', 'due': '2026-06-14', 'category': 'opinion'},
        {'name': 'Post-test', 'start': '2026-06-15', 'due': '2026-06-21', 'prompt': pre_post_test['prompt_ja'], 'task_data': pre_post_test},
    ]
    
    # Bộ đếm để lấy lần lượt các bài test khác nhau cho mỗi thể loại
    cat_indices = {'letter': 0, 'speech': 0, 'opinion': 0}
    
    for i, item in enumerate(timeline):
        timeline_name = f"{item['name']}" # Ví dụ: "Test 1"
        
        # Nếu là Pre-test hoặc Post-test
        if 'prompt' in item:
            prompt = item['prompt']
            task_data = item['task_data']
        # Nếu là Test 1-9
        else:
            cat = item['category']
            task_list = category_tasks[cat]
            if task_list:
                task_data = task_list[cat_indices[cat] % len(task_list)]
                cat_indices[cat] += 1
            else:
                task_data = {'title': 'General task', 'prompt_ja': 'N/A'}
                
            prompt = task_data.get('prompt_ja', task_data.get('title'))
        
        # Lấy Tiêu đề của bài viết (VD: "ホストファミリーへの感謝の手紙")
        question_title = task_data.get('title', timeline_name)

        task = Task(
            title=timeline_name,
            description=prompt[:100] + '...',
            difficulty='N3',
            task_type_id=task_data['id'],
            start_date=datetime.fromisoformat(item['start']),
            due_date=datetime.fromisoformat(item['due']),
            created_by=66  # 👉 Gắn cứng created_by là 66
        )
        db.session.add(task)
        db.session.flush()
        
        # Đóng gói requirements vào JSON
        requirements_payload = {
            'timeline': item['name'],
            'requirements': task_data.get('requirements', {})
        }
        
        # Create question if not exists, OR Update if it exists
        h = f"timeline_hash_{timeline_name}"
        q = QuestionBank.query.filter_by(similarity_hash=h).first()
        
        if not q:
            q = QuestionBank(
                sub_genre_id=1, 
                sub_topic_id=1,
                content=question_title,  # 👉 Lấy từ biến title của task_data
                level=3,
                required_points=json.dumps(requirements_payload, ensure_ascii=False),
                similarity_hash=h
            )
            db.session.add(q)
        else:
            # 👉 NẾU ĐÃ TỒN TẠI, CẬP NHẬT LẠI CHO ĐÚNG DỮ LIỆU MỚI
            q.content = question_title
            q.required_points = json.dumps(requirements_payload, ensure_ascii=False)
            
        db.session.flush()
        
        tq = TaskQuestion(task_id=task.id, question_bank_id=q.id, order=1)
        db.session.add(tq)
        print(f"Seeded {timeline_name} ({item['start']} to {item['due']})")
    
    db.session.commit()
    print("✅ Timeline tasks seeded (11 tasks)")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        # Dọn dẹp liên kết TaskQuestion và Task cũ trước khi seed
        tasks = Task.query.filter(Task.title.like('%Test %'), Task.title.like('%Pre%'), Task.title.like('%Post%')).all()
        for t in tasks:
            # Xóa các TaskQuestion liên quan đến task này trước để tránh lỗi khóa ngoại
            TaskQuestion.query.filter_by(task_id=t.id).delete()
            db.session.delete(t)
        db.session.commit()
        
        seed_timeline_tasks()
