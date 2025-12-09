# Fumi Mate Flask Demo API

A minimal Flask API for testing the Fumi Mate Next.js frontend.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the API:
```bash
python app.py
```

The API will run on `http://localhost:5000`

## API Endpoints

### Submissions
- `GET /api/submissions` - Get submissions (optional query params: `student_id`, `task_id`)
- `POST /api/submissions` - Create new submission
- `PATCH /api/submissions/<submission_id>` - Update submission (teacher grading)

### Tasks
- `GET /api/tasks` - Get tasks (optional query param: `teacher_id`)
- `POST /api/tasks` - Create new task

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create new question

### RAG Endpoints
- `POST /api/rag/find_question` - Find existing question by prompt
- `POST /api/rag/generate_question` - Generate new questions

## Data Model

- **Users**: id, user_type (student/teacher/reviewer)
- **Tasks**: id, question_id, teacher_id, deadline
- **Questions**: id, question_text, difficulty_level
- **Submissions**: id, task_id, student_id, content, status (0-4), scores, feedback

## Status Codes
- 0: draft
- 1: submitted
- 2: AI graded
- 3: teacher graded
- 4: reviewed

## Sample Data

The API comes pre-loaded with sample data for testing.
