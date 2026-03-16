'use client';

import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your Fumi-Mate platform - Question Bank, Users, and System Settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Question Bank Card */}
          <Link href="/admin/question-bank" className="group">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Question Bank</h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                Add, edit, and manage Japanese writing prompts for all levels
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-lg group-hover:text-blue-700">
                Manage Questions
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Users Card */}
          <Link href="/admin/users" className="group">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">User Management</h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                View students, teachers, and admin accounts. Manage access and permissions
              </p>
              <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-lg group-hover:text-green-700">
                Manage Users
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Settings Card */}
          <div className="group">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 hover:bg-white/90 cursor-pointer opacity-60">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">System Settings</h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                Platform configuration and AI settings (coming soon)
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold text-lg">
                Coming Soon
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-6xl mb-4">
            🚀
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ready to manage your Fumi-Mate Japanese learning platform?
          </p>
        </div>
      </div>
    </div>
  );
}

