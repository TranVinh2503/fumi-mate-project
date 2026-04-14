'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';

// ==========================================
// ⚙️ CẤU HÌNH THỜI GIAN LÀM BÀI (Tính bằng giây)
// Test: Để 30 (30 giây)
// Chạy thật: Để 45 * 60 (45 phút)
// ==========================================
const TEST_DURATION_SECONDS = 60 * 60; 

type Question = {
  id: number;
  questionText: string;
  questionType: string;
  hint?: string;
  sampleAnswer?: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  dueDate: string | null;
  createdAt: string | null;
  isDone: boolean;
  questions: Question[];
  teacherId?: string;
  submission?: {
    id: number;
    content: string;
    status: string;
  };
};

export default function WritingTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = params.id;
  
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<{id: number; content: string; status: string;} | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // TIMER STATES - Đã sử dụng biến cấu hình
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS); 
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // 1. Hook tải dữ liệu (Kết hợp khôi phục bản nháp từ LocalStorage nếu có)
  useEffect(() => {
    if (!token) {
      setMessage('Vui lòng đăng nhập để tiếp tục');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const taskResponse = await fetch(`${API_ENDPOINTS.STUDENT_TASKS}/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!taskResponse.ok) throw new Error('Không thể tải bài tập');

        const taskData = await taskResponse.json();
        setTask(taskData.task);

        const serverSubmission = taskData.task.submission;
        const serverContent = serverSubmission?.content || '';
        const localDraft = localStorage.getItem(`test_draft_${taskId}`);

        if (serverSubmission) {
          setSubmission(serverSubmission);
        }

        // Ưu tiên lấy nội dung dài hơn (bảo vệ sinh viên nếu server chưa kịp lưu bản mới nhất)
        if (localDraft && localDraft.length > serverContent.length && serverSubmission?.status !== 'submitted') {
          setContent(localDraft);
        } else {
          setContent(serverContent);
        }

      } catch (error) {
        console.error('Error fetching task:', error);
        setMessage('Không thể tải dữ liệu bài tập');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, token]);

  // 2a. Hook CHỈ làm nhiệm vụ đếm ngược (đã loại bỏ 'content' để tránh Time Drift)
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // 2b. Hook kiểm tra hết giờ & Gọi lệnh nộp tự động
  useEffect(() => {
    if (timerActive && timeLeft === 0) {
      setTimerActive(false); // Ngắt đếm giờ lập tức
      setMessage('⏰ HẾT GIỜ! Tự động nộp bài.');
      
      if (content.trim()) {
        handleSubmit(null, true); // Gọi nộp bài kèm cờ tự động
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, timerActive, content]);

  // 2c. Hook Auto-save: Tự động lưu nháp vào LocalStorage mỗi 10 giây
  useEffect(() => {
    if (!hasStarted || !timerActive || !content) return;
    const isSubmitted = submission?.status === 'submitted' || submission?.status === 'teacher_graded' || submission?.status === 'ai_graded';
    if (isSubmitted) return;

    const autoSaveInterval = setInterval(() => {
      localStorage.setItem(`test_draft_${taskId}`, content);
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [content, hasStarted, timerActive, submission, taskId]);

  // 3. Hook TỰ ĐỘNG BẮT ĐẦU HOẶC KHÔI PHỤC THỜI GIAN
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    const isAlreadySubmitted = submission?.status === 'submitted' || submission?.status === 'teacher_graded' || submission?.status === 'ai_graded';
    
    if (isAlreadySubmitted) {
      setHasStarted(true);
      setTimerActive(false);
      return;
    }

    const savedStart = localStorage.getItem(`test_start_${taskId}`);
    const now = new Date();

    if (savedStart) {
      const parsed = new Date(savedStart);
      if (!isNaN(parsed.getTime())) {
        setStartTime(parsed);
        setHasStarted(true);
        const elapsed = Math.floor((now.getTime() - parsed.getTime()) / 1000);
        
        // Sử dụng biến thay vì hardcode
        const remaining = TEST_DURATION_SECONDS - elapsed;
        
        if (remaining > 0) {
          setTimeLeft(remaining);
          setTimerActive(true);
        } else {
          // Kẹt thời gian (Hết giờ ở Local nhưng Server chưa nộp) -> Reset thời gian
          if (!submission || submission.status === 'draft') {
            console.warn("Phát hiện lỗi kẹt thời gian. Tiến hành reset bộ đếm.");
            localStorage.removeItem(`test_start_${taskId}`);
            localStorage.setItem(`test_start_${taskId}`, now.toISOString());
            setStartTime(now);
            setTimeLeft(TEST_DURATION_SECONDS); // Cập nhật bằng biến
            setTimerActive(true);
            setMessage('⚠️ Hệ thống phát hiện lỗi đồng bộ. Bài thi của bạn đã được làm mới thời gian.');
          } else {
            setTimeLeft(0);
            setTimerActive(false);
          }
        }
      }
    } else {
      localStorage.setItem(`test_start_${taskId}`, now.toISOString());
      setStartTime(now);
      setHasStarted(true);
      setTimeLeft(TEST_DURATION_SECONDS); // Cập nhật bằng biến
      setTimerActive(true);
    }
  }, [taskId, loading, submission]);

  // Các hàm xử lý nộp bài
  const handleSubmit = async (e?: React.FormEvent | null, isAutoSubmit: boolean = false) => {
    if (e) e.preventDefault();
    if (submitting) return; // Chặn Double Submit
  
    // Bỏ qua confirm nếu hệ thống tự nộp
    if (!isAutoSubmit) {
      if (!confirm('Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ không thể chỉnh sửa nội dung được nữa.')) {
        return;
      }
    }
  
    if (!token) {
      setMessage('Vui lòng đăng nhập lại');
      return;
    }
  
    setSubmitting(true);
  
    try {
      const response = await fetch(API_ENDPOINTS.STUDENT_SUBMIT_TEST(Number(taskId)), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          action: 'submit'
        })
      });
  
      if (response.ok) {
        const data = await response.json();
        setMessage('✅ Bài làm của bạn đã được nộp thành công!');
        setSubmission(data.submission);
        setTimerActive(false);
        
        // Dọn dẹp LocalStorage sau khi nộp thành công
        localStorage.removeItem(`test_start_${taskId}`);
        localStorage.removeItem(`test_draft_${taskId}`);

        setTimeout(() => router.push('/student/submissions'), 2000);
      } else {
        const error = await response.json();
        setMessage(`❌ Nộp bài thất bại: ${error.error || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (submitting) return;
    if (!token) {
      setMessage('Vui lòng đăng nhập lại');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.STUDENT_SUBMIT_TEST(Number(taskId)), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          action: 'save'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('💾 Đã lưu bản nháp thành công!');
        if (data.submission) {
          setSubmission(data.submission);
        }
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ Không thể lưu bản nháp: ${error.error || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Save draft error:', error);
      setMessage('❌ Lỗi kết nối khi lưu bản nháp.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto section-padding text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-xl text-gray-600 mt-4">Đang tải bài tập...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto section-padding text-center">
        <p className="text-xl text-red-600">Không tìm thấy bài tập</p>
        <Link href="/student/tasks" className="text-blue-600 hover:underline mt-4 inline-block">
          Quay lại danh sách bài tập
        </Link>
      </div>
    );
  }

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'teacher_graded' || submission?.status === 'ai_graded';
  const questions = task.questions || [];

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-3xl font-title font-bold text-gray-800">Bài thi viết</h2>
          
          {hasStarted && !isSubmitted && timeLeft > 0 && (
            <div className={`flex items-center gap-4 px-6 py-2 rounded-lg border-l-4 shadow-sm transition-all ${
              timeLeft < 5 * 60 
                ? 'bg-red-50 border-red-500 text-red-700 animate-pulse' 
                : 'bg-blue-50 border-blue-500 text-blue-800'
            }`}>
              <div className="text-right">
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Thời gian còn lại</p>
                {timeLeft < 5 * 60 && (
                  <p className="text-xs font-bold text-red-600">Sắp hết giờ!</p>
                )}
              </div>
              <div className={`text-3xl font-mono font-bold ${timeLeft < 5 * 60 ? 'text-red-600' : 'text-blue-700'}`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                {Math.floor(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {hasStarted && !isSubmitted && timeLeft <= 0 && (
            <div className="flex items-center gap-4 px-6 py-2 rounded-lg border-l-4 border-gray-500 bg-gray-100 shadow-sm text-gray-700">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm font-bold">HẾT GIỜ</p>
                <p className="text-xs">Đang xử lý nộp bài...</p>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`alert mb-6 p-4 rounded-lg flex justify-between items-center ${message.includes('✅') || message.includes('💾') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
            <span className="font-medium">{message}</span>
            <button
              onClick={() => setMessage('')}
              className="text-xl opacity-70 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-8 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <h3 className="font-bold text-xl mb-3 text-blue-900">{task.title}</h3>
          <p className="text-gray-700 mb-5 leading-relaxed">{task.description}</p>
          
          {questions.length > 0 && (
            <div className="mt-4 bg-white p-4 rounded border border-blue-100">
              <h4 className="font-semibold mb-3 text-blue-800">Yêu cầu chi tiết:</h4>
              {questions.map((q, index) => (
                <div key={q.id} className="mb-3 last:mb-0">
                  <p className="text-gray-800">
                    <span className="font-bold text-blue-600 mr-2">Câu {index + 1}:</span> 
                    {q.questionText}
                  </p>
                  {q.hint && (
                    <p className="text-sm text-gray-500 mt-1 pl-12">
                      <span className="font-medium text-amber-600">💡 Gợi ý:</span> {q.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-600 border-t border-blue-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">Độ khó:</span>
              <span className="px-2 py-1 bg-white rounded border uppercase text-xs font-bold shadow-sm">{task.difficulty || 'N/A'}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">Hạn chót:</span>
                <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {submission && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">Trạng thái:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${isSubmitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isSubmitted ? 'Đã nộp bài' : 'Bản nháp'}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="mb-6">
            <label htmlFor="content" className="block text-lg font-bold text-gray-800 mb-3">
              Bài làm của bạn
            </label>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              
              onPaste={(e) => {
                e.preventDefault();
                setMessage('⚠️ Chống gian lận: Không được phép dán (paste) nội dung vào bài thi!');
              }}
              onDrop={(e) => {
                e.preventDefault();
                setMessage('⚠️ Chống gian lận: Không được phép kéo thả nội dung!');
              }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              autoComplete="off"
              spellCheck="false"
              
              className="w-full p-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner text-gray-800 leading-relaxed resize-y"
              rows={15}
              required
              placeholder="Bắt đầu viết nội dung trả lời của bạn tại đây..."
              disabled={isSubmitted || (!timerActive && timeLeft <= 0)}
            />
            <div className="flex justify-end mt-2">
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Số ký tự: <span className={content.length > 0 ? 'text-blue-600' : ''}>{content.length}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting || isSubmitted || !content.trim() || (!timerActive && timeLeft <= 0)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {submitting ? 'Đang xử lý...' : isSubmitted ? 'Đã nộp bài' : 'Nộp bài thi'}
            </button>
            
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || isSubmitted || !content.trim() || (!timerActive && timeLeft <= 0)}
              className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Lưu bản nháp
            </button>

            <Link
              href="/student/tasks"
              className="ml-auto text-gray-500 px-6 py-3 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-all flex items-center"
            >
              Quay lại danh sách
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}