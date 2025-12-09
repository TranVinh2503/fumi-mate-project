'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTaskById, getQuestionById, getSubmissionsForTask } from '@/lib/mockData';
import { Task, Submission } from '@/lib/types';
import { ArrowLeft, Users, FileText, Calendar, Edit } from 'lucide-react';

export default function TeacherTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    // TODO: Fetch task details from Flask API
    // const response = await fetch(`/api/teacher/tasks/${taskId}`);
    // const data = await response.json();
    // setTask(data.task);
    // setSubmissions(data.submissions);

    // Mock data
    const taskData = getTaskById(taskId);
    const submissionsData = getSubmissionsForTask(taskId);

    setTask(taskData || null);
    setSubmissions(submissionsData);
    setLoading(false);
  }, [taskId]);

  if (loading) {
    return (
      <section className="container mx-auto section-padding mt-5 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="container mx-auto section-padding mt-5 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-6">The task you're looking for doesn't exist.</p>
          <Link
            href="/teacher/tasks"
            className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tasks
          </Link>
        </div>
      </section>
    );
  }

  const question = getQuestionById(task.question_id);

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/tasks"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Tasks"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Task Details</h1>
            <p className="text-gray-600">Task ID: {task.id}</p>
          </div>
        </div>
        <Link
          href={`/teacher/tasks/${task.id}/edit`}
          className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary transition-colors"
        >
          <Edit className="w-5 h-5" />
          Edit Task
        </Link>
      </div>

      {/* Task Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Task Information
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Question Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {question?.question_text || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                <span className="badge badge-info">
                  {question?.difficulty_level || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Task Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <p className="text-gray-900">
                    {new Date(task.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submissions</label>
                  <p className="text-gray-900">{submissions.length} submissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Student Submissions ({submissions.length})
        </h2>

        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-primary">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Student</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">AI Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Teacher Score</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{submission.student_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        submission.status === 0 ? 'badge-warning' :
                        submission.status === 1 ? 'badge-info' :
                        submission.status === 2 ? 'badge-primary' :
                        submission.status === 3 ? 'badge-success' :
                        'badge-secondary'
                      }`}>
                        {submission.status === 0 ? 'Draft' :
                         submission.status === 1 ? 'Submitted' :
                         submission.status === 2 ? 'AI Graded' :
                         submission.status === 3 ? 'Teacher Graded' :
                         'Reviewed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {submission.ai_score !== undefined ? (
                        <span className="font-semibold text-blue-600">{submission.ai_score}/100</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {submission.teacher_score !== undefined ? (
                        <span className="font-semibold text-green-600">{submission.teacher_score}/100</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/teacher/submissions/${submission.id}`}
                        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No submissions yet.</p>
            <p className="text-gray-400 text-sm mt-2">Students haven't submitted their work for this task yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
