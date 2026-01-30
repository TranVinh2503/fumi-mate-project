from datetime import datetime
from ..extensions import db


class Class(db.Model):
    """Class model for grouping students and assigning tasks"""
    __tablename__ = 'class'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    students = db.relationship('StudentProfile', back_populates='class_', lazy='dynamic')
    tasks = db.relationship('Task', back_populates='class_', lazy='dynamic')
    
    def __repr__(self):
        return f'<Class {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

