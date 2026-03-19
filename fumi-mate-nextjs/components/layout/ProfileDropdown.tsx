'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, Mail, Bell, Settings, HelpCircle } from 'lucide-react';

interface ProfileDropdownProps {
  username: string;
  role: 'student' | 'teacher' | 'admin';
  onLogout?: () => void;
}

export default function ProfileDropdown({ username, role, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const vietnameseRole = role === 'student' ? 'Học sinh' : role === 'teacher' ? 'Giáo viên' : 'Quản trị';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Profile menu"
      >
        <User className="w-6 h-6 text-gray-700" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <p className="font-semibold text-gray-900">{username}</p>
            <p className="text-sm text-gray-500 capitalize">{vietnameseRole}</p>
          </div>

          <div className="py-2">
           
            <button
              onClick={() => {
                window.location.href = "/settings";
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-sm">Đổi Mật Khẩu</p>
              </div>
            </button>

          </div>

          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                }
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 transition-colors text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">Đăng xuất</p>
                <p className="text-xs text-red-500">Thoát khỏi tài khoản</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
