'use client';

import { useEffect, useState } from 'react';

const messages = [
  "Chào mừng đến Fumi Mate — Học tiếng Nhật vui vẻ 🌸",
  "Làm chủ kanji, ngữ pháp và viết với AI 💫",
  "Học cùng giáo viên và tiến bộ mỗi ngày 📖",
  "Học tiếng Nhật đẹp đẽ — bất cứ lúc nào, bất cứ nơi đâu 🗾"
];

export default function DynamicBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 25000); // Change message every 25 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[30px] flex items-center justify-center bg-secondary text-white text-center overflow-hidden z-50">
      <div className="scroll-animation whitespace-nowrap text-sm">
        {messages[currentIndex]}
      </div>
    </div>
  );
}
