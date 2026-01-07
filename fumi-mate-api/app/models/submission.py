from datetime import datetime
from ..extensions import db

class Submission(db.Model):
    __tablename__ = 'submission'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    content = db.Column(db.Text)
    ai_feedback = db.Column(db.Text)
    ai_score = db.Column(db.Float)
    teacher_feedback = db.Column(db.Text)
    teacher_score = db.Column(db.Float)
    status = db.Column(db.String(20), default='draft') #done
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
