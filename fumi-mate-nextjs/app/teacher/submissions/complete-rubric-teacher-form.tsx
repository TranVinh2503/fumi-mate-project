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
        
        // Đảm bảo các mảng không bị undefined để không lỗi khi .map()
        setFormData({
          ...parsed,
          criteria_scores: parsed.criteria_scores || { '1': 0, '2': 0, '3': 0, '4': 0 },
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          action_plan: parsed.action_plan || [],
          detailed_analysis: parsed.detailed_analysis || formData.detailed_analysis
        });
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

  const updateCriteria = (id: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      criteria_scores: { ...prev.criteria_scores!, [id]: Math.max(0, Math.min(25, score)) },
      overall_score: Object.values({ ...prev.criteria_scores!, [id]: score }).reduce((a, b) => a + (b as number), 0)
    }));
  };

  const addTag = (field: 'strengths' | 'improvements' | 'action_plan', tag: string) => {
    if (tag.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), tag.trim()]
      }));
    }
  };

  const removeTag = (field: 'strengths' | 'improvements' | 'action_plan', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.overall_score === 0 || !formData.feedback_text?.trim()) {
      setMessage('Vui lòng điền điểm số và nhận xét');
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.TEACHER_GRADE_SUBMISSION(parseInt(submissionId)), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Submission Info + Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Thông tin bài nộp</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Sinh viên:</strong> {submission.student_name}</div>
              <div><strong>Bài tập:</strong> {submission.task_title}</div>
              <div><strong>Trạng thái:</strong> {submission.status}</div>
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
                  <span>{formData.criteria_scores![id] || 0}/{CRITERIA[parseInt(id)-1].max}</span>
                </div>
              ))}
            </div>
          </div>

          {aiFeedback.feedback_text && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🤖 Tham khảo AI</h4>
              <p className="text-sm text-blue-800">{aiFeedback.feedback_text}</p>
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span className="font-semibold text-blue-600">{formData.criteria_scores![id] || 0}</span>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Xếp loại</label>
              <select
                value={formData.grade || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn xếp loại</option>
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
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical"
            placeholder="Nhận xét tổng quát về bài viết, điểm mạnh, điểm cần cải thiện..."
            required
          />
        </div>

        {/* 4. Tag Lists */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[['strengths', 'Điểm mạnh'], ['improvements', 'Cần cải thiện'], ['action_plan', 'Kế hoạch']].map(([field, title]) => (
            <div key={field}>
              <label className="block text-lg font-semibold mb-3">{title}</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder={`Thêm ${title.toLowerCase()}...`}
                  onKeyDown={(e) => e.key === 'Enter' && addTag(field as any, e.currentTarget.value) && (e.currentTarget.value = '')}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Thêm"]') as HTMLInputElement;
                    addTag(field as any, input.value);
                    input.value = '';
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap"
                >
                  Thêm
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(formData[field as keyof TeacherFeedbackData] as string[])?.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(field as any, i)}
                      className="text-gray-500 hover:text-red-500 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Detailed Analysis */}
        <div>
          <h3 className="text-lg font-semibold mb-6">Phân tích chi tiết</h3>
          <div className="grid md:grid-cols-2 gap-6">
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
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span>0</span>
                  <span>{(formData.detailed_analysis as any)?.[area]?.score || 0}</span>
                  <span>20</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-12">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang lưu...' : 'Hoàn tất chấm điểm'}
          </button>
          <Link
            href="/teacher/submissions"
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            Hủy
          </Link>
        </div>
      </form>
    </section>
  );
}

