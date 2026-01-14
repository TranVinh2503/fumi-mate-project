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

    # ===== EXTENSIONS =====
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)  # 🔥 THIS IS REQUIRED


    # ===== CORS =====
    # Configure CORS to allow localhost:3000 with credentials
    cors_config = {
        "resources": {
            r"/api/*": {
                "origins": "http://localhost:3000",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        }
    }
    CORS(app, **cors_config)

    # ===== BLUEPRINTS =====
    app.register_blueprint(main_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(task_bp, url_prefix="/api/task")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")

    return app
