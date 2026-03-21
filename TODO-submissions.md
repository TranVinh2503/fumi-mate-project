# TODO: Fix Student Submissions - Replace Mock with Real API

## Plan Breakdown & Progress Tracking

### 1. ✅ Update types.ts to ensure Submission compatibility
   - Add `task_title?: string` and align status types with backend strings.
   - File: `fumi-mate-nextjs/lib/types.ts`

### 2. ✅ Update submissions list page.tsx - Real API integration complete with loading/error states, status mapping, backend field mapping (task.title, aiScore, updatedAt)
   - Replace mock getSubmissionsByStudentId with real fetch to /api/student/submissions
   - Use AuthContext for token
   - Map status strings to UI badges
   - Use task.title for display
   - Add loading/error states
   - File: `fumi-mate-nextjs/app/student/submissions/page.tsx`

### 3. ✅ Update submissions detail [id]/page.tsx - Real API, loading/error/not found UI, field mapping
   - Replace mock getSubmissionById with real fetch to /api/student/submissions/${id}
   - Use task.title
   - Keep feedback parsing
   - Add loading/error
   - File: `fumi-mate-nextjs/app/student/submissions/[id]/page.tsx`

### 4. [PENDING] Test implementation
   - Run backend: cd fumi-mate-api && python run.py
   - Run frontend: cd fumi-mate-nextjs && npm run dev
   - Login as student, check list/detail pages
   - Verify API calls succeed with auth

### 5. [PENDING] Optional: Cleanup mocks
   - Remove/update mock functions for submissions after confirmation

**Status: Starting implementation...**

