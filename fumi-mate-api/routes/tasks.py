from flask import Blueprint, request, jsonify
from services.gemini_service import generate_task

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/generate', methods=['POST'])
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
