import React from 'react';
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

const SUGGESTIONS = [
  'もっと親しみやすい文体にして',
  'キャッチコピーをもっと短く',
  '専門用語を減らして初心者向けに',
];

/**
 * Step 3（出品用テキスト完成画面）に埋め込む、AIへの編集チャット。
 * 送信するたびに出品ページ本文全体をAIが書き換え、下のプレビュー（各コピーカード）に反映する。
 * 反映内容は「変更を保存」を押すまでは下書き扱いで、押すとCreatorのアイデア一覧にも保存される。
 */
const ServiceChatEditor: React.FC<ServiceChatEditorProps> = ({
  messages, input, onInputChange, onSend, isLoading, error,
  isDirty, justSaved, onSave, onDiscard,
}) => {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <SparkleIcon />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">AIに編集を依頼</h4>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              「もっとカジュアルな文体に」など自由な言葉で伝えると、下のプレビュー全体を書き換えます。
            </p>
          </div>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onDiscard} className="btn-quiet px-3 py-1.5 text-xs">元に戻す</button>
            <button onClick={onSave} className="btn-primary px-4 py-1.5 text-xs">
              {justSaved ? '保存しました' : '変更を保存'}
            </button>
          </div>
        )}
      </div>

      {messages.length === 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onInputChange(s)}
              className="chip px-3 py-1.5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
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
        </div>
      )}

      {error && <p className="text-xs text-brand-600">{error}</p>}

      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="例: もっと親しみやすい文体にして"
          aria-label="AIへの編集指示"
          disabled={isLoading}
          className="field flex-grow px-4 py-2.5 text-sm"
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
  );
};

export default ServiceChatEditor;
