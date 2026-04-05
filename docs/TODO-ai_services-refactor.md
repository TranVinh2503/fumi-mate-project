# TODO: Refactor generate_ai_feedback (Feedback-approved)

## Plan:
**Issues**:
- Early `return feedback` → dead code
- Duplicated base_score/difficulty logic
- Hardcoded scores ruin A/B test
- Mixed camel/snake_case

**Fixes**:
1. **Priority 1**: Use `grade_writing_submission(task.task_type_id, content)` if task_type_id
2. **Priority 2**: Dynamic fallback `_calculate_heuristic_score(content, difficulty)`
3. **Snake_case**: overall_score, criteria_scores, etc
4. Clean structure, no duplication

## Steps:
- [x] 1. Refactor ai_services.py
- [x] 2. Test: Submit task w/task_type_id → rubric scores
- [x] 3. Test fallback (no task_type_id → dynamic length/JP chars)
- [x] 4. Complete

✅ Debug logs added! Server logs `[AI-FEEDBACK]` + `grading_method` in JSON.
Frontend console shows method too.
