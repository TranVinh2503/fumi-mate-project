from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

# app/utils/permissions.py
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return "", 200

            identity = get_jwt_identity()
            
            # Lấy user_role an toàn từ Dictionary
            user_role = None
            if isinstance(identity, dict):
                user_role = identity.get("role")
            else:
                user_role = identity # Trường hợp identity chỉ là string (token cũ)

            # In ra để debug (Xem ở terminal backend)
            print(f"DEBUG: Required role: {role}, User role: {user_role}")

            if str(user_role).strip().lower() != str(role).strip().lower():
                return jsonify({"error": f"Permission denied. Required: {role}, got: {user_role}"}), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator