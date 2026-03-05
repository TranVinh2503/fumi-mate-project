// API Configuration
// All API endpoints should use these base URLs

// For Next.js frontend to call Flask backend
// In production, you might want to use environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Student
  STUDENT_TASKS: `${API_BASE_URL}/api/student/tasks`,
  STUDENT_SUBMIT_TEST: (taskId: number) => `${API_BASE_URL}/api/student/submit-test/${taskId}`,
  STUDENT_SUBMISSIONS: `${API_BASE_URL}/api/student/submissions`,
  
  // Teacher
  TEACHER_TASKS: `${API_BASE_URL}/api/teacher/tasks`,
  TEACHER_CREATE_TASK: `${API_BASE_URL}/api/teacher/tasks`,
  TEACHER_STUDENTS: `${API_BASE_URL}/api/teacher/students`,
  TEACHER_SUBMISSIONS: `${API_BASE_URL}/api/teacher/submissions`,

  //question
  QUESTION_QUERY: `${API_BASE_URL}/api/task/questions`
};

export default API_BASE_URL;
