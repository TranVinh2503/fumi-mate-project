import type { Metadata } from 'next';
import { DM_Serif_Text, Zen_Maru_Gothic, Parisienne } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import DynamicBar from '@/components/layout/DynamicBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const dmSerif = DM_Serif_Text({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const zenMaru = Zen_Maru_Gothic({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-zen-maru',
  display: 'swap',
});

const parisienne = Parisienne({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-parisienne',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '文メイト - Learn Japanese with AI',
  description: 'Master Japanese writing with AI-powered feedback and personalized learning',
  icons: {
    icon: '/images/sake.png',
  },
};

export default function RootLayout({children,}: {children: React.ReactNode;}) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${zenMaru.variable} ${parisienne.variable}`}>
      <body className="font-japanese">
        <AuthProvider>
          <DynamicBar />
          <Navbar/>
          <main className="mt-[46px]">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
