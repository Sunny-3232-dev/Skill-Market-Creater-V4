import React, { useMemo, useState } from 'react';
import { SkillIdea } from '../types';
import { PinIcon } from './icons';

interface IdeaListProps {
  ideas: SkillIdea[];
  onSelect: (idea: SkillIdea) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  onBack: (e?: React.MouseEvent) => void;
}

// ピン留めしたアイデアを各セクション内で先頭に寄せる
const sortPinnedFirst = (items: SkillIdea[]): SkillIdea[] =>
  [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

const IdeaList: React.FC<IdeaListProps> = ({ ideas, onSelect, onDelete, onTogglePin, onBack }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const pinnedCount = useMemo(() => ideas.filter(i => i.pinned).length, [ideas]);

  if (ideas.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
        <h3 className="text-xl font-bold text-stone-900 mb-3">アイデアが見つかりませんでした</h3>
        <p className="text-stone-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          入力情報からうまく生成できませんでした。<br/>
          もう少し詳しく、または別の角度から入力してみてください。
        </p>
        <button
          type="button"
          onClick={(e) => onBack(e)}
          className="btn-dark text-sm py-3 px-8"
        >
          ← 入力画面に戻る
        </button>
      </div>
    );
  }

  const visibleIdeas = pinnedOnly ? ideas.filter(i => i.pinned) : ideas;
  const standardIdeas = sortPinnedFirst(visibleIdeas.filter(i => i.type === 'standard'));
  const nicheIdeas = sortPinnedFirst(visibleIdeas.filter(i => i.type === 'niche'));

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteCandidate === id) {
      setDeleteCandidate(null);
      onDelete(e, id);
    } else {
      setDeleteCandidate(id);
      setTimeout(() => setDeleteCandidate(prev => (prev === id ? null : prev)), 3000);
    }
  };

  const renderSection = (title: string, badge: string, description: string, items: SkillIdea[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-14 last:mb-0">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">{title}</h3>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-400 border border-stone-200 rounded-full px-2.5 py-0.5">{badge}</span>
          </div>
          <p className="text-stone-500 text-sm">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((idea) => {
            const isGenerated = !!idea.generatedContent;
            const isDeleting = deleteCandidate === idea.id;
            return (
              <div
                key={idea.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(idea)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(idea); }}
                className={`card-hoverable cursor-pointer text-left p-6 group flex flex-col h-full relative ${
                  idea.pinned ? 'border-brand-200 ring-1 ring-brand-100' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  {isGenerated ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      作成済み
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-stone-400">未作成</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(e, idea.id); }}
                      className={`p-1.5 rounded-lg transition-all ${
                        idea.pinned
                          ? 'text-brand-500 hover:text-brand-600 hover:bg-brand-50 opacity-100'
                          : 'text-stone-300 hover:text-brand-500 hover:bg-brand-50 opacity-0 group-hover:opacity-100'
                      }`}
                      title={idea.pinned ? 'ピン留めを外す' : 'ピン留めする'}
                      aria-pressed={!!idea.pinned}
                    >
                      <PinIcon filled={idea.pinned} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, idea.id)}
                      className={`text-[11px] font-semibold rounded-full transition-all ${
                        isDeleting
                          ? 'px-3 py-1 bg-brand-500 text-white'
                          : 'p-1.5 text-stone-300 hover:text-brand-500 hover:bg-brand-50 opacity-0 group-hover:opacity-100'
                      }`}
                      title="削除"
                    >
                      {isDeleting ? 'もう一度押すと削除' : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      )}
                    </button>
                    {!isGenerated && !isDeleting && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-semibold text-brand-500 ml-1">
                        作成する →
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-bold text-stone-900 mb-4 leading-snug">
                  {idea.title}
                </h4>

                <div className="mb-3 px-4 py-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] font-semibold text-stone-400 block mb-1 uppercase tracking-wider">強み</span>
                  <p className="text-sm text-stone-600 leading-relaxed">{idea.strength}</p>
                </div>

                <p className="text-sm text-stone-500 leading-relaxed flex-grow">
                  <span className="font-semibold text-stone-600 mr-1">解決する悩み:</span>{idea.solution}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 lg:p-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-10 pb-8 border-b border-stone-100">
        <div>
          <span className="eyebrow mb-1 block">Step 2</span>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">気になるアイデアを選択</h2>
          <p className="text-stone-500 mt-1.5 text-sm">
            あなたにぴったりの <span className="text-stone-900 font-bold">{ideas.length}</span> 件のアイデアが見つかりました
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-xs text-stone-500">データを消去しますか？</span>
              <button
                type="button"
                onClick={(e) => { setShowResetConfirm(false); onBack(e); }}
                className="btn-dark py-2 px-4 text-xs"
              >
                はい
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn-quiet py-2 px-4 text-xs"
              >
                いいえ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="btn-secondary py-2.5 px-5 text-xs"
            >
              最初からやり直す
            </button>
          )}
        </div>
      </div>

      {pinnedCount > 0 && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setPinnedOnly(!pinnedOnly)}
            aria-pressed={pinnedOnly}
            className={`inline-flex items-center gap-1.5 px-4 py-2 ${pinnedOnly ? 'chip-active' : 'chip'}`}
          >
            <PinIcon filled={pinnedOnly} />
            ピン留めのみ表示（{pinnedCount}）
          </button>
        </div>
      )}

      {pinnedOnly && standardIdeas.length === 0 && nicheIdeas.length === 0 && (
        <p className="text-stone-400 text-sm py-12 text-center">ピン留めされたアイデアはありません。</p>
      )}

      {renderSection(
        "王道アイデア",
        "Standard",
        "みんなが求めていて、安心して選べる手堅い案",
        standardIdeas
      )}

      {renderSection(
        "ニッチ・ユニーク",
        "Niche",
        "ライバルが少なく、あなただから選ばれる個性派の案",
        nicheIdeas
      )}
    </div>
  );
};

export default IdeaList;
