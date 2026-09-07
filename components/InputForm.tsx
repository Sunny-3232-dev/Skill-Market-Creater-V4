import React, { useState } from 'react';
import { UserInput } from '../types';
import Tour, { useTour } from './guide/Tour';

const INPUT_TOUR = [
  { sel: '[data-tour="input-text"]', title: 'まず、自己紹介をここに貼ります', text: '好きなこと・得意なこと・これまでの経験を。箇条書きでも、プロフィールの文章まるごとでも大丈夫です。長くて構いません。' },
  { sel: '[data-tour="input-decided"]', title: '出したいサービスが決まっているなら、ここを開く', text: '押すと欄が開きます。書くとアイデア出しを飛ばして、その案の出品文をすぐ作ります。開かなければ、自己紹介から20案を出します。' },
  { sel: '[data-tour="input-submit"]', title: '押すと、20のアイデアが出ます', text: '20〜40秒かかります。王道10案とニッチ10案が並び、この自己紹介にある事実だけを根拠にします。' },
  { sel: 'nav[aria-label="作成の進み"]', title: 'この3段で進みます', text: '入力 → 選ぶ → 仕上げ。仕上げの画面で出品文をコピーして、スキルマーケットに貼ります。' },
];

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  initialText?: string;
  // 既存のアイデアがある状態でプロフィール編集に来た場合の表示切り替え
  hasIdeas?: boolean;
  onBackToIdeas?: () => void;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, initialText = '', hasIdeas = false, onBackToIdeas }) => {
  const [rawText, setRawText] = useState(initialText);
  // 出したいサービスが決まっている人の案（任意）。あれば一覧を飛ばして出品文まで作る
  const [decidedIdea, setDecidedIdea] = useState('');
  // 欄は閉じておき、押した人にだけ開く。閉じるときは中身も消す（隠れたまま送られないように）
  const [showDecided, setShowDecided] = useState(false);
  const hasDecided = showDecided && decidedIdea.trim().length > 0;
  const canSubmit = rawText.trim().length > 0;
  // 案内はヘッダの「画面の案内（1分）」を押したときだけ開く
  const tour = useTour();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ rawText, decidedIdea: hasDecided ? decidedIdea.trim() : undefined });
  };

  return (
    <div className="p-6 md:p-10 lg:p-12 h-full flex flex-col">
      <Tour steps={INPUT_TOUR} open={tour.open} onClose={tour.close} />
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
          data-tour="input-text"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="field w-full flex-grow min-h-[200px] md:min-h-[260px] p-5 md:p-6 text-stone-800 text-base leading-relaxed resize-none"
          placeholder={"ここに貼り付け、または自由に入力してください。\n・好きなこと、得意なこと\n・これまでの仕事や人生の経験\n\nプロフィールの文章をまるごと貼り付けてもOKです。"}
        />

        {hasIdeas && !hasDecided && (
          <p className="text-xs text-stone-400 -mt-1">
            プロフィールを書き換えて生成すると、ピン留めしたアイデアは残したまま、それ以外を作り直します。
          </p>
        )}

        {/* 出したい案が決まっている人の近道。欄は閉じておき、押した人にだけ開く */}
        <div data-tour="input-decided">
          {!showDecided ? (
            <button
              type="button"
              onClick={() => setShowDecided(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-500 transition-colors"
            >
              <span aria-hidden>▸</span>
              出したいサービスが決まっている方はこちら
            </button>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start justify-between gap-3">
                <label htmlFor="decided-idea" className="block text-sm font-semibold text-stone-800">
                  出したいサービスを書いてください
                </label>
                <button
                  type="button"
                  onClick={() => { setShowDecided(false); setDecidedIdea(''); }}
                  className="shrink-0 text-xs text-stone-400 hover:text-brand-500 transition-colors"
                >
                  閉じる
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-1 mb-2 leading-relaxed">
                書くと、アイデア出しを飛ばして、この案の出品文をすぐ作ります。
              </p>
              <textarea
                id="decided-idea"
                value={decidedIdea}
                onChange={(e) => setDecidedIdea(e.target.value)}
                rows={2}
                autoFocus
                className="field w-full p-3 text-sm leading-relaxed resize-y bg-white"
                placeholder="例：ExcelのVLOOKUPとピボットを、実務の表で教える60分の個別レッスン"
              />
            </div>
          )}
        </div>

        <button data-tour="input-submit"
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full text-base py-4 px-8"
        >
          {hasDecided ? 'この案で出品文を作る' : hasIdeas ? 'このプロフィールで作り直す' : 'アイデアを生成する'}
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
};

export default InputForm;
