'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Dùng useRouter cho Client Side
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth(); // Giả sử Context có biến loading
  const router = useRouter();

  useEffect(() => {
    // Nếu đang load dữ liệu user thì đợi
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }


    // Điều hướng dựa trên Role
    switch (user.userRole) {
      case 'student':
        router.push('/student/tasks');
        break;
      case 'admin':
        router.push('/admin/question-bank');
        break;
      case 'teacher':
        router.push('/teacher/tasks');
        break;
      default:
        router.push('/login');
        break;
    }
  }, [user, loading, router]);

  // Hiển thị một màn hình chờ trong lúc kiểm tra
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return null;
}