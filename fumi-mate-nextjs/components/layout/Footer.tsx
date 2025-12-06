import Link from 'next/link';
import { GraduationCap, Facebook, Instagram, Linkedin, Github } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Left: Brand & Promo */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-4">
              <GraduationCap className="w-8 h-8" />
              <span className="font-title">日本語</span>
            </Link>
            <p className="text-gray-600 mb-6">
              Clear your desk. Tie your hair up. Grab a coffee, and just start.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://github.com/nancy-builds" className="text-gray-600 hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Middle: Image */}
          <div className="flex justify-center items-center">
            <div className="relative w-48 h-48">
              {/* Placeholder for footer image */}
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🎌</span>
              </div>
            </div>
          </div>

          {/* Right: Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-primary mb-4">Practice</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Kanji</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Grammar</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Vocabulary</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Writing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-300 my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-600">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <span className="hidden md:inline">•</span>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
          <span className="hidden md:inline">•</span>
          <span>&copy; 2025 日本語 Inc. All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  );
}
