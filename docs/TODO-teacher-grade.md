# TODO: Teacher Grade Student Submissions

## Plan
### 1. ✅ Backend grade endpoint PATCH /api/teacher/submissions/<id>/grade
 - teacher.py: update teacher_score, teacher_feedback, status='teacher_graded'
 - Check task.created_by == teacher_id

### 2. ✅ Frontend teacher detail form
 - app/teacher/submissions/[id]/page.tsx: score input, feedback textarea, submit
 - Disable if graded

### 3. ✅ Update student detail show teacher_score/feedback

**Status:** ✅ COMPLETE (refetch + isDone fixed)
