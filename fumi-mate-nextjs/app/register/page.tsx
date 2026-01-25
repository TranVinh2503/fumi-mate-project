'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"


export default function LoginPage() {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student")
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    console.log("Register here")

    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
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
        setMessage(data.message || 'Login failed')
        setLoading(false)
        return
      }

      // ✅ Save JWT
      localStorage.setItem('token', data.access_token)

      setMessage('Login successful!')
      router.push('/login') // hoặc dashboard

    } catch (err) {
      setMessage('Server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-start justify-center py-20">
      <div className="max-w-md w-full bg-white">
        <h2 className="text-3xl font-title font-bold text-start mb-8">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="custom-input"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Confirm your password"
              className="custom-input"
              required
            />
          </div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Role
  </label>

  <div className="flex gap-3">
    {["student", "teacher", "admin"].map((r) => (
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
        {r.charAt(0).toUpperCase() + r.slice(1)}
      </button>
    ))}
  </div>
</div>


          {message && (
            <div className={`text-center p-3 rounded-lg ${
              message.includes('successful') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              className="bg-secondary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors w-full md:w-auto"
            >
              Register
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
