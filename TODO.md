# Database Structure Update: Question Bank + Genres/Topics

Status: In Progress

## Steps:

### 1. ✅ Create new models (genres.py, topics.py)
### 2. ✅ Update existing models (question_bank.py, __init__.py)
### 3. ✅ Generate Alembic migration for new tables/FKs
### 4. ✅ Implement data migration in migration script
### 5. ✅ Update code references:
   - ✅ seed.py (insert genres/topics first)
   - ✅ app/routes/task.py (use IDs)
   - ✅ app/api/teacher.py, student.py (serialize names via rel)
   - ⏳ app/services/gemini_service.py, ai_services.py (map to IDs)
### 6. ⏳ Alembic upgrade head
### 7. Test: python fumi-mate-api/seed.py
### 8. Test APIs with Postman
### 9. Update docs if needed
### 10. Complete ✅

Next step: Apply migration.

