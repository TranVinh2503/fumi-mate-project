from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from ..extensions import db
from ..models import User, StudentProfile, TeacherProfile
from sqlalchemy.exc import IntegrityError
import re

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        username = data.get("username", "").strip()
        password = data.get("password", "")
        role = data.get("role", "").strip().lower()  # 'student' | 'teacher' | 'admin'

        if not username or not password or not role:
            return jsonify({"message": "Missing fields"}), 400

        if not re.match(r"^[A-Za-z0-9_]{3,20}$", username):
            return jsonify({"message": "Invalid username: must be 3-20 chars, letters/numbers/_ only"}), 400

        if len(password) < 6:
            return jsonify({"message": "Password too short, minimum 6 characters"}), 400

        if role not in ["student", "teacher", "admin"]:
            return jsonify({"message": "Invalid role"}), 400

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({"message": "Username already exists"}), 409

        user = User(
            username=username,
            password_hash=generate_password_hash(password),
            role=role
        )

        db.session.add(user)
        db.session.flush()

        if role == "teacher":
            db.session.add(TeacherProfile(user_id=user.id))
        elif role == "student":
            db.session.add(StudentProfile(user_id=user.id))

        db.session.commit()

        return jsonify({"message": "Registered successfully", "user_id": user.id}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Database integrity error"}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Server error", "error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid username or password"}), 401

    # Pass user object directly - @jwt.user_identity_loader will handle it
    access_token = create_access_token(identity=user)
    print("LOGIN SUCCESSFUL", access_token)
    
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }), 200

@auth_bp.route("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    # identity now returns {"id": "4", "role": "teacher"} from @jwt.user_identity_loader
    if isinstance(identity, dict):
        user_id = identity.get("id")
    else:
        user_id = identity
    user = User.query.get(int(user_id))
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role
    }
