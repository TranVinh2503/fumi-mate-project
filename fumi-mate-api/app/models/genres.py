from ..extensions import db

class Genre(db.Model):
    __tablename__ = 'genres'

    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, default=0, nullable=False)  # 0 = main genre, >0 = sub-genre
    name_jp = db.Column(db.String(255), nullable=False)
    name_vn = db.Column(db.String(255), nullable=False)

    # Self-referential relationship for hierarchy (disabled - add FK migration later)
    # parent = db.relationship('Genre', remote_side=[id], back_populates='subgenres')
    # subgenres = db.relationship('Genre', back_populates='parent')
    
    # Questions using this genre/sub-genre
    questions = db.relationship('QuestionBank', back_populates='sub_genre')

    def __repr__(self):
        return f'<Genre {self.id}: {self.name_jp}>'

