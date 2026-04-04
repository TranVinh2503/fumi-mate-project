# TODO: Auto-grading with Gemini + Rubric (Approved)

## Steps:
- [x] 1. Create fumi-mate-api/app/constants/writing_rubric.json with provided tasks/rubric
- [x] 2. fumi-mate-api/app/models/task.py: Add task_type_id (int 0-9)
- [x] 3. Migration: alembic revision + upgrade
- [x] 4. fumi-mate-api/app/services/gemini_service.py: Add grade_writing_submission(task_type_id, content, difficulty)
- [x] 5. Update fumi-mate-api/app/ai_services.py: Use new grader in generate_ai_feedback
- [x] 6. fumi-mate-api/app/api/student.py: Pass task.id/task_type_id to feedback gen
- [x] 7. Update fumi-mate-nextjs/lib/types.ts: Extend ai_feedback structure
- [x] 8. Test submission → verify structured grading (manual: set task.task_type_id=1, submit essay, check ai_feedback JSON + score)
- [x] 9. Complete

✅ Rubric-based Gemini auto-grading implemented!

**Usage**: Create task w/ task_type_id (0-9), students submit → AI grades per rubric (criteria_scores, total_score/100, feedback etc.). Restart API (`cd fumi-mate-api && python run.py`).

Current: 1/9
