import React from 'react';
import { isHeadingLine } from '../utils/skillMarketMarkup';

// スキルマーケットに貼ったあとの見え方で本文を表示する。
// コピー時に <strong> が付く見出し行を、画面でも太字にして「貼るとこうなる」を先に見せる
const ListingPreview: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <div className={className}>
    {text.split('\n').map((line, i) =>
      isHeadingLine(line) ? (
        <strong key={i} className="block font-bold text-stone-900 mt-3 first:mt-0">{line}</strong>
      ) : (
        <span key={i} className="block min-h-[1.5em] whitespace-pre-wrap">{line}</span>
      )
    )}
  </div>
);

export default ListingPreview;
