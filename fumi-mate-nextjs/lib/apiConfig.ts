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
  STUDENT_TASK_DETAIL: (taskId: string) => `${API_BASE_URL}/api/student/tasks/${taskId}`,
  STUDENT_SUBMIT_TEST: (taskId: number) => `${API_BASE_URL}/api/student/submit-test/${taskId}`,
  STUDENT_SUBMISSIONS: `${API_BASE_URL}/api/student/submissions`,
  TEACHER_GRADE_SUBMISSION: (id: number) => `${API_BASE_URL}/api/teacher/submissions/${id}/grade`,
  TEACHER_AI_GRADE_SUBMISSION: (id: number) => `${API_BASE_URL}/api/teacher/submissions/${id}/ai-grade`,
  
// Teacher
  TEACHER_TASKS: `${API_BASE_URL}/api/teacher/tasks`,
  TEACHER_CREATE_TASK: `${API_BASE_URL}/api/teacher/tasks`,
  TEACHER_STUDENTS: `${API_BASE_URL}/api/teacher/students`,
  TEACHER_SUBMISSIONS: `${API_BASE_URL}/api/teacher/submissions`,
  TEACHER_TASK_DETAIL: (taskId: number) => `${API_BASE_URL}/api/teacher/tasks/${taskId}`,

// Question Bank
  QUESTION_QUERY: `${API_BASE_URL}/api/task/questions`,
  
  // Admin
  ADMIN_GENRES: `${API_BASE_URL}/api/admin/genres`,
  ADMIN_TOPICS: `${API_BASE_URL}/api/admin/topics`,
  ADMIN_QUESTION_CREATE: `${API_BASE_URL}/api/admin/question-bank`,

  //change
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  TEACHER_UPLOAD_WORD: (id: number) => `${API_BASE_URL}/api/teacher/submissions/${id}/upload-word`,

  // api download file submission
  API_BASE_URL_SERVER_DOWNLOADFILE : `${API_BASE_URL}`
};

export default API_BASE_URL;
