from datetime import datetime
from ..extensions import db

class Feedback(db.Model):
    __tablename__ = 'feedback'

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submission.id'))
    agent_name = db.Column(db.String(100))
    result = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)