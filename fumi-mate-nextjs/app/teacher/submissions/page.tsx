'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/apiConfig';
// Đảm bảo bạn đã khai báo đúng type này trong lib/types
import { SubmissionWithDetails } from '@/lib/types'; 
import { Eye, CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function TeacherSubmissionsPage() {
  const router = useRouter();
  // Sửa 1: Dùng đúng Type thay vì any[]
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [taskFilter, setTaskFilter] = useState('');
  // Sửa 2: Thêm loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.TEACHER_SUBMISSIONS, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error('Error fetching submissions:', err);
      } finally {
        setIsLoading(false); // Tắt loading dù thành công hay thất bại
      }
    };

    fetchSubmissions();
  }, []);

  // Hàm Helper để check xem đã chấm hay chưa (tránh lỗi điểm 0 hoặc null)
  const isGraded = (score: number | null | undefined) => score !== null && score !== undefined;

  const filteredSubmissions = submissions.filter(sub => {
    // Sửa 3: Sửa lại logic lọc status
    if (filter === 'submitted') return sub.status === 1 && !isGraded(sub.teacher_score);
    if (filter === 'graded') return isGraded(sub.teacher_score);
    return true; // cho 'all'
  }).filter(sub => 
    taskFilter === '' || (sub.task_title && sub.task_title.toLowerCase().includes(taskFilter.toLowerCase()))
  );

  const handleRowClick = (submissionId: string | number) => {
    router.push(`/teacher/submissions/${submissionId}`);
  };

  // Nếu đang loading thì hiện vòng xoay
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 mt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-gray-600">Đang tải danh sách...</span>
      </div>
    );
  }

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <h2 className="text-4xl font-bold mb-8">Student Submissions</h2>

      {/* Status Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tất cả ({submissions.length})
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
          Chờ chấm ({submissions.filter(s => s.status === 1 && !isGraded(s.teacher_score)).length})
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
          Đã chấm ({submissions.filter(s => isGraded(s.teacher_score)).length})
        </button>
      </div>

      {/* Task Filter Dropdown */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo bài tập:</label>
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Tất cả bài tập</option>
            {/* Sửa 4: Loại bỏ các task_title null/undefined trước khi tạo Set */}
            {[...new Set(submissions.map(s => s.task_title).filter(Boolean))].map(title => (
              <option key={title as string} value={title as string}>{title}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {setTaskFilter(''); setFilter('all');}}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
        >
          Xóa bộ lọc
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
                      {sub.student_name || sub.studentId}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{sub.task_title || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{sub.difficulty || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {sub.submission_time ? new Date(sub.submission_time).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {sub.ai_score !== null && sub.ai_score !== undefined ? (
                        <span className="font-semibold text-blue-600">{sub.ai_score}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isGraded(sub.teacher_score) ? (
                        <span className="font-semibold text-green-600">{sub.teacher_score}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isGraded(sub.teacher_score) ? (
                        <span className="badge badge-success bg-green-100 text-green-800 px-2 py-1 rounded">Graded</span>
                      ) : sub.status === 1 ? (
                        <span className="badge badge-warning bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                      ) : (
                        <span className="badge badge-secondary bg-gray-100 text-gray-800 px-2 py-1 rounded">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => sub.id && handleRowClick(sub.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {isGraded(sub.teacher_score) ? 'View' : 'Grade'}
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
          <p className="text-gray-500 text-lg">Không tìm thấy bài nộp nào phù hợp.</p>
        </div>
      )}
    </section>
  );
}