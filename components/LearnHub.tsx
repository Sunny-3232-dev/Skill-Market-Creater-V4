import React from 'react';
import { MAGAZINE_ARTICLES, KNOWHOW_ARTICLES } from '../data/articles';
import ArticleList, { KindMark } from './support/ArticleList';
import Deck from './learn/Deck';
import { PUBLISH_SLIDES, POLISH_SLIDES } from './learn/deckSlides';

const SlidesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>
  </svg>
);

// 種類ごとの入口。上に3つ並べて、押すとその節へ飛ぶ
const KindNav: React.FC = () => {
  const items = [
    { id: 'learn-decks', label: '勉強会の資料', count: 2, mark: <span className="w-8 h-8 shrink-0 rounded-lg bg-stone-900 text-white flex items-center justify-center"><SlidesIcon /></span>, note: 'スライド18枚×2本' },
    { id: 'learn-magazine', label: '学長マガジン', count: MAGAZINE_ARTICLES.length, mark: <KindMark kind="magazine" />, note: '両学長の記事' },
    { id: 'learn-knowhow', label: 'ノウハウ図書館', count: KNOWHOW_ARTICLES.length, mark: <KindMark kind="knowhow" />, note: '先輩出品者の記事' },
  ];
  return (
    <nav aria-label="資料の種類" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8">
      {items.map(it => (
        <a
          key={it.id}
          href={`#${it.id}`}
          onClick={(e) => { e.preventDefault(); document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          className="card-hoverable px-4 py-3 flex items-center gap-3"
        >
          {it.mark}
          <span className="min-w-0">
            <span className="block text-sm font-bold text-stone-900 leading-tight">{it.label} <span className="text-stone-400 font-semibold">{it.count}</span></span>
            <span className="block text-[11px] text-stone-500">{it.note}</span>
          </span>
        </a>
      ))}
    </nav>
  );
};

// 「前提・下敷き」となる読み物レイヤー。Creator/Supportと並ぶ第3の入口。
// 3種類（勉強会の資料／学長マガジン／ノウハウ図書館）を、見た目の印で区別する
const LearnHub: React.FC = () => {
  return (
    <div className="p-6 md:p-10 lg:p-12 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <span className="eyebrow mb-1 block">いつでも参考に</span>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">参考になる資料と記事</h2>
          <p className="text-stone-500 text-sm mt-2 leading-relaxed">
            3種類あります。勉強会で使ったスライド、両学長の記事（学長マガジン）、先輩出品者の記事（ノウハウ図書館）。
            はじめる前でも、行き詰まったときでも、のぞいてみてください。
          </p>
          <a
            href="https://library.libecity.com/articles/01KD26FQVJ9VJNH99JBJ9F3TGS"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-3 btn-secondary px-4 py-2 text-xs"
          >
            このツールの使い方記事（ノウハウ図書館）↗
          </a>
        </div>

        <KindNav />

        <div className="space-y-12">
          {/* 勉強会の資料（作業画面から移した読み物2本） */}
          <section id="learn-decks" className="scroll-mt-24 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-lg bg-stone-900 text-white flex items-center justify-center"><SlidesIcon /></span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-widest text-brand-500">勉強会の資料</span>
                <h3 className="text-base font-bold text-stone-900 mt-0.5">スライドで読む、出品前と出品後</h3>
                <p className="text-stone-500 text-xs mt-1 leading-relaxed">出品前と出品後、それぞれのつまずきと越え方を18枚ずつにまとめています。「資料を見る」で開きます。</p>
              </div>
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
            id="learn-magazine"
            kind="magazine"
            title="学長に学ぶ、売る前の基本"
            subtitle="リベ大の両学長が「価格の決め方」「嫌われない宣伝のコツ」を解説。出品する前に押さえておきたい考え方です。"
            articles={MAGAZINE_ARTICLES}
          />
          <ArticleList
            id="learn-knowhow"
            kind="knowhow"
            title="先輩出品者に学ぶ、売れるまでの工夫"
            subtitle="実際に売れている出品者が実践しているコツを無料で読めます。「売れない…」のつまずきポイントの解決策も。"
            articles={KNOWHOW_ARTICLES}
          />
        </div>
      </div>
    </div>
  );
};

export default LearnHub;
