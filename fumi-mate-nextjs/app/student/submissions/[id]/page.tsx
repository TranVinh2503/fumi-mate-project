'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { FeedbackData } from '@/lib/types';
import { parseJSON } from '@/lib/utils';

// Cấu hình tên 7 tiêu chí chuẩn từ phía giáo viên
const TEACHER_CRITERIA_NAMES: Record<string, string> = {
  '1': 'Hoàn thành yêu cầu đề (15)',
  '2': 'Nội dung và phát triển ý (15)',
  '3': 'Bố cục và mạch lạc (15)',
  '4': 'Ngữ pháp / cấu trúc (20)',
  '5': 'Từ vựng (15)',
  '6': 'Chữ viết / chính tả (10)',
  '7': 'Văn phong / ngữ dụng (10)'
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submissionId = params.id;
  const [submission, setSubmission] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<any>({});  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_ENDPOINTS.STUDENT_SUBMISSIONS}/${submissionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) throw new Error('Không thể tải thông tin bài làm');
        
        const data = await response.json();
        const sub = data.submission;
        setSubmission(sub);

        // Xử lý logic chọn nguồn feedback (Ưu tiên Giáo viên nếu đã chấm)
        let rawFeedback: string | object | undefined;
        let isTeacherGraded = sub.status === 'teacher_graded';
        
        if (isTeacherGraded) {
          rawFeedback = sub.teacherFeedback || sub.teacher_feedback;
        } else {
          rawFeedback = sub.aiFeedback || sub.ai_feedback;
        }
        
        const parsed = typeof rawFeedback === 'string' 
          ? parseJSON<any>(rawFeedback, {}) 
          : rawFeedback;
          
        setFeedback(parsed || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) return <div className="container mx-auto p-20 text-center text-gray-500">Đang tải...</div>;
  if (error) return <div className="container mx-auto p-20 text-center text-red-500">{error}</div>;
  if (!submission) return null;

  const isTeacherGraded = submission.status === 'teacher_graded';
  const displayScore = isTeacherGraded ? submission.teacherScore : submission.aiScore;
  const hasFeedback = Object.keys(feedback).length > 0;

  return (
    <section className="section-padding mt-5 container mx-auto px-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-10 border-b pb-4">
          <div>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-1">
                {isTeacherGraded ? '👨‍🏫 Kết quả từ Giáo viên' : '🤖 Kết quả từ AI'}
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">Chi tiết đánh giá</h2>
          </div>
          <Link href="/student/submissions" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-all flex items-center gap-1">
            <span className="text-lg">←</span> Quay lại danh sách
          </Link>
        </div>

        {/* HIỂN THỊ FILE WORD ĐÍNH KÈM NẾU CÓ */}
        {submission.word_file_path && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">📄</div>
              <div>
                <h4 className="font-bold text-emerald-900">Bản sửa lỗi chi tiết đã sẵn sàng</h4>
                <p className="text-sm text-emerald-700">Giáo viên đã gửi kèm một file Word nhận xét chi tiết.</p>
              </div>
            </div>
            <a 
              href={`${API_BASE_URL}${submission.word_file_path}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-center shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
            >
              📥 Tải xuống bản chữa (.docx)
            </a>
          </div>
        )}

        {/* Nội dung bài làm */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 text-gray-500 font-bold text-xs uppercase tracking-widest">
            <span>📄 Bài viết của bạn</span>
          </div>
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed bg-gray-50/50 p-5 rounded-lg border border-dashed italic">
            {submission.content}
          </p>
        </div>

        {hasFeedback ? (
          <>
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="flex flex-col md:flex-row">
                <div className="bg-slate-50 md:w-56 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Tổng điểm</p>
                  <div className="relative flex items-baseline">
                    <span className="text-7xl font-black text-indigo-600 tracking-tighter">{displayScore ?? '—'}</span>
                    <span className="ml-2 text-xl font-bold text-slate-300">/100</span>
                  </div>
                  {feedback.grade && (
                    <div className="mt-6 px-6 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl uppercase shadow-lg shadow-indigo-100">
                      Loại {feedback.grade}
                    </div>
                  )}
                </div>
                <div className="flex-1 p-8">
                  <h6 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <span className="text-blue-500">💬</span> Nhận xét tổng quát
                  </h6>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap italic border-l-4 border-blue-100 pl-4">
                    {feedback.feedback_text || "Không có nhận xét bổ sung."}
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria Scores */}
            {feedback.criteria_scores && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 border-b pb-4">
                  Điểm thành phần chi tiết
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(feedback.criteria_scores).map(([key, score]: [string, any]) => {
                    // Logic hiển thị tên tiêu chí: Nếu là 7 tiêu chí GV thì dùng TEACHER_CRITERIA_NAMES, ngược lại dùng logic cũ
                    const is7Criteria = Object.keys(feedback.criteria_scores).length > 4;
                    const label = is7Criteria 
                      ? TEACHER_CRITERIA_NAMES[key] 
                      : ['Hoàn thành nhiệm vụ (25)', 'Tổ chức & Nội dung (25)', 'Từ vựng (25)', 'Ngữ pháp (25)'][parseInt(key)-1];
                    
                    const maxScore = is7Criteria ? (key === '4' ? 20 : (key === '6' || key === '7' ? 10 : 15)) : 25;

                    return (
                      <div key={key} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-[11px] font-bold text-gray-500 uppercase">{label || `Tiêu chí ${key}`}</p>
                          <p className="text-sm font-black text-indigo-600">{score} <span className="text-gray-300">/{maxScore}</span></p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${(score / maxScore) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths & Improvements (Giữ nguyên giao diện đẹp của bạn) */}
            {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Render Strengths & Improvements tương tự code cũ của bạn */}
                </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
            <span className="text-5xl mb-4 block animate-bounce">⏳</span>
            <h5 className="text-xl font-bold text-gray-800 mb-2">Đang chờ chấm bài</h5>
            <p className="text-gray-500">Giáo viên đang xem xét bài viết của bạn. Vui lòng quay lại sau ít phút.</p>
          </div>
        )}
      </div>
    </section>
  );
}