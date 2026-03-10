import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ===== BASIC =====
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # ===== JWT =====
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 60 * 60 * 24))  # 1 day

    # ===== DATABASE =====
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ===== CORS =====
    CORS_SUPPORTS_CREDENTIALS = True
