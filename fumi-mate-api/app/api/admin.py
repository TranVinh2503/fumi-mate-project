from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.genres import Genre
from app.models.topics import Topic
from app.models.question_bank import QuestionBank
from app.utils.permissions import role_required
# from app.services.gemini_service import generate_question_content
import hashlib
import json

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/genres', methods=['GET'])
@jwt_required()
@role_required(['admin', 'teacher'])
def get_genres():
    """List all genres"""
    genres = Genre.query.all()
    return jsonify({
        'genres': [g.to_dict() for g in genres]
    })

@admin_bp.route('/genres', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_genre():
    """Create new genre"""
    data = request.get_json()
    if not data.get('name_jp') or not data.get('name_vn'):
        return jsonify({'error': 'name_jp and name_vn required'}), 400
    
    parent_id = data.get('parent_id', 0)
    
    # Check if ID already exists (fixed ID support)
    genre_id = data.get('id')
    if genre_id:
        existing = Genre.query.get(genre_id)
        if existing:
            return jsonify({'error': 'ID already exists'}), 400
    
    genre = Genre(
        id=genre_id,
        parent_id=parent_id,
        name_jp=data['name_jp'],
        name_vn=data['name_vn']
    )
    
    db.session.add(genre)
    db.session.commit()
    
    return jsonify({
        'message': 'Genre created',
        'genre': genre.to_dict()
    }), 201

@admin_bp.route('/topics', methods=['GET'])
@jwt_required()
@role_required(['admin', 'teacher'])
def get_topics():
    """List all topics"""
    topics = Topic.query.all()
    return jsonify({
        'topics': [t.to_dict() for t in topics]
    })

@admin_bp.route('/topics', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_topic():
    """Create new topic"""
    data = request.get_json()
    if not data.get('name_jp') or not data.get('name_vn'):
        return jsonify({'error': 'name_jp and name_vn required'}), 400
    
    parent_id = data.get('parent_id', 0)
    
    topic_id = data.get('id')
    if topic_id:
        existing = Topic.query.get(topic_id)
        if existing:
            return jsonify({'error': 'ID already exists'}), 400
    
    topic = Topic(
        id=topic_id,
        parent_id=parent_id,
        name_jp=data['name_jp'],
        name_vn=data['name_vn']
    )
    
    db.session.add(topic)
    db.session.commit()
    
    return jsonify({
        'message': 'Topic created',
        'topic': topic.to_dict()
    }), 201

@admin_bp.route('/question-bank', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_question_bank():
    """Create new question bank entry"""
    data = request.get_json()
    
    required = ['sub_genre_id', 'sub_topic_id', 'content', 'level']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} required'}), 400
    
    # Check if content already exists (duplicate detection)
    content_hash = hashlib.md5(data['content'].encode('utf-8')).hexdigest()
    existing = QuestionBank.query.filter_by(similarity_hash=content_hash).first()
    if existing:
        return jsonify({'error': 'Question already exists'}), 400
    
    # Verify genre/topic exist
    genre = Genre.query.get(data['sub_genre_id'])
    topic = Topic.query.get(data['sub_topic_id'])
    if not genre or not topic:
        return jsonify({'error': 'Invalid genre or topic ID'}), 400
    
    question = QuestionBank(
        sub_genre_id=data['sub_genre_id'],
        sub_topic_id=data['sub_topic_id'],
        content=data['content'],
        level=data['level'],
        required_points=json.dumps(data.get('required_points', [])),
        similarity_hash=content_hash
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify({
        'message': 'Question added successfully',
        'question': question.to_dict()
    }), 201

@admin_bp.route('/question-bank', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_question_bank():
    """List all question bank entries with genres/topics"""
    questions = QuestionBank.query.all()
    genres = Genre.query.all()
    topics = Topic.query.all()
    
    return jsonify({
        'genres': [g.to_dict() for g in genres],
        'topics': [t.to_dict() for t in topics],
        'questions': [q.to_dict() for q in questions],
        'total': len(questions)
    })

# Add to main.py

