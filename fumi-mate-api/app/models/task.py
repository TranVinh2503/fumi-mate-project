from datetime import datetime
from ..extensions import db


# ── Task: e.g., "N4 Kanji Practice", "Essay Writing Test" ──
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

    questions = db.relationship('Question', backref='task', lazy=True, cascade="all, delete-orphan")

    # NEW: link back to User
    created_user = db.relationship('User', backref='tasks', lazy=True)



# ── Question: belongs to one Task ──
class Question(db.Model):
    __tablename__ = 'question'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50))  # e.g., 'kanji', 'sentence', 'translation', 'essay'
    hint = db.Column(db.String(255))  # optional: e.g., “Use this word: 食べる”
    sample_answer = db.Column(db.Text)  # optional: teacher’s example answer

    def __repr__(self):
        return f'<Question {self.id} ({self.question_type})>'
