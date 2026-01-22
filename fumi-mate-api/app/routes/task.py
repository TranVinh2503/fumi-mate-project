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
    Request body: {"genre": "手紙|スピーチ|意見・感想", "topic": "string", "level": "N3|N2"}
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        genre = data.get('genre')
        topic = data.get('topic')
        level = data.get('level')

        # Validate required fields
        if not all([genre, topic, level]):
            return jsonify({'error': 'Missing required fields: genre, topic, level'}), 400

        # Validate genre
        valid_genres = ['手紙', 'スピーチ', '意見・感想']
        if genre not in valid_genres:
            return jsonify({
                'error': f'Invalid genre. Must be one of: {", ".join(valid_genres)}'
            }), 400

        # Validate level
        valid_levels = ['N3', 'N2']
        if level not in valid_levels:
            return jsonify({
                'error': f'Invalid level. Must be one of: {", ".join(valid_levels)}'
            }), 400

        # Generate question using Gemini
        print(f"🔄 Generating question: genre={genre}, topic={topic}, level={level}")
        question_data = generate_single_question(genre, topic, level)

        # Create QuestionBank entry
        new_question = QuestionBank(
            genre=genre,
            topic=topic,
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
            # Check if it's a duplicate hash error
            if 'similarity_hash' in str(e):
                return jsonify({
                    'error': 'A similar question already exists in the database',
                    'details': 'This question appears to be a duplicate based on content similarity'
                }), 409
            else:
                raise e

        # Return the saved question
        return jsonify({
            'success': True,
            'message': 'Question generated and saved successfully',
            'question': {
                'id': new_question.id,
                'genre': new_question.genre,
                'topic': new_question.topic,
                'content': new_question.content,
                'level': new_question.level,
                'required_points': new_question.required_points,
                'similarity_hash': new_question.similarity_hash
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error in generate-question endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

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
                    'genre': q.genre,
                    'topic': q.topic,
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

