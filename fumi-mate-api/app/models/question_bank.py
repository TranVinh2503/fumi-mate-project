from ..extensions import db
from sqlalchemy import Enum

class QuestionBank(db.Model):
    __tablename__ = 'question_bank'

    id = db.Column(db.Integer, primary_key=True)
    genre = db.Column(Enum('手紙', 'スピーチ', '意見・感想', name='genre_enum'), nullable=False)
    topic = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)  # The prompt
    level = db.Column(Enum('N3', 'N2', name='level_enum'), nullable=False)
    required_points = db.Column(db.Text, nullable=False)  # JSON list of mandatory ideas
    similarity_hash = db.Column(db.String(64), unique=True, nullable=False)  # For deduplication

    # Relationship to TaskQuestion (many-to-many with Task)
    task_questions = db.relationship('TaskQuestion', back_populates='question_bank', lazy=True)

    def __repr__(self):
        return f'<QuestionBank {self.id} ({self.genre}, {self.level})>'
