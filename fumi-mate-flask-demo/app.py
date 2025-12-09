from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory data store
users = {
    'student1': {'id': 'student1', 'user_type': 'student'},
    'student2': {'id': 'student2', 'user_type': 'student'},
    'teacher1': {'id': 'teacher1', 'user_type': 'teacher'},
    'reviewer1': {'id': 'reviewer1', 'user_type': 'reviewer'},
}

questions = {
    'q1': {
        'id': 'q1',
        'question_text': '「山」という漢字を使って、短い文を書いてください。',
        'difficulty_level': 'N5'
    },
    'q2': {
        'id': 'q2',
        'question_text': 'あなたの好きな季節について書いてください。',
        'difficulty_level': 'N4'
    },
    'q3': {
        'id': 'q3',
        'question_text': 'Translate: "I go to school every day"',
        'difficulty_level': 'N4'
    },
    'q4': {
        'id': 'q4',
        'question_text': 'あなたの家族について200字で書いてください。',
        'difficulty_level': 'N3'
    },
}

tasks = {
    'task1': {
        'id': 'task1',
        'question_id': 'q1',
        'teacher_id': 'teacher1',
        'deadline': '2025-01-15T23:59:59Z'
    },
    'task2': {
        'id': 'task2',
        'question_id': 'q2',
        'teacher_id': 'teacher1',
        'deadline': '2025-01-20T23:59:59Z'
    },
    'task3': {
        'id': 'task3',
        'question_id': 'q4',
        'teacher_id': 'teacher1',
        'deadline': '2025-01-25T23:59:59Z'
    },
}

submissions = {
    'sub1': {
        'id': 'sub1',
        'task_id': 'task1',
        'student_id': 'student1',
        'content': '富士山は日本で一番高い山です。私は春が好きです。桜がとてもきれいだからです。',
        'status': 3,  # teacher graded
        'ai_score': 85,
        'ai_feedback': 'Good work! Your kanji usage is accurate.',
        'teacher_score': 88,
        'teacher_feedback': 'Excellent effort! Your kanji is very neat.',
        'submission_time': '2025-01-05T10:30:00Z'
    },
    'sub2': {
        'id': 'sub2',
        'task_id': 'task2',
        'student_id': 'student1',
        'content': '私は毎日学校に行きます。',
        'status': 2,  # AI graded only
        'ai_score': 92,
        'ai_feedback': 'Perfect translation!',
        'submission_time': '2025-01-06T09:15:00Z'
    },
    'sub3': {
        'id': 'sub3',
        'task_id': 'task3',
        'student_id': 'student1',
        'content': '私の家族は四人です。父と母と弟がいます。父は会社員です。母は先生です。弟は高校生です。私たちはとても仲がいいです。週末によく一緒に出かけます。',
        'status': 3,  # teacher graded
        'ai_score': 88,
        'ai_feedback': 'Excellent essay! Your description is clear.',
        'teacher_score': 90,
        'teacher_feedback': 'Great work! Your essay is well-written and engaging.',
        'submission_time': '2025-01-07T11:00:00Z'
    },
    'sub4': {
        'id': 'sub4',
        'task_id': 'task1',
        'student_id': 'student2',
        'content': '山は高いです。春はいいです。',
        'status': 0,  # draft
    },
}

# API Endpoints

@app.route('/api/submissions', methods=['GET', 'POST'])
def handle_submissions():
    if request.method == 'GET':
        student_id = request.args.get('student_id')
        task_id = request.args.get('task_id')

        filtered_submissions = list(submissions.values())

        if student_id:
            filtered_submissions = [s for s in filtered_submissions if s['student_id'] == student_id]
        if task_id:
            filtered_submissions = [s for s in filtered_submissions if s['task_id'] == task_id]

        return jsonify(filtered_submissions)

    elif request.method == 'POST':
        data = request.get_json()
        submission_id = f"sub{len(submissions) + 1}"

        new_submission = {
            'id': submission_id,
            'task_id': data['task_id'],
            'student_id': data['student_id'],
            'content': data['content'],
            'status': 1,  # submitted
            'submission_time': datetime.utcnow().isoformat() + 'Z'
        }

        submissions[submission_id] = new_submission
        return jsonify(new_submission), 201

@app.route('/api/submissions/<submission_id>', methods=['PATCH'])
def update_submission(submission_id):
    if submission_id not in submissions:
        return jsonify({'error': 'Submission not found'}), 404

    data = request.get_json()
    submission = submissions[submission_id]

    if 'teacher_score' in data:
        submission['teacher_score'] = data['teacher_score']
        submission['status'] = 3  # teacher graded

    if 'teacher_feedback' in data:
        submission['teacher_feedback'] = data['teacher_feedback']

    return jsonify(submission)

@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
    if request.method == 'GET':
        teacher_id = request.args.get('teacher_id')
        filtered_tasks = list(tasks.values())

        if teacher_id:
            filtered_tasks = [t for t in filtered_tasks if t['teacher_id'] == teacher_id]

        return jsonify(filtered_tasks)

    elif request.method == 'POST':
        data = request.get_json()
        task_id = f"task{len(tasks) + 1}"

        new_task = {
            'id': task_id,
            'question_id': data['question_id'],
            'teacher_id': data['teacher_id'],
            'deadline': data['deadline']
        }

        tasks[task_id] = new_task
        return jsonify(new_task), 201

@app.route('/api/questions', methods=['GET', 'POST'])
def handle_questions():
    if request.method == 'GET':
        return jsonify(list(questions.values()))

    elif request.method == 'POST':
        data = request.get_json()
        question_id = f"q{len(questions) + 1}"

        new_question = {
            'id': question_id,
            'question_text': data['question_text'],
            'difficulty_level': data['difficulty_level']
        }

        questions[question_id] = new_question
        return jsonify(new_question), 201

@app.route('/api/rag/find_question', methods=['POST'])
def find_question():
    data = request.get_json()
    prompt = data.get('prompt', '')
    difficulty = data.get('difficulty', 'N5')

    # Simple mock logic: return a question matching difficulty
    matching_questions = [q for q in questions.values() if q['difficulty_level'] == difficulty]
    if matching_questions:
        return jsonify({'question_id': matching_questions[0]['id']})
    else:
        # Fallback to first question
        return jsonify({'question_id': list(questions.keys())[0]})

@app.route('/api/rag/generate_question', methods=['POST'])
def generate_question():
    data = request.get_json()
    criteria = data.get('criteria', {})

    # Mock generated questions
    generated_questions = [
        {
            'id': f"gen_q{len(questions) + 1}",
            'question_text': '新しく生成された質問です。',
            'difficulty_level': criteria.get('difficulty', 'N5')
        }
    ]

    return jsonify({'candidates': generated_questions})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
