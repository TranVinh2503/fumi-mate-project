# TODO: Add experimental_group to submission detail (Approved Plan)

## Steps:
- [x] 1. Update fumi-mate-api/app/models/submission.py: Add student relationship to User
- [x] 2. Update fumi-mate-api/app/api/student.py: Include experimental_group from student User in get_submission_detail response
- [x] 3. Update fumi-mate-nextjs/lib/types.ts: Add experimental_group to Submission interface
- [ ] 4. Test: Restart API, refresh page, verify console.log and UI conditional rendering
- [ ] 5. Complete task

Current step: 1/5
