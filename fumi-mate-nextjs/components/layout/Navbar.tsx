'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileDropdown from './ProfileDropdown';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // prevents hydration mismatch
  }

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMobileMenuOpen(false);
  };
  console.log(user.userRole);

  return (
    <nav className="fixed top-[30px] left-0 right-0 bg-white shadow-lg z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-primary transition-colors">
            <GraduationCap className="w-8 h-8" />
            <span className="font-title">日本語</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {user.isAuthenticated ? (
              <>
                {user.userRole === 'student' ? (
                  <>
                    <Link href="/student/tasks" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Nhiệm vụ
                    </Link>
                    <Link href="/student/submissions" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Bài nộp
                    </Link>
                  </>
                ) : user.userRole === 'teacher' ? (
                  <>
                    <Link href="/teacher/tasks" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Quản lý nhiệm vụ
                    </Link>
                    <Link href="/teacher/submissions" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Xem xét bài nộp
                    </Link>

                  </>
                ) : user.userRole === 'admin' ? (
                  <>
                    <Link href="/admin" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Bảng điều khiển
                    </Link>
                    <Link href="/admin/question-bank" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Ngân hàng câu hỏi
                    </Link>
                    <Link href="/teacher/submissions" className="px-4 text-xs hover:text-primary transition-colors uppercase">
                      Xem xét bài nộp
                    </Link>
                  </>
                ) : null}
                
                {/* Profile Dropdown */}
                <ProfileDropdown username={user.username || 'Người dùng'} role={user.userRole} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-xs hover:text-primary transition-colors uppercase">Đăng nhập</Link>
                <Link href="/register" className="px-4 py-2 text-xs hover:text-primary transition-colors uppercase">Đăng ký</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-700 hover:text-primary"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>


      </div>
    </nav>
  );
}
