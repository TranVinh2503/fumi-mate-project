'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTasksForStudent, getSubmissionsForStudent, getQuestionById } from '@/lib/mockData';
import { Task, Submission } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState('');
  const studentId = 'student1'; // TODO: Get from auth context

  useEffect(() => {
    // TODO: Fetch tasks from Flask API
    // const response = await fetch(`/api/submissions?student_id=${studentId}`);
    // const data = await response.json();
    // setTasks(data.tasks);
    // setSubmissions(data.submissions);

    // Mock data for now
    setTasks(getTasksForStudent(studentId));
    setSubmissions(getSubmissionsForStudent(studentId));
  }, [studentId]);

  const getTaskStatus = (taskId: string) => {
    const submission = submissions.find(sub => sub.task_id === taskId);
    if (!submission) return 'Not Started';
    if (submission.status === 0) return 'Draft';
    if (submission.status >= 1) return 'Submitted';
    return 'Completed';
  };

  const isTaskCompleted = (taskId: string) => {
    const submission = submissions.find(sub => sub.task_id === taskId);
    return submission && submission.status >= 3; // teacher graded
  };

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      <h2 className="text-4xl font-bold mb-8">Your Tasks</h2>

      {/* Flash messages */}
      {message && (
        <div className="alert alert-success mb-4">
          {message}
          <button 
            onClick={() => setMessage('')}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {tasks.map((task) => {
            const question = getQuestionById(task.question_id);
            const status = getTaskStatus(task.id);
            const completed = isTaskCompleted(task.id);

            return (
              <div key={task.id}>
                {completed ? (
                  <div className="bg-red-100 border-2 border-gray-800 rounded-lg shadow-md p-6">
                    <h5 className="text-xl font-bold mb-2">
                      {question?.question_text || 'Task'}
                    </h5>
                    <p className="text-gray-600 text-sm mb-3">
                      Difficulty: {question?.difficulty_level || 'N/A'}
                    </p>
                    <div className="mb-2">
                      <span className="font-semibold">Due: </span>
                      <span>{formatDate(task.deadline)}</span>
                    </div>
                    <div className="mb-3">
                      <span className="font-semibold">Status: </span>
                      <span>{status}</span>
                    </div>
                    <div className="text-center mt-4">
                      <span className="badge badge-danger">Completed</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-gray-800 rounded-lg shadow-md p-6 card-hover">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-xl font-bold">
                        {question?.question_text || 'Task'}
                      </h5>
                      <span className="badge badge-primary">
                        {question?.difficulty_level || 'N/A'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      Status: {status}
                    </p>
                    <div className="mb-2">
                      <span className="font-semibold">Due: </span>
                      <span>{formatDate(task.deadline)}</span>
                    </div>
                    <div className="mb-4">
                      <span className="font-semibold">Teacher: </span>
                      <span>{task.teacher_id}</span>
                    </div>
                    <Link
                      href={`/student/writing-test/${task.id}`}
                      className="block w-full text-center bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary transition-colors"
                    >
                      {status === 'Not Started' ? 'Start Task' : 'Continue Task'}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center mt-12">
          <img
            src="/images/crying_girl.png"
            alt="No tasks"
            className="mx-auto mb-4"
            style={{ width: '200px' }}
          />
          <p className="text-gray-500 text-lg">No tasks available yet.</p>
        </div>
      )}
    </section>
  );
}
