'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/student/tasks', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  console.log("Teacher Task page");
  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      <div className="flex justify-between items-center my-8">
        <h2 className="text-4xl font-title font-bold">Task Management</h2>
        <Link href="/teacher/tasks/create"
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
              <thead className="bg-gray-100 border-b border-gray">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Task ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Difficulty</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Due Date</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{task.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{task.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-info">{task.difficulty}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
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
                ))}
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
