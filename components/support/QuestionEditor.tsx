import React, { useState } from 'react';
import { SurveyPattern, SurveyQuestionDef } from '../../types';

interface QuestionEditorProps {
  pattern: SurveyPattern;
  onUpdate: (questions: SurveyQuestionDef[]) => void;
  onReset: () => void;
  isDirty: boolean;
}

/**
 * 選択中のアンケートパターンの設問を微調整するエディタ。
 * 文言修正・必須/任意の切替・並べ替え・削除ができる。
 * 変更は即座に下のGASコードへ反映される。
 */
const QuestionEditor: React.FC<QuestionEditorProps> = ({ pattern, onUpdate, onReset, isDirty }) => {
  const [open, setOpen] = useState(false);
  const qs = pattern.questions;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    const next = [...qs];
    [next[i], next[j]] = [next[j], next[i]];
    onUpdate(next);
  };

  const edit = (i: number, patch: Partial<SurveyQuestionDef>) => {
    const next = qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q));
    onUpdate(next);
  };

  const remove = (i: number) => {
    onUpdate(qs.filter((_, idx) => idx !== i));
  };

  const iconBtn = "w-7 h-7 rounded-full flex items-center justify-center text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="card p-5 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-brand-600 transition-colors"
        >
          <span className={`text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
          設問を調整する
          <span className="text-xs font-normal text-stone-400">（文言修正・並べ替え・削除）</span>
        </button>
        {isDirty && (
          <button onClick={onReset} className="btn-quiet px-3 py-1.5 text-xs">
            生成時の内容に戻す
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {qs.map((q, i) => (
            <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2">
              <span className="text-[11px] font-semibold text-stone-400 w-5 shrink-0 text-right">{i + 1}</span>
              <input
                value={q.title}
                onChange={(e) => edit(i, { title: e.target.value })}
                aria-label={`設問 ${i + 1} の文言`}
                className="flex-grow bg-transparent border-0 outline-none text-sm text-stone-700 min-w-0 focus:bg-white rounded-lg px-2 py-1 transition-colors"
              />
              <span className="hidden sm:inline text-[10px] text-stone-400 shrink-0 w-16 text-center">{q.type}</span>
              <button
                onClick={() => edit(i, { required: !q.required })}
                className={`shrink-0 px-2.5 py-1 ${q.required ? 'chip-active' : 'chip'} text-[10px]`}
                title="必須/任意を切り替え"
              >
                {q.required ? '必須' : '任意'}
              </button>
              <button onClick={() => move(i, -1)} disabled={i === 0} className={iconBtn} aria-label="上へ">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === qs.length - 1} className={iconBtn} aria-label="下へ">↓</button>
              <button onClick={() => remove(i)} className={iconBtn} aria-label="削除" title="削除">✕</button>
            </div>
          ))}
          <p className="text-[11px] text-stone-400 pt-1">変更は下のGASコードにすぐ反映され、自動保存されます。選択肢（options）の編集には対応していません。</p>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
