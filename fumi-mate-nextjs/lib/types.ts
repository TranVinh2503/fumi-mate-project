// User Types
export type UserType = 'student' | 'teacher' | 'reviewer';

export interface Genre {
  id: number;
  parent_id: number;
  name_jp: string;
  name_vn: string;
}

export interface Topic {
  id: number;
  parent_id: number;
  name_jp: string;
  name_vn: string;
}

export interface User {
  id: string;
  name: string;
  user_type: UserType;
}

// Task Types
export interface Task {
  id: number | string;
  title: string;
  description?: string;
  difficulty?: string;
  dueDate?: string;
  deadline?: string;
  startDate?: string;
  createdAt?: string;
  isDone?: boolean;
  questionCount?: number;
  questions?: Array<{
    id: number;
    content: string;
    level: number;
    subGenre: {
      id: number;
      nameJp: string;
      nameVn: string;
    };
    subTopic: {
      id: number;
      nameJp: string;
      nameVn: string;
    };
  }>;
  assignedStudents?: number[];
}

// Question Types
export interface Question {
  id: string;
  question_text: string;
  difficulty_level: string; // e.g. N2, N3
}

// Submission Types
export type SubmissionStatus = 'draft' | 'submitted' | 'ai_graded' | 'teacher_graded' | 'reviewed';

export interface Submission {
  id: number | string;
  task?: {
    id: number | string;
    title: string;
  };
  task_id: number | string;
  student_id: number | string;
  student_name?: string;
  task_title?: string;
  content: string;
  aiScore?: number;
  ai_score?: number;
  ai_feedback?: string | object;
  teacherScore?: number;
  teacher_score?: number;
  teacher_feedback?: string;
  status: SubmissionStatus;
  submission_time?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionWithDetails extends Submission {
  student_name: string;
  task_title: string;
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
