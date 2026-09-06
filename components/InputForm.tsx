import React, { useState } from 'react';
import { UserInput } from '../types';

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  initialText?: string;
  // 既存のアイデアがある状態でプロフィール編集に来た場合の表示切り替え
  hasIdeas?: boolean;
  onBackToIdeas?: () => void;
}

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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">あなたの好き・得意・経験を教えてください</h2>
        </div>
        {hasIdeas && onBackToIdeas && (
          <button type="button" onClick={onBackToIdeas} className="btn-secondary px-4 py-2 text-xs shrink-0">
            ← アイデア一覧へ
          </button>
        )}
      </div>

      <p className="text-sm text-stone-500 leading-relaxed mb-5">
        いちばんかんたんなのは、<span className="font-semibold text-stone-700">リベシティのプロフィールをそのままコピペ</span>。もっと掘り下げたい人は「スキルの種シート」の内容でもOKです。
      </p>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-5">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="field w-full flex-grow min-h-[200px] md:min-h-[260px] p-5 md:p-6 text-stone-800 text-base leading-relaxed resize-none"
          placeholder={"ここに貼り付け、または自由に入力してください。\n・好きなこと、得意なこと\n・これまでの仕事や人生の経験\n\nプロフィールの文章をまるごと貼り付けてもOKです。"}
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
