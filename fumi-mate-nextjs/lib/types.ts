// User Types
export type UserType = 'student' | 'teacher' | 'reviewer';

export interface User {
  id: string;
  name: string;
  user_type: UserType;
}

// Task Types
export interface Task {
  id: string;
  question_id: string;
  teacher_id: string;
  deadline: string; // ISO datetime
}

// Question Types
export interface Question {
  id: string;
  question_text: string;
  difficulty_level: string; // e.g. N2, N3
}

// Submission Types
export type SubmissionStatus = 0 | 1 | 2 | 3 | 4; // 0: draft, 1: submitted, 2: AI graded, 3: teacher graded, 4: reviewed

export interface Submission {
  id: string;
  task_id: string;
  student_id: string;
  content: string;
  ai_score?: number;
  ai_feedback?: string;
  teacher_score?: number;
  teacher_feedback?: string;
  submission_time?: string; // ISO datetime
  status: SubmissionStatus;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// RAG API Types
export interface RagFindQuestionRequest {
  prompt: string;
  difficulty: string;
}

export interface RagFindQuestionResponse {
  question_id: string;
}

export interface RagGenerateQuestionRequest {
  criteria: Record<string, any>; // flexible criteria object
}

export interface RagGenerateQuestionResponse {
  candidates: Question[];
}

// Task Creation Request
export interface CreateTaskRequest {
  prompt: string;
  difficulty: string;
  deadline: string;
  teacher_id: string;
}

// Submission Creation/Update
export interface CreateSubmissionRequest {
  task_id: string;
  student_id: string;
  content: string;
}

export interface UpdateSubmissionRequest {
  teacher_score?: number;
  teacher_feedback?: string;
}
