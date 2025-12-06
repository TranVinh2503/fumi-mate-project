'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockTasks } from '@/lib/mockData';
import { Task } from '@/lib/types';
import { formatDate, getDifficultyColor } from '@/lib/utils';

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TODO: Fetch tasks from Flask API
    // const response = await fetch('/api/student/tasks');
    // const data = await response.json();
    // setTasks(data);
    
    // Mock data for now
    setTasks(mockTasks);
  }, []);

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
          {tasks.map((task) => (
            <div key={task.id}>
              {task.isDone ? (
                <div className="bg-red-100 border-2 border-gray-800 rounded-lg shadow-md p-6">
                  <h5 className="text-xl font-bold mb-2">{task.title}</h5>
                  <p className="text-gray-600 text-sm mb-3">
                    {task.description || '-'}
                  </p>
                  <div className="mb-2">
                    <span className="font-semibold">Due: </span>
                    <span>{task.dueDate ? formatDate(task.dueDate) : '-'}</span>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold">Created: </span>
                    <span>{task.createdAt ? formatDate(task.createdAt) : '-'}</span>
                  </div>
                  <div className="text-center mt-4">
                    <span className="badge badge-danger">Completed</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-gray-800 rounded-lg shadow-md p-6 card-hover">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-xl font-bold">{task.title}</h5>
                    <span className={`badge ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {task.description || '-'}
                  </p>
                  <div className="mb-2">
                    <span className="font-semibold">Due: </span>
                    <span>{task.dueDate ? formatDate(task.dueDate) : '-'}</span>
                  </div>
                  <div className="mb-4">
                    <span className="font-semibold">Created: </span>
                    <span>{task.createdAt ? formatDate(task.createdAt) : '-'}</span>
                  </div>
                  <Link
                    href={`/student/writing-test/${task.id}`}
                    className="block w-full text-center bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary transition-colors"
                  >
                    Take Test
                  </Link>
                </div>
              )}
            </div>
          ))}
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
