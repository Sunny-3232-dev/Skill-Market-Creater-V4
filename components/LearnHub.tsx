import React from 'react';
import { MAGAZINE_ARTICLES, KNOWHOW_ARTICLES } from '../data/articles';
import ArticleList from './support/ArticleList';
import Deck from './learn/Deck';
import { PUBLISH_SLIDES, POLISH_SLIDES } from './learn/deckSlides';

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
          {/* 作業画面から移した読み物2本。作業の邪魔をしないよう、ここでまとめて読む */}
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">勉強会の資料（読み物）</h3>
              <p className="text-stone-500 text-sm mt-1">出品前と出品後、それぞれのつまずきと越え方を18枚ずつにまとめています。</p>
            </div>
            <Deck
              slides={PUBLISH_SLIDES}
              title="はじめての出品ガイド"
              description="何を出すか決まらない、入力が多くて手が止まる、準備が万全じゃなくてためらう——出品前のつまずきと、その越え方。"
            />
            <Deck
              slides={POLISH_SLIDES}
              title="出品を磨く3つの型"
              description="サービス画像・アンケート・つぶやき。サポートの各メニューを「なぜそう作るのか」から使えるように。"
            />
          </section>
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
