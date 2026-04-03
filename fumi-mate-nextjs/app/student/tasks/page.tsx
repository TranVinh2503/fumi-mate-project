'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Submission } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { API_ENDPOINTS } from '@/lib/apiConfig';

type Task = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  dueDate: string | null;
  createdAt: string | null;
  isDone: boolean;
  attemptCount?: number;
  questions: {
    id: number;
    questionText: string;
    questionType: string;
    hint?: string;
    sampleAnswer?: string;
  }[];
  teacherId?: string;
};

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để xem bài tập.');
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.STUDENT_TASKS, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.msg || 'Không thể tải danh sách bài tập');
        }

        const data = await res.json();
        setTasks(data.tasks);
        console.log("Task",data.tasks)
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return <div className="p-10 text-center text-lg">Đang tải bài tập...</div>;
  if (error) return <p className="text-red-500 p-10 text-center">{error}</p>;

  return (
    <section className="container mx-auto section-padding mt-5 px-4">
      <h2 className="text-4xl font-title font-bold mb-8">Bài tập của bạn</h2>

      {/* Thông báo nhanh */}
      {message && (
        <div className="alert alert-success mb-4 bg-green-100 p-4 rounded-lg flex justify-between items-center">
          <span>{message}</span>
          <button
            onClick={() => setMessage('')}
            className="font-bold text-xl"
          >
            ×
          </button>
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {tasks.map((task) => {
            const currentAttempt = task.attemptCount ?? 0;
            // Temporarily disabled resubmit
            const canResubmit = false;
            const isFinalDone = task.isDone;
            const statusText = task.isDone ? 'Đã hoàn thành' : 'Chưa bắt đầu';
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <div key={task.id}>
                {isFinalDone ? (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg shadow-sm p-6 opacity-80">
                    <h5 className="text-xl font-bold mb-2">{task.title || 'Bài tập'}</h5>
                    {/* <p className="text-gray-600 text-sm mb-3 font-medium text-green-600">
                      Trạng thái: Hoàn thành {task.attemptCount}/2 ✅
                    </p> */}
                    <p className="text-gray-600 text-sm mb-3 font-medium text-green-600">
                      Trạng thái: Hoàn thành ✅
                    </p>
                    <div className="mb-2 text-sm">
                      <span className="font-semibold">Hạn chót: </span>
                      <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                        {task.dueDate ? formatDate(task.dueDate) : 'Không có'}
                      </span>
                    </div>
                    {isOverdue && (
                      <p className="text-sm text-red-600 mt-1 font-semibold">
                        ⏰ ĐÃ QUÁ HẠN
                      </p>
                    )}
                    <div className="mt-auto pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic mb-2 text-center">
                        Để xem chi tiết điểm và nhận xét của giáo viên:
                      </p>
                      <Link 
                        href="/student/submissions" 
                        className="block w-full text-center bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        Vào danh sách bài đã nộp ➔
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-gray-800 rounded-lg shadow-md p-6 card-hover flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-xl font-bold">{task.title || 'Bài tập'}</h5>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {task.difficulty || 'Dễ'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      Trạng thái: <span className={task.isDone ? "text-green-600" : "text-orange-500 font-bold"}>
                        {canResubmit ? "Đã chấm (Lần 1) - Có thể nộp lại" : statusText}
                      </span>
                    </p>

                    <div className="mb-4 flex-grow text-sm">
                      <div className="mb-1">
                        <span className="font-semibold">Hạn chót: </span>
                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                          {task.dueDate ? formatDate(task.dueDate) : 'Không có'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Lượt nộp: </span>
                        <span>{task.attemptCount || 0} / 2</span>
                      </div>
                    </div>

                    <Link
                      href={`/student/writing-test/${task.id}`}
                      className={`block w-full text-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isOverdue || canResubmit 
                          ? "bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-400" 
                          : "bg-secondary text-white hover:bg-primary"
                      }`}
                    >
                      {isOverdue ? '🚨 Nộp muộn OK' : canResubmit ? 'Nộp lại bài (Lần 2)' : (task.isDone ? 'Làm lại' : 'Bắt đầu làm bài')}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center mt-12">
          <img
            src="/images/crying_girl.png"
            alt="Không có bài tập"
            className="mx-auto mb-4"
            style={{ width: '200px' }}
          />
          <p className="text-gray-500 text-lg">Hiện tại bạn chưa có bài tập nào được giao.</p>
        </div>
      )}      
    </section>
  );
}
