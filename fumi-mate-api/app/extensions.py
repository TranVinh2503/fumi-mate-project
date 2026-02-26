from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

# --- THÊM ĐOẠN NÀY VÀO DƯỚI ĐÂY ---

@jwt.user_identity_loader
def user_identity_loader(user_data):
    """
    Hàm này quyết định cái gì sẽ được lưu vào trường 'sub' của Token.
    Vì bạn đang truyền vào một Dictionary {"id": "...", "role": "..."},
    ta cần trả về một giá trị mà JWT có thể serialize được (thường là ID).
    """
    if isinstance(user_data, dict):
        return user_data.get("id")
    return str(user_data)

@jwt.user_lookup_loader
def user_lookup_loader(_jwt_header, jwt_data):
    """
    Hàm này giúp bạn lấy đối tượng User từ Database tự động.
    jwt_data["sub"] chính là cái ID ta đã trả về ở hàm trên.
    """
    from .models import User  # Import tại đây để tránh lỗi vòng lặp (circular import)
    identity = jwt_data["sub"]
    return User.query.get(identity)