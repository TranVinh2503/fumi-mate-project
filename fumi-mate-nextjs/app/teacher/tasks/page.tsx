'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTasksForTeacher, getQuestionById } from '@/lib/mockData';
import { Task } from '@/lib/types';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TODO: Fetch tasks from Flask API
    // const response = await fetch('/api/teacher/tasks');
    // const data = await response.json();
    // setTasks(data);

    // Mock data - assuming current teacher is teacher1
    const teacherTasks = getTasksForTeacher('teacher1');
    setTasks(teacherTasks);
  }, []);

  const handleDelete = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    // TODO: Delete task via Flask API
    // await fetch(`/api/teacher/tasks/${taskId}`, { method: 'DELETE' });

    console.log('Deleting task:', taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
    setMessage('Task deleted successfully!');
  };

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold">Task Management</h2>
        <Link
          href="/teacher/tasks/create"
          className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Task
        </Link>
      </div>

      {/* Flash messages */}
      {message && (
        <div className="alert alert-success mb-6">
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-primary">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Task ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Question</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Difficulty</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Due Date</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const question = getQuestionById(task.question_id);
                  return (
                    <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{task.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {question?.question_text || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Question ID: {task.question_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-info">
                          {question?.difficulty_level || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(task.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/teacher/tasks/${task.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/teacher/tasks/${task.id}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center mt-12 bg-white rounded-lg shadow-lg p-12">
          <p className="text-gray-500 text-lg mb-6">No tasks created yet.</p>
          <Link
            href="/teacher/tasks/create"
            className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Task
          </Link>
        </div>
      )}
    </section>
  );
}
