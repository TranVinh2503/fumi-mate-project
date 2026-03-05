'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Submission } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { API_ENDPOINTS } from '@/lib/apiConfig';

type Task = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  dueDate: string | null;
  createdAt: string | null;
  isDone: boolean;
  questions: {
    id: number;
    questionText: string;
    questionType: string;
    hint?: string;
    sampleAnswer?: string;
  }[];
  teacherId?: string; // add if backend returns teacher info
};

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('TOKEN USED IN TASK PAGE:', token);

    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.STUDENT_TASKS, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.msg || 'Failed to fetch tasks');
        }

        const data = await res.json();
        setTasks(data.tasks);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      <h2 className="text-4xl font-title font-bold mb-8">Your Tasks</h2>

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
            const status = task.isDone ? 'Completed' : 'Not Started';

            return (
              <div key={task.id}>
                {task.isDone ? (
                  <div className="bg-red-100 border-2 border-gray-800 rounded-lg shadow-md p-6">
                    <h5 className="text-xl font-bold mb-2">
                      {task.title || 'Task'}
                    </h5>
                    <p className="text-gray-600 text-sm mb-3">
                      Difficulty: {task.difficulty || 'N/A'}
                    </p>
                    <div className="mb-2">
                      <span className="font-semibold">Due: </span>
                      <span>{task.dueDate ? formatDate(task.dueDate) : 'N/A'}</span>
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
                        {task.title || 'Task'}
                      </h5>
                      <span className="badge badge-primary">
                        {task.difficulty || 'N/A'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      Status: {status}
                    </p>
                    <div className="mb-2">
                      <span className="font-semibold">Due: </span>
                      <span>{task.dueDate ? formatDate(task.dueDate) : 'N/A'}</span>
                    </div>
                    <div className="mb-4">
                      <span className="font-semibold">Teacher: </span>
                      <span>{task.teacherId || 'Unknown'}</span>
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