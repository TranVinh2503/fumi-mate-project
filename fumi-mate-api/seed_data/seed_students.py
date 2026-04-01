import json
import sys
import os

# Thêm đường dẫn root vào sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import app factory và các thành phần cần thiết
from app import create_app  # Giả sử bạn có hàm này trong app/__init__.py
from app.extensions import db
from app.models.user import User # Đảm bảo đúng path tới model User
from app.models.student import StudentProfile
from werkzeug.security import generate_password_hash
from app.constants.roles import Roles as Role

def seed_students():
    # Xác định đường dẫn tuyệt đối tới file json để tránh lỗi "File not found"
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, '../../docs/students.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file tại {json_path}")
        return

    students = data.get('students', [])
    
    for student in students:
        student_id = student.get('student_id')
        full_name = student.get('full_name')
        
        # Kiểm tra user đã tồn tại chưa
        user = User.query.filter_by(username=student_id).first()
        if not user:
            # Tạo user mới
            user = User(
                username=student_id,
                role=Role.STUDENT,
                password_hash=generate_password_hash('Hanu@2026')
            )
            db.session.add(user)
            db.session.flush()  # Để lấy user.id cho profile
            
            # Tạo profile sinh viên
            profile = StudentProfile(
                user_id=user.id,
                jlpt_level='N5'
            )
            db.session.add(profile)
            print(f"Đã thêm mới: {student_id} - {full_name}")
        else:
            print(f"Bỏ qua: User {student_id} đã tồn tại")
    
    try:
        db.session.commit()
        print(f"--- Thành công! Đã seed {len(students)} sinh viên ---")
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi khi commit database: {e}")

if __name__ == '__main__':
    # 1. Khởi tạo Flask App
    app = create_app() 
    
    # 2. Đưa logic vào trong Application Context
    with app.app_context():
        seed_students()