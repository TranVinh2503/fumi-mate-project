'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, ShoppingCart, Heart, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()

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
    router.push('/')
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-[30px] left-0 right-0 bg-white shadow-lg z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center flex-start gap-20 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-primary transition-colors">
            <GraduationCap className="w-8 h-8" />
            <span className="font-title">日本語</span>
          </Link>

          {/* Desktop Navigation */}
<div className="lg:flex items-center gap-8 ml-auto">
  {user.isAuthenticated ? (
    <>
      {user.userRole === 'student' ? (
        <>
          {/* Student Links */}
          <Link href="/student/tasks" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Task
          </Link>
          <Link href="/student/submissions" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Submission
          </Link>
          <Link href="#contact" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Contact
          </Link>

          {/* Resources Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsResourcesOpen(!isResourcesOpen)}
              className="px-4 pe-10 text-xs hover:text-primary transition-colors uppercase flex items-center gap-1"
            >
              Resources
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isResourcesOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                <Link href="/resources/kanji" className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-semibold text-sm">Kanji</p>
                    <p className="text-xs text-gray-500">Lists, readings & stroke order</p>
                  </div>
                </Link>
                <Link href="/resources/grammar" className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-semibold text-sm">Grammar Tips</p>
                    <p className="text-xs text-gray-500">Short lessons & common mistakes</p>
                  </div>
                </Link>
                <Link href="/resources/progress" className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="font-semibold text-sm">Progress</p>
                    <p className="text-xs text-gray-500">View your study streak and scores</p>
                  </div>
                </Link>
                <Link href="/resources/how-it-works" className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">❓</span>
                  <div>
                    <p className="font-semibold text-sm">How it works</p>
                    <p className="text-xs text-gray-500">Quick guide to using the site</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </>
      ) : user.userRole === 'teacher' ? (
        <>
          {/* Teacher Links */}
          <Link href="/teacher/tasks" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Task Management
          </Link>
          <Link href="/teacher/submissions" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Submission Review
          </Link>
          <Link href="#contact" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Contact
          </Link>
        </>
      ) : user.userRole === 'admin' ? (
        <>
          {/* Admin Links – can reuse teacher links + admin extras if needed */}
          <Link href="/teacher/tasks" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Task Management
          </Link>
          <Link href="/teacher/submissions" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Submission Review
          </Link>
          <Link href="#contact" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Contact
          </Link>
          <Link href="/admin/users" className="px-4 text-xs hover:text-primary transition-colors uppercase">
            Manage Users
          </Link>
        </>
      ) : null}
      
      {/* Username and Logout button */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">{user.username || 'User'}</span>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </>
  ) : (
    <>
      <Link href="/login" className="px-4 py-2 text-xs hover:text-primary transition-colors uppercase">Login</Link>
      <Link href="/register" className="px-4 py-2 text-xs hover:text-primary transition-colors uppercase"> Sign Up </Link>
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

        {/* Mobile Menu */}
{isMobileMenuOpen && (
  <div className="lg:hidden py-4 border-t border-gray-200">
    {user.isAuthenticated ? (
      <>
        {user.userRole === 'student' ? (
          <>
            <Link href="/student/tasks" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Task
            </Link>
            <Link href="/student/submissions" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Submission
            </Link>
            <Link href="#contact" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
          </>
        ) : user.userRole === 'teacher' ? (
          <>
            <Link href="/teacher/tasks" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Task Management
            </Link>
            <Link href="/teacher/submissions" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Submission Review
            </Link>
            <Link href="#contact" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
          </>
        ) : user.userRole === 'admin' ? (
          <>
            <Link href="/admin/tasks" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Admin Dashboard
            </Link>
            <Link href="/admin/users" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Manage Users
            </Link>
            <Link href="#contact" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
          </>
        ) : null}
      </>
    ) : (
      <>
        <Link href="/login" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
          Login
        </Link>
        <Link href="/register" className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
          Sign Up
        </Link>
      </>
    )}
  </div>
)}

      </div>
    </nav>
  );
}
