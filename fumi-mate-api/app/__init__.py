from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from .config import Config
import os

from .extensions import db, jwt, migrate
from .routes.auth import auth_bp
from .routes.task import task_bp
from .api.student import student_bp
from .api.teacher import teacher_bp
from .api.main import main_bp

def create_app():
    load_dotenv()

    app = Flask(__name__)

    # ===== CONFIG =====
    app.config.from_object(Config)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]

    # ===== EXTENSIONS =====
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # ===== JWT CUSTOM CALLBACK =====
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        print("--- [DEBUG] TẠO TOKEN CHO USER_ID:", user.id)
        # BẮT BUỘC CHỈ TRẢ VỀ STRING ĐỂ KHÔNG BỊ LỖI 422
        return str(user.id) 
    
    # THÊM HÀM NÀY ĐỂ LƯU ROLE TRONG TOKEN
    @jwt.additional_claims_loader
    def add_claims_to_access_token(user):
        return {"role": user.role}
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        print("--- [DEBUG] CALL API: GIẢI MÃ TOKEN ID LÀ:", identity)
        from app.models.user import User
        return User.query.get(int(identity))


    # ===== CORS =====
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "supports_credentials": True,
        }
    })

    # ===== BLUEPRINTS =====
    app.register_blueprint(main_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(task_bp, url_prefix="/api/task")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")

    return app
