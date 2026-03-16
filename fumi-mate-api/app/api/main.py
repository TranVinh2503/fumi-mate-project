from flask import Blueprint, jsonify
from app.api.admin import admin_bp

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Welcome to Fumi-Mate API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'student': '/api/student',
            'teacher': '/api/teacher',
            'admin': '/api/admin',
            'health': '/api/health'
        }
    }), 200
