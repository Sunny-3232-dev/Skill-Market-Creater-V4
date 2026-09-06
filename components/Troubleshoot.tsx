import React from 'react';

export interface TroubleItem {
  q: string;
  a: React.ReactNode;
}

// 画面の末尾に置く「うまくいかないとき」。PJ090 と同じく、問いを1行で並べて開いたら2〜3文で答える
const Troubleshoot: React.FC<{ items: TroubleItem[]; className?: string }> = ({ items, className }) => (
  <section className={className} data-tour="troubleshoot">
    <h3 className="text-base font-bold text-stone-900 mb-3">うまくいかないとき</h3>
    <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200/80 bg-white">
      {items.map(item => (
        <details key={item.q} className="group">
          <summary className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer list-none text-sm font-semibold text-stone-800 hover:text-brand-600 transition-colors [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden className="text-stone-300 transition-transform duration-200 group-open:rotate-180">▾</span>
          </summary>
          <div className="px-5 pb-4 -mt-1 text-[13px] text-stone-500 leading-relaxed">{item.a}</div>
        </details>
      ))}
    </div>
  </section>
);

export default Troubleshoot;
