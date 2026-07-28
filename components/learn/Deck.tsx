import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 作業画面に置く「読み物スライド」ビューア。
 * 文字サイズはコンテナ幅（cqw）基準なので、埋め込み表示でも全画面でも同じ見え方になる。
 * スライドの中身は deckSlides.ts 側で定義する。
 */

export interface DeckSlide {
  cover?: boolean;
  html: string;
}

interface DeckProps {
  slides: DeckSlide[];
  title: string;
  description: string;
  /** 初期状態で開いておくか（既定は閉じる。作業画面の邪魔をしないため） */
  defaultOpen?: boolean;
}

const DECK_CSS = `
.deck-stage {
  /* 文字サイズの基準は「スライド自身の幅」。全画面で高さに合わせて縮めても比率が崩れない */
  container-type: inline-size;
  position: relative;
  aspect-ratio: 16 / 9;
  background: #fafaf9;
  background-image:
    radial-gradient(at 88% 4%, hsla(22,100%,72%,.13) 0, hsla(22,100%,72%,0) 46%),
    radial-gradient(at 4% 96%, hsla(339,100%,60%,.10) 0, hsla(339,100%,60%,0) 46%);
  color: #292524;
  overflow: hidden;
}
.deck-inner {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center;
  padding: 6cqw 6cqw 7.5cqw;
}
@keyframes deckRise { from { opacity: 0; transform: translateY(1.2cqw); } to { opacity: 1; transform: none; } }
.deck-inner > * { animation: deckRise .42s cubic-bezier(.2,.7,.3,1) both; }
.deck-inner > *:nth-child(2) { animation-delay: .07s; }
.deck-inner > *:nth-child(3) { animation-delay: .14s; }
.deck-inner > *:nth-child(4) { animation-delay: .21s; }
@media (prefers-reduced-motion: reduce) { .deck-inner > * { animation: none; } }

.deck-stage .d-label { font-size: 1.75cqw; font-weight: 700; letter-spacing: .12em; color: #e11d48; margin-bottom: 1.6cqw; }
.deck-stage .d-label-mute { color: #6b6560; }
.deck-stage .d-h1 { font-size: 7.2cqw; font-weight: 700; line-height: 1.22; letter-spacing: -.02em; }
.deck-stage .d-h2 { font-size: 5.2cqw; font-weight: 700; line-height: 1.32; letter-spacing: -.01em; }
.deck-stage .d-meta { margin-top: 3cqw; font-size: 2.05cqw; color: #6b6560; line-height: 1.85; }
.deck-stage .d-lead { margin-top: 1.8cqw; font-size: 2.45cqw; color: #6b6560; line-height: 1.75; }
.deck-stage .d-note { margin-top: 2.2cqw; font-size: 2cqw; color: #6b6560; line-height: 1.75; }
.deck-stage .d-note b, .deck-stage .d-lead b { color: #292524; font-weight: 700; }
.deck-stage .d-hl { background: linear-gradient(transparent 60%, rgba(225,29,72,.17) 60%); padding: 0 .06em; }

.deck-stage .d-ul, .deck-stage .d-ol { list-style: none; margin-top: 2.6cqw; padding: 0; }
.deck-stage .d-ul li {
  font-size: 2.7cqw; line-height: 1.55; padding: 1.1cqw 0 1.1cqw 1.3em;
  position: relative; border-bottom: 1px solid #e7e5e4; font-weight: 500;
}
.deck-stage .d-ul li:last-child { border-bottom: none; }
.deck-stage .d-ul li::before { content: "—"; position: absolute; left: 0; color: #e7e5e4; }
.deck-stage .d-ol { counter-reset: dstep; }
.deck-stage .d-ol li {
  font-size: 2.6cqw; line-height: 1.55; padding: 1.1cqw 0 1.1cqw 2.1em;
  position: relative; border-bottom: 1px solid #e7e5e4; font-weight: 500;
}
.deck-stage .d-ol li:last-child { border-bottom: none; }
.deck-stage .d-ol li::before {
  counter-increment: dstep; content: counter(dstep);
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  font-size: .68em; font-weight: 700; color: #e11d48; background: #fff1f2;
  width: 1.9em; height: 1.9em; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
}
.deck-stage .d-ul b, .deck-stage .d-ol b { font-weight: 700; }

.deck-stage .d-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(24cqw, 1fr)); gap: 1.8cqw; margin-top: 2.8cqw; }
.deck-stage .d-card { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.4cqw; padding: 2.4cqw; }
.deck-stage .d-card .d-num { font-size: 1.55cqw; font-weight: 700; letter-spacing: .12em; color: #e11d48; margin-bottom: .7em; }
.deck-stage .d-card h3 { font-size: 2.8cqw; font-weight: 700; line-height: 1.35; margin: 0 0 .45em; }
.deck-stage .d-card p { font-size: 1.9cqw; color: #6b6560; line-height: 1.65; margin: 0; }

.deck-stage .d-goal { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.2cqw; margin-top: 3.2cqw; }
.deck-stage .d-goal > div { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.6cqw; padding: 2.6cqw; text-align: center; }
.deck-stage .d-goal .d-n { font-size: 6.8cqw; font-weight: 700; color: #e11d48; line-height: 1; letter-spacing: -.03em; }
.deck-stage .d-goal .d-n small { font-size: .38em; margin-left: .12em; }
.deck-stage .d-goal .d-t { margin-top: .6em; font-size: 2.2cqw; font-weight: 700; }
.deck-stage .d-goal .d-s { margin-top: .35em; font-size: 1.75cqw; color: #6b6560; }

.deck-stage .d-slim { display: grid; grid-template-columns: repeat(2, 1fr); gap: .6cqw 4cqw; margin-top: 2.6cqw; }
.deck-stage .d-slim > div {
  display: flex; align-items: baseline; gap: .7em;
  font-size: 2.5cqw; line-height: 1.45; padding: 1cqw 0;
  border-bottom: 1px solid #e7e5e4; font-weight: 700;
}
.deck-stage .d-slim span { font-size: .6em; color: #e11d48; letter-spacing: .06em; flex-shrink: 0; }
.deck-stage .d-slim em { font-style: normal; font-weight: 400; color: #6b6560; font-size: .7em; }

.deck-stage .d-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2cqw; margin-top: 2.8cqw; font-size: 2.2cqw; font-weight: 700; }
.deck-stage .d-flow span { background: #fff; border: 1px solid #e7e5e4; border-radius: 999px; padding: .5em 1.1em; }
.deck-stage .d-flow i { color: #e7e5e4; font-style: normal; }

.deck-stage .d-split { display: grid; grid-template-columns: 1fr 1fr; gap: 3cqw; align-items: start; margin-top: 2.6cqw; }
.deck-stage .d-steps { list-style: none; padding: 0; margin: 0; }
.deck-stage .d-steps li { display: flex; gap: .6em; align-items: baseline; padding: .8cqw 0; font-size: 2.35cqw; font-weight: 700; }
.deck-stage .d-steps li b { color: #e11d48; font-size: .72em; min-width: 5.2em; display: inline-block; }
.deck-stage .d-steps li i { font-style: normal; font-weight: 400; color: #6b6560; font-size: .78em; }
.deck-stage .d-tweet { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.6cqw; padding: 2.4cqw; font-size: 2.05cqw; line-height: 1.9; }
.deck-stage .d-tweet span { display: block; margin-bottom: .45em; }
.deck-stage .d-tweet .d-url { color: #6b6560; font-size: .85em; margin: .3em 0 0; }

.deck-stage .d-chat { display: flex; flex-direction: column; gap: 1.2cqw; }
.deck-stage .d-chat span { background: #fff; border: 1px solid #e7e5e4; border-radius: 999px; padding: .6em 1.2em; font-size: 2.05cqw; font-weight: 700; }
.deck-stage .d-after { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.6cqw; padding: 2.4cqw; font-size: 2.05cqw; line-height: 1.85; }
.deck-stage .d-after b { color: #e11d48; }

.deck-stage .d-fig { margin-top: 2.8cqw; }
.deck-stage .d-fig svg { width: 100%; height: auto; display: block; }

.deck-bar { position: absolute; left: 0; bottom: 0; height: .35cqw; background: #e11d48; transition: width .25s ease; }
.deck-pager { position: absolute; right: 2.4cqw; bottom: 2.2cqw; font-size: 1.35cqw; color: #6b6560; letter-spacing: .1em; }

/* 全画面：画面より横長のモニター(ウルトラワイド等)でも縦が見切れないよう、高さに合わせて中央に置く */
.deck-view:fullscreen { display: flex; align-items: center; justify-content: center; background: #fafaf9; }
.deck-view:fullscreen .deck-stage { width: min(100vw, calc(100vh * 16 / 9)); height: auto; }
.deck-view:-webkit-full-screen { display: flex; align-items: center; justify-content: center; background: #fafaf9; }
.deck-view:-webkit-full-screen .deck-stage { width: min(100vw, calc(100vh * 16 / 9)); height: auto; }
`;

let cssInjected = 0;

const Deck: React.FC<DeckProps> = ({ slides, title, description, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [index, setIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 連打しても取りこぼさないよう、直前の値からの相対移動で更新する
  const step = useCallback((delta: number) => {
    setIndex(prev => Math.max(0, Math.min(slides.length - 1, prev + delta)));
  }, [slides.length]);

  // 資料にフォーカスがあるときだけ矢印キーで送る（ページ全体のスクロールは奪わない）
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  // 複数のDeckが同時に載っても<style>は1つだけにする
  useEffect(() => {
    if (cssInjected === 0) {
      const style = document.createElement('style');
      style.id = 'deck-css';
      style.textContent = DECK_CSS;
      document.head.appendChild(style);
    }
    cssInjected += 1;
    return () => {
      cssInjected -= 1;
      if (cssInjected === 0) document.getElementById('deck-css')?.remove();
    };
  }, []);

  const slide = slides[index];

  return (
    <section className="card p-4 md:p-5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 text-left group"
        aria-expanded={open}
      >
        <span className="shrink-0 w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
          </svg>
        </span>
        <span className="min-w-0 flex-grow">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-stone-900">{title}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">全{slides.length}枚</span>
          </span>
          <span className="block text-xs text-stone-500 mt-1 leading-relaxed">{description}</span>
        </span>
        <span className="shrink-0 text-xs font-bold text-stone-400 group-hover:text-stone-600 transition-colors whitespace-nowrap mt-1">
          {open ? '閉じる ▲' : '資料を見る ▼'}
        </span>
      </button>

      {open && (
        <>
          <div
            ref={wrapRef}
            className="deck-view mt-4 rounded-2xl border border-stone-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-200"
            tabIndex={0}
            onKeyDown={onKeyDown}
            role="group"
            aria-label={title}
          >
            <div className="deck-stage">
              <div
                key={index}
                className="deck-inner"
                dangerouslySetInnerHTML={{ __html: slide.html }}
              />
              <div className="deck-bar" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
              <div className="deck-pager">{index + 1} / {slides.length}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={index === 0}
                className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← 前へ
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={index === slides.length - 1}
                className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                次へ →
              </button>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              ⛶ 大きく見る
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default Deck;
