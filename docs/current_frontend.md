# Current Frontend Audit

## Component Architecture

**Total Pages: 8**

### Existing Pages

#### Login Page (`/login`)
- **Purpose**: User authentication entry point.
- **Components**: Form with username/password inputs, submit button, error messages, link to register.
- **Features**: JWT token storage in localStorage, redirects based on user role (`/student/tasks` or `/teacher/tasks`).
- **State Management**: Uses `useState` for form data and messages; integrates with `AuthContext` for login.
- **UI Design**: Tailwind CSS, responsive form layout.

#### Register Page (`/register`)
- **Purpose**: New user registration.
- **Components**: Form with username, password, role selection (student/teacher/admin), submit button, link to login.
- **Features**: Validates input, calls backend API, handles errors.
- **State Management**: `useState` for form data; no auth context integration yet.
- **UI Design**: Similar to login, with role dropdown.

#### Student Dashboard (`/student/tasks`)
- **Purpose**: Display assigned tasks for students.
- **Components**: Task cards grid, loading/error states, task status (Completed/Not Started).
- **Features**: Fetches tasks from API, shows difficulty, due date, teacher; links to writing test.
- **State Management**: `useState` for tasks, loading, error; uses localStorage token.
- **UI Design**: Card-based layout, badges for status/difficulty.

#### Student Submissions (`/student/submissions`)
- **Purpose**: View student's own submissions.
- **Components**: Table with task, status, scores, updated date; clickable rows to detail view.
- **Features**: Fetches submissions from API (currently mock), displays AI/teacher scores.
- **State Management**: `useState` for submissions; mock data used.
- **UI Design**: Table layout, status badges.

#### Student Writing Test (`/student/writing-test/[id]`)
- **Purpose**: Take a writing task.
- **Components**: Task details, text area for submission, save/submit buttons.
- **Features**: Loads task/questions, allows draft save or final submit.
- **State Management**: `useState` for content; API integration for submit.
- **UI Design**: Form layout with question display.

#### Teacher Task Creation (`/teacher/tasks/create`)
- **Purpose**: Create new tasks with questions.
- **Components**: Form for task info (title, description, difficulty, due date), dynamic question list (add/remove), submit button.
- **Features**: Adds/removes questions, form validation; currently console logs (no API save).
- **State Management**: `useState` for form data and questions array.
- **UI Design**: Multi-section form, expandable question cards.

#### Teacher Tasks (`/teacher/tasks`)
- **Purpose**: Manage created tasks.
- **Components**: Table with task details, actions (view, edit, delete).
- **Features**: Lists tasks (mock data), delete functionality (mock).
- **State Management**: `useState` for tasks; mock data.
- **UI Design**: Table with action buttons.

#### Teacher Submissions (`/teacher/submissions`)
- **Purpose**: View and grade student submissions.
- **Components**: Filter tabs (All/Pending/Graded), table with submissions, grade/view buttons.
- **Features**: Filters by status, links to detail view; mock data.
- **State Management**: `useState` for submissions and filter.
- **UI Design**: Tabbed filters, detailed table.

### Shared Components
- **Navbar**: Role-based navigation, profile dropdown with logout.
- **Footer**: Static content.
- **AuthContext**: Global auth state (user, login/logout), persists to localStorage.

## Data Management

### Communication with Backend
- **HTTP Client**: Uses native `fetch` API (not Axios). All API calls include `Authorization: Bearer ${token}` header.
- **Base URL**: Hardcoded to `http://localhost:5000/api` (backend) and `http://localhost:5001/api` (inconsistent, likely typo).
- **Error Handling**: Basic try/catch, displays error messages in UI.
- **Authentication**: JWT tokens stored in localStorage; checked on mount in AuthContext.

### State Management
- **Local State**: `useState` hooks for component-specific data (forms, lists, loading states).
- **Global State**: `AuthContext` for user auth state (isAuthenticated, role, username).
- **Persistence**: Auth state saved to localStorage; token separate.
- **Data Fetching**: Manual in `useEffect` hooks; no caching or advanced libraries (e.g., React Query).

## Feature Status

### Functional Features
- **Authentication**: Login/register fully functional with backend API.
- **Student Tasks View**: Fetches and displays tasks from API.
- **Student Submissions**: Displays submissions (currently mock, but structure ready for API).
- **Student Writing Test**: Submit/save to API, generates AI feedback.
- **Role-based Routing**: Redirects based on user role after login.
- **Form Validation**: Basic client-side validation on forms.

### Placeholder/Template Features
- **Teacher Task Creation**: UI complete, but submit only logs to console (no API save).
- **Teacher Tasks Management**: Displays mock data, delete is mock.
- **Teacher Submissions**: Mock data, no grading UI implemented.
- **Student Dashboard**: Functional, but teacher info not fetched (hardcoded).
- **Error Handling**: Basic, but no global error boundaries or advanced UX.
- **Loading States**: Present but minimal (e.g., "Loading..." text).
- **Responsive Design**: Tailwind used, but not fully tested on all devices.
- **Accessibility**: Basic, but no ARIA labels or keyboard navigation checks.
