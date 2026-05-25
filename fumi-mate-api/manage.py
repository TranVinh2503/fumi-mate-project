#!/usr/bin/env python3
import random
import click
import csv
import json
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

def _read_student_codes(file_path):
    """Read unique student codes from CSV/TXT.

    Supported formats:
    - CSV with a column named student_code, username, code, or id
    - Plain text/CSV without header: first comma/tab/space-separated token per line
    """
    codes = []
    with open(file_path, 'r', encoding='utf-8-sig', newline='') as f:
        sample = f.read(2048)
        f.seek(0)
        try:
            has_header = csv.Sniffer().has_header(sample) if sample.strip() else False
        except csv.Error:
            first_line = sample.splitlines()[0].strip().lower() if sample.splitlines() else ''
            has_header = first_line in {'student_code', 'username', 'code', 'id', 'student_id'}

        if has_header:
            reader = csv.DictReader(f)
            fieldnames = [name.strip() for name in (reader.fieldnames or [])]
            lookup = {name.lower(): name for name in fieldnames}
            code_column = None
            for candidate in ('student_code', 'username', 'code', 'id', 'student_id'):
                if candidate in lookup:
                    code_column = lookup[candidate]
                    break

            if not code_column:
                raise click.ClickException(
                    'Không tìm thấy cột mã sinh viên. Hãy dùng một trong các tên cột: '
                    'student_code, username, code, id, student_id.'
                )

            for row in reader:
                value = (row.get(code_column) or '').strip()
                if value:
                    codes.append(value)
        else:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                value = line.replace(',', ' ').replace('\t', ' ').split()[0].strip()
                if value:
                    codes.append(value)

    return list(dict.fromkeys(codes))

@cli.command('ab-test-assign-from-graded')
@click.option('--graded-file', required=True, type=click.Path(exists=True, dir_okay=False), help='CSV/TXT chứa mã SV đã được GV chấm/chữa.')
@click.option('--seed', default=20260517, show_default=True, type=int, help='Seed random để kết quả chia nhóm tái lập được.')
@click.option('--apply', 'apply_changes', is_flag=True, help='Thực sự cập nhật DB. Nếu không có flag này, command chỉ dry-run.')
@click.option('--report-file', default=None, type=click.Path(dir_okay=False), help='Ghi report JSON ra file nếu cần.')
@click.option('--include-non-numeric', is_flag=True, help='Bao gồm cả username không phải mã số sinh viên. Mặc định bỏ qua tài khoản test/non-numeric.')
def assign_ab_test_from_graded(graded_file, seed, apply_changes, report_file, include_non_numeric):
    """Chia nhóm theo danh sách SV đã được GV chấm và cân bằng 2 nhóm.

    Rule:
    - SV trong graded_file -> control
    - Nếu control chưa đủ 50%, chọn thêm SV chưa chấm vào control để GV chấm bù
    - SV còn lại -> variant
    - Mặc định dry-run, chỉ update DB khi truyền --apply
    """
    graded_codes = set(_read_student_codes(graded_file))

    with app.app_context():
        students_query = User.query.filter_by(role='student').order_by(User.username.asc())
        students = students_query.all()
        ignored_non_numeric = []
        if not include_non_numeric:
            filtered_students = []
            for student in students:
                username = str(student.username).strip()
                if username.isdigit():
                    filtered_students.append(student)
                else:
                    ignored_non_numeric.append(username)
            students = filtered_students

        if not students:
            click.echo('⚠️ Không tìm thấy sinh viên nào.')
            return

        students_by_username = {str(student.username).strip(): student for student in students}
        matched_graded_codes = sorted(code for code in graded_codes if code in students_by_username)
        missing_codes = sorted(code for code in graded_codes if code not in students_by_username)

        total = len(students)
        target_control = (total + 1) // 2
        control_codes = set(matched_graded_codes)
        ungraded_codes = sorted(code for code in students_by_username if code not in control_codes)

        extra_control_codes = []
        if len(control_codes) < target_control:
            needed = target_control - len(control_codes)
            rng = random.Random(seed)
            shuffled = ungraded_codes[:]
            rng.shuffle(shuffled)
            extra_control_codes = sorted(shuffled[:needed])
            control_codes.update(extra_control_codes)

        variant_codes = sorted(code for code in students_by_username if code not in control_codes)
        control_codes_sorted = sorted(control_codes)

        report = {
            'dry_run': not apply_changes,
            'seed': seed,
            'total_students': total,
            'target_control': target_control,
            'control_count': len(control_codes_sorted),
            'variant_count': len(variant_codes),
            'graded_input_count': len(graded_codes),
            'graded_matched_count': len(matched_graded_codes),
            'missing_codes': missing_codes,
            'ignored_non_numeric_students': sorted(ignored_non_numeric),
            'control_from_graded': matched_graded_codes,
            'control_extra_for_makeup_grading': extra_control_codes,
            'variant': variant_codes,
        }

        click.echo('--- AB GROUP ASSIGNMENT REPORT ---')
        click.echo(f"Mode: {'APPLY' if apply_changes else 'DRY-RUN'}")
        click.echo(f"Total students: {total}")
        click.echo(f"Control: {len(control_codes_sorted)}")
        click.echo(f"  - From graded list: {len(matched_graded_codes)}")
        click.echo(f"  - Extra control for makeup grading: {len(extra_control_codes)}")
        click.echo(f"Variant: {len(variant_codes)}")

        if missing_codes:
            click.echo(f"⚠️ Missing in DB ({len(missing_codes)}): {', '.join(missing_codes[:20])}")
            if len(missing_codes) > 20:
                click.echo(f"  ... and {len(missing_codes) - 20} more")

        if ignored_non_numeric:
            click.echo(f"Ignored non-numeric student accounts: {len(ignored_non_numeric)}")

        if report_file:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            click.echo(f"Report written to: {report_file}")

        if not apply_changes:
            click.echo('Dry-run only. Add --apply after you confirm this report.')
            return

        try:
            for code in control_codes_sorted:
                students_by_username[code].experimental_group = 'control'
            for code in variant_codes:
                students_by_username[code].experimental_group = 'variant'
            db.session.commit()
            click.echo('✅ Đã cập nhật experimental_group trong bảng user.')
        except Exception as e:
            db.session.rollback()
            click.echo(f'❌ Lỗi khi cập nhật DB: {e}')

if __name__ == "__main__":
    cli()
