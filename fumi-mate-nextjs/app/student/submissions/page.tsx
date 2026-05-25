'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Submission } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export default function StudentSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Vui lòng đăng nhập lại');
        }
        const response = await fetch(API_ENDPOINTS.STUDENT_SUBMISSIONS, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (err: any) {
        console.error('Fetch submissions error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleRowClick = (submissionId: string | number) => {
    router.push(`/student/submissions/${String(submissionId)}`);
  };

  const getDisplayScore = (sub: Submission) => {
    return sub.experimental_group === 'control'
      ? (sub.teacherScore ?? sub.teacher_score)
      : (sub.aiScore ?? sub.ai_score);
  };

  const getStatusBadge = (sub: Submission) => {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';

    if (sub.status === 'draft') {
      return <span className={`badge badge-secondary bg-gray-100 text-gray-800 ${baseClass}`}>Bản nháp</span>;
    }

    if (sub.experimental_group === 'control') {
      if (sub.teacherScore !== null && sub.teacherScore !== undefined || sub.teacher_score !== null && sub.teacher_score !== undefined) {
        return <span className={`badge badge-info bg-blue-100 text-blue-800 ${baseClass}`}>Đã có kết quả</span>;
      }
      return <span className={`badge bg-yellow-100 text-yellow-800 ${baseClass}`}>Chờ chấm</span>;
    }

    if (sub.aiScore !== null && sub.aiScore !== undefined || sub.ai_score !== null && sub.ai_score !== undefined) {
      return <span className={`badge badge-success bg-green-100 text-green-800 ${baseClass}`}>Đã có kết quả</span>;
    }

    return <span className={`badge bg-yellow-100 text-yellow-800 ${baseClass}`}>Chờ chấm</span>;
  };

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <h2 className="text-4xl font-title font-bold mb-8">Bài làm của tôi</h2>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 animate-pulse">Đang tải bài nộp của bạn...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-xl text-red-600 mb-4">Lỗi tải dữ liệu: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : submissions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Bài tập</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Cập nhật</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Điểm số</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => handleRowClick(sub.id)}
                    className="clickable-row border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold flex flex-wrap gap-2 items-center">
                      {/* Hiển thị tiêu đề bài tập nếu có, nếu không để mặc định */}
                      <span>{sub.task?.title || (sub.id ? `Bài viết #${String(sub.id).slice(-4)}` : '—')}</span>
                      {sub.lateMinutes && sub.lateMinutes > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                          Nộp muộn {Math.round(sub.lateMinutes)} phút
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(sub.updatedAt ?? sub.createdAt ?? sub.updated_at ?? sub.created_at ?? '') || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {getDisplayScore(sub) !== null && getDisplayScore(sub) !== undefined ? (
                        <span className="font-semibold text-blue-600">
                          {getDisplayScore(sub)}
                        </span>
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
          <img src="/images/crying_girl.png" alt="Không có bài nộp" className="mx-auto mb-4" style={{ width: '200px' }} />
          <p className="text-gray-500 text-lg">Bạn chưa có bài viết nào được nộp.</p>
        </div>
      )}
    </section>
  );
}
