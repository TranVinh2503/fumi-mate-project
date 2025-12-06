import { User, Student, Teacher, Task, Submission, Question } from './types';

// Mock Users
export const mockStudents: Student[] = [
  { id: 1, username: 'student1', role: 'student' },
  { id: 2, username: 'student2', role: 'student' },
  { id: 3, username: 'yuki_tanaka', role: 'student' },
];

export const mockTeachers: Teacher[] = [
  { id: 4, username: 'teacher1', role: 'teacher' },
  { id: 5, username: 'sensei_yamada', role: 'teacher' },
];

export const mockUsers: User[] = [...mockStudents, ...mockTeachers];

// Mock Questions
export const mockQuestions: Question[] = [
  {
    id: 1,
    taskId: 1,
    questionText: '「山」という漢字を使って、短い文を書いてください。',
    questionType: 'kanji',
    hint: 'Think about mountains in Japan',
    sampleAnswer: '富士山は日本で一番高い山です。',
  },
  {
    id: 2,
    taskId: 1,
    questionText: 'あなたの好きな季節について書いてください。',
    questionType: 'writing',
    hint: 'Describe why you like that season',
    sampleAnswer: '私は春が好きです。桜がきれいだからです。',
  },
  {
    id: 3,
    taskId: 2,
    questionText: 'Translate: "I go to school every day"',
    questionType: 'translation',
    hint: 'Use 毎日 for "every day"',
    sampleAnswer: '私は毎日学校に行きます。',
  },
  {
    id: 4,
    taskId: 3,
    questionText: 'あなたの家族について200字で書いてください。',
    questionType: 'essay',
    hint: 'Include family members and their characteristics',
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'N5 Kanji Writing Practice',
    description: 'Practice basic kanji and simple sentence construction',
    difficulty: 'N5',
    dueDate: '2025-01-15',
    createdBy: 4,
    createdAt: '2025-01-01',
    isDone: false,
    questions: mockQuestions.filter(q => q.taskId === 1),
  },
  {
    id: 2,
    title: 'N4 Translation Exercise',
    description: 'Translate English sentences to Japanese',
    difficulty: 'N4',
    dueDate: '2025-01-20',
    createdBy: 4,
    createdAt: '2025-01-02',
    isDone: false,
    questions: mockQuestions.filter(q => q.taskId === 2),
  },
  {
    id: 3,
    title: 'N3 Essay Writing',
    description: 'Write a short essay about your family',
    difficulty: 'N3',
    dueDate: '2025-01-25',
    createdBy: 5,
    createdAt: '2025-01-03',
    isDone: true,
    questions: mockQuestions.filter(q => q.taskId === 3),
  },
  {
    id: 4,
    title: 'Daily Conversation Practice',
    description: 'Write dialogues for common daily situations',
    difficulty: 'N4',
    dueDate: '2025-01-18',
    createdBy: 4,
    createdAt: '2025-01-04',
    isDone: false,
    questions: [],
  },
];

// Mock Submissions
export const mockSubmissions: Submission[] = [
  {
    id: 1,
    taskId: 1,
    studentId: 1,
    content: '富士山は日本で一番高い山です。私は春が好きです。桜がとてもきれいだからです。',
    status: 'submitted',
    aiScore: 85,
    teacherScore: 88,
    aiFeedback: JSON.stringify({
      grade: 'B+',
      feedbackText: 'Good work! Your kanji usage is accurate and your sentences are well-structured. Consider adding more descriptive details.',
      actionPlan: [
        'Practice using more adjectives to describe nouns',
        'Work on connecting sentences with conjunctions',
        'Review particle usage, especially は and が',
      ],
      practiceExercises: [
        {
          title: 'Adjective Practice',
          description: 'Practice using い-adjectives and な-adjectives',
          example: '高い山、きれいな桜',
        },
        {
          title: 'Sentence Connection',
          description: 'Use conjunctions like そして、でも、だから',
          example: '春が好きです。そして、桜がきれいです。',
        },
      ],
      detailedAnalysis: {
        grammar: {
          score: 90,
          issues: ['Particle usage could be improved'],
          suggestions: ['Review the difference between は and が'],
        },
        vocabulary: {
          score: 85,
          strengths: ['Good use of basic vocabulary'],
          improvements: ['Try using more varied vocabulary'],
        },
        structure: {
          score: 80,
          comments: ['Sentences are clear but simple'],
        },
        fluency: {
          score: 85,
          feedback: 'Natural flow, but could be more connected',
        },
        content: {
          score: 85,
          feedback: 'Addresses the prompt well',
        },
      },
      overallScore: 85,
    }),
    teacherFeedback: 'Excellent effort! Your kanji is very neat.',
    createdAt: '2025-01-05T10:30:00',
    updatedAt: '2025-01-05T14:20:00',
  },
  {
    id: 2,
    taskId: 2,
    studentId: 1,
    content: '私は毎日学校に行きます。',
    status: 'submitted',
    aiScore: 92,
    createdAt: '2025-01-06T09:15:00',
    updatedAt: '2025-01-06T09:15:00',
  },
  {
    id: 3,
    taskId: 3,
    studentId: 1,
    content: '私の家族は四人です。父と母と弟がいます。父は会社員です。母は先生です。弟は高校生です。私たちはとても仲がいいです。週末によく一緒に出かけます。',
    status: 'submitted',
    aiScore: 88,
    teacherScore: 90,
    aiFeedback: JSON.stringify({
      grade: 'A-',
      feedbackText: 'Excellent essay! Your description is clear and well-organized. Great use of vocabulary.',
      actionPlan: [
        'Practice using more complex sentence structures',
        'Add more specific details about family activities',
        'Work on using transitional phrases',
      ],
      practiceExercises: [
        {
          title: 'Complex Sentences',
          description: 'Practice using subordinate clauses',
          example: '父は会社員なので、平日は忙しいです。',
        },
      ],
      detailedAnalysis: {
        grammar: {
          score: 90,
          issues: [],
          suggestions: ['Try using more complex grammar patterns'],
        },
        vocabulary: {
          score: 88,
          strengths: ['Good variety of family-related vocabulary'],
          improvements: ['Add more descriptive adjectives'],
        },
        structure: {
          score: 85,
          comments: ['Well-organized and logical flow'],
        },
        fluency: {
          score: 90,
          feedback: 'Very natural and easy to read',
        },
        content: {
          score: 88,
          feedback: 'Comprehensive description of family',
        },
      },
      overallScore: 88,
    }),
    teacherFeedback: 'Great work! Your essay is well-written and engaging.',
    createdAt: '2025-01-07T11:00:00',
    updatedAt: '2025-01-07T16:30:00',
  },
  {
    id: 4,
    taskId: 1,
    studentId: 2,
    content: '山は高いです。春はいいです。',
    status: 'draft',
    createdAt: '2025-01-08T08:00:00',
    updatedAt: '2025-01-08T08:30:00',
  },
];

// Helper function to get task by ID
export const getTaskById = (id: number): Task | undefined => {
  return mockTasks.find(task => task.id === id);
};

// Helper function to get submissions by student ID
export const getSubmissionsByStudentId = (studentId: number): Submission[] => {
  return mockSubmissions
    .filter(sub => sub.studentId === studentId)
    .map(sub => ({
      ...sub,
      task: getTaskById(sub.taskId),
    }));
};

// Helper function to get submissions by task ID
export const getSubmissionsByTaskId = (taskId: number): Submission[] => {
  return mockSubmissions
    .filter(sub => sub.taskId === taskId)
    .map(sub => ({
      ...sub,
      student: mockStudents.find(s => s.id === sub.studentId),
    }));
};

// Helper function to get submission by ID
export const getSubmissionById = (id: number): Submission | undefined => {
  const submission = mockSubmissions.find(sub => sub.id === id);
  if (submission) {
    return {
      ...submission,
      task: getTaskById(submission.taskId),
      student: mockStudents.find(s => s.id === submission.studentId),
    };
  }
  return undefined;
};

// Helper function to get tasks by teacher ID
export const getTasksByTeacherId = (teacherId: number): Task[] => {
  return mockTasks.filter(task => task.createdBy === teacherId);
};
