import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface TourStep {
  /** 指す要素のセレクタ。部品をまたいで使えるよう data-tour 属性で引く */
  sel: string;
  title: string;
  text: string;
}

// 初めての人向けの案内（PJ090 の型）。画面の上に暗い幕をかけ、実物の場所に穴を開けて順に指し示す。
// 絵で説明するより「ここがこれ」と実物を指すほうが言葉が要らない。
// 見えていない項目（別タブ・折りたたみの中）は飛ばす。案内中は幕がクリックを受けるので画面は触れない。
interface TourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

interface Box { top: number; left: number; width: number; height: number }

const isVisible = (el: Element | null): el is HTMLElement => !!el && el.getClientRects().length > 0;

const Tour: React.FC<TourProps> = ({ steps, open, onClose }) => {
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<Box | null>(null);
  const [card, setCard] = useState<{ top: number; left: number } | null>(null);

  // 見えている次の歩を探す。無ければ -1
  const nextVisible = useCallback((from: number): number => {
    for (let i = from; i < steps.length; i++) {
      if (isVisible(document.querySelector(steps[i].sel))) return i;
    }
    return -1;
  }, [steps]);

  const measure = useCallback((i: number) => {
    const el = document.querySelector(steps[i].sel);
    if (!isVisible(el)) return;
    el.scrollIntoView({ block: 'center' });
    // 貼り付くヘッダーがあると直後は位置がずれるので、少し待って測る
    window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      const pad = 6;
      setHole({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
      const cw = Math.min(352, window.innerWidth - 24);
      const ch = 180; // カードのおおよその高さ。下に入らなければ上に出す
      let top = r.bottom + 14;
      if (top + ch > window.innerHeight - 12) top = Math.max(12, r.top - ch - 14);
      const left = Math.min(Math.max(12, r.left), window.innerWidth - cw - 12);
      setCard({ top, left });
    }, 80);
  }, [steps]);

  const show = useCallback((from: number) => {
    const i = nextVisible(from);
    if (i === -1) { onClose(); return; }
    setIndex(i);
    setHole(null);
    measure(i);
  }, [nextVisible, measure, onClose]);

  useEffect(() => {
    if (!open) return;
    show(0);
  }, [open, show]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); show(index + 1); }
    };
    const onResize = () => measure(index);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open, index, show, measure, onClose]);

  if (!open || steps.length === 0) return null;
  const step = steps[index];
  const isLast = nextVisible(index + 1) === -1;

  return createPortal(
    <div className="fixed inset-0 z-[300]" role="presentation" onClick={(e) => e.stopPropagation()}>
      {/* 穴。周囲は巨大な影で暗くする（親に overflow:hidden があると切れるので body 直下に置く） */}
      {hole && (
        <div
          aria-hidden
          className="absolute rounded-xl pointer-events-none transition-all duration-300 ease-smooth"
          style={{ ...hole, boxShadow: '0 0 0 9999px rgba(28, 25, 23, 0.55)' }}
        />
      )}
      {!hole && <div aria-hidden className="absolute inset-0 bg-stone-900/55" />}
      <div
        role="dialog"
        aria-live="polite"
        aria-label={step.title}
        className="absolute bg-white rounded-2xl shadow-card-hover border border-stone-200/60 p-5 flex flex-col gap-2 transition-all duration-300 ease-smooth"
        style={{ width: 'min(22rem, calc(100vw - 24px))', top: card?.top ?? 24, left: card?.left ?? 24, opacity: card ? 1 : 0 }}
      >
        <div className="text-[11px] font-bold tracking-widest text-brand-500">{index + 1} / {steps.length}</div>
        <h4 className="text-base font-bold text-stone-900 leading-snug">{step.title}</h4>
        <p className="text-sm text-stone-600 leading-relaxed">{step.text}</p>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="btn-quiet px-4 py-2 text-xs">閉じる</button>
          <button type="button" onClick={() => show(index + 1)} className="btn-dark px-4 py-2 text-xs" autoFocus>{isLast ? 'おわり' : '次へ'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Tour;

/**
 * 案内の開閉と「初回だけ自動で始める」。
 * autoStartWhen が true になったとき（その画面が初めて描かれたとき）に、見た印が無ければ 900ms 後に始める。
 * 閉じたら印を付け、2回目からは出さない。ボタンからは何度でも開ける。
 */
export const useTour = (storageKey: string, autoStartWhen: boolean) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!autoStartWhen) return;
    let seen = false;
    try { seen = !!localStorage.getItem(storageKey); } catch { /* noop */ }
    if (seen) return;
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [autoStartWhen, storageKey]);
  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(storageKey, '1'); } catch { /* noop */ }
  }, [storageKey]);
  const start = useCallback(() => setOpen(true), []);
  // ヘッダの「はじめての方へ」ボタン（App.tsx）は、いま表示中の画面の案内を開く
  useEffect(() => {
    window.addEventListener(TOUR_EVENT, start);
    return () => window.removeEventListener(TOUR_EVENT, start);
  }, [start]);
  return { open, start, close };
};

export const TOUR_EVENT = 'smc:tour';
export const requestTour = () => window.dispatchEvent(new Event(TOUR_EVENT));
