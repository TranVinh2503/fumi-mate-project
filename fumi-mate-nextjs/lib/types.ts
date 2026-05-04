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
  attemptCount?: number;
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
  experimental_group?: string;
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
  aiFeedback?: object;
  teacherScore?: number;
  teacher_score?: number;
  teacher_feedback?: string;
  teacherFeedback?: string;
  attemptCount?: number;
  lateMinutes?: number;
  status: SubmissionStatus;
  submission_time?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  word_file_path?: string;
  word_file_url?: string;

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

export interface TeacherFeedbackData extends FeedbackData {
  grading_method?: 'teacher_manual';
}

// Enhanced FeedbackData for rubric grading
export interface FeedbackData {
  grade?: string;
  feedback_text?: string;
  action_plan?: string[];
  strengths?: string[];
  improvements?: string[];
  criteria_scores?: Record<string, number>;
  practice_exercises?: Array<{
    title: string;
    description: string;
    example?: string;
  }>;
  detailed_analysis?: {
    grammar?: { score: number; issues?: string[]; suggestions?: string[] };
    vocabulary?: { score: number; strengths?: string[]; improvements?: string[] };
    structure?: { score: number; comments?: string };
    fluency?: { score: number; feedback?: string };
    content?: { score: number; feedback?: string };
  };
  overall_score?: number;
  total_score?: number;
}
