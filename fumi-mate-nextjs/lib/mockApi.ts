import { User, Task, Submission, Question } from './types';

// Mock API functions that simulate fetch() calls
// All functions return Promises to mimic real API calls

export const mockApi = {
  // User APIs
  getUsers: (): Promise<User[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUsers), 300);
    });
  },

  getUserById: (id: string): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.id === id);
        resolve(user || null);
      }, 200);
    });
  },

  // Task APIs
  getTasks: (): Promise<Task[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTasks), 300);
    });
  },

  getTaskById: (id: string): Promise<Task | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const task = mockTasks.find(t => t.id === id);
        resolve(task || null);
      }, 200);
    });
  },

  getTasksByTeacher: (teacherId: string): Promise<Task[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = mockTasks.filter(t => t.teacher_id === teacherId);
        resolve(tasks);
      }, 300);
    });
  },

  createTask: (taskData: Omit<Task, 'id'>): Promise<Task> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTask: Task = {
          id: `task${mockTasks.length + 1}`,
          ...taskData
        };
        mockTasks.push(newTask);
        resolve(newTask);
      }, 500);
    });
  },

  // Submission APIs
  getSubmissions: (): Promise<Submission[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSubmissions), 300);
    });
  },

  getSubmissionById: (id: string): Promise<Submission | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const submission = mockSubmissions.find(s => s.id === id);
        resolve(submission || null);
      }, 200);
    });
  },

  getSubmissionsByTask: (taskId: string): Promise<Submission[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const submissions = mockSubmissions.filter(s => s.task_id === taskId);
        resolve(submissions);
      }, 300);
    });
  },

  getSubmissionsByStudent: (studentId: string): Promise<Submission[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const submissions = mockSubmissions.filter(s => s.student_id === studentId);
        resolve(submissions);
      }, 300);
    });
  },

  createSubmission: (submissionData: Omit<Submission, 'id' | 'submission_time'>): Promise<Submission> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSubmission: Submission = {
          id: `sub${mockSubmissions.length + 1}`,
          submission_time: new Date().toISOString(),
          ...submissionData
        };
        mockSubmissions.push(newSubmission);
        resolve(newSubmission);
      }, 500);
    });
  },

  updateSubmission: (id: string, updates: Partial<Submission>): Promise<Submission | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const submission = mockSubmissions.find(s => s.id === id);
        if (submission) {
          Object.assign(submission, updates);
          resolve(submission);
        } else {
          resolve(null);
        }
      }, 400);
    });
  },

  // Question APIs
  getQuestions: (): Promise<Question[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockQuestions), 300);
    });
  },

  getQuestionById: (id: string): Promise<Question | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const question = mockQuestions.find(q => q.id === id);
        resolve(question || null);
      }, 200);
    });
  },

  createQuestion: (questionData: Omit<Question, 'id'>): Promise<Question> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newQuestion: Question = {
          id: `q${mockQuestions.length + 1}`,
          ...questionData
        };
        mockQuestions.push(newQuestion);
        resolve(newQuestion);
      }, 500);
    });
  },

  // RAG APIs (mock LLM responses)
  generateQuestionFromPrompt: (prompt: string, criteria: { difficulty?: string }): Promise<Question> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock RAG response - generate a question based on prompt
        const difficulty = criteria.difficulty || 'N3';
        const generatedQuestion: Question = {
          id: `gen_q${Date.now()}`,
          question_text: `Generated question for: "${prompt}". Please write a ${difficulty} level response.`,
          difficulty_level: difficulty
        };
        resolve(generatedQuestion);
      }, 1500); // Simulate LLM processing time
    });
  },

  findBestQuestion: (criteria: { difficulty?: string; topic?: string }): Promise<Question> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock RAG - return a random question matching criteria
        const matchingQuestions = mockQuestions.filter(q =>
          !criteria.difficulty || q.difficulty_level === criteria.difficulty
        );
        const randomQuestion = matchingQuestions[Math.floor(Math.random() * matchingQuestions.length)];
        resolve(randomQuestion);
      }, 800);
    });
  }
};

// Mock data (expanded)
const mockUsers: User[] = [
  { id: "s1", name: "Student A", user_type: "student" },
  { id: "s2", name: "Student B", user_type: "student" },
  { id: "s3", name: "Student C", user_type: "student" },
  { id: "t1", name: "Teacher A", user_type: "teacher" },
  { id: "t2", name: "Teacher B", user_type: "teacher" },
  { id: "r1", name: "Reviewer A", user_type: "reviewer" },
];

const mockQuestions: Question[] = [
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
  {
    id: 'q5',
    question_text: '日本の伝統的なお祭りについて説明してください。',
    difficulty_level: 'N3',
  },
  {
    id: 'q6',
    question_text: '将来の夢について日本語で書いてください。',
    difficulty_level: 'N4',
  },
  {
    id: 'q7',
    question_text: '日本の食べ物で一番好きなものを紹介してください。',
    difficulty_level: 'N4',
  },
  {
    id: 'q8',
    question_text: '学校での一日について書いてください。',
    difficulty_level: 'N5',
  },
  {
    id: 'q9',
    question_text: '日本の四季について、それぞれの特徴を説明してください。',
    difficulty_level: 'N3',
  },
  {
    id: 'q10',
    question_text: '友達との思い出について書いてください。',
    difficulty_level: 'N4',
  },
];

const mockTasks: Task[] = [
  {
    id: 'task1',
    question_id: 'q1',
    teacher_id: 't1',
    deadline: '2025-01-15T23:59:59Z',
  },
  {
    id: 'task2',
    question_id: 'q2',
    teacher_id: 't1',
    deadline: '2025-01-20T23:59:59Z',
  },
  {
    id: 'task3',
    question_id: 'q4',
    teacher_id: 't1',
    deadline: '2025-01-25T23:59:59Z',
  },
  {
    id: 'task4',
    question_id: 'q5',
    teacher_id: 't2',
    deadline: '2025-02-01T23:59:59Z',
  },
  {
    id: 'task5',
    question_id: 'q3',
    teacher_id: 't2',
    deadline: '2025-02-05T23:59:59Z',
  },
];

const mockSubmissions: Submission[] = [
  {
    id: 'sub1',
    task_id: 'task1',
    student_id: 's1',
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
    student_id: 's1',
    content: '私は毎日学校に行きます。',
    status: 2, // AI graded only
    ai_score: 92,
    ai_feedback: 'Perfect translation!',
    submission_time: '2025-01-06T09:15:00Z',
  },
  {
    id: 'sub3',
    task_id: 'task3',
    student_id: 's1',
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
    student_id: 's2',
    content: '山は高いです。春はいいです。',
    status: 0, // draft
  },
  {
    id: 'sub5',
    task_id: 'task4',
    student_id: 's2',
    content: '日本の伝統的なお祭りはとても面白いです。例えば、お盆や正月のお祭りがあります。お盆では先祖の霊を迎えます。正月には初詣に行きます。',
    status: 1, // submitted
    submission_time: '2025-01-10T14:20:00Z',
  },
  {
    id: 'sub6',
    task_id: 'task2',
    student_id: 's3',
    content: '夏が好きです。暑いですが、海に行けます。友達と泳ぎます。',
    status: 4, // reviewed
    ai_score: 78,
    ai_feedback: 'Good content but could be more detailed.',
    teacher_score: 82,
    teacher_feedback: 'Nice work! Try to write longer sentences.',
    submission_time: '2025-01-08T16:45:00Z',
  },
  {
    id: 'sub7',
    task_id: 'task5',
    student_id: 's3',
    content: 'I go to school every day by bus.',
    status: 2, // AI graded
    ai_score: 95,
    ai_feedback: 'Excellent translation! Grammar is perfect.',
    submission_time: '2025-01-12T08:30:00Z',
  },
];
