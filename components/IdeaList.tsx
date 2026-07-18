import React, { useMemo, useState } from 'react';
import { SkillIdea } from '../types';
import { PinIcon, SparkleIcon } from './icons';

interface IdeaListProps {
  ideas: SkillIdea[];
  keywords?: string[];
  onSelect: (idea: SkillIdea) => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  onRegenerate: (instruction: string) => void;
  onEditProfile: () => void;
  onBack: (e?: React.MouseEvent) => void;
}

// 再生成バーで使える指示のテンプレ（初心者・オンライン前提に合うものだけ）
const REGEN_SUGGESTIONS = [
  '副業として始めやすいもの',
  '初心者でも今日から出せるもの',
  'スキマ時間でできるもの',
  '顔出しなしでできるもの',
  '続けて頼まれやすいもの',
];

// ピン留めしたアイデアを各セクション内で先頭に寄せる
const sortPinnedFirst = (items: SkillIdea[]): SkillIdea[] =>
  [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

const PinButton: React.FC<{ pinned?: boolean; onClick: (e: React.MouseEvent) => void }> = ({ pinned, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={!!pinned}
    title={pinned ? 'ピン留めを外す' : 'ピン留めする'}
    className={`inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold transition-colors px-3 py-1.5 ${
      pinned
        ? 'bg-brand-500 text-white hover:bg-brand-600'
        : 'bg-white text-stone-400 border border-stone-200 hover:border-brand-300 hover:text-brand-600'
    }`}
  >
    <PinIcon filled={pinned} />
    {pinned ? 'ピン留め中' : 'ピン留め'}
  </button>
);

const IdeaList: React.FC<IdeaListProps> = ({ ideas, keywords = [], onSelect, onTogglePin, onRegenerate, onEditProfile, onBack }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');

  const pinnedCount = useMemo(() => ideas.filter(i => i.pinned).length, [ideas]);

  const handleRegenerate = () => {
    onRegenerate(regenInstruction);
    setRegenInstruction('');
  };

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
            return (
              <div
                key={idea.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(idea)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(idea); }}
                className={`card-hoverable cursor-pointer text-left p-6 group flex flex-col h-full relative overflow-hidden ${
                  idea.pinned ? 'border-brand-300 ring-1 ring-brand-100 bg-brand-50/20' : ''
                }`}
              >
                {idea.pinned && <span className="absolute top-0 left-0 w-1 h-full bg-brand-400"></span>}
                <div className="flex justify-between items-center mb-3 gap-2">
                  {isGenerated ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      作成済み
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-stone-400">未作成</span>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    <PinButton pinned={idea.pinned} onClick={(e) => onTogglePin(e, idea.id)} />
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

                <div className="mt-4 flex justify-end">
                  <span className="text-xs font-semibold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isGenerated ? '内容を見る →' : '出品ページを作成 →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 lg:p-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
        <div>
          <span className="eyebrow mb-1 block">Step 2</span>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">気になるアイデアを選択</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={onEditProfile} className="btn-secondary py-2.5 px-4 text-xs">
            プロフィールを修正
          </button>
          {showResetConfirm ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-xs text-stone-500">全部消しますか？</span>
              <button
                type="button"
                onClick={(e) => { setShowResetConfirm(false); onBack(e); }}
                className="btn-dark py-2.5 px-4 text-xs"
              >
                はい
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn-quiet py-2.5 px-4 text-xs"
              >
                いいえ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="btn-secondary py-2.5 px-4 text-xs"
            >
              最初から
            </button>
          )}
        </div>
      </div>

      {/* AIで作り直すバー */}
      <div className="mb-8 rounded-2xl border border-brand-100 p-5" style={{ backgroundImage: 'var(--gradient-brand-soft)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <SparkleIcon />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">AIでアイデアを作り直す</h3>
            <p className="text-[11px] text-stone-500">ピン留めした案は残したまま、それ以外を作り直します。</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRegenerate(); } }}
            placeholder="例: 副業として始めやすいもの（空欄でもOK）"
            aria-label="作り直しの指示"
            className="field flex-grow px-4 py-2.5 text-sm rounded-full bg-white"
          />
          <button type="button" onClick={handleRegenerate} className="btn-primary px-6 py-2.5 text-xs shrink-0">
            作り直す
          </button>
        </div>

        {/* あなたの自己紹介から抽出した特徴キーワード */}
        {keywords.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-stone-500 mb-1.5">あなたのキーワードで絞る</p>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setRegenInstruction(`「${kw}」を活かせるもの`)}
                  className="chip px-3 py-1.5 bg-white"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <p className="text-[11px] font-semibold text-stone-500 mb-1.5">こんな方向で</p>
          <div className="flex flex-wrap gap-1.5">
            {REGEN_SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRegenInstruction(s)}
                className="chip px-3 py-1.5 bg-white/70"
              >
                {s}
              </button>
            ))}
          </div>
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

      {/* 一覧の一番下：ピン留め／作り直しの案内 */}
      <p className="text-stone-500 text-sm text-center mt-10 pt-6 border-t border-stone-100">
        ぴったりの案が見つかったら、<span className="text-brand-600 font-semibold">ピン留め</span>して残せます。残りはAIで何度でも作り直せます。
      </p>
    </div>
  );
};

export default IdeaList;
