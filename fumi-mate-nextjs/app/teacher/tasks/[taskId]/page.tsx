'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task, Submission } from '@/lib/types';
import { ArrowLeft, Users, FileText, Calendar, Edit } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export default function TeacherTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]); // TODO: Fetch real submissions
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    const fetchTaskDetails = async () => {
      try {
        setLoading(true); 

        const token = localStorage.getItem('access_token');
        
        // 1. Lấy chi tiết bài tập từ Flask API
        const response = await fetch(API_ENDPOINTS.TEACHER_TASK_DETAIL(Number(taskId)), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }
        
        const data = await response.json();
        setTask(data.task);
        console.log('Real task data:', data.task);

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  if (loading) {
    return (
      <section className="container mx-auto section-padding mt-5 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải chi tiết bài tập...</p>
        </div>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="container mx-auto section-padding mt-5 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài tập</h2>
          <p className="text-gray-600 mb-6">Bài tập bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <Link
            href="/teacher/tasks"
            className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách bài tập
          </Link>
        </div>
      </section>
    );
  }

  // Use real questions from backend API
  const firstQuestion = task?.questions?.[0];

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">  
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/tasks"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-title font-bold">Chi tiết bài tập</h1>
            <p className="text-gray-600">Mã bài tập (ID): {task.id}</p>
          </div>
        </div>
        <Link
          href={`/teacher/tasks/${task.id}/edit`}
          className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary transition-colors"
        >
          <Edit className="w-5 h-5" />
          Chỉnh sửa bài tập
        </Link>
      </div>

      {/* Thông tin bài tập */}
      <div className="bg-white rounded-lg border-2 border-gray p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Thông tin chung
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Chi tiết câu hỏi</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung câu hỏi</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg italic">
                  "{firstQuestion?.content || 'Không có dữ liệu câu hỏi'}"
                </p>
                {firstQuestion?.subGenre && (
                  <p className="text-sm text-gray-500 mt-1">
                    Thể loại: {firstQuestion.subGenre.nameVn} ({firstQuestion.subGenre.nameJp})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ khó</label>
                <span className="badge badge-info bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                  {firstQuestion?.level ? `N${6 - firstQuestion.level}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Cài đặt bài tập</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hạn chót</label>
                  <p className="text-gray-900 font-medium">
                    {task.dueDate || task.deadline ? 
                      new Date(task.dueDate || task.deadline).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Không có hạn'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số lượng bài nộp</label>
                  <p className="text-gray-900">{submissions.length} bài đã nộp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách bài nộp */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Danh sách học sinh làm bài ({submissions.length})
        </h2>

        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 rounded-lg border-2 border-gray">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Học sinh</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Điểm AI</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Điểm GV</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{submission.student_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge px-2 py-1 rounded text-xs font-bold ${
                        submission.status === 0 ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 1 ? 'bg-blue-100 text-blue-800' :
                        submission.status === 2 ? 'bg-indigo-100 text-indigo-800' :
                        submission.status === 3 ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status === 0 ? 'Bản nháp' :
                         submission.status === 1 ? 'Đã nộp' :
                         submission.status === 2 ? 'AI đã chấm' :
                         submission.status === 3 ? 'GV đã chấm' :
                         'Đã xem'}
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
                        Xem chi tiết
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
            <p className="text-gray-500 text-lg">Chưa có bài nộp nào.</p>
            <p className="text-gray-400 text-sm mt-2">Học sinh chưa thực hiện nộp bài cho nhiệm vụ này.</p>
          </div>
        )}
      </div>
    </section>
  );
}