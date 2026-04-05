# TODO: Student control group - Full teacher feedback display

## Information Gathered
- Student page shows AI rubric for variant (criteria_scores, strengths, improvements...)
- Control shows placeholder "Chờ giáo viên chấm"
- Backend teacher_feedback now full FeedbackData JSON
- types.ts has TeacherFeedbackData extends FeedbackData
- Page already fetches submission.teacher_feedback

## Plan
1. Update fumi-mate-nextjs/app/student/submissions/[id]/page.tsx: Parse/display teacher_feedback identical to ai_feedback for control
2. Control: rubric, strengths/improvements/action_plan, detailed_analysis
3. Shared components/logic with variant section
4. Test control submission → teacher grade → full display

## Dependent Files
- fumi-mate-nextjs/app/student/submissions/[id]/page.tsx (main)
- fumi-mate-nextjs/lib/types.ts (confirm TeacherFeedbackData)

## Followup steps
- Restart Next.js (`npm run dev`)
- Test control student submission → teacher rubric → full student view

<ask_followup_question>
Plan OK? Proceed to implement?
</ask_followup_question>
