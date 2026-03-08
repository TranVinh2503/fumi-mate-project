from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return "", 200
            
            try:
                # Check Authorization header
                auth_header = request.headers.get('Authorization')
                print(f"DEBUG AUTH HEADER: {auth_header}")
                
                verify_jwt_in_request()
                
                claims = get_jwt()
                user_role = claims.get("role")
                user_identity = get_jwt_identity()
                
                print(f"DEBUG CHECK QUYỀN: Yêu cầu quyền [{role}], User identity: {user_identity}, User đang có quyền [{user_role}]")

                if str(user_role).strip().lower() != str(role).strip().lower():
                    return jsonify({"error": f"Permission denied. Required: {role}, got: {user_role}"}), 403

                return f(*args, **kwargs)
            except Exception as e:
                print(f"DEBUG JWT ERROR: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": "Lỗi xác thực Token: " + str(e)}), 401

        return wrapper
    return decorator
