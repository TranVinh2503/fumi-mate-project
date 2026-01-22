# Current Backend Audit

## Database Schema

### Models Breakdown

#### User
- **Fields**:
  - `id` (Integer, Primary Key)
  - `username` (String, Unique, Not Null)
  - `password_hash` (String, Not Null)
  - `role` (String, Not Null, Indexed) - Values: 'admin', 'teacher', 'student'
  - `created_at` (DateTime, Server Default: now())
- **Relationships**:
  - 1-n with StudentProfile (uselist=False)
  - 1-n with TeacherProfile (uselist=False)
  - 1-n with Task (as creator)
  - 1-n with Submission (as student)

#### StudentProfile
- **Fields**:
  - `id` (Integer, Primary Key)
  - `user_id` (Integer, Foreign Key to User.id, Unique, Not Null)
  - `jlpt_level` (String) - e.g., 'N5', 'N4', etc.
  - `total_points` (Integer, Default: 0)
- **Relationships**:
  - n-1 with User

#### TeacherProfile
- **Fields**:
  - `id` (Integer, Primary Key)
  - `user_id` (Integer, Foreign Key to User.id, Unique, Not Null)
  - `bio` (Text)
  - `experience_years` (Integer)
- **Relationships**:
  - n-1 with User

#### Task
- **Fields**:
  - `id` (Integer, Primary Key)
  - `title` (String, Not Null)
  - `description` (Text)
  - `difficulty` (String) - e.g., 'N5'
  - `due_date` (DateTime)
  - `created_by` (Integer, Foreign Key to User.id)
  - `created_at` (DateTime, Default: utcnow)
  - `is_done` (Boolean, Default: False, Not Null)
- **Relationships**:
  - n-1 with User (creator)
  - 1-n with Question
  - 1-n with Submission

#### Question
- **Fields**:
  - `id` (Integer, Primary Key)
  - `task_id` (Integer, Foreign Key to Task.id, Not Null)
  - `question_text` (Text, Not Null)
  - `question_type` (String) - e.g., 'kanji', 'sentence', 'translation', 'essay'
  - `hint` (String)
  - `sample_answer` (Text)
- **Relationships**:
  - n-1 with Task

#### Submission
- **Fields**:
  - `id` (Integer, Primary Key)
  - `task_id` (Integer, Foreign Key to Task.id)
  - `student_id` (Integer, Foreign Key to User.id)
  - `content` (Text)
  - `ai_feedback` (Text)
  - `ai_score` (Float)
  - `teacher_feedback` (Text)
  - `teacher_score` (Float)
  - `status` (String, Default: 'draft') - e.g., 'draft', 'submitted'
  - `created_at` (DateTime, Default: utcnow)
  - `updated_at` (DateTime, Default: utcnow, On Update: utcnow)
- **Relationships**:
  - n-1 with Task
  - n-1 with User (student)
  - 1-n with Feedback

#### Feedback
- **Fields**:
  - `id` (Integer, Primary Key)
  - `submission_id` (Integer, Foreign Key to Submission.id)
  - `agent_name` (String)
  - `result` (Text)
  - `created_at` (DateTime, Default: utcnow)
- **Relationships**:
  - n-1 with Submission

### Relationships Summary
- **1-n (One-to-Many)**: User -> StudentProfile, User -> TeacherProfile, User -> Task, Task -> Question, Task -> Submission, User -> Submission, Submission -> Feedback
- **n-n (Many-to-Many)**: None explicitly defined, but could be inferred through intermediate models if needed.

## API Inventory

**Total APIs: 12**

### Auth Endpoints (Blueprint: auth)
- **POST /api/auth/register**: Registers a new user with username, password, role. Creates associated profile (StudentProfile or TeacherProfile). Validates input, checks uniqueness.
- **POST /api/auth/login**: Authenticates user, returns JWT access token with user info.
- **GET /api/auth/me** (JWT Required): Returns current authenticated user's info.

### Main Endpoints (Blueprint: main)
- **GET /api/**: Returns API info, version, and list of available endpoints.

### Student Endpoints (Blueprint: student, JWT + Role: student required)
- **GET /api/student/tasks**: Retrieves all tasks, includes submission status for current student.
- **GET /api/student/tasks/<task_id>**: Retrieves specific task details, including questions and existing submission.
- **GET /api/student/submissions**: Retrieves all submissions for current student.
- **GET /api/student/submissions/<submission_id>**: Retrieves detailed submission with AI feedback.
- **POST /api/student/submit-test/<task_id>**: Submits or saves a test. Generates AI feedback on submit.

### Teacher Endpoints (Blueprint: teacher)
- No routes defined yet.

### Task Endpoints (Blueprint: task)
- **POST /api/task/generate**: Generates a task with questions using Gemini AI. Requires topic, level, numQuestions.

## Logic Audit

### User Roles Handling
- Roles are stored in the `User.role` field with values: 'student', 'teacher', 'admin'.
- Upon registration, profiles are created: StudentProfile for 'student', TeacherProfile for 'teacher'.
- Authentication uses JWT, with role included in token identity.
- Permissions are enforced via `@role_required` decorator (e.g., student endpoints require 'student' role).
- Role-based access: Students can view tasks/submissions, teachers (future) can manage tasks/submissions.

### Submission/Grading Flow
- Students submit content via POST /submit-test/<task_id>, with action 'save' (draft) or 'submit'.
- On submit, AI feedback is generated using `generate_ai_feedback` (from ai_services.py), stored as JSON in `ai_feedback`, score in `ai_score`.
- Teachers can later add `teacher_feedback` and `teacher_score` (not implemented in APIs yet).
- Status: 'draft' -> 'submitted' on submit.
- Feedback model exists but not used in current flow; seems for additional AI agents.

## Gap Analysis

### AI Question Generation
- Partially implemented: POST /api/task/generate calls `generate_task` (commented out), uses Gemini service.
- Missing: Full integration, topic/level handling, saving generated tasks/questions to DB.
- Gap: No UI integration, no persistence of generated content.

### Topic-based Question Bank
- No topic field in Task or Question models.
- Questions are tied to specific Tasks, no shared bank.
- Gap: Need Topic model, Question-Bank relationships, search/filter by topic.

### Similarity Checking
- Not implemented at all.
- Gap: Need service to check submission similarity (e.g., against other submissions or sample answers), store results, perhaps in Feedback or new model.
