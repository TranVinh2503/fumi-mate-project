'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm: '',
    role: 'student' as 'student' | 'teacher',
  });
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirm) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    
    // TODO: Implement actual registration API call
    console.log('Registration attempt:', {
      username: formData.username,
      role: formData.role,
    });
    
    setMessage('Registration successful! Redirecting to login...');
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-title font-bold text-center mb-8">Register</h2>
        
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
              minLength={3}
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
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm"
              value={formData.confirm}
              onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
              className="custom-input"
              placeholder="Confirm your password"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </span>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'teacher' })}
                className="custom-select pl-10"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
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
