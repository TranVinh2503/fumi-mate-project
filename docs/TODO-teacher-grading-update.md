# TODO: Mirror AI Grading in Teacher Manual Grading (Approved)

## Steps:
- [x] 1. Update fumi-mate-nextjs/app/teacher/submissions/[id]/page.tsx: Full rubric form implemented
- [x] 2. Update fumi-mate-api/app/api/teacher.py: PATCH /grade accepts full AI JSON, validates criteria_scores/overall_score, saves teacher_feedback as JSON
- [x] 3. Update fumi-mate-nextjs/lib/types.ts: TeacherFeedbackData = FeedbackData
- [ ] 4. Test form submit → DB → display
- [ ] 5. Complete

Current step: 1/5
