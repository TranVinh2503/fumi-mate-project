# TODO List - 文メイト Next.js Frontend

## 🔴 High Priority - Student Pages

### Student Tasks Page
- [ ] Create `app/student/tasks/page.tsx`
  - [ ] Display list of available tasks
  - [ ] Show task cards with title, description, due date
  - [ ] Filter by difficulty (N5, N4, N3, N2, N1)
  - [ ] Mark completed tasks differently
  - [ ] Link to task detail page
  - [ ] Show "No tasks" empty state

### Student Task Detail Page
- [ ] Create `app/student/tasks/[id]/page.tsx`
  - [ ] Display task information
  - [ ] Show questions
  - [ ] Display due date and difficulty
  - [ ] "Start Test" button
  - [ ] Show if already submitted

### Student Writing Test Page
- [ ] Create `app/student/writing-test/[taskId]/page.tsx`
  - [ ] Text area for writing
  - [ ] Character counter
  - [ ] Timer display (optional)
  - [ ] Save draft functionality
  - [ ] Submit button with confirmation
  - [ ] Auto-save feature
  - [ ] Prevent navigation without saving

### Student Submissions Page
- [ ] Create `app/student/submissions/page.tsx`
  - [ ] List all submissions
  - [ ] Show status (draft, submitted, graded)
  - [ ] Display scores (AI and teacher)
  - [ ] Filter by status
  - [ ] Sort by date
  - [ ] Link to submission detail

### Student Submission Detail Page
- [ ] Create `app/student/submissions/[id]/page.tsx`
  - [ ] Display submitted content
  - [ ] Show AI feedback with detailed analysis
  - [ ] Show teacher feedback
  - [ ] Display scores
  - [ ] Show action plan
  - [ ] Display practice exercises
  - [ ] Grammar/vocabulary breakdown
  - [ ] Print/export functionality

## 🔴 High Priority - Teacher Pages

### Teacher Tasks Dashboard
- [ ] Create `app/teacher/tasks/page.tsx`
  - [ ] List all created tasks
  - [ ] Show task statistics (submissions count)
  - [ ] Create new task button
  - [ ] Edit/delete task actions
  - [ ] Filter and search
  - [ ] Sort by date/difficulty

### Teacher Create Task Page
- [ ] Create `app/teacher/tasks/create/page.tsx`
  - [ ] Task title input
  - [ ] Description textarea
  - [ ] Difficulty selector (N5-N1)
  - [ ] Due date picker
  - [ ] Add questions dynamically
  - [ ] Question type selector
  - [ ] Sample answer input
  - [ ] Form validation
  - [ ] Save draft functionality

### Teacher Edit Task Page
- [ ] Create `app/teacher/tasks/[id]/edit/page.tsx`
  - [ ] Pre-fill form with existing data
  - [ ] Same fields as create page
  - [ ] Update functionality
  - [ ] Delete confirmation

### Teacher Task Detail Page
- [ ] Create `app/teacher/tasks/[id]/page.tsx`
  - [ ] Display task information
  - [ ] Show all questions
  - [ ] List submissions
  - [ ] Statistics (completion rate, average score)
  - [ ] Edit/delete buttons

### Teacher Submissions Page
- [ ] Create `app/teacher/submissions/page.tsx`
  - [ ] List all student submissions
  - [ ] Filter by task
  - [ ] Filter by student
  - [ ] Filter by status (pending, graded)
  - [ ] Sort by date/score
  - [ ] Quick grade view

### Teacher Grade Submission Page
- [ ] Create `app/teacher/submissions/[id]/page.tsx`
  - [ ] Display student's writing
  - [ ] Show AI feedback
  - [ ] Teacher score input
  - [ ] Teacher feedback textarea
  - [ ] Rubric display
  - [ ] Save grade button
  - [ ] Return to student option

## 🟡 Medium Priority - Components

### Reusable Components
- [ ] Create `components/ui/TaskCard.tsx`
  - [ ] Task information display
  - [ ] Status badge
  - [ ] Difficulty badge
  - [ ] Action buttons
  - [ ] Hover effects

- [ ] Create `components/ui/SubmissionCard.tsx`
  - [ ] Submission preview
  - [ ] Status indicator
  - [ ] Scores display
  - [ ] Click to view detail

- [ ] Create `components/ui/FeedbackDisplay.tsx`
  - [ ] Formatted feedback text
  - [ ] Score visualization
  - [ ] Action plan list
  - [ ] Practice exercises
  - [ ] Detailed analysis sections

- [ ] Create `components/ui/QuestionForm.tsx`
  - [ ] Question input fields
  - [ ] Type selector
  - [ ] Hint input
  - [ ] Sample answer
  - [ ] Add/remove buttons

- [ ] Create `components/ui/LoadingSpinner.tsx`
  - [ ] Animated spinner
  - [ ] Different sizes
  - [ ] Optional text

- [ ] Create `components/ui/Button.tsx`
  - [ ] Variants (primary, secondary, danger)
  - [ ] Sizes (sm, md, lg)
  - [ ] Loading state
  - [ ] Disabled state

- [ ] Create `components/ui/Input.tsx`
  - [ ] Text input
  - [ ] Textarea
  - [ ] Error state
  - [ ] Label integration

- [ ] Create `components/ui/Select.tsx`
  - [ ] Dropdown select
  - [ ] Multi-select option
  - [ ] Search functionality

- [ ] Create `components/ui/Modal.tsx`
  - [ ] Confirmation dialogs
  - [ ] Form modals
  - [ ] Close on overlay click
  - [ ] Keyboard navigation

- [ ] Create `components/ui/Toast.tsx`
  - [ ] Success notifications
  - [ ] Error notifications
  - [ ] Auto-dismiss
  - [ ] Action buttons

## 🟡 Medium Priority - Features

### Form Validation
- [ ] Install react-hook-form
- [ ] Install zod for schema validation
- [ ] Create validation schemas
- [ ] Add error messages
- [ ] Add field-level validation
- [ ] Add form-level validation

### Loading States
- [ ] Add loading spinners
- [ ] Skeleton screens
- [ ] Progress indicators
- [ ] Disable buttons during loading

### Error Handling
- [ ] Create error boundary component
- [ ] Add try-catch blocks
- [ ] Display user-friendly errors
- [ ] Log errors for debugging
- [ ] Retry mechanisms

### Search & Filter
- [ ] Search tasks by title
- [ ] Filter by difficulty
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Clear filters button

### Pagination
- [ ] Add pagination component
- [ ] Page size selector
- [ ] Previous/next buttons
- [ ] Jump to page
- [ ] Show total count

### Sorting
- [ ] Sort by date
- [ ] Sort by score
- [ ] Sort by status
- [ ] Toggle ascending/descending

## 🟢 Low Priority - API Integration

### API Client Setup
- [ ] Create `lib/api.ts`
- [ ] Configure base URL
- [ ] Add request interceptors
- [ ] Add response interceptors
- [ ] Error handling
- [ ] Retry logic

### Authentication
- [ ] Install NextAuth.js or similar
- [ ] Create auth context
- [ ] Implement login API call
- [ ] Implement register API call
- [ ] Implement logout
- [ ] Store tokens securely
- [ ] Refresh token logic

### Protected Routes
- [ ] Create middleware for auth check
- [ ] Redirect unauthenticated users
- [ ] Role-based access control
- [ ] Protect student routes
- [ ] Protect teacher routes

### API Endpoints Implementation
- [ ] Replace mock data in tasks page
- [ ] Replace mock data in submissions page
- [ ] Implement create task API call
- [ ] Implement update task API call
- [ ] Implement delete task API call
- [ ] Implement submit test API call
- [ ] Implement grade submission API call
- [ ] Add loading states for all API calls
- [ ] Add error handling for all API calls

## 🟢 Low Priority - Testing

### Unit Tests
- [ ] Test utility functions
- [ ] Test helper functions
- [ ] Test data transformations
- [ ] Test validation schemas

### Component Tests
- [ ] Test TaskCard component
- [ ] Test SubmissionCard component
- [ ] Test form components
- [ ] Test button interactions
- [ ] Test modal behavior

### Integration Tests
- [ ] Test page navigation
- [ ] Test form submissions
- [ ] Test data flow
- [ ] Test error scenarios

### E2E Tests
- [ ] Install Playwright
- [ ] Test login flow
- [ ] Test task creation flow
- [ ] Test submission flow
- [ ] Test grading flow

## 🟢 Low Priority - Optimization

### Performance
- [ ] Implement code splitting
- [ ] Lazy load components
- [ ] Optimize images
- [ ] Add caching strategies
- [ ] Minimize bundle size
- [ ] Use React.memo where appropriate
- [ ] Optimize re-renders

### SEO
- [ ] Add meta tags
- [ ] Create sitemap
- [ ] Add robots.txt
- [ ] Implement structured data
- [ ] Add Open Graph tags
- [ ] Add Twitter cards

### Accessibility
- [ ] Add ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast check
- [ ] Focus management
- [ ] Alt text for images

### Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Performance monitoring
- [ ] User behavior tracking

## 📝 Documentation

- [ ] API documentation
- [ ] Component documentation
- [ ] Deployment guide
- [ ] Contributing guidelines
- [ ] Code style guide
- [ ] Testing guide

## 🚀 Deployment

- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables
- [ ] Set up staging environment
- [ ] Set up production environment
- [ ] Configure domain
- [ ] SSL certificate
- [ ] CDN setup
- [ ] Backup strategy

---

## Progress Tracking

### Completed: 9 items
- ✅ Project setup
- ✅ TypeScript configuration
- ✅ TailwindCSS setup
- ✅ Layout components
- ✅ Auth pages
- ✅ Mock data
- ✅ Type definitions
- ✅ Utility functions
- ✅ Documentation

### In Progress: 0 items

### Total Remaining: ~100+ items

### Estimated Time
- High Priority: 2-3 weeks
- Medium Priority: 2-3 weeks
- Low Priority: 3-4 weeks
- **Total**: 7-10 weeks for complete implementation

---

**Last Updated**: December 4, 2024
