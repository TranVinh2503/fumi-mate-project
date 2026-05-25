'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { parseJSON } from '@/lib/utils';
import { useParams } from 'next/navigation';

const CRITERIA: Record<string, {
  name: string;
  max: number;
  levels: Record<string, { score: number; desc: string }>;
}> = {
  '1': {
    name: 'Hoàn thành yêu cầu đề',
    max: 15,
    levels: {
      M4: { score: 15, desc: 'Đáp ứng đầy đủ yêu cầu đề; bám sát chủ đề, đúng mục đích và dạng bài; không bỏ sót ý chính' },
      M3: { score: 11.25, desc: 'Đáp ứng phần lớn yêu cầu; có thể thiếu nhẹ một ý hoặc một phần triển khai' },
      M2: { score: 7.5, desc: 'Chỉ đáp ứng một phần yêu cầu; còn thiếu ý hoặc lệch một phần so với đề' },
      M1: { score: 3.75, desc: 'Lạc đề, sai dạng bài hoặc bỏ sót phần lớn yêu cầu' }
    }
  },
  '2': {
    name: 'Nội dung và phát triển ý',
    max: 15,
    levels: {
      M4: { score: 15, desc: 'Ý rõ ràng, có triển khai, giải thích hoặc minh họa phù hợp' },
      M3: { score: 11.25, desc: 'Ý tương đối rõ; có phát triển nhưng chưa đều hoặc còn đơn giản' },
      M2: { score: 7.5, desc: 'Ý nghèo, lặp, phát triển hạn chế; ít minh họa/hỗ trợ' },
      M1: { score: 3.75, desc: 'Nội dung rất ít, rời rạc, khó hình thành thông điệp' }
    }
  },
  '3': {
    name: 'Bố cục và mạch lạc',
    max: 15,
    levels: {
      M4: { score: 15, desc: 'Bố cục rõ; sắp xếp ý logic; liên kết tự nhiên; dễ theo dõi' },
      M3: { score: 11.25, desc: 'Có bố cục cơ bản; nhìn chung logic; còn vài chỗ chuyển ý chưa mượt' },
      M2: { score: 7.5, desc: 'Trình tự ý chưa hợp lý; liên kết yếu; có đoạn khó theo dõi' },
      M1: { score: 3.75, desc: 'Ý rời rạc, thiếu tổ chức; rất khó theo dõi' }
    }
  },
  '4': {
    name: 'Ngữ pháp / cấu trúc',
    max: 20,
    levels: {
      M4: { score: 20, desc: 'Dùng đúng và khá đa dạng cấu trúc ở mức đích; lỗi ít, không cản hiểu' },
      M3: { score: 15, desc: 'Dùng được các cấu trúc cần thiết; có lỗi nhưng nhìn chung vẫn rõ nghĩa' },
      M2: { score: 10, desc: 'Chủ yếu dùng cấu trúc đơn giản; lỗi xuất hiện thường xuyên, đôi lúc cản hiểu' },
      M1: { score: 5, desc: 'Lỗi dày đặc; ảnh hưởng lớn đến việc hiểu nội dung' }
    }
  },
  '5': {
    name: 'Từ vựng',
    max: 15,
    levels: {
      M4: { score: 15, desc: 'Từ vựng phù hợp chủ đề; tương đối đa dạng; dùng từ khá chính xác' },
      M3: { score: 11.25, desc: 'Vốn từ đủ dùng; còn lặp từ hoặc vài chỗ dùng từ chưa thật tự nhiên' },
      M2: { score: 7.5, desc: 'Vốn từ hạn chế; dùng từ sai/chưa đúng ngữ cảnh khá nhiều' },
      M1: { score: 3.75, desc: 'Rất hạn chế về từ vựng; nhiều chỗ không diễn đạt được ý' }
    }
  },
  '6': {
    name: 'Chữ viết / chính tả',
    max: 10,
    levels: {
      M4: { score: 10, desc: 'Dùng chữ viết và chính tả nhìn chung đúng, ổn định; bài dễ đọc' },
      M3: { score: 7.5, desc: 'Có một số lỗi nhưng không ảnh hưởng đáng kể đến việc đọc hiểu' },
      M2: { score: 5, desc: 'Lỗi khá nhiều; làm giảm độ rõ và độ trôi chảy khi đọc' },
      M1: { score: 2.5, desc: 'Lỗi thường xuyên; ảnh hưởng rõ đến khả năng đọc hiểu' }
    }
  },
  '7': {
    name: 'Văn phong / ngữ dụng',
    max: 10,
    levels: {
      M4: { score: 10, desc: 'Văn phong phù hợp; register nhất quán; diễn đạt đúng ngữ cảnh' },
      M3: { score: 7.5, desc: 'Nhìn chung phù hợp; có vài chỗ lệch văn phong hoặc chưa tự nhiên' },
      M2: { score: 5, desc: 'Nhiều chỗ lẫn lộn văn phong/ngữ dụng; giảm tính phù hợp của bài viết' },
      M1: { score: 2.5, desc: 'Văn phong không phù hợp rõ rệt; gây lệch sắc thái hoặc mục đích giao tiếp' }
    }
  }
};


export default function SubmissionDetailPage() {
  const params = useParams();
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

        // Chọn nguồn feedback theo nhóm nghiên cứu.
        // control: chỉ thấy kết quả giáo viên; variant: chỉ thấy kết quả AI.
        let rawFeedback: string | object | undefined;
        const isControlGroup = sub.experimental_group === 'control';

        if (isControlGroup) {
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

  const isControlGroup = submission.experimental_group === 'control';
  const displayScore = isControlGroup
    ? (submission.teacherScore ?? submission.teacher_score)
    : (submission.aiScore ?? submission.ai_score);
  const hasFeedback = Object.keys(feedback).length > 0;
  const criteriaScores = feedback.criteria_scores || {};
  const criteriaLevels = feedback.criteria_levels || {};
  const criteriaFeedback = feedback.criteria_feedback || {};
  const criteriaKeys = Object.keys(criteriaScores).sort((a, b) => Number(a) - Number(b));

  return (
    <section className="section-padding mt-5 container mx-auto px-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-10 border-b pb-4">
          <div>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-1">
                Kết quả đánh giá
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">Chi tiết đánh giá</h2>
          </div>
          <Link href="/student/submissions" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-all flex items-center gap-1">
            <span className="text-lg">←</span> Quay lại danh sách
          </Link>
        </div>

        {/* HIỂN THỊ FILE WORD ĐÍNH KÈM NẾU CÓ */}
        {isControlGroup && submission.word_file_path && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">📄</div>
              <div>
                <h4 className="font-bold text-emerald-900">Bản sửa lỗi chi tiết đã sẵn sàng</h4>
                <p className="text-sm text-emerald-700">Bài viết đã có file nhận xét chi tiết.</p>
              </div>
            </div>
            <a
              href={`${API_ENDPOINTS.SERVER_DOWNLOADFILE}${submission.word_file_path}`}
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
                  {/* {feedback.grade && (
                    <div className="mt-6 px-6 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl uppercase shadow-lg shadow-indigo-100">
                      Loại {feedback.grade}
                    </div>
                  )} */}
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
            {criteriaKeys.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 border-b pb-4">
                  Đánh giá theo tiêu chí
                </h5>
                <div className="space-y-5">
                  {criteriaKeys.map((key) => {
                    const score = Number(criteriaScores[key]) || 0;
                    const criterion = CRITERIA[key];
                    const level = criteriaLevels[key];
                    const maxScore = criterion?.max || 25;
                    const fallbackDesc = level && criterion?.levels?.[level]?.desc;
                    const detail = criteriaFeedback[key] || fallbackDesc || '';

                    return (
                      <div key={key} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                          <div>
                            <p className="text-sm font-black text-gray-800">
                              {key}. {criterion?.name || `Tiêu chí ${key}`}
                            </p>
                            {level && (
                              <p className="text-xs font-bold text-indigo-500 mt-1">
                                Mức {level}
                              </p>
                            )}
                          </div>
                          <p className="text-base font-black text-indigo-600">
                            {score} <span className="text-gray-300">/{maxScore}</span>
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (score / maxScore) * 100)}%` }}
                          />
                        </div>
                        {detail && (
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {detail}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {feedback.strengths?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
                    <h5 className="text-xs font-black text-green-600 uppercase tracking-widest mb-4">
                      Điểm tốt
                    </h5>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      {feedback.strengths.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {feedback.improvements?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                    <h5 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">
                      Cần cải thiện
                    </h5>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      {feedback.improvements.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {feedback.corrected_text && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-4">
                  Bản gợi ý chỉnh sửa
                </h5>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed bg-blue-50/60 p-5 rounded-xl border border-blue-100">
                  {feedback.corrected_text}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
            <span className="text-5xl mb-4 block animate-bounce">⏳</span>
            <h5 className="text-xl font-bold text-gray-800 mb-2">Đang chờ chấm bài</h5>
            <p className="text-gray-500">Bài viết của bạn đang được xem xét. Vui lòng quay lại sau ít phút.</p>
          </div>
        )}
      </div>
    </section>
  );
}
