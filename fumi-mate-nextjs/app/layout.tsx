import type { Metadata } from 'next';
import { DM_Serif_Text, Parisienne, Zen_Maru_Gothic, Dancing_Script } from 'next/font/google'; 
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import DynamicBar from '@/components/layout/DynamicBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// DM Serif Text: Dùng latin-ext để hỗ trợ tiếng Việt
const dmSerif = DM_Serif_Text({
  weight: ['400'],
  subsets: ['latin-ext'], 
  variable: '--font-dm-serif',
  display: 'swap',
});

// Zen Maru Gothic: Chỉ có latin, nên tiếng Việt ở font này SẼ BỊ LỖI DẤU.
// Lời khuyên: Chỉ dùng font này cho các từ tiếng Nhật (Kanji/Kana).
const zenMaru = Zen_Maru_Gothic({
  weight: ['400', '500', '700'],
  subsets: ['latin'], 
  variable: '--font-zen-maru',
  display: 'swap',
});

// Dancing Script: Hỗ trợ subset vietnamese cực tốt
const dancingScript = Dancing_Script({
  weight: ['400', '700'],
  subsets: ['vietnamese'], 
  variable: '--font-handwriting', 
  display: 'swap',
});

export const metadata: Metadata = {
  title: '文メイト - Học tiếng Nhật với AI',
  description: 'Làm chủ viết tiếng Nhật với phản hồi AI cá nhân hóa',
  icons: { icon: '/images/sake.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <html lang="vi" className={`${dmSerif.variable} ${zenMaru.variable} ${dancingScript.variable}`}>
      <body className="antialiased"> 
        <AuthProvider>
          <DynamicBar />
          <Navbar />
          <main className="mt-[46px]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}