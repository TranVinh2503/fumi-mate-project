# TODO: Add Task Start Date (Auto-release Feature)

## Plan Breakdown

### 1. ✅ Add start_date to Task model
 - `fumi-mate-api/app/models/task.py`

### 2. ✅ Migration complete
 - `flask db migrate -m "add start_date to task" && flask db upgrade`

### 3. ✅ Filter in student get_tasks API
 - Only show tasks where start_date <= now OR null
 - `fumi-mate-api/app/api/student.py`

### 4. ✅ Update frontend types
 - Add startDate?: string to Task
 - `fumi-mate-nextjs/lib/types.ts`

### 5. ✅ Seed example tasks with start_date
 - Updated seed_start.py (task1 past start, task2 future)

**Status:** Starting...
