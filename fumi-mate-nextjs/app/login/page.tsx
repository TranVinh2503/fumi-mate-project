'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const { login } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  console.log("HANDLE SUBMIT CALLED"); // 👈

  e.preventDefault();

  const username = formData.username.trim();
  const password = formData.password.trim();

  if (!username || !password) {
    setMessage("Please fill in all fields");
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE (browser):", data);

    if (!res.ok) {
      setMessage(data.message || "Login failed");
      return;
    }

    // ✅ LƯU TOKEN
    localStorage.setItem("access_token", data.access_token);
    console.log("TOKEN SAVED:", data.access_token);

    // ✅ SET AUTH CONTEXT
    login({
      username: data.user.username,
      userRole: data.user.role,
    });

    setMessage("Login successful! Redirecting...");

    router.push(`/${data.user.role}/tasks`);
  } catch (err) {
    console.error(err);
    setMessage("Server error, please try again later");
  }
};





  return (
    <section className="min-h-screen flex items-start justify-center py-20">
      <div className="max-w-md w-full bg-white ">
        <h2 className="text-3xl font-title font-bold text-start mb-8">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="custom-input"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="custom-input"
              placeholder="Enter your password"
              required
            />
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
              Login
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
