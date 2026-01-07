from ..extensions import db

class StudentProfile(db.Model):
    __tablename__ = "student_profile"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        unique=True,
        nullable=False
    )

    jlpt_level = db.Column(db.String(10))  # N5, N4, N3...
    total_points = db.Column(db.Integer, default=0)

    user = db.relationship(
        "User",
        backref=db.backref("student_profile", uselist=False)
    )
