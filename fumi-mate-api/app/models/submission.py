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
    version = db.Column(db.Integer, default=1)  # For versioning
    parent_id = db.Column(db.Integer, db.ForeignKey('submission.id'), nullable=True)  # For re-submissions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referential relationship for parent submissions
    parent = db.relationship('Submission', remote_side=[id], backref='children')
