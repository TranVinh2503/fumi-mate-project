'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";
import Navbar from '@/components/layout/Navbar';
interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Admin Navbar */}
         <Navbar/>

        <main className="pt-4 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
