# 文メイト (Fumi-Mate) - Flask Backend API

A Flask REST API for a Japanese learning platform with AI-powered writing feedback.

## Features

- JWT Authentication with role-based access control
- Student Routes: View tasks, submit writing tests, check submissions
- Teacher Routes: Create tasks, manage submissions, grade students
- AI Integration: Gemini-powered feedback for writing submissions
- PostgreSQL Database with SQLAlchemy ORM
- CORS Enabled for Next.js frontend on localhost:3000

## Project Structure

fumi-mate-api/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config.py                # Configuration settings
│   ├── extensions.py            # DB, JWT, Migrate extensions
│   ├── api/
│   │   ├── main.py             # Main routes
│   │   ├── student.py          # Student endpoints
│   │   └── teacher.py          # Teacher endpoints
│   ├── routes/
│   │   ├── auth.py             # Login/register
│   │   └── task.py             # Task routes
│   ├── models/
│   │   ├── user.py             # User model
│   │   ├── student.py          # Student profile
│   │   ├── teacher.py          # Teacher profile
│   │   ├── task.py             # Task & TaskQuestion
│   │   ├── question_bank.py    # Question bank
│   │   ├── submission.py       # Student submissions
│   │   └── feedback.py         # Feedback models
│   ├── services/
│   │   └── gemini_service.py   # AI feedback service
│   ├── ai_services.py          # AI feedback wrapper
│   ├── utils/
│   │   └── permissions.py      # Role-based decorators
│   └── constants/
│       └── roles.py            # Role constants
├── migrations/                  # Alembic migrations
├── test/                        # Test files
├── run.py                       # Application entry point
├── seed.py                      # Database seeding
├── requirements.txt             # Python dependencies
└── .env                         # Environment variables

## Setup Instructions

### Prerequisites
- Python 3.9+
- PostgreSQL 14+
- pip or poetry

### Installation

1. Create virtual environment:
```bash
cd fumi-mate-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
Create .env file:
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=postgresql://username:password@localhost:5432/fumi_mate
GEMINI_API_KEY=your-gemini-api-key
```

4. Initialize database:
```bash
flask db upgrade
```

5. Seed sample data (optional):
```bash
python seed.py
```

### Running the Server

```bash
python run.py
# Server runs at http://localhost:5001
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get JWT token |
| GET | /api/auth/me | Get current user info |

### Student Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/student/tasks | Get all tasks |
| GET | /api/student/tasks/<id> | Get task details |
| POST | /api/student/submit-test/<task_id> | Submit/save writing test |
| GET | /api/student/submissions | Get all submissions |
| GET | /api/student/submissions/<id> | Get submission details |

### Teacher Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/teacher/tasks | Get all tasks |
| POST | /api/teacher/tasks | Create new task |
| PUT | /api/teacher/tasks/<id> | Update task |
| DELETE | /api/teacher/tasks/<id> | Delete task |
| GET | /api/teacher/submissions | Get all submissions |
| POST | /api/teacher/grade/<id> | Grade submission |

## Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

Role-based access:
- @role_required("student") - Student access only
- @role_required("teacher") - Teacher access only

Role is passed in request body/query for each request:
```json
{ "role": "student" }
```

## Database Schema

### Users Table
- id (PK)
- username (unique)
- password_hash
- role (student/teacher/admin)
- created_at

### Tasks Table
- id (PK)
- title
- description
- difficulty (N5, N4, N3, N2, N1)
- due_date
- created_at

### Question Bank Table
- id (PK)
- question_text
- question_type
- hint
- sample_answer
- difficulty

### Task Questions (Many-to-Many)
- id (PK)
- task_id (FK)
- question_bank_id (FK)
- order

### Submissions Table
- id (PK)
- task_id (FK)
- student_id (FK)
- content
- status (draft/submitted)
- ai_score
- ai_feedback (JSON)
- teacher_score
- teacher_feedback
- created_at, updated_at

## Sample API Requests

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "password123"}'
```

### Get Tasks
```bash
curl -X GET http://localhost:5001/api/student/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "student"}'
```

### Submit Test
```bash
curl -X POST http://localhost:5001/api/student/submit-test/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "My essay...", "action": "submit"}'
```

## Dependencies

- Flask - Web framework
- Flask-JWT-Extended - JWT authentication
- Flask-SQLAlchemy - Database ORM
- Flask-Migrate - Database migrations
- Flask-CORS - Cross-origin resource sharing
- google-generativeai - Gemini AI for feedback
- psycopg2-binary - PostgreSQL adapter
- python-dotenv - Environment variables

## Resources

- Flask Documentation: https://flask.palletsprojects.com/
- Flask-JWT-Extended: https://flask-jwt-extended.readthedocs.io/
- SQLAlchemy: https://docs.sqlalchemy.org/
- PostgreSQL: https://www.postgresql.org/docs/
- Gemini API: https://ai.google.dev/docs

