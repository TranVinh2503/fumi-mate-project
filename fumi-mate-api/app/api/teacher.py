from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.task import Task, TaskQuestion
from ..ai_services import generate_ai_feedback
from app.utils.permissions import role_required

teacher_bp = Blueprint('teacher', __name__)
