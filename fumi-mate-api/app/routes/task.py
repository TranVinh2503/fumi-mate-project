from flask import Blueprint, request, jsonify
from app.services.gemini_service import generate_task, generate_single_question
from flask_jwt_extended import jwt_required
from app.models.task import Task, TaskQuestion
from app.models.question_bank import QuestionBank
from app.extensions import db
from app.utils.permissions import role_required
from sqlalchemy.exc import IntegrityError

task_bp = Blueprint('task', __name__)

@task_bp.route('/generate', methods=['POST'])
def generate():
    """
    Generate a task with questions using Gemini AI.
    Request body: {"topic": "string", "level": "string", "numQuestions": int}
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        topic = data.get('topic')
        level = data.get('level')
        num_questions = data.get('numQuestions')

        if not all([topic, level, num_questions]):
            return jsonify({'error': 'Missing required fields: topic, level, numQuestions'}), 400

        if not isinstance(num_questions, int) or num_questions <= 0:
            return jsonify({'error': 'numQuestions must be a positive integer'}), 400

        # Generate task
        task_data = generate_task(topic, level, num_questions)

        return jsonify(task_data), 200

    except Exception as e:
        print(f"Error in generate endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@task_bp.route('/generate-question', methods=['POST'])
@jwt_required()
@role_required('teacher')
def generate_question():
    """
    Generate a single question and save to QuestionBank using Gemini AI.
    Request body: {"sub_genre_id": int, "sub_topic_id": int, "level": int}
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        sub_genre_id = data.get('sub_genre_id')
        sub_topic_id = data.get('sub_topic_id')
        level = data.get('level')

        # Validate required fields
        if not all([sub_genre_id, sub_topic_id, level]):
            return jsonify({'error': 'Missing required fields: sub_genre_id, sub_topic_id, level'}), 400

        # Validate existence
        genre = Genre.query.get(sub_genre_id)
        topic = Topic.query.get(sub_topic_id)
        if not genre or not topic:
            return jsonify({'error': 'Invalid sub_genre_id or sub_topic_id'}), 400

        if not isinstance(level, int) or level < 1 or level > 5:
            return jsonify({'error': 'Level must be integer 1-5'}), 400

        # Get names for Gemini prompt
        genre_name = genre.name_jp
        topic_name = topic.name_jp
        level_str = f"N{5-level+1}"  # 1→N5, 2→N4, ..., 5→N1

        print(f"🔄 Generating question: genre={genre_name}, topic={topic_name}, level={level}")
        question_data = generate_single_question(genre_name, topic_name, level_str)

        # Create QuestionBank entry
        new_question = QuestionBank(
            sub_genre_id=sub_genre_id,
            sub_topic_id=sub_topic_id,
            content=question_data['content'],
            level=level,
            required_points=question_data['required_points'],
            similarity_hash=question_data['similarity_hash']
        )

        # Save to database
        try:
            db.session.add(new_question)
            db.session.commit()
            print(f"✅ Question saved to database with ID: {new_question.id}")
        except IntegrityError as e:
            db.session.rollback()
            if 'similarity_hash' in str(e):
                return jsonify({
                    'error': 'A similar question already exists'
                }), 409
            raise e

        return jsonify({
            'success': True,
            'question': {
                'id': new_question.id,
                'subGenre': {
                    'id': genre.id,
                    'nameJp': genre.name_jp,
                    'nameVn': genre.name_vn
                },
                'subTopic': {
                    'id': topic.id,
                    'nameJp': topic.name_jp,
                    'nameVn': topic.name_vn
                },
                'content': new_question.content,
                'level': new_question.level,
                'required_points': new_question.required_points,
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@task_bp.route('/questions', methods=['GET'])
@jwt_required()
def list_questions():
    """
    List all questions from QuestionBank.
    Optional query parameters:
    - genre: Filter by genre
    - level: Filter by level
    - limit: Number of results (default: 50)
    - offset: Pagination offset (default: 0)
    """
    try:
        # Get query parameters
        genre = request.args.get('genre')
        level = request.args.get('level')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Build query
        query = QuestionBank.query

        # Apply filters
        if genre:
            query = query.filter_by(genre=genre)
        if level:
            query = query.filter_by(level=level)

        # Get total count
        total = query.count()

        # Apply pagination
        questions = query.limit(limit).offset(offset).all()

        # Format response
        return jsonify({
            'success': True,
            'total': total,
            'limit': limit,
            'offset': offset,
            'questions': [
                {
                    'id': q.id,
                    'subGenre': {
                        'id': q.sub_genre_id,
                        'nameJp': getattr(q.sub_genre, 'name_jp', 'N/A'),
                        'nameVn': getattr(q.sub_genre, 'name_vn', 'N/A')
                    },
                    'subTopic': {
                        'id': q.sub_topic_id,
                        'nameJp': getattr(q.sub_topic, 'name_jp', 'N/A'),
                        'nameVn': getattr(q.sub_topic, 'name_vn', 'N/A')
                    },
                    'content': q.content,
                    'level': q.level,
                    'required_points': q.required_points
                }
                for q in questions
            ]
        }), 200

    except Exception as e:
        print(f"❌ Error in list-questions endpoint: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

