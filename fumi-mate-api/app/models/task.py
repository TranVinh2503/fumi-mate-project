from datetime import datetime
from ..extensions import db

class Task(db.Model):
    __tablename__ = 'task'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.String(20))
    due_date = db.Column(db.DateTime)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=True)  # Class assignment
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_done = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships
    task_questions = db.relationship('TaskQuestion', back_populates='task', lazy=True, cascade="all, delete-orphan")
    created_user = db.relationship('User', backref='tasks', lazy=True)
    class_ = db.relationship('Class', back_populates='tasks', lazy=True)
    questions = db.relationship(
        'QuestionBank',
        secondary='task_question',
        back_populates='tasks',
        viewonly=True
    )

    def get_questions(self):
        return [tq.question for tq in sorted(self.task_questions, key=lambda x: x.order)]


class TaskQuestion(db.Model):
    __tablename__ = 'task_question'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    question_bank_id = db.Column(db.Integer, db.ForeignKey('question_bank.id'), nullable=False)
    order = db.Column(db.Integer, default=1)

    # Relationships
    task = db.relationship('Task', back_populates='task_questions')
    question = db.relationship('QuestionBank', back_populates='task_questions')
