'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockSubmissions } from '@/lib/mockData';
import { Submission } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Eye, CheckCircle, Clock } from 'lucide-react';

export default function TeacherSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    // TODO: Fetch submissions from Flask API
    // const response = await fetch('/api/teacher/submissions');
    // const data = await response.json();
    // setSubmissions(data);
    
    // Mock data
    const allSubmissions = mockSubmissions.map(sub => ({
      ...sub,
      task: mockSubmissions.find(s => s.id === sub.id)?.task,
      student: { id: sub.studentId, username: `student${sub.studentId}`, role: 'student' as const },
    }));
    setSubmissions(allSubmissions);
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    if (filter === 'submitted') return sub.status === 'submitted' && !sub.teacherScore;
    if (filter === 'graded') return sub.teacherScore !== undefined;
    return true;
  });

  const handleRowClick = (submissionId: number) => {
    router.push(`/teacher/submissions/${submissionId}`);
  };

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <h2 className="text-4xl font-bold mb-8">Student Submissions</h2>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({submissions.length})
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            filter === 'submitted'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending ({submissions.filter(s => s.status === 'submitted' && !s.teacherScore).length})
        </button>
        <button
          onClick={() => setFilter('graded')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            filter === 'graded'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Graded ({submissions.filter(s => s.teacherScore).length})
        </button>
      </div>

      {filteredSubmissions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-primary">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Student</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Task</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Submitted</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">AI Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Teacher Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {sub.student?.username || `Student ${sub.studentId}`}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{sub.task?.title || '—'}</p>
                        <p className="text-sm text-gray-500">{sub.task?.difficulty}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {formatDateTime(sub.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {sub.aiScore ? (
                        <span className="font-semibold text-blue-600">{sub.aiScore}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.teacherScore ? (
                        <span className="font-semibold text-green-600">{sub.teacherScore}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.teacherScore ? (
                        <span className="badge badge-success">Graded</span>
                      ) : sub.status === 'submitted' ? (
                        <span className="badge badge-warning">Pending</span>
                      ) : (
                        <span className="badge badge-secondary">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleRowClick(sub.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {sub.teacherScore ? 'View' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center mt-12 bg-white rounded-lg shadow-lg p-12">
          <p className="text-gray-500 text-lg">No submissions found for this filter.</p>
        </div>
      )}
    </section>
  );
}
