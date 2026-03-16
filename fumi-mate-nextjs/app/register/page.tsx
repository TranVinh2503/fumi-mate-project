'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { API_ENDPOINTS } from '@/lib/apiConfig';

export default function RegisterPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student")
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const renderRoleLabel = (r: string) => {
    switch (r) {
      case 'student': return 'Học sinh';
      case 'teacher': return 'Giáo viên';
      case 'admin': return 'Quản trị viên';
      default: return r;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Đăng ký thất bại');
        setLoading(false)
        return
      }

      // ✅ Lưu JWT
      localStorage.setItem('access_token', data.access_token)

      setMessage('Đăng ký thành công!')
      
      // Chuyển hướng sang trang đăng nhập sau 1 giây
      setTimeout(() => {
        router.push('/login')
      }, 1000)

    } catch (err) {
      setMessage('Lỗi máy chủ, vui lòng thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-start justify-center py-20">
      <div className="max-w-md w-full bg-white px-4">
        <h2 className="text-3xl font-title font-bold text-start mb-8">Đăng ký tài khoản</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Tên đăng nhập
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              className="custom-input"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              className="custom-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vai trò
            </label>

            <div className="flex gap-3">
              {["student", "teacher"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r as typeof role)}
                  className={`
                    px-4 py-2 rounded-xl border text-sm font-medium transition
                    ${
                      role === r
                        ? "bg-secondary text-white border-secondary"
                        : "border-gray-300 text-gray-700 hover:border-secondary hover:text-secondary"
                    }
                    focus:outline-none
                  `}
                >
                  {renderRoleLabel(r)}
                </button>
              ))}
            </div>
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
              disabled={loading}
              className={`bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors w-full md:w-auto ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Bạn đã có tài khoản?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}