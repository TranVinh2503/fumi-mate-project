'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/apiConfig';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

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

        if (!taskResponse.ok) {
          throw new Error('Không thể tải bài tập');
        }

        const taskData = await taskResponse.json();
        setTask(taskData.task);

        if (taskData.task.submission) {
          setSubmission(taskData.task.submission);
          setContent(taskData.task.submission.content || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirm('Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ không thể chỉnh sửa nội dung được nữa.')) {
      return;
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

  const isSubmitted = submission?.status === 'submitted';
  const questions = task.questions || [];

  return (
    <section className="section-padding mt-5 container mx-auto px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-4xl font-title font-bold mb-8">Bài thi viết</h2>

        {/* Thông báo nhanh */}
        {message && (
          <div className={`alert mb-4 p-4 rounded-lg flex justify-between items-center ${message.includes('✅') || message.includes('💾') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>{message}</span>
            <button
              onClick={() => setMessage('')}
              className="font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Thông tin bài tập */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <h3 className="font-semibold mb-3 text-lg">{task.title}</h3>
          <p className="text-gray-700 mb-4">{task.description}</p>
          
          {questions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Câu hỏi:</h4>
              {questions.map((q, index) => (
                <div key={q.id} className="mb-3 p-3 bg-white rounded">
                  <p className="text-gray-700">
                    <span className="font-semibold">Câu {index + 1}:</span> {q.questionText}
                  </p>
                  {q.hint && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-semibold text-blue-600">Gợi ý:</span> {q.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-sm text-gray-600 flex gap-4">
            <div>
              <span className="font-semibold">Độ khó: </span>
              <span className="capitalize">{task.difficulty || 'N/A'}</span>
            </div>
            {task.dueDate && (
              <div>
                <span className="font-semibold">Hạn chót: </span>
                <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
          {submission && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Trạng thái: </span>
              <span className={isSubmitted ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                {isSubmitted ? 'Đã nộp bài' : 'Bản nháp'}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="content" className="block text-lg font-semibold mb-3">
              Nội dung bài làm
            </label>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="custom-textarea w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary outline-none transition-all"
              rows={15}
              required
              placeholder="Bắt đầu viết nội dung trả lời của bạn tại đây..."
              disabled={isSubmitted}
            />
            <p className="text-sm text-gray-500 mt-2">
              Số ký tự: {content.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={submitting || isSubmitted || !content.trim()}
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang nộp bài...' : isSubmitted ? 'Đã nộp bài' : 'Nộp bài thi'}
            </button>
            
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || isSubmitted || !content.trim()}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu bản nháp
            </button>

            <Link
              href="/student/tasks"
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all inline-flex items-center"
            >
              Hủy bỏ
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}