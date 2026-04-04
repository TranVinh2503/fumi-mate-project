# app/models/user.py
from ..extensions import db

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    role = db.Column(
        db.String(20),
        nullable=False,
        index=True
    )  # 'admin' | 'teacher' | 'control' | 'variant'

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    experimental_group = db.Column(db.String(20), default='control', server_default='control')  # 'control' | 'variant' for students

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
