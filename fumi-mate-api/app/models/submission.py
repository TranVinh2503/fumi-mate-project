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
    attempt_count = db.Column(db.Integer, default=1)  # Track resubmission attempts max 2
    late_minutes = db.Column(db.Float, default=0.0)  # Late submission minutes
    parent_id = db.Column(db.Integer, db.ForeignKey('submission.id'), nullable=True)  # For re-submissions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    word_file_path = db.Column(db.String(500), nullable=True)  # Path to teacher-uploaded corrected Word file

    # Self-referential relationship for parent submissions
    parent = db.relationship('Submission', remote_side=[id], backref='children')
    
    # Relationship to student user for experimental_group
    student = db.relationship('User', foreign_keys=[student_id], backref='submissions')
    ai_grading_results = db.relationship(
        'AIGradingResult',
        back_populates='submission',
        cascade='all, delete-orphan',
        order_by='AIGradingResult.created_at.desc()'
    )
