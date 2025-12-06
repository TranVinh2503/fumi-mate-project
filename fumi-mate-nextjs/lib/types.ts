// User Types
export type UserRole = 'student' | 'teacher';

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface Student extends User {
  role: 'student';
}

export interface Teacher extends User {
  role: 'teacher';
}

// Task Types
export type TaskDifficulty = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type QuestionType = 'writing' | 'kanji' | 'vocabulary' | 'translation' | 'essay';

export interface Question {
  id: number;
  taskId: number;
  questionText: string;
  questionType: QuestionType;
  hint?: string;
  sampleAnswer?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  difficulty: TaskDifficulty;
  dueDate?: string;
  createdBy: number;
  createdAt: string;
  isDone: boolean;
  questions: Question[];
}

// Submission Types
export type SubmissionStatus = 'draft' | 'submitted' | 'graded';

export interface Submission {
  id: number;
  taskId: number;
  studentId: number;
  content: string;
  status: SubmissionStatus;
  aiScore?: number;
  teacherScore?: number;
  aiFeedback?: string;
  teacherFeedback?: string;
  createdAt: string;
  updatedAt: string;
  task?: Task;
  student?: Student;
}

// Feedback Types
export interface DetailedAnalysis {
  grammar?: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  vocabulary?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  structure?: {
    score: number;
    comments: string[];
  };
  fluency?: {
    score: number;
    feedback: string;
  };
  content?: {
    score: number;
    feedback: string;
  };
}

export interface PracticeExercise {
  title: string;
  description: string;
  example: string;
}

export interface FeedbackData {
  grade: string;
  feedbackText: string;
  actionPlan: string[];
  practiceExercises: PracticeExercise[];
  detailedAnalysis: DetailedAnalysis;
  overallScore: number;
}
