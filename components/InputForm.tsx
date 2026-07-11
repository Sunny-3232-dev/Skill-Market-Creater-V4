import React, { useState } from 'react';
import { UserInput } from '../types';

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  initialText?: string;
  // 既存のアイデアがある状態でプロフィール編集に来た場合の表示切り替え
  hasIdeas?: boolean;
  onBackToIdeas?: () => void;
}

const GuideStep: React.FC<{
  number: number;
  title: string;
  description: string;
  isActive?: boolean;
}> = ({ number, title, description, isActive }) => (
  <div className={`flex-1 p-4 rounded-2xl border transition-colors ${
    isActive ? 'bg-white border-brand-200 shadow-soft' : 'bg-stone-50 border-stone-200/60'
  }`}>
    <div className="flex items-start gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isActive ? 'text-white' : 'bg-white text-stone-400 border border-stone-200'
        }`}
        style={isActive ? { backgroundImage: 'var(--gradient-brand)' } : undefined}
      >
        {number}
      </div>
      <div className="min-w-0">
        <h4 className={`font-semibold text-sm mb-0.5 ${isActive ? 'text-stone-900' : 'text-stone-500'}`}>{title}</h4>
        <p className="text-xs leading-relaxed text-stone-400">{description}</p>
      </div>
    </div>
  </div>
);

const InputForm: React.FC<InputFormProps> = ({ onSubmit, initialText = '', hasIdeas = false, onBackToIdeas }) => {
  const [rawText, setRawText] = useState(initialText);
  const canSubmit = rawText.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ rawText });
  };

  return (
    <div className="p-6 md:p-10 lg:p-12 h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-8">
        <GuideStep number={1} title="「想い」を書き出す" description="箇条書きやメモでOK。AIが強みを見つけます。" isActive />
        <GuideStep number={2} title="20の案から選ぶ" description="王道からニッチまで、あなただけの案を提案。" />
        <GuideStep number={3} title="出品セットが完成" description="文章と画像プロンプトが出来上がります。" />
      </div>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow mb-1 block">Step 1</span>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">あなたの好き・得意・経験を教えてください</h2>
        </div>
        {hasIdeas && onBackToIdeas && (
          <button type="button" onClick={onBackToIdeas} className="btn-secondary px-4 py-2 text-xs shrink-0">
            ← アイデア一覧へ
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-5">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="field w-full flex-grow min-h-[200px] md:min-h-[260px] p-5 md:p-6 text-stone-800 text-base leading-relaxed resize-none"
          placeholder={"ここに自由に書き込んでください。\n・好きなこと、得意なこと\n・これまでの仕事や人生の経験\n\n箇条書きやメモのコピーでも構いません。AIが魅力的なサービス案に変換します。"}
        />

        {hasIdeas && (
          <p className="text-xs text-stone-400 -mt-1">
            プロフィールを書き換えて生成すると、ピン留めしたアイデアは残したまま、それ以外を作り直します。
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full text-base py-4 px-8"
        >
          {hasIdeas ? 'このプロフィールで作り直す' : 'アイデアを生成する'}
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
};

export default InputForm;
