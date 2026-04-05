# TODO: Frontend AI re-grade for variant students (Feedback-approved)

## Steps:
- [x] 1. Backend: fumi-mate-api/app/api/student.py add PATCH /submissions/<int:submission_id>/grade → if variant call generate_ai_feedback
- [x] 2. Frontend: fumi-mate-nextjs/app/student/submissions/[id]/page.tsx → useEffect if variant && !ai_score → POST grade
- [ ] 3. types.ts UpdateSubmissionRequest add task_type_id? (optional)
- [x] 4. Test: Submit (control=no AI), detail page → auto AI if variant
- [x] 5. Complete

✅ Variant students auto AI-grade on detail page load if no score!

Current: 1/5
