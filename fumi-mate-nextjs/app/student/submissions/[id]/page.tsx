'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Submission } from '@/lib/types';
import { parseJSON } from '@/lib/utils';

// Cập nhật Interface để khớp với dữ liệu thực tế từ JSON
interface FeedbackData {
  grade?: string;
  feedback_text?: string;
  action_plan?: string[];
  practice_exercises?: Array<{
    title: string;
    description: string;
    example?: string;
  }>;
  detailed_analysis?: {
    grammar?: { score: number; issues?: string[]; suggestions?: string[] };
    vocabulary?: { score: number; strengths?: string[]; improvements?: string[] };
    structure?: { score: number; comments?: string };
    fluency?: { score: number; feedback?: string };
    content?: { score: number; feedback?: string };
  };
  overall_score?: number;
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submissionId = params.id;
  
  const [submission, setSubmission] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({});
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

        // LOGIC CHIA NHÓM
        if (sub.experimental_group === 'variant') {
          // Nếu backend gửi string thì parse, nếu gửi object thì dùng luôn
          const rawFeedback = sub.ai_feedback || sub.aiFeedback;
          const parsed = typeof rawFeedback === 'string' 
            ? parseJSON<FeedbackData>(rawFeedback, {}) 
            : rawFeedback;
          setFeedback(parsed || {});
        } else {
          // Nhóm Control: Giả lập cấu hình feedback từ dữ liệu giáo viên
          setFeedback({
            feedback_text: sub.teacher_feedback || sub.teacherFeedback,
            overall_score: sub.teacher_score || sub.teacherScore
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [submissionId]);

  if (loading) return <div className="container mx-auto p-20 text-center text-gray-500">Đang tải kết quả...</div>;
  if (error) return <div className="container mx-auto p-20 text-center text-red-500">{error}</div>;
  if (!submission) return null;

  const isVariant = submission.experimental_group === 'variant';
  const displayScore = isVariant ? (submission.ai_score || submission.aiScore) : (submission.teacher_score || submission.teacherScore);
  console.log(submission)
  console.log(submission.experimental_group)
  return (
    <section className="section-padding mt-5 container mx-auto px-4 pb-20">
      <div className="max-w-4xl mx-auto"> {/* Thu hẹp chiều rộng tối đa để tập trung nội dung */}
        <div className="flex justify-between items-end mb-10 border-b pb-4">
          <div>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-1">Kết quả học tập</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Chi tiết đánh giá</h2>
          </div>
          <Link href="/student/submissions" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-all flex items-center gap-1">
            <span className="text-lg">←</span> Quay lại danh sách
          </Link>
        </div>

        {/* 1. Nội dung bài làm - Nhỏ gọn hơn */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <span className="text-lg">📄</span>
            <span className="text-sm font-semibold uppercase">Bài làm của bạn</span>
          </div>
          <p className="whitespace-pre-wrap text-gray-600 leading-relaxed bg-gray-50/50 p-5 rounded-lg border border-dashed">
            {submission.content}
          </p>
        </div>

        {/* 2. Điểm số & Nhận xét - Style mới: Nhỏ gọn & Tinh tế */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            {/* Box điểm nhỏ gọn bên trái */}
            <div className="bg-slate-50 md:w-48 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="relative flex items-center justify-center">
                {/* Vòng tròn điểm số nhỏ */}
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-sm flex flex-col items-center justify-center bg-white">
                  <span className="text-3xl font-black text-slate-800">{displayScore ?? '—'}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Điểm số</span>
                </div>
              </div>
              {feedback.grade && (
                <div className="mt-4 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-tighter">
                  Xếp loại {feedback.grade}
                </div>
              )}
            </div>
            
            {/* Nội dung nhận xét bên phải */}
            <div className="flex-1 p-8">
              <h6 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-500">💬</span> Nhận xét tổng quát
              </h6>
              <div className="text-gray-600 leading-relaxed text-sm md:text-base">
                {feedback.feedback_text || "Hệ thống đã ghi nhận bài làm của bạn. Hãy xem chi tiết các phân tích bên dưới để cải thiện kỹ năng."}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Phần bổ trợ cho nhóm Variant (AI) */}
        {isVariant && (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Phân tích kỹ năng - Style Grid nhỏ */}
            {feedback.detailed_analysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Phân tích kỹ năng</h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(feedback.detailed_analysis).map(([key, data]: [string, any]) => (
                    <div key={key} className="text-center p-3 rounded-lg bg-gray-50 border border-transparent hover:border-blue-100 transition-all">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{key}</p>
                      <p className="text-xl font-black text-gray-700">{data.score}</p>
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-blue-400" style={{ width: `${data.score}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hai cột: Lộ trình & Bài tập */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Lộ trình */}
               {feedback.action_plan && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h5 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-green-500">🚀</span> Cần cải thiện
                    </h5>
                    <ul className="space-y-3">
                      {feedback.action_plan.slice(0, 4).map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-2">
                          <span className="text-green-400">•</span> {item}
                        </li>
                      ))}
                    </ul>
                 </div>
               )}

               {/* Bài tập bổ trợ nhỏ gọn */}
               {feedback.practice_exercises && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h5 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-purple-500">💡</span> Bài tập gợi ý
                    </h5>
                    <div className="space-y-3">
                      {feedback.practice_exercises.slice(0, 2).map((ex, i) => (
                        <div key={i} className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                          <p className="text-xs font-bold text-purple-800 mb-1">{ex.title}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-2">{ex.description}</p>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        <footer className="mt-16 text-center border-t pt-8">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            Academic Evaluation System • Fumi Mate Project
          </p>
        </footer>
      </div>
    </section>
  );
}