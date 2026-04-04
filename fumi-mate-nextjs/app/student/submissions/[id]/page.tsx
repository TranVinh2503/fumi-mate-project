'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Submission, FeedbackData } from '@/lib/types';
import { parseJSON } from '@/lib/utils';

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

        // Auto AI grade for variant if no AI score
        if (sub.experimental_group === 'variant' && (!sub.ai_score && !sub.aiScore)) {
          await triggerAIGrading(submissionId, token!);
          // Refetch after grading
          const regradeRes = await fetch(`${API_ENDPOINTS.STUDENT_SUBMISSIONS}/${submissionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const regradeData = await regradeRes.json();
          sub.ai_feedback = regradeData.submission.ai_feedback;
          sub.ai_score = regradeData.submission.ai_score;
        }

        // Parse feedback for display
        const rawFeedback = sub.ai_feedback || sub.aiFeedback;
        const parsed = typeof rawFeedback === 'string' 
          ? parseJSON<FeedbackData>(rawFeedback, {}) 
          : rawFeedback;
        setFeedback(parsed || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const triggerAIGrading = async (id: string, token: string) => {
      try {
        const res = await fetch(`${API_ENDPOINTS.STUDENT_SUBMISSIONS}/${id}/grade`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) console.error('AI grading failed:', await res.text());
      } catch (e) {
        console.error('Trigger AI grade error:', e);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) return <div className="container mx-auto p-20 text-center text-gray-500">Đang tải...</div>;
  if (error) return <div className="container mx-auto p-20 text-center text-red-500">{error}</div>;
  if (!submission) return null;

  const isVariant = submission.experimental_group === 'variant';
  const displayScore = submission.ai_score || submission.aiScore || submission.teacher_score || submission.teacherScore;
  
        console.log('Submission:', submission);
        console.log('Feedback:', feedback);
        if (feedback.grading_method) {
          console.log(`[FRONTEND] Grading method: ${feedback.grading_method}`);
        }

  return (
    <section className="section-padding mt-5 container mx-auto px-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-10 border-b pb-4">
          <div>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-1">Kết quả học tập</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Chi tiết đánh giá</h2>
          </div>
          <Link href="/student/submissions" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-all flex items-center gap-1">
            <span className="text-lg">←</span> Quay lại danh sách
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <span className="text-lg">📄</span>
            <span className="text-sm font-semibold uppercase">Bài làm</span>
          </div>
          <p className="whitespace-pre-wrap text-gray-600 leading-relaxed bg-gray-50/50 p-5 rounded-lg border border-dashed">
            {submission.content}
          </p>
        </div>

        {/* Score & Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="bg-slate-50 md:w-48 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-sm flex flex-col items-center justify-center bg-white">
                <span className="text-3xl font-black text-slate-800">{displayScore ?? '—'}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">/100</span>
              </div>
              {feedback.grade && (
                <div className="mt-4 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-tighter">
                  {feedback.grade}
                </div>
              )}
            </div>
            <div className="flex-1 p-8">
              <h6 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-500">💬</span> Nhận xét tổng quát
              </h6>
              <div className="text-gray-600 leading-relaxed text-sm md:text-base">
                {feedback.feedback_text || 'Chờ đánh giá...'}
              </div>
            </div>
          </div>
        </div>

        {/* Rubric for variant */}
        {isVariant && feedback.criteria_scores && (
          <div className="space-y-6">
            {/* 4 Criteria */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Tiêu chí đánh giá (100pts)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(feedback.criteria_scores || {}).map(([key, score]: [string, number]) => {
                  const names = [
                    'Hoàn thành nhiệm vụ giao tiếp (25)',
                    'Tổ chức & Nội dung (25)',
                    'Từ vựng & Diễn đạt (25)',
                    'Ngữ pháp & chính tả (25)'
                  ];
                  const label = names[parseInt(key)-1] || `Tiêu chí ${key}`;
                  return (
                    <div key={key} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-2 truncate">{label}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-black text-blue-600">{score?.toFixed(1) || 0}</span>
                        <span className="text-sm text-gray-500">/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min((score || 0) / 25 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {feedback.strengths?.length ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <h5 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <span className="text-emerald-500">✅</span> Điểm mạnh
                  </h5>
                  <ul className="space-y-2 text-sm text-emerald-700 max-h-32 overflow-y-auto">
                    {feedback.strengths.slice(0,5).map((item, i) => (
                      <li key={i} className="flex gap-2 pl-2 border-l-2 border-emerald-300">
                        <span>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              
              {feedback.improvements?.length ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h5 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span> Cần cải thiện
                  </h5>
                  <ul className="space-y-2 text-sm text-amber-700 max-h-32 overflow-y-auto">
                    {feedback.improvements.slice(0,5).map((item, i) => (
                      <li key={i} className="flex gap-2 pl-2 border-l-2 border-amber-300">
                        <span>•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Action Plan */}
            {feedback.action_plan?.length ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h5 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <span className="text-blue-500">🚀</span> Kế hoạch cải thiện
                </h5>
                <ol className="space-y-3 text-sm text-blue-700 list-decimal list-inside max-h-40 overflow-y-auto">
                  {feedback.action_plan.slice(0,6).map((item, i) => (
                    <li key={i} className="pb-2">{item}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        )}

        {/* Control/Teacher fallback */}
        {!isVariant && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <h5 className="text-lg font-bold text-gray-800 mb-4">Chờ giáo viên chấm</h5>
            <p className="text-gray-600">Bài làm đã được ghi nhận. Kết quả sẽ được cập nhật sau khi giáo viên chấm điểm.</p>
          </div>
        )}

        <footer className="mt-16 text-center border-t pt-8">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            Fumi Mate • AI Writing Evaluation System
          </p>
        </footer>
      </div>
    </section>
  );
}
