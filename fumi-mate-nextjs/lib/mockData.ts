import { User, Task, Submission, Question } from './types';

// Mock Users
export const mockUsers: User[] = [
  { id: 'student1', name: 'Alice Johnson', user_type: 'student' },
  { id: 'student2', name: 'Bob Smith', user_type: 'student' },
  { id: 'teacher1', name: 'Dr. Tanaka', user_type: 'teacher' },
  { id: 'reviewer1', name: 'Ms. Yamada', user_type: 'reviewer' },
];

// Mock Questions
export const mockQuestions: Question[] = [
  {
    id: 'q1',
    question_text: '「山」という漢字を使って、短い文を書いてください。',
    difficulty_level: 'N5',
  },
  {
    id: 'q2',
    question_text: 'あなたの好きな季節について書いてください。',
    difficulty_level: 'N4',
  },
  {
    id: 'q3',
    question_text: 'Translate: "I go to school every day"',
    difficulty_level: 'N4',
  },
  {
    id: 'q4',
    question_text: 'あなたの家族について200字で書いてください。',
    difficulty_level: 'N3',
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task1',
    question_id: 'q1',
    teacher_id: 'teacher1',
    deadline: '2025-01-15T23:59:59Z',
  },
  {
    id: 'task2',
    question_id: 'q2',
    teacher_id: 'teacher1',
    deadline: '2025-01-20T23:59:59Z',
  },
  {
    id: 'task3',
    question_id: 'q4',
    teacher_id: 'teacher1',
    deadline: '2025-01-25T23:59:59Z',
  },
];

// Mock Submissions
export const mockSubmissions: Submission[] = [
  {
    id: 'sub1',
    task_id: 'task1',
    student_id: 'student1',
    content: '富士山は日本で一番高い山です。私は春が好きです。桜がとてもきれいだからです。',
    status: 3, // teacher graded
    ai_score: 85,
    ai_feedback: 'Good work! Your kanji usage is accurate.',
    teacher_score: 88,
    teacher_feedback: 'Excellent effort! Your kanji is very neat.',
    submission_time: '2025-01-05T10:30:00Z',
  },
  {
    id: 'sub2',
    task_id: 'task2',
    student_id: 'student1',
    content: '私は毎日学校に行きます。',
    status: 2, // AI graded only
    ai_score: 92,
    ai_feedback: 'Perfect translation!',
    submission_time: '2025-01-06T09:15:00Z',
  },
  {
    id: 'sub3',
    task_id: 'task3',
    student_id: 'student1',
    content: '私の家族は四人です。父と母と弟がいます。父は会社員です。母は先生です。弟は高校生です。私たちはとても仲がいいです。週末によく一緒に出かけます。',
    status: 3, // teacher graded
    ai_score: 88,
    ai_feedback: 'Excellent essay! Your description is clear.',
    teacher_score: 90,
    teacher_feedback: 'Great work! Your essay is well-written and engaging.',
    submission_time: '2025-01-07T11:00:00Z',
  },
  {
    id: 'sub4',
    task_id: 'task1',
    student_id: 'student2',
    content: '山は高いです。春はいいです。',
    status: 0, // draft
  },
];

// Helper functions
export const getTasksForStudent = (studentId: string): Task[] => {
  // In real app, this would filter tasks assigned to student
  // For demo, return all tasks
  return mockTasks;
};

export const getSubmissionsForStudent = (studentId: string): Submission[] => {
  return mockSubmissions.filter(sub => sub.student_id === studentId);
};

export const getSubmissionsForTask = (taskId: string): Submission[] => {
  return mockSubmissions.filter(sub => sub.task_id === taskId);
};

export const getTaskById = (id: string): Task | undefined => {
  return mockTasks.find(task => task.id === id);
};

export const getQuestionById = (id: string): Question | undefined => {
  return mockQuestions.find(q => q.id === id);
};

export const getSubmissionById = (id: string): Submission | undefined => {
  return mockSubmissions.find(sub => sub.id === id);
};

export const getTasksForTeacher = (teacherId: string): Task[] => {
  return mockTasks.filter(task => task.teacher_id === teacherId);
};
