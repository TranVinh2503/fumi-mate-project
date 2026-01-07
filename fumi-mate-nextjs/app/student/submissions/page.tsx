'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockSubmissions, getSubmissionsByStudentId } from '@/lib/mockData';
import { Submission } from '@/lib/types';
import { formatDateTime, getStatusColor } from '@/lib/utils';

export default function StudentSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    // TODO: Fetch submissions from Flask API
    // const response = await fetch('/api/student/submissions');
    // const data = await response.json();
    // setSubmissions(data);
    
    // Mock data - assuming current user is student with ID student1

    const studentSubmissions = getSubmissionsByStudentId("student1");
    setSubmissions(studentSubmissions);
  }, []);

  const handleRowClick = (submissionId: string) => {
    router.push(`/student/submissions/${submissionId}`);
  };

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <h2 className="text-4xl font-title font-bold mb-8">My Submissions</h2>

      {submissions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-2">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Task</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Updated</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">AI Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Teacher Score</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => handleRowClick(sub.id)}
                    className="clickable-row border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {'—'}
                    </td>
                    <td className="px-6 py-4">
                      {sub.status === 2 ? (
                        <span className="badge badge-success">AI Graded</span>
                      ) : sub.status === 3 ? (
                        <span className="badge badge-info">Teacher Graded</span>
                      ) : (
                        <span className="badge badge-secondary">Draft</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {sub.submission_time}
                    </td>
                    <td className="px-6 py-4">
                      {sub.ai_score ? (
                        <span className="font-semibold text-blue-600">{sub.ai_score}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.teacher_score ? (
                        <span className="font-semibold text-green-600">{sub.teacher_score}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center mt-12">
          <img src="/images/crying_girl.png" alt="No submissions" className="mx-auto mb-4" style={{ width: '200px' }} />
          <p className="text-gray-500 text-lg">You haven't submitted any writing tests yet.</p>
        </div>
      )}
    </section>
  );
}
