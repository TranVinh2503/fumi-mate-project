'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, Mail, Bell, Settings, HelpCircle } from 'lucide-react';

interface ProfileDropdownProps {
  username: string;
  role: 'student' | 'teacher';
}

export default function ProfileDropdown({ username, role }: ProfileDropdownProps) {
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
            <p className="text-sm text-gray-500 capitalize">{role}</p>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-sm">Profile</p>
                <p className="text-xs text-gray-500">View your profile</p>
              </div>
            </Link>

            <Link
              href="/messages"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Messages</p>
                <p className="text-xs text-gray-500">3 unread messages</p>
              </div>
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">3</span>
            </Link>

            <Link
              href="/notifications"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-sm">Notifications</p>
                <p className="text-xs text-gray-500">Manage notifications</p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-sm">Settings</p>
                <p className="text-xs text-gray-500">Account preferences</p>
              </div>
            </Link>

            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-sm">Help & Support</p>
                <p className="text-xs text-gray-500">Get assistance</p>
              </div>
            </Link>
          </div>

          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                // TODO: Implement logout functionality
                console.log('Logout clicked');
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 transition-colors text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">Logout</p>
                <p className="text-xs text-red-500">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
