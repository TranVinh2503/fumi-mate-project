from datetime import datetime
from ..extensions import db


class AIGradingResult(db.Model):
    __tablename__ = 'ai_grading_result'

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submission.id'), nullable=False, index=True)
    provider = db.Column(db.String(30), nullable=False)
    model = db.Column(db.String(100), nullable=True)
    prompt_version = db.Column(db.String(50), nullable=True)
    rubric_version = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(30), nullable=False, default='succeeded')
    total_score = db.Column(db.Float, nullable=True)
    feedback_json = db.Column(db.Text, nullable=True)
    raw_response = db.Column(db.Text, nullable=True)
    error_reason = db.Column(db.Text, nullable=True)
    latency_ms = db.Column(db.Integer, nullable=True)
    is_selected = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    submission = db.relationship('Submission', back_populates='ai_grading_results')
