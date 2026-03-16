from ..extensions import db

class Topic(db.Model):
    __tablename__ = 'topics'

    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, default=0, nullable=False)  # 0 = main topic, >0 = sub-topic
    name_jp = db.Column(db.String(255), nullable=False)
    name_vn = db.Column(db.String(255), nullable=False)

    # Self-referential relationship for hierarchy (disabled - add FK migration later)
    # parent = db.relationship('Topic', remote_side=[id], back_populates='subtopics')
    # subtopics = db.relationship('Topic', back_populates='parent')
    
    # Questions using this topic/sub-topic
    questions = db.relationship('QuestionBank', back_populates='sub_topic')

    def __repr__(self):
        return f'<Topic {self.id}: {self.name_jp}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name_jp': self.name_jp,
            'name_vn': self.name_vn,
            'parent_id': self.parent_id
        }

