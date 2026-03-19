'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileDropdown from './ProfileDropdown';
import { GraduationCap, Menu, X, LogOut, User } from 'lucide-react'; // Thêm icon cho mobile
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  // Helper để render các link dựa trên Role (Dùng chung cho cả Desktop và Mobile)
  const NavLinks = ({ mobile = false }) => {
    const baseClass = mobile 
      ? "block px-4 py-3 text-base font-medium border-b border-gray-100 hover:bg-gray-50 text-gray-700" 
      : "px-4 py-1 text-sm font-medium hover:text-primary transition-colors";

    if (!user.isAuthenticated) {
      return (
        <>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Đăng nhập</Link>
          <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Đăng ký</Link>
        </>
      );
    }

    return (
      <>
        {user.userRole === 'student' && (
          <>
            <Link href="/student/tasks" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Nhiệm vụ</Link>
            <Link href="/student/submissions" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Bài nộp</Link>
          </>
        )}
        {user.userRole === 'teacher' && (
          <>
            <Link href="/teacher/tasks" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Nhiệm vụ</Link>
            <Link href="/teacher/submissions" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Bài nộp</Link>
          </>
        )}
        {user.userRole === 'admin' && (
          <>
            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Dashboard</Link>
            <Link href="/admin/question-bank" onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>Question Bank</Link>
          </>
        )}
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50"> {/* Chỉnh top-0 để tránh khoảng hở nếu không cần thiết */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-primary transition-colors">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="font-title">日本語</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            <NavLinks />
            {user.isAuthenticated && (
              <ProfileDropdown username={user.username || 'Người dùng'} role={user.userRole} onLogout={handleLogout} />
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU CONTENT - Hiển thị khi isMobileMenuOpen === true */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col py-2">
            <NavLinks mobile={true} />
            
            {user.isAuthenticated && (
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4 text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.userRole}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}