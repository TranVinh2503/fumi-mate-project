from datetime import datetime
from ..extensions import db


class QuestionBank(db.Model):
    """Question bank for storing reusable questions"""
    __tablename__ = 'question_bank'
    
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)  # essay, multiple_choice, etc.
    hint = db.Column(db.Text, nullable=True)
    sample_answer = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(20), default='N5')  # N5, N4, N3, N2, N1
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    task_questions = db.relationship('TaskQuestion', back_populates='question', lazy='dynamic')
    tasks = db.relationship(
        'Task',
        secondary='task_question',
        back_populates='questions',
        viewonly=True
    )
    
    def __repr__(self):
        return f'<QuestionBank {self.id}: {self.question_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'hint': self.hint,
            'sample_answer': self.sample_answer,
            'difficulty': self.difficulty,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
