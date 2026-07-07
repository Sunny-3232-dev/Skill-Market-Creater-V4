import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  message: string;
  title?: string;
  sourceWords?: string[];
}

// 入力された言葉が静かに立ちのぼる演出。
// 「あなたの言葉をAIが読んでいる」ことを伝える機能的な表現に留める。
const WORD_COLORS = ['text-stone-400', 'text-brand-300', 'text-orange-300'];

const FloatingWord: React.FC<{ word: string; index: number }> = ({ word, index }) => {
  const style = useMemo(() => {
    const top = Math.random() * 80 + 10;
    const left = Math.random() * 80 + 10;
    const size = Math.random() * 0.6 + 0.8; // 0.8rem 〜 1.4rem
    const delay = Math.random() * 5;
    const duration = 10 + Math.random() * 10;
    return {
      top: `${top}%`,
      left: `${left}%`,
      fontSize: `${size}rem`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    };
  }, []);

  return (
    <div
      className={`absolute pointer-events-none select-none opacity-0 animate-float-fade font-medium ${WORD_COLORS[index % WORD_COLORS.length]}`}
      style={style}
    >
      {word}
    </div>
  );
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, title = "考えています…", sourceWords = [] }) => {
  const displayWords = useMemo(() => {
    if (!sourceWords.length) return [];
    const unique = Array.from(new Set(sourceWords));
    return unique.sort(() => 0.5 - Math.random()).slice(0, 14);
  }, [sourceWords]);

  return createPortal(
    <div className="fixed inset-0 bg-stone-50/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        {displayWords.map((word, idx) => (
          <FloatingWord key={`${word}-${idx}`} word={word} index={idx} />
        ))}
      </div>

      <div
        role="status"
        className="relative z-10 bg-white rounded-3xl px-10 py-12 max-w-sm w-full shadow-card-hover border border-stone-200/60 text-center space-y-7 animate-in fade-in zoom-in-95 duration-500"
      >
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 border-[3px] border-stone-100 rounded-full"></div>
          <div className="absolute inset-0 border-[3px] border-transparent border-t-brand-500 border-r-orange-400 rounded-full animate-spin"></div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-stone-900 tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-stone-500 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
