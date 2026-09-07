import React from 'react';
import { ArticleLink } from '../../data/articles';

// 記事の種類。学長マガジン（両学長の記事）とノウハウ図書館（先輩出品者の記事）は見た目で区別する
export type ArticleKind = 'magazine' | 'knowhow';

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

/** 種類の印。学長は丸い「学長」アバター、ノウハウ図書館は本のタイル。記事1件ごとの左にも同じ印を置く */
export const KindMark: React.FC<{ kind: ArticleKind; size?: 'sm' | 'lg' }> = ({ kind, size = 'sm' }) => {
  const box = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  if (kind === 'magazine') {
    return (
      <span className={`${box} shrink-0 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold ${size === 'lg' ? 'text-[11px]' : 'text-[10px]'} tracking-tight`} aria-label="学長マガジン">
        学長
      </span>
    );
  }
  return (
    <span className={`${box} shrink-0 rounded-lg bg-stone-900 text-white flex items-center justify-center`} aria-label="ノウハウ図書館">
      <BookIcon />
    </span>
  );
};

export const KIND_LABEL: Record<ArticleKind, string> = { magazine: '学長マガジン', knowhow: 'ノウハウ図書館' };

interface ArticleSectionProps {
  id?: string;
  kind: ArticleKind;
  title: string;
  subtitle: string;
  articles: ArticleLink[];
}

// 種類ごとのセクション。頭に大きな印、各記事の左に小さな印を置いて、どの種類の記事か迷わないようにする
const ArticleList: React.FC<ArticleSectionProps> = ({ id, kind, title, subtitle, articles }) => (
  <section id={id} className="scroll-mt-24">
    <div className="flex items-start gap-3 mb-4">
      <KindMark kind={kind} size="lg" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-widest text-brand-500">{KIND_LABEL[kind]}</span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">無料で読める</span>
        </div>
        <h3 className="text-base font-bold text-stone-900 mt-0.5">{title}</h3>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-2.5">
      {articles.map((article, index) => (
        <a
          key={index}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group card-hoverable px-4 py-3.5 flex items-center gap-3"
        >
          <KindMark kind={kind} />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <span className="shrink-0 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{article.category}</span>
              <h4 className="text-sm font-bold text-stone-800 group-hover:text-stone-900 transition-colors leading-snug truncate">{article.title}</h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">{article.description}</p>
            <p className="text-[11px] text-stone-400 mt-1">{KIND_LABEL[kind]} ／ {article.author}</p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 group-hover:text-brand-600 transition-colors whitespace-nowrap">
            読む<span aria-hidden>↗</span>
          </span>
        </a>
      ))}
    </div>
  </section>
);

export default ArticleList;
