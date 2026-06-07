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
  title?: string;
  question_id?: string;
  teacher_id?: string;
  description?: string;
  difficulty?: string;
  dueDate?: string;
  deadline?: string;
  startDate?: string;
  taskTypeId?: number | null;
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
export type SubmissionStatus = 0 | 1 | 2 | 3 | 4 | 'draft' | 'submitted' | 'ai_graded' | 'ai_teacher_graded' | 'teacher_graded' | 'reviewed';

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
  ai_grading_results?: AIGradingResult[];

}

export interface SubmissionWithDetails extends Submission {
  student_name: string;
  task_title: string;
}

export interface AIGradingResult {
  id: number;
  submission_id: number;
  provider: 'gemini' | 'openai' | string;
  model?: string | null;
  prompt_version?: string | null;
  rubric_version?: string | null;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'fallback' | string;
  total_score?: number | null;
  feedback?: FeedbackData | Record<string, any>;
  error_reason?: string | null;
  latency_ms?: number | null;
  is_selected?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
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

export type GradingMethod =
  | 'teacher_manual'
  | 'ai_generated'
  | 'gemini_rubric'
  | 'ai_7_criteria_gemini'
  | 'openai_7_criteria'
  | 'openai_7_criteria_fallback'
  | 'heuristic_7_criteria_fallback'
  | 'heuristic_dynamic'
  | 'ai_heuristic';

export interface TeacherFeedbackData extends FeedbackData {
  grading_method?: GradingMethod;
}

// Enhanced FeedbackData for rubric grading
export interface FeedbackData {
  grade?: string;
  feedback_text?: string;
  ai_summary?: string;
  corrected_text?: string;
  error_reason?: string;
  action_plan?: string[];
  strengths?: string[];
  improvements?: string[];

  // 7 criteria scores: { "1": 11.25, ..., "7": 7.5 }
  criteria_scores?: Record<string, number>;

  // 7 criteria levels: { "1": "M3", ..., "7": "M2" }
  criteria_levels?: Record<string, 'M1' | 'M2' | 'M3' | 'M4'>;

  // Feedback riêng từng tiêu chí
  criteria_feedback?: Record<string, string>;

  practice_exercises?: Array<{
    title: string;
    description: string;
    example?: string;
  }>;

  detailed_analysis?: {
    grammar?: {
      score?: number;
      issues?: string[];
      suggestions?: string[];
    };
    vocabulary?: {
      score?: number;
      strengths?: string[];
      improvements?: string[];
    };
    structure?: {
      score?: number;
      comments?: string;
    };
    fluency?: {
      score?: number;
      feedback?: string;
    };
    content?: {
      score?: number;
      feedback?: string;
    };

    // thêm cho Japanese writing
    kanji_orthography?: {
      feedback?: string;
    };
    style_usage?: {
      feedback?: string;
    };
  };

  overall_score?: number;
  total_score?: number;
}
