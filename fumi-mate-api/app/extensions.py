# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

@jwt.user_identity_loader
def user_identity_loader(user_data):
    """
    Hàm này biến identity thành một string để lưu vào trường 'sub' của JWT.
    """
    print("user_data", user_data)
    if isinstance(user_data, dict):
        return str(user_data.get("id"))
    return str(user_data)

@jwt.user_lookup_loader
def user_lookup_loader(_jwt_header, jwt_data):
    """
    Hàm này dùng để lấy đối tượng User từ Database dựa vào 'sub' trong token.
    """
    from .models import User
    identity = jwt_data["sub"]
    return User.query.get(int(identity))
