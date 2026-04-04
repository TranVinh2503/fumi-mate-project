#!/usr/bin/env python3
import random
import click
from flask.cli import FlaskGroup
from app.extensions import db
from app.models.user import User
from run import app  # Import biến app từ file run.py

# Định nghĩa hàm tạo app cho FlaskGroup
def create_cli_app():
    return app

# Khởi tạo Group CLI chuẩn
cli = FlaskGroup(create_app=create_cli_app)

@cli.command('ab-test-reset')
def reset_ab_test():
    """Xóa toàn bộ nhóm đã chia của sinh viên (Reset về NULL)"""
    with app.app_context():
        print("--- Đang kết nối Database để Reset ---")
        # Chú ý: Kiểm tra chính xác giá trị 'student' trong DB của bạn
        students = User.query.filter_by(role='student').all()
        
        if not students:
            click.echo('⚠️ Không tìm thấy sinh viên nào.')
            return

        count = 0
        for student in students:
            if student.experimental_group is not None:
                student.experimental_group = None
                count += 1
        
        try:
            db.session.commit()
            click.echo(f'✅ Thành công: Đã xóa nhóm của {count} sinh viên.')
        except Exception as e:
            db.session.rollback()
            click.echo(f'❌ Lỗi: {e}')

@cli.command('ab-test-assign')
def assign_ab_test():
    """Chia đều 50/50 sinh viên vào 2 nhóm: control và variant"""
    with app.app_context():
        # Lấy sinh viên chưa có nhóm
        students = User.query.filter_by(role='student').filter(
            (User.experimental_group == None) | (User.experimental_group == '')
        ).all()

        if not students:
            click.echo('⚠️ Không có sinh viên nào cần chia nhóm.')
            return

        random.shuffle(students)
        total = len(students)
        half = total // 2
        
        for i, student in enumerate(students):
            student.experimental_group = 'control' if i < half else 'variant'
        
        try:
            db.session.commit()
            click.echo(f'✅ Đã chia xong {total} sinh viên:')
            click.echo(f'  - Nhóm Control (Giáo viên): {half}')
            click.echo(f'  - Nhóm Variant (AI): {total - half}')
        except Exception as e:
            db.session.rollback()
            click.echo(f'❌ Lỗi: {e}')

if __name__ == "__main__":
    cli()