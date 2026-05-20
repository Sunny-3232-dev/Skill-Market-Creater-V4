
import React, { useState } from 'react';
import { UserInput } from '../types';
import { PenIcon } from './icons';

interface GuideStepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive?: boolean;
}

// Define the missing interface for InputForm props
interface InputFormProps {
  onSubmit: (input: UserInput) => void;
}

const GuideStep: React.FC<GuideStepProps> = ({ number, icon, title, description, isActive }) => (
  <div className={`flex-1 relative p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-500 ${
    isActive 
      ? 'bg-white shadow-xl shadow-rose-100/50 border border-rose-100 ring-2 ring-rose-50/50 z-10' 
      : 'bg-stone-100/60 border border-stone-200/60 opacity-80 md:opacity-100'
  }`}>
    <div className="flex items-center md:items-start gap-3 md:gap-4">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl shrink-0 shadow-sm transition-colors ${
        isActive ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white' : 'bg-white text-stone-600 border border-stone-200'
      }`}>
        {isActive ? icon : number}
      </div>
      <div className="overflow-hidden">
        <h4 className={`font-bold text-xs md:text-sm mb-0.5 md:mb-1 transition-colors truncate ${isActive ? 'text-stone-800' : 'text-stone-700'}`}>{title}</h4>
        <p className={`text-[10px] md:text-[11px] leading-tight md:leading-relaxed font-medium transition-colors ${isActive ? 'text-stone-400' : 'text-stone-500'}`}>
          {description}
        </p>
      </div>
    </div>
    {isActive && (
      <div className="absolute top-2 right-2 md:top-3 md:right-3">
        <span className="flex h-1.5 w-1.5 md:h-2 md:w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-rose-500"></span>
        </span>
      </div>
    )}
  </div>
);

const InputForm: React.FC<InputFormProps> = ({ onSubmit }) => {
  const [rawText, setRawText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      alert("情報を入力してください。");
      return;
    }
    onSubmit({ rawText });
  };

  return (
    <div className="p-6 md:p-10 lg:p-12 h-full flex flex-col">
      {/* Usage Guide Roadmap - Optimized for vertical space */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-6 md:mb-8 relative">
        <GuideStep 
          number={1} 
          icon={<div className="scale-75"><PenIcon /></div>} 
          title="「想い」を書き出す" 
          description="箇条書きやメモでOK。AIが強みを見つけます。" 
          isActive={true}
        />
        <div className="hidden md:flex items-center text-stone-300">
          <span className="text-xl font-bold">→</span>
        </div>
        <GuideStep 
          number={2} 
          icon="💡" 
          title="20の案から選ぶ" 
          description="王道からニッチまで、あなただけの案を提案。" 
        />
        <div className="hidden md:flex items-center text-stone-300">
          <span className="text-xl font-bold">→</span>
        </div>
        <GuideStep 
          number={3} 
          icon="✨" 
          title="出品セットが完成" 
          description="文章と画像が一瞬で出来上がります。" 
        />
      </div>

      <div className="mb-4 md:mb-6">
        <span className="text-rose-500 font-bold tracking-wider text-[10px] md:text-xs uppercase mb-1 block">Step 1</span>
        <h2 className="text-xl md:text-3xl font-bold text-stone-800 tracking-tight leading-tight">あなたの好き・得意・経験を教えてください</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-4 md:space-y-6">
        <div className="relative flex-grow">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-full min-h-[180px] md:min-h-[250px] p-5 md:p-8 bg-white border border-stone-100 rounded-[1.5rem] md:rounded-[2rem] shadow-soft text-stone-700 placeholder:text-stone-300 text-base md:text-lg leading-relaxed resize-none outline-none focus:border-rose-200 focus:ring-2 focus:ring-rose-100 transition-all"
            placeholder="ここに自由に書き込んでください。
・好きなこと、得意なこと
・これまでの仕事や人生の経験

箇条書きやメモのコピーでも構いません。AIが魅力的なサービス案に変換します。"
          />
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-400 via-rose-500 to-purple-600 hover:from-orange-500 hover:via-rose-600 hover:to-purple-700 text-white font-bold text-base md:text-lg py-4 md:py-5 px-8 rounded-xl md:rounded-2xl transition-all duration-300 ease-smooth shadow-xl shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-3 group overflow-hidden relative"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-xl md:rounded-t-2xl"></span>
            <span className="relative z-10">アイデアを生成する</span>
            <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300 ease-smooth">→</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-smooth rounded-2xl"></div>
          </button>
          
        </div>
      </form>
    </div>
  );
};

export default InputForm;
