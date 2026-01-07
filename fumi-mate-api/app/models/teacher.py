from ..extensions import db

class TeacherProfile(db.Model):
    __tablename__ = "teacher_profile"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,db.ForeignKey("user.id"),unique=True,nullable=False)

    bio = db.Column(db.Text)
    experience_years = db.Column(db.Integer)

    user = db.relationship(
        "User",
        backref=db.backref("teacher_profile", uselist=False)
    )
