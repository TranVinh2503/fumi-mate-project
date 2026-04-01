import json
import os
import sys
from datetime import datetime, timedelta

# 1. Setup path để import được module app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # Import hàm khởi tạo app của bạn
from app.extensions import db
from app.models.user import User
from app.models.question_bank import QuestionBank
from app.models.task import Task, TaskQuestion
# Import Genre, Topic nếu cần check ID thực tế
# from app.models.metadata import Genre, Topic 

def seed_writing_tasks():
    # Xác định đường dẫn file JSON
    json_path = os.path.join(os.path.dirname(__file__), '../../docs/writing_tasks.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Không tìm thấy file JSON tại: {json_path}")
        return

    writing_tasks = data['writing_tasks']
    
    # Mapping ID (Lưu ý: Bạn nên kiểm tra ID thực tế trong DB của mình)
    genre_map = {
        'letter': 1,
        'speech': 2,
        'opinion': 3,
        'essay': 4
    }
    
    pre_post_test = writing_tasks['pre_post_test']
    
    # Lấy danh sách task để xử lý chung
    all_tasks_to_process = []
    
    # Thêm Pre/Post test vào danh sách chờ xử lý
    all_tasks_to_process.append({
        'category': 'essay',
        'data': pre_post_test,
        'is_test': True
    })
    
    # Thêm các loại bài khác
    for cat in ['letter', 'speech', 'opinion']:
        for t in writing_tasks[cat]:
            all_tasks_to_process.append({
                'category': cat,
                'data': t,
                'is_test': False
            })

    # Tìm giáo viên để gán quyền tạo task
    teacher = User.query.filter_by(role='teacher').first()
    if not teacher:
        print("Cảnh báo: Không tìm thấy user 'teacher'. Vui lòng seed user trước.")
        return

    for item in all_tasks_to_process:
        cat = item['category']
        t_data = item['data']
        
        # Tạo hash đơn giản để tránh trùng
        content_jp = t_data.get('prompt_ja', t_data.get('title', ''))
        sim_hash = f"hash_{hash(content_jp)}"

        # 1. Kiểm tra xem câu hỏi đã tồn tại trong QuestionBank chưa
        q = QuestionBank.query.filter_by(similarity_hash=sim_hash).first()
        
        if not q:
            q = QuestionBank(
                content=content_jp,
                sub_genre_id=genre_map.get(cat, 1),
                sub_topic_id=1, # Tạm thời để 1, bạn có thể map theo topic_map
                required_points=json.dumps(t_data.get('requirement' if item['is_test'] else 'requirements')),
                level=3,
                similarity_hash=sim_hash
            )
            db.session.add(q)
            db.session.flush() # Để lấy q.id ngay lập tức

        # 2. Tạo Task tương ứng cho câu hỏi này
        new_task = Task(
            title=f"Luyện viết: {cat.capitalize()}",
            description=f"Bài tập viết chủ đề {t_data.get('topic', 'General')}",
            difficulty='N3',
            due_date=datetime.utcnow() + timedelta(days=7),
            created_by=teacher.id
        )
        db.session.add(new_task)
        db.session.flush()

        # 3. Liên kết Task với QuestionBank qua TaskQuestion
        tq = TaskQuestion(
            task_id=new_task.id,
            question_bank_id=q.id,
            order=1
        )
        db.session.add(tq)
        print(f"Đã tạo Task cho: {cat}")

    try:
        db.session.commit()
        print("--- Hoàn tất Seed Questions & Tasks ---")
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi database: {e}")

if __name__ == '__main__':
    # THAY ĐỔI QUAN TRỌNG Ở ĐÂY:
    app = create_app() # Khởi tạo app từ factory
    with app.app_context(): # Sử dụng app context từ object app vừa tạo
        seed_writing_tasks()