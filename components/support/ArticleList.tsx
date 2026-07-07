import React from 'react';
import { ArticleLink } from '../../data/articles';

const ArticleList: React.FC<{ articles: ArticleLink[] }> = ({ articles }) => (
  <div className="card overflow-hidden">
    {articles.map((article, index) => (
      <a
        key={index}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-stone-50 ${
          index !== articles.length - 1 ? 'border-b border-stone-100' : ''
        }`}
      >
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors leading-snug">{article.title}</h4>
            <span className="shrink-0 text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{article.category}</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 truncate">{article.description}</p>
          <p className="text-[11px] text-stone-400 mt-1">by {article.author}</p>
        </div>
        <span className="shrink-0 mt-1 text-stone-300 group-hover:text-brand-400 transition-colors text-xs" aria-hidden>↗</span>
      </a>
    ))}
  </div>
);

export default ArticleList;
