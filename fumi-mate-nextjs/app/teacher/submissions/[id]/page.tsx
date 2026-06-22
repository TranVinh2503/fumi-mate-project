'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { AIGradingResult, Submission, TeacherFeedbackData } from '@/lib/types';

type LevelKey = 'M4' | 'M3' | 'M2' | 'M1';

// Cấu trúc 7 tiêu chí chuẩn
const CRITERIA = [
  {
    id: '1',
    name: 'Hoàn thành yêu cầu đề',
    max: 15,
    levels: {
      M4: {
        score: 15,
        desc: 'Đáp ứng đầy đủ yêu cầu đề; bám sát chủ đề, đúng mục đích và dạng bài; không bỏ sót ý chính'
      },
      M3: {
        score: 11.25,
        desc: 'Đáp ứng phần lớn yêu cầu; có thể thiếu nhẹ một ý hoặc một phần triển khai'
      },
      M2: {
        score: 7.5,
        desc: 'Chỉ đáp ứng một phần yêu cầu; còn thiếu ý hoặc lệch một phần so với đề'
      },
      M1: {
        score: 3.75,
        desc: 'Lạc đề, sai dạng bài hoặc bỏ sót phần lớn yêu cầu'
      }
    }
  },
  {
    id: '2',
    name: 'Nội dung và phát triển ý',
    max: 15,
    levels: {
      M4: {
        score: 15,
        desc: 'Ý rõ ràng, có triển khai, giải thích hoặc minh họa phù hợp'
      },
      M3: {
        score: 11.25,
        desc: 'Ý tương đối rõ; có phát triển nhưng chưa đều hoặc còn đơn giản'
      },
      M2: {
        score: 7.5,
        desc: 'Ý nghèo, lặp, phát triển hạn chế; ít minh họa/hỗ trợ'
      },
      M1: {
        score: 3.75,
        desc: 'Nội dung rất ít, rời rạc, khó hình thành thông điệp'
      }
    }
  },
  {
    id: '3',
    name: 'Bố cục và mạch lạc',
    max: 15,
    levels: {
      M4: {
        score: 15,
        desc: 'Bố cục rõ; sắp xếp ý logic; liên kết tự nhiên; dễ theo dõi'
      },
      M3: {
        score: 11.25,
        desc: 'Có bố cục cơ bản; nhìn chung logic; còn vài chỗ chuyển ý chưa mượt'
      },
      M2: {
        score: 7.5,
        desc: 'Trình tự ý chưa hợp lý; liên kết yếu; có đoạn khó theo dõi'
      },
      M1: {
        score: 3.75,
        desc: 'Ý rời rạc, thiếu tổ chức; rất khó theo dõi'
      }
    }
  },
  {
    id: '4',
    name: 'Ngữ pháp / cấu trúc',
    max: 20,
    levels: {
      M4: {
        score: 20,
        desc: 'Dùng đúng và khá đa dạng cấu trúc ở mức đích; lỗi ít, không cản hiểu'
      },
      M3: {
        score: 15,
        desc: 'Dùng được các cấu trúc cần thiết; có lỗi nhưng nhìn chung vẫn rõ nghĩa'
      },
      M2: {
        score: 10,
        desc: 'Chủ yếu dùng cấu trúc đơn giản; lỗi xuất hiện thường xuyên, đôi lúc cản hiểu'
      },
      M1: {
        score: 5,
        desc: 'Lỗi dày đặc; ảnh hưởng lớn đến việc hiểu nội dung'
      }
    }
  },
  {
    id: '5',
    name: 'Từ vựng',
    max: 15,
    levels: {
      M4: {
        score: 15,
        desc: 'Từ vựng phù hợp chủ đề; tương đối đa dạng; dùng từ khá chính xác'
      },
      M3: {
        score: 11.25,
        desc: 'Vốn từ đủ dùng; còn lặp từ hoặc vài chỗ dùng từ chưa thật tự nhiên'
      },
      M2: {
        score: 7.5,
        desc: 'Vốn từ hạn chế; dùng từ sai/chưa đúng ngữ cảnh khá nhiều'
      },
      M1: {
        score: 3.75,
        desc: 'Rất hạn chế về từ vựng; nhiều chỗ không diễn đạt được ý'
      }
    }
  },
  {
    id: '6',
    name: 'Chữ viết / chính tả',
    max: 10,
    levels: {
      M4: {
        score: 10,
        desc: 'Dùng chữ viết và chính tả nhìn chung đúng, ổn định; bài dễ đọc'
      },
      M3: {
        score: 7.5,
        desc: 'Có một số lỗi nhưng không ảnh hưởng đáng kể đến việc đọc hiểu'
      },
      M2: {
        score: 5,
        desc: 'Lỗi khá nhiều; làm giảm độ rõ và độ trôi chảy khi đọc'
      },
      M1: {
        score: 2.5,
        desc: 'Lỗi thường xuyên; ảnh hưởng rõ đến khả năng đọc hiểu'
      }
    }
  },
  {
    id: '7',
    name: 'Văn phong / ngữ dụng',
    max: 10,
    levels: {
      M4: {
        score: 10,
        desc: 'Văn phong phù hợp; register nhất quán; diễn đạt đúng ngữ cảnh'
      },
      M3: {
        score: 7.5,
        desc: 'Nhìn chung phù hợp; có vài chỗ lệch văn phong hoặc chưa tự nhiên'
      },
      M2: {
        score: 5,
        desc: 'Nhiều chỗ lẫn lộn văn phong/ngữ dụng; giảm tính phù hợp của bài viết'
      },
      M1: {
        score: 2.5,
        desc: 'Văn phong không phù hợp rõ rệt; gây lệch sắc thái hoặc mục đích giao tiếp'
      }
    }
  }
];

export default function TeacherGradeSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // State cho AI grading
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [aiResults, setAiResults] = useState<AIGradingResult[]>([]);
  const [selectedAiResultId, setSelectedAiResultId] = useState<number | null>(null);

  // Khởi tạo State với giá trị mặc định sạch
  const [formData, setFormData] = useState<TeacherFeedbackData>({
    overall_score: 0,
    grade: '',
    feedback_text: '',
    ai_summary: '',
    corrected_text: '',
    error_reason: '',
    criteria_scores: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0
    },
    grading_method: 'teacher_manual'
  });

  const normalizeCriteriaScores = (scores: any): Record<string, number> => {
    const normalizedScores: Record<string, number> = {};

    ['1', '2', '3', '4', '5', '6', '7'].forEach(id => {
      normalizedScores[id] = Number(scores?.[id]) || 0;
    });

    return normalizedScores;
  };

  const parseFeedbackSource = (feedbackSource: any) => {
    if (!feedbackSource) return null;

    try {
      return typeof feedbackSource === 'string'
        ? JSON.parse(feedbackSource)
        : feedbackSource;
    } catch (err) {
      console.error('❌ Parse feedback error:', err);
      return null;
    }
  };

  const buildRubricFeedbackText = (scores: Record<string, number>) => {
    return CRITERIA.map(c => {
      const score = scores[c.id];
      const selectedLevel = Object.entries(c.levels).find(
        ([_, level]) => level.score === score
      );

      return selectedLevel && score > 0
        ? `${c.id}. ${c.name} (${selectedLevel[0]} - ${score}/${c.max}): ${selectedLevel[1].desc}`
        : null;
    }).filter(Boolean).join('\n\n');
  };

  const providerLabel = (provider: string) => {
    if (provider === 'openai') return 'ChatGPT / OpenAI';
    if (provider === 'gemini') return 'Gemini';
    return provider;
  };

  const applyFeedbackToForm = (feedback: any, fallbackMethod = 'ai_generated') => {
    if (!feedback) return;

    const normalizedScores = normalizeCriteriaScores(feedback.criteria_scores);
    setAiFeedback(feedback);
    setFormData(prev => ({
      ...prev,
      overall_score: Number(feedback.overall_score || feedback.total_score) || 0,
      grade: feedback.grade || prev.grade || '',
      feedback_text: buildRubricFeedbackText(normalizedScores),
      ai_summary: feedback.feedback_text || prev.ai_summary || '',
      corrected_text: feedback.corrected_text || prev.corrected_text || '',
      error_reason: feedback.error_reason || '',
      criteria_scores: normalizedScores,
      grading_method: feedback.grading_method || fallbackMethod
    }));
  };

  const handleSelectAiResult = (result: AIGradingResult) => {
    if (result.status === 'failed') return;
    setSelectedAiResultId(result.id);
    applyFeedbackToForm(result.feedback, `${result.provider}_generated`);
  };

  const fetchSubmission = useCallback(async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('⚠️ Missing access token');
      setLoading(false);
      return;
    }

    console.log("submissionId: '" + submissionId + "'");

    try {
      const response = await fetch(`${API_ENDPOINTS.TEACHER_SUBMISSIONS}/${submissionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      const sub = data.submission;
      const fetchedAiResults: AIGradingResult[] = sub?.ai_grading_results || [];

      console.group('📌 FETCH SUBMISSION DETAIL');
      console.log('submissionId:', submissionId);
      console.log('raw response:', data);
      console.log('submission:', sub);
      console.log('status:', sub?.status);
      console.log('ai_score:', sub?.ai_score);
      console.log('ai_feedback:', sub?.ai_feedback);
      console.log('teacher_score:', sub?.teacher_score);
      console.log('teacher_feedback:', sub?.teacher_feedback);
      console.log('task_id:', sub?.task_id);
      console.log('task_title:', sub?.task_title);
      console.log('content length:', sub?.content?.length);
      console.groupEnd();

      setSubmission(sub);
      setAiResults(fetchedAiResults);

      const selectedResult = fetchedAiResults.find(result => result.is_selected);
      const firstUsableResult = fetchedAiResults.find(result => result.status === 'succeeded') ||
        fetchedAiResults.find(result => result.status === 'fallback');
      const defaultAiResult = selectedResult || firstUsableResult;
      setSelectedAiResultId(defaultAiResult?.id || null);

      /**
       * Ưu tiên teacher_feedback nếu đã có.
       * Nếu chưa có teacher_feedback nhưng đã có ai_feedback thì preview kết quả AI.
       */
      const feedbackSource = sub.teacher_feedback || sub.ai_feedback || defaultAiResult?.feedback;

      if (feedbackSource) {
        const parsed = parseFeedbackSource(feedbackSource);

        console.group('🧾 PARSED FEEDBACK SOURCE');
        console.log('source:', sub.teacher_feedback ? 'teacher_feedback' : 'ai_feedback');
        console.log('parsed:', parsed);
        console.log('criteria_scores:', parsed?.criteria_scores);
        console.log('criteria_levels:', parsed?.criteria_levels);
        console.log('overall_score:', parsed?.overall_score);
        console.groupEnd();

        if (parsed) {
          if (sub.ai_feedback) {
            setAiFeedback(parseFeedbackSource(sub.ai_feedback));
          }
          applyFeedbackToForm(parsed, sub.teacher_feedback ? 'teacher_manual' : 'ai_generated');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setMessage('❌ Không thể tải dữ liệu bài làm');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  // Cập nhật điểm và tự động sinh Feedback
  const updateCriteria = (cId: string, levelKey: string) => {
    const criterion = CRITERIA.find(c => c.id === cId);
    if (!criterion) return;

    const levelData = criterion.levels[levelKey as LevelKey];
    if (!levelData) return;

    setFormData(prev => {
      const newScores = {
        ...prev.criteria_scores,
        [cId]: levelData.score
      };

      const newTotal = Object.values(newScores).reduce((a, b) => Number(a) + Number(b), 0);

      return {
        ...prev,
        criteria_scores: newScores,
        overall_score: parseFloat(newTotal.toFixed(2)),
        grade: '',
        feedback_text: buildRubricFeedbackText(newScores)
      };
    });
  };

  const exportToWord = async () => {
    if (!submission) return;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Học sinh: ${submission.student_name || 'Không rõ'}`,
                  bold: true,
                  size: 28
                })
              ]
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: 'Bài làm:',
                  bold: true,
                  size: 24
                })
              ]
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: submission.content || '',
                  size: 24
                })
              ]
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: 'Đánh giá chi tiết:',
                  bold: true,
                  size: 24
                })
              ]
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: formData.feedback_text || '',
                  size: 24
                })
              ]
            }),

            ...((formData.corrected_text || aiFeedback?.corrected_text) ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Bản gợi ý chỉnh sửa:',
                    bold: true,
                    size: 24
                  })
                ]
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: formData.corrected_text || aiFeedback?.corrected_text || '',
                    size: 24
                  })
                ]
              })
            ] : [])
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Bai_lam_${submission.student_name}.docx`);
  };

  const handleAIGrade = async () => {
    const token = localStorage.getItem('access_token');

    console.group('🤖 AI GRADE CLICK');
    console.log('submissionId:', submissionId);
    console.log('token exists:', !!token);
    console.log('current submission:', submission);
    console.log('current formData before AI:', formData);
    console.groupEnd();

    if (!token) {
      setMessage('❌ Không tìm thấy access token');
      return;
    }

    if (!submission) {
      setMessage('❌ Không có dữ liệu bài nộp');
      return;
    }

    setAiLoading(true);
    setMessage('🤖 Đang gọi AI chấm điểm...');

    try {
      /**
       * Nếu bạn đã thêm vào apiConfig:
       * TEACHER_AI_GRADE_SUBMISSION: (id: number) => `${API_BASE_URL}/teacher/submissions/${id}/ai-grade`
       *
       * thì có thể đổi dòng dưới thành:
       * const url = API_ENDPOINTS.TEACHER_AI_GRADE_SUBMISSION(parseInt(submissionId));
       */
      const url = API_ENDPOINTS.TEACHER_AI_GRADE_SUBMISSION(parseInt(submissionId));

      console.group('🚀 AI GRADE REQUEST');
      console.log('url:', url);
      console.log('method:', 'POST');
      console.log('submission content length:', submission.content?.length);
      console.groupEnd();

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const rawText = await response.text();

      console.group('📥 AI GRADE RAW RESPONSE');
      console.log('status:', response.status);
      console.log('ok:', response.ok);
      console.log('rawText:', rawText);
      console.groupEnd();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseErr) {
        console.error('❌ JSON parse error:', parseErr);
        throw new Error('Backend không trả JSON hợp lệ');
      }

      console.group('✅ AI GRADE PARSED RESPONSE');
      console.log('data:', data);
      console.log('ai_score:', data?.ai_score);
      console.log('ai_feedback:', data?.ai_feedback);
      console.log('criteria_scores:', data?.ai_feedback?.criteria_scores);
      console.log('criteria_levels:', data?.ai_feedback?.criteria_levels);
      console.log('criteria_feedback:', data?.ai_feedback?.criteria_feedback);
      console.groupEnd();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Lỗi khi gọi AI chấm điểm');
      }

      const freshResults: AIGradingResult[] = data?.ai_grading_results || [];
      const previewResult = freshResults.find(result => result.id === data?.preview_result_id) ||
        freshResults.find(result => result.status === 'succeeded') ||
        freshResults.find(result => result.status === 'fallback');
      const feedback = previewResult?.feedback || data?.ai_feedback;

      if (!feedback) {
        throw new Error('Response không có ai_feedback');
      }

      setAiResults(prev => [...freshResults, ...prev]);
      setSelectedAiResultId(previewResult?.id || null);
      applyFeedbackToForm(feedback, data.grading_method || 'ai_generated');

      setMessage('✅ AI đã chấm điểm xong. Hãy chọn Gemini hoặc ChatGPT rồi bấm Gửi kết quả AI.');
    } catch (err: any) {
      console.error('❌ AI grading error:', err);
      setMessage(`❌ Lỗi AI chấm điểm: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublishAIGrade = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setMessage('❌ Không tìm thấy access token');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TEACHER_PUBLISH_AI_GRADE_SUBMISSION(parseInt(submissionId)), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selected_result_id: selectedAiResultId })
      });

      const rawText = await response.text();
      if (!response.ok) {
        let errorMessage = 'Lỗi khi gửi kết quả AI';
        try {
          const errorData = rawText ? JSON.parse(rawText) : null;
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      setMessage('✅ Đã gửi kết quả AI cho sinh viên!');
      setTimeout(() => router.push('/teacher/submissions'), 1500);
    } catch (err: any) {
      setMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');

    console.group('💾 TEACHER SAVE FINAL GRADE');
    console.log('submissionId:', submissionId);
    console.log('formData:', formData);
    console.log('selectedFile:', selectedFile);
    console.groupEnd();

    setLoading(true);

    try {
      const sendData = new FormData();

      if (selectedFile) {
        sendData.append('file', selectedFile);
      }

      sendData.append('data', JSON.stringify(formData));

      const response = await fetch(API_ENDPOINTS.TEACHER_GRADE_SUBMISSION(parseInt(submissionId)), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: sendData
      });

      const rawText = await response.text();

      console.group('💾 SAVE FINAL GRADE RESPONSE');
      console.log('status:', response.status);
      console.log('ok:', response.ok);
      console.log('rawText:', rawText);
      console.groupEnd();

      if (!response.ok) {
        let errorMessage = 'Lỗi khi lưu dữ liệu';

        try {
          const errorData = rawText ? JSON.parse(rawText) : null;
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch {}

        throw new Error(errorMessage);
      }

      setMessage('✅ Đã lưu kết quả chấm điểm!');
      setTimeout(() => router.push('/teacher/submissions'), 1500);
    } catch (err: any) {
      setMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !submission) {
    return <div className="p-10 text-center">Đang tải dữ liệu bài làm...</div>;
  }

  const isGraded = submission.status === 'teacher_graded';
  const isVariantGroup = submission.experimental_group === 'variant';
  const hasGradingTask = Boolean(submission.grading_task?.prompt_ja);
  const canEditManualGrade = !isGraded && !isVariantGroup;
  const canPublishAIGrade = !isGraded && isVariantGroup && Boolean(selectedAiResultId || submission.ai_score || formData.overall_score);

  return (
    <section className="container mx-auto p-8 max-w-6xl space-y-8">
      {/* 1. Header & Tools */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isGraded ? 'Xem lại kết quả chấm' : 'Chấm bài viết'}
            </h1>
            <p className="text-sm text-slate-500">Học sinh: {submission.student_name}</p>
          </div>

          {/* HIỂN THỊ FILE ĐÃ CHẤM NẾU CÓ */}
          {isGraded && submission.word_file_path && (
            <a
              href={`${API_ENDPOINTS.SERVER_DOWNLOADFILE}${submission.word_file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all text-sm animate-in fade-in slide-in-from-left-4"
            >
              <span className="text-lg">📄</span> Tải bản sửa (.docx)
            </a>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToWord}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 border border-blue-100 text-sm"
          >
            📥 Xuất Word bài làm
          </button>

          <button
            type="button"
            onClick={handleAIGrade}
            disabled={aiLoading || loading || isGraded || !isVariantGroup || !hasGradingTask}
            title={!hasGradingTask ? 'Chưa có đề chấm tương ứng với task_type_id' : undefined}
            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold hover:bg-purple-100 border border-purple-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? '🤖 Đang AI chấm...' : '🤖 AI chấm điểm'}
          </button>

          {canEditManualGrade ? (
            <label className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 cursor-pointer border border-green-100 text-sm">
              📤 {selectedFile ? selectedFile.name : 'Đính kèm bản sửa'}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
          ) : (
            <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl font-bold border border-slate-100 text-sm italic">
              Đã khóa chỉnh sửa
            </div>
          )}

          <Link
            href="/teacher/submissions"
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
          >
            Quay lại
          </Link>
        </div>
      </div>

      {/* 2. Đề bài mà AI/giáo viên dùng để chấm */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-800">Đề bài</h3>

        {submission.grading_task?.prompt_ja ? (
          <div className="whitespace-pre-wrap border-l-4 border-indigo-400 bg-indigo-50 px-5 py-4 text-base leading-relaxed text-slate-700">
            {submission.grading_task.prompt_ja}
          </div>
        ) : (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Không tìm thấy đề tương ứng với task_type_id. Không nên gọi AI chấm trước khi kiểm tra lại mapping.
          </div>
        )}
      </div>

      {/* 3. PHẦN TRÊN: Nội dung bài làm */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-4 flex justify-between">
          Nội dung bài làm
          <span className="text-xs font-normal text-slate-400 italic">
            ({submission.content.length} ký tự)
          </span>
        </h3>

        <div className="bg-slate-50 p-8 rounded-xl min-h-[200px] text-slate-600 italic leading-relaxed border border-slate-100 whitespace-pre-wrap text-lg">
          {submission.content}
        </div>
      </div>

      {/* 4. PHẦN DƯỚI: Chia 2 cột */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Cột trái dưới: 7 tiêu chí đánh giá */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl text-slate-800 px-2">Đánh giá chi tiết</h3>

          {CRITERIA.map(c => {
            const currentScore = formData.criteria_scores?.[c.id] || 0;

            const selectedLevel = Object.entries(c.levels).find(
              ([_, level]) => level.score === currentScore
            );

            const aiCriteriaFeedback = aiFeedback?.criteria_feedback?.[c.id];

            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-bold text-slate-600">
                    {c.id}. {c.name}
                  </span>

                  <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg text-xs">
                    {currentScore} / {c.max}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['M4', 'M3', 'M2', 'M1'] as LevelKey[]).map(k => (
                    <button
                      key={k}
                      type="button"
                      disabled={!canEditManualGrade}
                      onClick={() => updateCriteria(c.id, k)}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        currentScore === c.levels[k].score
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                          : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {k}
                      <span
                        className={`block text-[9px] font-normal ${
                          currentScore === c.levels[k].score
                            ? 'text-indigo-100'
                            : 'text-slate-300'
                        }`}
                      >
                        {c.levels[k].score}đ
                      </span>
                    </button>
                  ))}
                </div>

                {selectedLevel && currentScore > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-500 leading-relaxed italic">
                    &quot;{c.levels[selectedLevel[0] as LevelKey].desc}&quot;
                  </div>
                )}

                {aiCriteriaFeedback && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-100 text-[11px] text-purple-700 leading-relaxed">
                    <b>Nhận xét AI:</b> {aiCriteriaFeedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cột phải dưới: Tổng điểm & Nhận xét */}
        <div className="sticky top-8 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8"></div>

            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-4">
              Tổng điểm hệ thống
            </p>

            <div className="flex items-baseline justify-center">
              <span className="text-8xl font-black text-indigo-600 tracking-tighter">
                {formData.overall_score}
              </span>

              <span className="ml-4 text-2xl font-bold text-slate-300">
                / 100
              </span>
            </div>

            <div className="mt-6 space-y-3 text-left">
              {isVariantGroup && aiResults.length > 0 && (
                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-purple-800">
                        Kết quả AI để chọn gửi
                      </p>
                      <p className="text-xs text-purple-500">
                        Sinh viên chỉ nhìn thấy kết quả được chọn sau khi giáo viên gửi.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-600">
                      {aiResults.length} bản
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {aiResults.map(result => {
                      const isSelected = selectedAiResultId === result.id;
                      const isFailed = result.status === 'failed';

                      return (
                        <button
                          key={result.id}
                          type="button"
                          disabled={isFailed || isGraded}
                          onClick={() => handleSelectAiResult(result)}
                          className={`w-full rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-purple-500 bg-white shadow-sm'
                              : 'border-white bg-white/70 hover:border-purple-200'
                          } ${isFailed ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-800">
                                {providerLabel(result.provider)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {result.model || 'model chưa rõ'}
                                {result.latency_ms ? ` · ${result.latency_ms}ms` : ''}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xl font-black text-purple-700">
                                {result.total_score ?? '—'}
                              </p>
                              <p className={`text-[10px] font-bold uppercase ${
                                result.status === 'succeeded'
                                  ? 'text-green-600'
                                  : result.status === 'fallback'
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}>
                                {result.status}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <p className="mt-3 rounded-lg bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700">
                              Đang chọn kết quả này để gửi cho sinh viên
                            </p>
                          )}

                          {result.error_reason && (
                            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                              {result.error_reason}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-bold">Phương thức chấm:</span>{' '}
                {formData.grading_method || 'unknown'}
              </div>

              {formData.grading_method === 'heuristic_7_criteria_fallback' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-bold">Cảnh báo: AI chưa chấm thật.</p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {formData.error_reason || 'Backend đã dùng fallback nên điểm có thể giống nhau giữa các bài.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-10 text-left space-y-4">
              <label className="block text-sm font-bold text-slate-700">
                Đánh giá chi tiết
              </label>

              <textarea
                value={formData.feedback_text}
                onChange={e => setFormData({
                  ...formData,
                  feedback_text: e.target.value
                })}
                disabled={!canEditManualGrade}
                className="w-full p-5 border-2 border-slate-50 rounded-2xl h-80 focus:border-indigo-100 outline-none text-sm text-slate-600 leading-relaxed transition-all resize-none"
                placeholder="Đánh giá chi tiết sẽ tự động lấy từ mô tả level trong rubric..."
              />

              {isVariantGroup && formData.ai_summary && (
                <div className="p-4 rounded-xl bg-blue-50 text-blue-700 text-sm leading-relaxed">
                  <p className="font-bold mb-2">Nhận xét tổng quan từ AI:</p>
                  <p className="whitespace-pre-wrap">{formData.ai_summary}</p>
                </div>
              )}

              {isVariantGroup && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Bản gợi ý chỉnh sửa
                  </label>
                  <textarea
                    value={formData.corrected_text || ''}
                    onChange={e => setFormData({
                      ...formData,
                      corrected_text: e.target.value
                    })}
                    disabled
                    className="w-full p-5 border-2 border-slate-50 rounded-2xl h-80 focus:border-indigo-100 outline-none text-sm text-slate-600 leading-relaxed transition-all resize-none disabled:opacity-75"
                    placeholder="Sau khi bấm AI chấm điểm, hệ thống sẽ gợi ý bản viết lại tại đây..."
                  />
                </div>
              )}

              {isVariantGroup && aiFeedback?.strengths && Array.isArray(aiFeedback.strengths) && aiFeedback.strengths.length > 0 && (
                <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm">
                  <p className="font-bold mb-2">Ưu điểm AI nhận xét:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiFeedback.strengths.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isVariantGroup && aiFeedback?.improvements && Array.isArray(aiFeedback.improvements) && aiFeedback.improvements.length > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 text-orange-700 text-sm">
                  <p className="font-bold mb-2">Điểm cần cải thiện:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiFeedback.improvements.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {message && (
                <div
                  className={`p-4 rounded-xl text-sm font-bold ${
                    message.includes('✅')
                      ? 'bg-green-50 text-green-700'
                      : message.includes('🤖')
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message}
                </div>
              )}

              {canEditManualGrade && (
                <button
                  onClick={handleSubmit}
                  disabled={loading || aiLoading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-300 mt-4"
                >
                  {loading ? 'Đang lưu kết quả...' : 'Hoàn tất & Gửi kết quả'}
                </button>
              )}

              {isVariantGroup && !isGraded && (
                <button
                  onClick={handlePublishAIGrade}
                  disabled={loading || aiLoading || !canPublishAIGrade}
                  className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all active:scale-95 disabled:bg-slate-300 mt-4"
                >
                  {loading ? 'Đang gửi kết quả AI...' : 'Gửi kết quả AI'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
