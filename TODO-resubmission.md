# TODO: Resubmission System (Max 2 attempts)

## Steps

### 1. ✅ DB Model: Added attempt_count to Submission
   - Migration file: fumi-mate-api/migrations/versions/add_attempt_count_submission.py
   - Update Submission model
   - `flask db migrate && flask db upgrade`

### 2. ✅ Backend: Updated submit-test + APIs attempt_count
   - student.py /submit-test: if teacher_graded and attempt_count <2, increment
   - Update get_submissions: include attempt_count

### 3. [PENDING] Frontend Student tasks page.tsx
   - Show 'Resubmit' if graded && attempt_count==1
   - 'Final Completed' if 2

### 4. [PENDING] Frontend Student submissions page.tsx + detail
   - Show "Attempt X/2"

### 5. [PENDING] Frontend Teacher submissions list/detail
   - Show "Attempt X/2"

**Status: Starting migration...**

