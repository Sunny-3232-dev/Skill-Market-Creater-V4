import React, { useEffect, useRef, useState } from 'react';
import { SparkleIcon } from './icons';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface ServiceChatEditorProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  justSaved: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

// ありがちな編集指示のテンプレ。クリックで入力欄に挿入される（自動送信はしない＝価格など微調整できる）
const TEMPLATE_GROUPS: Array<{ label: string; items: string[] }> = [
  {
    label: '文体・トーン',
    items: [
      'もっと親しみやすい文体にして',
      'もっと丁寧でプロフェッショナルな文体にして',
      '初心者にもわかる言葉に言い換えて',
      '絵文字を少し減らして落ち着いた印象にして',
    ],
  },
  {
    label: '内容の調整',
    items: [
      '全体をもう少し簡潔にして',
      'サービス詳細をもっと具体的にして',
      '実績・安心感が伝わる表現を強化して',
      '「こんな方におすすめ」の項目を増やして',
    ],
  },
  {
    label: '部分だけ変える',
    items: [
      'タイトルだけ別の案にして',
      'キャッチコピーを短くインパクトのある表現にして',
      '価格を8,000円に変更して',
      '依頼テンプレートの項目をもっと簡単にして',
    ],
  },
];

/**
 * Step 3（出品用テキスト完成画面）の画面下部に常駐するAI編集バー。
 * プレビューをスクロールしながらいつでも指示を出せる。
 * 「テンプレ」からありがちな指示を挿入、「履歴」で往復の記録を確認できる。
 */
const ServiceChatEditor: React.FC<ServiceChatEditorProps> = ({
  messages, input, onInputChange, onSend, isLoading, error,
  isDirty, justSaved, onSave, onDiscard,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false); // 履歴が自動で開いたか（自動なら応答後に自動で畳む）

  // 送信したら履歴パネルを開き、応答が返ったら数秒見せてから自動で畳む。
  // ユーザーが「履歴」ボタンで開いた場合は畳まない。
  useEffect(() => {
    if (isLoading) {
      setShowHistory(true);
      setShowTemplates(false);
      autoOpenedRef.current = true;
      return;
    }
    if (autoOpenedRef.current) {
      const timer = setTimeout(() => {
        setShowHistory(false);
        autoOpenedRef.current = false;
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // 履歴は常に最新までスクロール
  useEffect(() => {
    if (showHistory) historyEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isLoading, showHistory]);

  const pickTemplate = (t: string) => {
    onInputChange(t);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  const hasHistory = messages.length > 0;

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto relative">

        {/* テンプレのポップオーバー */}
        {showTemplates && (
          <div className="absolute bottom-full mb-2 inset-x-0 card shadow-card-hover p-4 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-[11px] text-stone-400 leading-relaxed">
              クリックすると入力欄に入ります。送信前に文言（価格など）を調整できます。
            </p>
            {TEMPLATE_GROUPS.map(g => (
              <div key={g.label}>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">{g.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map(t => (
                    <button key={t} type="button" onClick={() => pickTemplate(t)} className="chip px-3 py-1.5">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 履歴のポップオーバー */}
        {showHistory && !showTemplates && (hasHistory || isLoading) && (
          <div className="absolute bottom-full mb-2 inset-x-0 card shadow-card-hover p-4 max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-50 text-stone-600 border border-stone-100'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-2.5 text-xs text-stone-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"></span>
                  編集しています…
                </div>
              </div>
            )}
            <div ref={historyEndRef} />
          </div>
        )}

        {/* コマンドバー本体 */}
        <div className="card shadow-card-hover p-3">
          {error && <p className="text-xs text-brand-600 px-1 pb-2">{error}</p>}
          {isDirty && (
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <span className="text-[11px] font-semibold text-brand-600">未保存の変更があります</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onDiscard} className="btn-quiet px-3 py-1.5 text-xs">元に戻す</button>
                <button type="button" onClick={onSave} className="btn-primary px-4 py-1.5 text-xs">
                  {justSaved ? '保存しました' : '変更を保存'}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="shrink-0 flex items-center gap-2" title="AIに編集を依頼">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center" aria-hidden>
                <SparkleIcon />
              </div>
              <div className="hidden sm:block leading-tight pr-1">
                <p className="text-xs font-bold text-stone-900">AI編集</p>
                <p className="text-[10px] text-stone-400">文章で指示</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setShowTemplates(v => !v); setShowHistory(false); }}
              aria-pressed={showTemplates}
              className={`${showTemplates ? 'chip-active' : 'chip'} px-3 py-2 shrink-0`}
            >
              テンプレ
            </button>
            {hasHistory && (
              <button
                type="button"
                onClick={() => { setShowHistory(v => !v); setShowTemplates(false); autoOpenedRef.current = false; }}
                aria-pressed={showHistory}
                className={`${showHistory ? 'chip-active' : 'chip'} px-3 py-2 shrink-0`}
              >
                履歴
              </button>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); onSend(); }}
              className="flex-grow flex gap-2 min-w-[220px]"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="AIに編集を依頼（例: もっと親しみやすく／タイトルだけ変えて）"
                aria-label="AIへの編集指示"
                disabled={isLoading}
                className="field flex-grow px-4 py-2.5 text-sm rounded-full"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn-dark px-5 py-2.5 text-xs shrink-0"
              >
                送信
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceChatEditor;
