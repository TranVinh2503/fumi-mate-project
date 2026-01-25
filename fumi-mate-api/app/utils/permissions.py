from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..extensions import db
from ..models import User

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):

            # ✅ CHO PREFLIGHT ĐI QUA
            if request.method == "OPTIONS":
                return "", 200

            identity = get_jwt_identity()
            print("identity", identity)
            
            if not identity:
                return jsonify({"error": "Unauthorized"}), 401

            # Identity is a string (user_id), query database to get the role
            try:
                user_id = int(identity)
                user = User.query.get(user_id)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid token identity"}), 401

            if not user:
                return jsonify({"error": "User not found"}), 401

            if user.role != role:
                return jsonify({"error": "Permission denied"}), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator
