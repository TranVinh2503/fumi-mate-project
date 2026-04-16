'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Submission, TeacherFeedbackData } from '@/lib/types';
import { parseJSON } from '@/lib/utils';

const CRITERIA = [
  { id: '1', name: 'Hoàn thành nhiệm vụ giao tiếp', max: 25 },
  { id: '2', name: 'Tổ chức & Nội dung', max: 25 },
  { id: '3', name: 'Từ vựng & Diễn đạt', max: 25 },
  { id: '4', name: 'Ngữ pháp & chính tả', max: 25 },
];

const GRADES = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

export default function TeacherGradeSubmissionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const submissionId = params.id;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [aiFeedback, setAiFeedback] = useState<any>({});
  const [formData, setFormData] = useState<TeacherFeedbackData>({
    overall_score: 0,
    grade: '',
    feedback_text: '',
    criteria_scores: { '1': 0, '2': 0, '3': 0, '4': 0 },
    strengths: [],
    improvements: [],
    action_plan: [],
    detailed_analysis: {
      grammar: { score: 0 },
      vocabulary: { score: 0 },
      structure: { score: 0 },
      fluency: { score: 0 },
      content: { score: 0 },
    },
    grading_method: 'teacher_manual',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchSubmission = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.TEACHER_SUBMISSIONS}/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSubmission(data.submission);
      
      // Pre-fill from teacher_feedback if exists
      if (data.submission.teacher_feedback) {
        const parsed = parseJSON<TeacherFeedbackData>(data.submission.teacher_feedback, formData);
        setFormData(parsed);
      }
      
      // Parse AI for reference
      if (data.submission.ai_feedback) {
        setAiFeedback(parseJSON(data.submission.ai_feedback, {}));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);
  
  // Xác định xem bài đã chấm hay chưa
  const isGraded = Boolean(submission?.teacher_feedback);

  // Hàm tính điểm (để dùng chung cho cả nút bấm và tự động nhảy)
  const handleAutoCalculateGrade = useCallback(() => {
    const score = formData.overall_score ?? 0;
    let autoGrade = 'F';

    if (score >= 90) autoGrade = 'A';
    else if (score >= 85) autoGrade = 'B+';
    else if (score >= 80) autoGrade = 'B';
    else if (score >= 75) autoGrade = 'C+';
    else if (score >= 70) autoGrade = 'C';
    else if (score >= 65) autoGrade = 'D+';
    else if (score >= 60) autoGrade = 'D';

    setFormData(prev => ({ ...prev, grade: autoGrade }));
  }, [formData.overall_score]);

  // Tự động nhảy điểm khi overall_score thay đổi
  useEffect(() => {
    if (!submission || isGraded) return;
    handleAutoCalculateGrade();
  }, [formData.overall_score, submission, isGraded, handleAutoCalculateGrade]);

  const updateCriteria = (id: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      criteria_scores: { ...prev.criteria_scores!, [id]: Math.max(0, Math.min(25, score)) },
      overall_score: Object.values({ ...prev.criteria_scores!, [id]: score }).reduce((a, b) => a + (b as number), 0)
    }));
  };

  const addTag = (field: 'strengths' | 'improvements' | 'action_plan', tag: string) => {
    if (tag.trim()) {
      setFormData(prev => {
        const currentList = Array.isArray(prev[field]) ? prev[field] : [];
        return {
          ...prev,
          [field]: [...currentList, tag.trim()]
        };
      });
    }
  };
  
  const removeTag = (field: 'strengths' | 'improvements' | 'action_plan', index: number) => {
    setFormData(prev => {
      const currentList = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: currentList.filter((_: any, i: number) => i !== index)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.overall_score === 0 || !formData.feedback_text!.trim()) {
      setMessage('Vui lòng điền điểm số và nhận xét');
      return;
    }

    // Tự động "vét" chữ còn sót lại trong các ô input (nếu giáo viên quên bấm Thêm)
    const payloadToSubmit = { ...formData };
    ['strengths', 'improvements', 'action_plan'].forEach((field) => {
      const input = document.getElementById(`input-${field}`) as HTMLInputElement;
      if (input && input.value.trim()) {
        const currentList = Array.isArray(payloadToSubmit[field as keyof TeacherFeedbackData]) 
          ? payloadToSubmit[field as keyof TeacherFeedbackData] as string[]
          : [];
        // Thêm nội dung còn sót vào payload gửi đi
        (payloadToSubmit[field as keyof TeacherFeedbackData] as string[]) = [...currentList, input.value.trim()];
        input.value = ''; // Xóa trắng ô input
      }
    });

    const token = localStorage.getItem('access_token');
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.TEACHER_GRADE_SUBMISSION(parseInt(submissionId)), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        // Gửi cái payload thông minh đã vét hết chữ đi
        body: JSON.stringify(payloadToSubmit), 
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submit failed');
      }

      setMessage('✅ Đã chấm điểm thành công!');
      setTimeout(() => router.push('/teacher/submissions'), 1500);
    } catch (err: any) {
      setMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !submission) return <div>Loading...</div>;

  return (
    <section className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Chấm điểm chi tiết</h1>
        <Link href="/teacher/submissions" className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
          ← Danh sách
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Cảnh báo nếu bài đã chấm */}
      {isGraded && (
        <div className="p-4 rounded-lg mb-6 bg-yellow-100 text-yellow-800 flex items-center gap-2 border border-yellow-200 shadow-sm">
          <span className="text-xl">🔒</span> 
          <span className="font-medium">Bài nộp này đã được chấm điểm.</span> 
          Bạn chỉ có thể xem chi tiết và không thể chỉnh sửa.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Submission Info + Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Thông tin bài nộp</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Sinh viên:</strong> {submission.student_name}</div>
              <div><strong>Bài tập:</strong> {submission.task_title}</div>
              <div>
                <strong>Trạng thái: </strong> 
                <span className={`px-2 py-1 rounded text-xs font-bold ${isGraded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {isGraded ? 'Đã chấm' : 'Chờ chấm'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Bài viết</h3>
            <div className="bg-gray-50 p-6 rounded-lg min-h-[200px] max-h-[400px] overflow-auto whitespace-pre-wrap">
              {submission.content}
            </div>
            <p className="text-sm text-gray-500 mt-2">Độ dài: {submission.content.length} ký tự</p>
          </div>
        </div>

        {/* Right: Current Score Summary */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              📊 Tổng điểm hiện tại
            </h3>
            <div className="text-4xl font-black text-blue-600 text-center mb-4">
              {formData.overall_score}/100
            </div>
            <div className="space-y-1 text-sm">
              {CRITERIA.map(({ id }) => (
                <div key={id} className="flex justify-between">
                  <span>C{ id }:</span>
                  <span className="font-semibold">{formData.criteria_scores![id] || 0}/{CRITERIA[parseInt(id)-1].max}</span>
                </div>
              ))}
            </div>
          </div>

          {aiFeedback.feedback_text && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
              <h4 className="font-semibold mb-2 text-blue-900">🤖 Tham khảo AI</h4>
              <p className="text-sm text-blue-800 leading-relaxed">{aiFeedback.feedback_text}</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Rubric Form */}
      <form onSubmit={handleSubmit} className="mt-12 bg-white p-8 rounded-2xl shadow-xl border">
        <h2 className="text-2xl font-bold mb-8">Form chấm điểm chi tiết</h2>

        {/* 1. Criteria Scores */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Tiêu chí (25 điểm mỗi tiêu chí)</h3>
            {CRITERIA.map(({ id, name, max }) => (
              <div key={id} className="mb-6">
                <label className="block text-sm font-medium mb-2">{name}</label>
                <input
                  type="range"
                  min="0"
                  max={max}
                  value={formData.criteria_scores![id] || 0}
                  onChange={(e) => updateCriteria(id, parseInt(e.target.value))}
                  disabled={isGraded}
                  className={`w-full h-2 rounded-lg appearance-none accent-blue-500 ${isGraded ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200 cursor-pointer'}`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span className={`font-semibold ${isGraded ? 'text-gray-500' : 'text-blue-600'}`}>
                    {formData.criteria_scores![id] || 0}
                  </span>
                  <span>{max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 2. Overall & Grade */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tổng quan</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Tổng điểm (/100)</label>
              <input
                type="number"
                value={formData.overall_score}
                onChange={(e) => setFormData(prev => ({ ...prev, overall_score: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
                disabled={isGraded}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed font-bold text-blue-600"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Xếp loại</label>
                {/* Nút bấm tự động tính (chỉ hiện khi chưa chấm) */}
                {!isGraded && (
                  <button
                    type="button"
                    onClick={handleAutoCalculateGrade}
                    className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded border border-green-200 transition-colors flex items-center gap-1 font-medium active:scale-95"
                    title="Tính lại xếp loại dựa trên tổng điểm"
                  >
                    🪄 Tự động tính
                  </button>
                )}
              </div>
              <select
                value={formData.grade || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                disabled={isGraded} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold ${
                  isGraded 
                    ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 appearance-none' 
                    : 'bg-white text-gray-900 border-gray-300 cursor-pointer'
                }`}
              >
                <option value="">Chọn xếp loại...</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Feedback Text */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-3">Nhận xét tổng quát *</label>
          <textarea
            value={formData.feedback_text}
            onChange={(e) => setFormData(prev => ({ ...prev, feedback_text: e.target.value }))}
            rows={4}
            disabled={isGraded}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
            placeholder="Nhận xét tổng quát về bài viết, điểm mạnh, điểm cần cải thiện..."
            required
          />
        </div>

        {/* 4. Tag Lists */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[['strengths', 'Điểm mạnh'], ['improvements', 'Cần cải thiện'], ['action_plan', 'Kế hoạch']].map(([field, title]) => {
            const rawValue = formData[field as keyof TeacherFeedbackData];
            const tags = Array.isArray(rawValue) 
              ? rawValue 
              : (typeof rawValue === 'string' && rawValue ? [rawValue] : []);

            return (
              <div key={field} className="bg-gray-50 p-4 rounded-xl border">
                <label className="block text-lg font-semibold mb-3">{title}</label>
                
                {!isGraded && (
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      id={`input-${field}`}
                      placeholder={`Thêm ${title.toLowerCase()}...`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(field as any, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`input-${field}`) as HTMLInputElement;
                        addTag(field as any, input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap text-sm font-medium transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {tags.length > 0 ? (
                    tags.map((tag, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
                        <span>{typeof tag === 'object' && tag !== null ? (tag as any).title : tag}</span>
                        {!isGraded && (
                          <button
                            type="button"
                            onClick={() => removeTag(field as any, i)}
                            className="text-blue-400 hover:text-red-500 ml-1 font-bold transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    isGraded && (
                      <p className="text-sm text-gray-500 italic py-2">Không có ghi chú</p>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. Detailed Analysis */}
        <div>
          <h3 className="text-lg font-semibold mb-6">Phân tích chi tiết</h3>
          <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border">
            {['grammar', 'vocabulary', 'structure', 'fluency', 'content'].map((area) => (
              <div key={area}>
                <label className="block text-sm font-medium mb-2 capitalize">{area}</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={(formData.detailed_analysis as any)?.[area]?.score || 0}
                  onChange={(e) => {
                    const newAnalysis = { ...formData.detailed_analysis! };
                    newAnalysis[area as keyof typeof newAnalysis] = { ...newAnalysis[area as keyof typeof newAnalysis], score: parseInt(e.target.value) };
                    setFormData(prev => ({ ...prev, detailed_analysis: newAnalysis }));
                  }}
                  disabled={isGraded}
                  className={`w-full h-2 rounded-lg appearance-none accent-green-500 ${isGraded ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 cursor-pointer'}`}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span>0</span>
                  <span className={isGraded ? 'text-gray-500 font-semibold' : 'text-green-600 font-semibold'}>
                  {(formData.detailed_analysis as any)?.[area]?.score || 0}
                  </span>
                  <span>20</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-12">
          {!isGraded && (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-transform active:scale-95"
            >
              {loading ? 'Đang lưu...' : 'Hoàn tất chấm điểm'}
            </button>
          )}
          <Link
            href="/teacher/submissions"
            className={`py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors text-center ${isGraded ? 'w-full' : 'px-8'}`}
          >
            {isGraded ? 'Quay lại danh sách' : 'Hủy'}
          </Link>
        </div>
      </form>
    </section>
  );
}