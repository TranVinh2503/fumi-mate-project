from datetime import datetime
from ..extensions import db

class Task(db.Model):
    __tablename__ = 'task'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.String(20))
    due_date = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_done = db.Column(db.Boolean, default=False, nullable=False)

    # Quan hệ với bảng trung gian TaskQuestion
    task_questions = db.relationship('TaskQuestion', back_populates='task', lazy=True, cascade="all, delete-orphan")
    created_user = db.relationship('User', backref='tasks', lazy=True)

    def get_questions(self):
        return [tq.question_bank for tq in sorted(self.task_questions, key=lambda x: x.order)]

# THAY THẾ CLASS QUESTION CŨ BẰNG CLASS NÀY
class TaskQuestion(db.Model):
    __tablename__ = 'task_question'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    question_bank_id = db.Column(db.Integer, db.ForeignKey('question_bank.id'), nullable=False)
    order = db.Column(db.Integer, default=1)

    # Nối ngược lại Task và QuestionBank
    task = db.relationship('Task', back_populates='task_questions')
    question_bank = db.relationship('QuestionBank', back_populates='task_questions')