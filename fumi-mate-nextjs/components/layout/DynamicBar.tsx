'use client';

import { useEffect, useState } from 'react';

const messages = [
  "Welcome to Fumi Mate — Learn Japanese with fun 🌸",
  "Master kanji, grammar, and writing with AI 💫",
  "Join your teacher and improve every day 📖",
  "Learn Japanese beautifully — anytime, anywhere 🗾"
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
