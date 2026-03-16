'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ tất cả các trường");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Ưu tiên thông báo lỗi từ Server, nếu không có thì dùng câu tiếng Việt
        setMessage(data.message || "Đăng nhập thất bại");
        return;
      }

      // ✅ LƯU TOKEN
      localStorage.setItem("access_token", data.access_token);

      // ✅ SET AUTH CONTEXT
      login({
        username: data.user.username,
        userRole: data.user.role,
      });

      setMessage("Đăng nhập thành công! Đang chuyển hướng...");

      // Đợi một chút để người dùng kịp thấy thông báo thành công
      setTimeout(() => {
        router.push(`/${data.user.role}/tasks`);
      }, 1000);

    } catch (err) {
      console.error(err);
      setMessage("Lỗi máy chủ, vui lòng thử lại sau");
    }
  };

  return (
    <section className="min-h-screen flex items-start justify-center py-20">
      <div className="max-w-md w-full bg-white px-4">
        <h2 className="text-3xl font-title font-bold text-start mb-8">Đăng nhập</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="custom-input"
              placeholder="Nhập tên đăng nhập của bạn"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="custom-input"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {message && (
            <div className={`text-center p-3 rounded-lg ${
              message.includes('thành công') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors w-full md:w-auto"
            >
              Đăng nhập
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}