# Teacher Submissions Real API Integration
Status: Planning

## Phase 1: Backend APIs (teacher.py) ✅
- [x] 1. GET /api/teacher/submissions (list teacher's submissions)
- [x] 2. GET /api/teacher/submissions/<id> (detail)
- [x] 3. POST /api/teacher/grade-submission/<id> (grade)

## Phase 2: Frontend Replace Mocks ✅
- [x] 4. app/teacher/submissions/page.tsx → fetch TEACHER_SUBMISSIONS
- [x] 5. app/teacher/submissions/[id]/page.tsx → fetch detail/grade POST
- [x] 6. Update types.ts (SubmissionWithDetails)

## Test
- [ ] Restart backend
- [ ] Teacher: /teacher/submissions list → detail → grade
- [ ] Update task detail submissions count

**Backend APIs ready. Frontend now uses real API calls instead of mocks. Ready for testing!**

## Phase 2: Frontend Replace Mocks
- [ ] 4. app/teacher/submissions/page.tsx → fetch TEACHER_SUBMISSIONS
- [ ] 5. app/teacher/submissions/[id]/page.tsx → fetch detail/grade POST
- [ ] 6. Update types.ts (SubmissionWithDetails)

## Test
- [ ] Restart backend
- [ ] Teacher: /teacher/submissions list → detail → grade
- [ ] Update task detail submissions count

Notes: Use Submission model fields (student_id, content, ai_score, teacher_score, status='draft/submitted/...')
