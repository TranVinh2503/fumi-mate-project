'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ShoppingCart, Heart, Menu, X } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

interface NavbarProps {
  isAuthenticated?: boolean;
  userRole?: 'student' | 'teacher';
  username?: string;
}

export default function Navbar({ isAuthenticated = false, userRole = 'student', username = 'User' }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);

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
            {isAuthenticated ? (
              <>
                {userRole === 'student' ? (
                  <>
                    <Link href="/student/tasks" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                      Task
                    </Link>
                    <Link href="/student/submissions" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                      Submission
                    </Link>
                    <Link href="#contact" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                      Contact
                    </Link>
                    
                    {/* Resources Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                        className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase flex items-center gap-1"
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
                ) : (
                  <>
                    <Link href="/teacher/tasks" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                      Task Management
                    </Link>
                    <Link href="/teacher/submissions" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                      Submission Review
                    </Link>
                    <Link href="#contact" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                      Contact
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                  Login
                </Link>
                <Link href="/register" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors uppercase">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Right side icons */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated && (
              <>
                <button className="text-gray-700 hover:text-primary transition-all hover:scale-125">
                  <ShoppingCart className="w-6 h-6" />
                </button>
                <button className="text-gray-700 hover:text-primary transition-all hover:scale-125">
                  <Heart className="w-6 h-6" />
                </button>
                <ProfileDropdown username={username} role={userRole} />
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
            {isAuthenticated ? (
              <>
                {userRole === 'student' ? (
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
                ) : (
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
                )}
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
