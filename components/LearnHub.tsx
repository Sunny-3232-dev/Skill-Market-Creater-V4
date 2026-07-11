import React from 'react';
import { MAGAZINE_ARTICLES, KNOWHOW_ARTICLES } from '../data/articles';
import ArticleList from './support/ArticleList';

// 「前提・下敷き」となる読み物レイヤー。Creator/Supportと並ぶ第3の入口。
const LearnHub: React.FC = () => {
  return (
    <div className="p-6 md:p-10 lg:p-12 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="eyebrow mb-1 block">いつでも参考に</span>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">売れる出品者のヒント</h2>
          <p className="text-stone-500 text-sm mt-2 leading-relaxed">
            うまくいっている人が実践している「価格の決め方・宣伝・改善」の考え方を、無料の記事でまとめました。
            はじめる前でも、行き詰まったときでも、のぞいてみてください。
          </p>
        </div>

        <div className="space-y-10">
          <ArticleList
            title="学長に学ぶ、売る前の基本"
            subtitle="リベ大の両学長が「価格の決め方」「嫌われない宣伝のコツ」を解説。出品する前に押さえておきたい考え方です。"
            articles={MAGAZINE_ARTICLES}
          />
          <ArticleList
            title="先輩出品者のノウハウ図書館"
            subtitle="実際に売れている出品者が実践しているコツを無料で読めます。「売れない…」のつまずきポイントの解決策も。"
            articles={KNOWHOW_ARTICLES}
          />
        </div>
      </div>
    </div>
  );
};

export default LearnHub;
