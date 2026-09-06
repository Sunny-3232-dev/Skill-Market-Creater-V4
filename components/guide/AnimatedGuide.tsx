import React, { useEffect, useRef, useState } from 'react';

export interface GuideStep {
  title: string;
  text: string;
}

interface AnimatedGuideProps {
  /** 1周の長さ(ms)。SVG 側の @keyframes の duration と一致させる */
  cycleMs: number;
  /** 各歩の終わり(ms)。歩の数 - 1 個 */
  edges: number[];
  steps: GuideStep[];
  /** SVG 本体。カーソル要素に data-guide-cursor を付けておくと、その経過時間で歩を同期する */
  children: React.ReactNode;
  caption?: string;
  className?: string;
}

// PJ090（oVice看板）の「動くマニュアル」の枠。
// 1枚の絵の中で全部起こし、下の歩の一覧をいま何歩目か光らせる。
// 動き自体は CSS の @keyframes（index.css）で、ここは同期と操作だけを持つ。
const AnimatedGuide: React.FC<AnimatedGuideProps> = ({ cycleMs, edges, steps, children, caption, className }) => {
  const figRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fig = figRef.current;
    if (!fig) return;
    const tick = () => {
      const cursor = fig.querySelector<SVGElement>('[data-guide-cursor]');
      const anim = cursor?.getAnimations?.()[0];
      if (!anim) return;
      const t = (Number(anim.currentTime) || 0) % cycleMs;
      setCurrent(edges.filter(e => t >= e).length);
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [cycleMs, edges]);

  const replay = () => {
    const fig = figRef.current;
    if (!fig) return;
    fig.querySelectorAll('*').forEach(el => (el as Element).getAnimations?.().forEach(a => { a.currentTime = 0; }));
    setPaused(false);
    setCurrent(0);
  };

  return (
    <figure ref={figRef} className={`animGuide ${paused ? 'paused' : ''} ${className ?? ''} rounded-2xl border border-stone-200/80 bg-white overflow-hidden m-0`}>
      {children}
      <div className="border-t border-stone-100 px-4 py-3 flex flex-wrap items-start gap-3">
        <ol className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 min-w-[16rem] list-none m-0 p-0">
          {steps.map((st, i) => {
            const active = i === current;
            return (
              <li
                key={st.title}
                aria-current={active ? 'step' : undefined}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors ${active ? 'bg-brand-50' : 'opacity-60'}`}
              >
                <span className={`shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${active ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600'}`}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-stone-900 leading-snug">{st.title}</span>
                  <span className="block text-[11px] text-stone-500 leading-snug">{st.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="flex gap-1.5 shrink-0">
          <button type="button" onClick={() => setPaused(p => !p)} className="btn-quiet px-3 py-1.5 text-[11px]">{paused ? '再生' : '一時停止'}</button>
          <button type="button" onClick={replay} className="btn-quiet px-3 py-1.5 text-[11px]">最初から</button>
        </div>
      </div>
      {caption && <figcaption className="px-4 pb-3 text-[11px] text-stone-400">{caption}</figcaption>}
    </figure>
  );
};

export default AnimatedGuide;
