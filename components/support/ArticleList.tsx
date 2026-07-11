import React from 'react';
import { ArticleLink } from '../../data/articles';

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

interface ArticleSectionProps {
  title: string;
  subtitle: string;
  articles: ArticleLink[];
}

// 「読むと何が得られるか」が伝わる、価値提示つきの記事セクション
const ArticleList: React.FC<ArticleSectionProps> = ({ title, subtitle, articles }) => (
  <section>
    <div className="flex items-start gap-3 mb-4">
      <span className="shrink-0 w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
        <BookIcon />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">無料で読める</span>
        </div>
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
          className="group card-hoverable px-4 py-3.5 flex items-center gap-4"
        >
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="shrink-0 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{article.category}</span>
              <h4 className="text-sm font-bold text-stone-800 group-hover:text-stone-900 transition-colors leading-snug truncate">{article.title}</h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">{article.description}</p>
            <p className="text-[11px] text-stone-400 mt-1">by {article.author}</p>
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
