from ..extensions import db

class DetailedFeedback(db.Model):
    __tablename__ = 'detailed_feedback'

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submission.id'), nullable=False)
    task_achievement = db.Column(db.Float, nullable=False)  # 0-25 points
    content_organization = db.Column(db.Float, nullable=False)  # 0-25 points
    vocabulary_expression = db.Column(db.Float, nullable=False)  # 0-25 points
    grammar_orthography = db.Column(db.Float, nullable=False)  # 0-25 points
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationship back to Submission
    submission = db.relationship('Submission', backref=db.backref('detailed_feedback', uselist=False))

    def __repr__(self):
        return f'<DetailedFeedback {self.id} for Submission {self.submission_id}>'

    def calculate_total_score(self):
        """
        Calculate the total score by summing the 4 criteria.
        Each criterion is worth up to 25 points, total max 100.
        """
        return self.task_achievement + self.content_organization + self.vocabulary_expression + self.grammar_orthography
