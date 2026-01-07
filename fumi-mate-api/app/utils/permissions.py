from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):

            # ✅ CHO PREFLIGHT ĐI QUA
            if request.method == "OPTIONS":
                return "", 200

            identity = get_jwt_identity()
            if not identity:
                return jsonify({"error": "Unauthorized"}), 401

            if identity.get("role") != role:
                return jsonify({"error": "Permission denied"}), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator
