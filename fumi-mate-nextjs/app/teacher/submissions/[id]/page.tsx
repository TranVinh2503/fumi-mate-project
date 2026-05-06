'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Submission, TeacherFeedbackData } from '@/lib/types';
import { parseJSON } from '@/lib/utils';
import {API_BASE_URL_SERVER_DOWNLOADFILE} from '@/lib/apiConfig'

// Cấu trúc 7 tiêu chí chuẩn
const CRITERIA = [
  { id: '1', name: 'Hoàn thành yêu cầu đề', max: 15, levels: { 
      M4: { score: 15, desc: "Đáp ứng đầy đủ yêu cầu đề; bám sát chủ đề, đúng mục đích và dạng bài; không bỏ sót ý chính" },
      M3: { score: 11.25, desc: "Đáp ứng phần lớn yêu cầu; có thể thiếu nhẹ một ý hoặc một phần triển khai" },
      M2: { score: 7.5, desc: "Chỉ đáp ứng một phần yêu cầu; còn thiếu ý hoặc lệch một phần so với đề" },
      M1: { score: 3.75, desc: "Lạc đề, sai dạng bài hoặc bỏ sót phần lớn yêu cầu" }
  }},
  { id: '2', name: 'Nội dung và phát triển ý', max: 15, levels: {
      M4: { score: 15, desc: "Ý rõ ràng, có triển khai, giải thích hoặc minh họa phù hợp" },
      M3: { score: 11.25, desc: "Ý tương đối rõ; có phát triển nhưng chưa đều hoặc còn đơn giản" },
      M2: { score: 7.5, desc: "Ý nghèo, lặp, phát triển hạn chế; ít minh họa/hỗ trợ" },
      M1: { score: 3.75, desc: "Nội dung rất ít, rời rạc, khó hình thành thông điệp" }
  }},
  { id: '3', name: 'Bố cục và mạch lạc', max: 15, levels: {
      M4: { score: 15, desc: "Bố cục rõ; sắp xếp ý logic; liên kết tự nhiên; dễ theo dõi" },
      M3: { score: 11.25, desc: "Có bố cục cơ bản; nhìn chung logic; còn vài chỗ chuyển ý chưa mượt" },
      M2: { score: 7.5, desc: "Trình tự ý chưa hợp lý; liên kết yếu; có đoạn khó theo dõi" },
      M1: { score: 3.75, desc: "Ý rời rạc, thiếu tổ chức; rất khó theo dõi" }
  }},
  { id: '4', name: 'Ngữ pháp / cấu trúc', max: 20, levels: {
      M4: { score: 20, desc: "Dùng đúng và khá đa dạng cấu trúc ở mức đích; lỗi ít, không cản hiểu" },
      M3: { score: 15, desc: "Dùng được các cấu trúc cần thiết; có lỗi nhưng nhìn chung vẫn rõ nghĩa" },
      M2: { score: 10, desc: "Chủ yếu dùng cấu trúc đơn giản; lỗi xuất hiện thường xuyên, đôi lúc cản hiểu" },
      M1: { score: 5, desc: "Lỗi dày đặc; ảnh hưởng lớn đến việc hiểu nội dung" }
  }},
  { id: '5', name: 'Từ vựng', max: 15, levels: {
      M4: { score: 15, desc: "Từ vựng phù hợp chủ đề; tương đối đa dạng; dùng từ khá chính xác" },
      M3: { score: 11.25, desc: "Vốn từ đủ dùng; còn lặp từ hoặc vài chỗ dùng từ chưa thật tự nhiên" },
      M2: { score: 7.5, desc: "Vốn từ hạn chế; dùng từ sai/chưa đúng ngữ cảnh khá nhiều" },
      M1: { score: 3.75, desc: "Rất hạn chế về từ vựng; nhiều chỗ không diễn đạt được ý" }
  }},
  { id: '6', name: 'Chữ viết / chính tả', max: 10, levels: {
      M4: { score: 10, desc: "Dùng chữ viết và chính tả nhìn chung đúng, ổn định; bài dễ đọc" },
      M3: { score: 7.5, desc: "Có một số lỗi nhưng không ảnh hưởng đáng kể đến việc đọc hiểu" },
      M2: { score: 5, desc: "Lỗi khá nhiều; làm giảm độ rõ và độ trôi chảy khi đọc" },
      M1: { score: 2.5, desc: "Lỗi thường xuyên; ảnh hưởng rõ đến khả năng đọc hiểu" }
  }},
  { id: '7', name: 'Văn phong / ngữ dụng', max: 10, levels: {
      M4: { score: 10, desc: "Văn phong phù hợp; register nhất quán; diễn đạt đúng ngữ cảnh" },
      M3: { score: 7.5, desc: "Nhìn chung phù hợp; có vài chỗ lệch văn phong hoặc chưa tự nhiên" },
      M2: { score: 5, desc: "Nhiều chỗ lẫn lộn văn phong/ngữ dụng; giảm tính phù hợp của bài viết" },
      M1: { score: 2.5, desc: "Văn phong không phù hợp rõ rệt; gây lệch sắc thái hoặc mục đích giao tiếp" }
  }}
];

export default function TeacherGradeSubmissionPage() {
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const params = useParams();
  const submissionId = params.id as string;
  
  // Khởi tạo State với giá trị mặc định sạch
  const [formData, setFormData] = useState<TeacherFeedbackData>({
    overall_score: 0,
    grade: '',
    feedback_text: '',
    criteria_scores: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
    grading_method: 'teacher_manual'
  });

  const fetchSubmission = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
	console.log("submissionId: '" + submissionId + "'");
    try {
      const response = await fetch(`${API_ENDPOINTS.TEACHER_SUBMISSIONS}/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      const sub = data.submission;
      setSubmission(sub); // Lưu submission vào state (đã bao gồm word_file_path)
  
      if (sub.teacher_feedback) {
        const parsed = typeof sub.teacher_feedback === 'string' 
          ? JSON.parse(sub.teacher_feedback) 
          : sub.teacher_feedback;
  
        if (parsed) {
          const normalizedScores: Record<string, number> = {};
          ['1', '2', '3', '4', '5', '6', '7'].forEach(id => {
            normalizedScores[id] = Number(parsed.criteria_scores?.[id]) || 0;
          });
  
          setFormData({
            overall_score: Number(parsed.overall_score) || 0,
            grade: parsed.grade || '',
            feedback_text: parsed.feedback_text || '',
            criteria_scores: normalizedScores,
            grading_method: parsed.grading_method || 'teacher_manual'
            // Lưu ý: word_file_path nằm trực tiếp ở sub, không nằm trong formData
          });
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { fetchSubmission(); }, [fetchSubmission]);

  // Cập nhật điểm và tự động sinh Feedback
  const updateCriteria = (cId: string, levelKey: string) => {
    const levelData = CRITERIA.find(c => c.id === cId)?.levels[levelKey as 'M4'];
    if (!levelData) return;

    setFormData(prev => {
      const newScores = { ...prev.criteria_scores, [cId]: levelData.score };
      const newTotal = Object.values(newScores).reduce((a, b) => Number(a) + Number(b), 0);
      
      // Tạo đoạn văn nhận xét tự động từ mô tả các mức đã chọn
      const feedbackLines = CRITERIA.map(c => {
        const score = newScores[c.id];
        const level = Object.values(c.levels).find(l => l.score === score);
        return level && score > 0 ? `${c.name}: ${level.desc}` : null;
      }).filter(Boolean);

      let newGrade = 'F';
      if (newTotal >= 90) newGrade = 'A';
      else if (newTotal >= 80) newGrade = 'B';
      else if (newTotal >= 70) newGrade = 'C';
      else if (newTotal >= 60) newGrade = 'D';

      return {
        ...prev,
        criteria_scores: newScores,
        overall_score: parseFloat(newTotal.toFixed(2)),
        grade: newGrade,
        feedback_text: feedbackLines.join('\n\n')
      };
    });
  };

  const exportToWord = async () => {
    if (!submission) return;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `Học sinh: ${submission.student_name}`, bold: true, size: 28 })] }),
          new Paragraph({ text: `Bài làm:`, bold: true }),
          new Paragraph({ text: submission.content, size: 24 })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Bai_lam_${submission.student_name}.docx`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const sendData = new FormData();
      if (selectedFile) sendData.append('file', selectedFile);
      sendData.append('data', JSON.stringify(formData));

      const response = await fetch(API_ENDPOINTS.TEACHER_GRADE_SUBMISSION(parseInt(submissionId)), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: sendData,
      });

      if (!response.ok) throw new Error('Lỗi khi lưu dữ liệu');
      setMessage('✅ Đã lưu kết quả chấm điểm!');
      setTimeout(() => router.push('/teacher/submissions'), 1500);
    } catch (err: any) {
      setMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !submission) return <div className="p-10 text-center">Đang tải dữ liệu bài làm...</div>;

  const isGraded = submission.status === 'teacher_graded';

  return (
    <section className="container mx-auto p-8 max-w-6xl space-y-8">
      {/* 1. Header & Tools - Giữ nguyên */}
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
            href={`${API_BASE_URL_SERVER_DOWNLOADFILE}${submission.word_file_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all text-sm animate-in fade-in slide-in-from-left-4"
          >
            <span className="text-lg">📄</span> Tải bản sửa (.docx)
          </a>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={exportToWord} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 border border-blue-100 text-sm">
          📥 Xuất Word bài làm
        </button>
        
        {!isGraded ? (
          <label className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 cursor-pointer border border-green-100 text-sm">
            📤 {selectedFile ? selectedFile.name : 'Đính kèm bản sửa'}
            <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </label>
        ) : (
          <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl font-bold border border-slate-100 text-sm italic">
            Đã khóa chỉnh sửa
          </div>
        )}
        
        <Link href="/teacher/submissions" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">
          Quay lại
        </Link>
      </div>
    </div>
  
      {/* 2. PHẦN TRÊN: Nội dung bài làm chiếm trọn chiều ngang */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-4 flex justify-between">
          Nội dung bài làm 
          <span className="text-xs font-normal text-slate-400 italic">({submission.content.length} ký tự)</span>
        </h3>
        <div className="bg-slate-50 p-8 rounded-xl min-h-[200px] text-slate-600 italic leading-relaxed border border-slate-100 whitespace-pre-wrap text-lg">
          {submission.content}
        </div>
      </div>
  
      {/* 3. PHẦN DƯỚI: Chia 2 cột cho Đánh giá và Tổng kết */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Cột trái dưới: 7 tiêu chí đánh giá */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl text-slate-800 px-2">Đánh giá chi tiết</h3>
          {CRITERIA.map(c => {
            const currentScore = formData.criteria_scores?.[c.id] || 0;
            const selectedLevel = Object.entries(c.levels).find(([_, l]) => l.score === currentScore);
            
            return (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-bold text-slate-600">{c.id}. {c.name}</span>
                  <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg text-xs">
                    {currentScore} / {c.max}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['M4', 'M3', 'M2', 'M1'].map(k => (
                    <button 
                      key={k} 
                      type="button" 
                      disabled={isGraded}
                      onClick={() => updateCriteria(c.id, k)}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        currentScore === c.levels[k as 'M4'].score 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                          : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {k} 
                      <span className={`block text-[9px] font-normal ${currentScore === c.levels[k as 'M4'].score ? 'text-indigo-100' : 'text-slate-300'}`}>
                        {c.levels[k as 'M4'].score}đ
                      </span>
                    </button>
                  ))}
                </div>
                {selectedLevel && currentScore > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-500 leading-relaxed italic">
                    &quot;{c.levels[selectedLevel[0] as 'M4'].desc}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
  
        {/* Cột phải dưới: Tổng điểm & Nhận xét (Sticky để dễ theo dõi) */}
        <div className="sticky top-8 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8"></div>
            
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-4">Tổng điểm hệ thống</p>
            <div className="flex items-baseline justify-center">
                {/* Số điểm chính - To, đậm, rõ ràng */}
                <span className="text-8xl font-black text-indigo-600 tracking-tighter">
                  {formData.overall_score}
                </span>
                
                {/* Dấu / 100 - Cách ra một khoảng lề trái (ml-4) và màu nhạt hơn */}
                <span className="ml-4 text-2xl font-bold text-slate-300">
                  / 100
                </span>
              </div>
            
            <div className="mt-8 bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
              <p className="text-[10px] uppercase font-bold text-indigo-900/40 mb-1">Xếp loại dự kiến</p>
              <span className="text-4xl font-black text-indigo-700">{formData.grade || '-'}</span>
            </div>
  
            <div className="mt-10 text-left space-y-4">
              <label className="block text-sm font-bold text-slate-700">Nhận xét tổng quát</label>
              <textarea 
                value={formData.feedback_text} 
                onChange={e => setFormData({...formData, feedback_text: e.target.value})}
                disabled={isGraded}
                className="w-full p-5 border-2 border-slate-50 rounded-2xl h-80 focus:border-indigo-100 outline-none text-sm text-slate-600 leading-relaxed transition-all resize-none"
                placeholder="Nhận xét chi tiết sẽ tự động hiển thị khi bạn chấm điểm ở cột bên trái..." 
              />
              
              {message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}
  
              {!isGraded && (
                <button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-300 mt-4"
                >
                  {loading ? 'Đang lưu kết quả...' : 'Hoàn tất & Gửi kết quả'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}