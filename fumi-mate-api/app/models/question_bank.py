from ..extensions import db

class QuestionBank(db.Model):
    __tablename__ = 'question_bank'

    id = db.Column(db.Integer, primary_key=True)
    sub_genre_id = db.Column(db.Integer, db.ForeignKey('genres.id'), nullable=False)
    sub_topic_id = db.Column(db.Integer, db.ForeignKey('topics.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    required_points = db.Column(db.Text, nullable=False)
    level = db.Column(db.Integer, nullable=False)  # 1-5 mapping e.g. N5=1, N1=5
    similarity_hash = db.Column(db.String(64), unique=True, nullable=False)

    # Relationships
    sub_genre = db.relationship('Genre', back_populates='questions')
    sub_topic = db.relationship('Topic', back_populates='questions')
    task_questions = db.relationship('TaskQuestion', back_populates='question_bank', lazy=True)

    def __repr__(self):
        return f'<QuestionBank {self.id} (Genre:{self.sub_genre_id}, Topic:{self.sub_topic_id}, Level:{self.level})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'sub_genre_id': self.sub_genre_id,
            'sub_topic_id': self.sub_topic_id,
            'content': self.content,
            'level': self.level,
            'required_points': self.required_points,
            'similarity_hash': self.similarity_hash
        }
