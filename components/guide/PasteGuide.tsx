import React from 'react';
import AnimatedGuide from './AnimatedGuide';

// 仕上げ画面の「貼り方」。1枚の絵の中で
// このツールで「コピー」 → スキルマーケットの出品画面の「サービス詳細」欄に貼る → 公開 → 見出しが太字で表示される
// までを14秒で見せる。動きは index.css の pg-* キーフレーム（% が時刻）
const PasteGuide: React.FC<{ className?: string }> = ({ className }) => (
  <AnimatedGuide
    className={className}
    cycleMs={14000}
    edges={[1960, 7280, 9240]}
    steps={[
      { title: 'このページで「コピー」', text: 'サービス詳細の右上のボタンです。見出しに <strong> が付いた形でコピーされます' },
      { title: '出品画面の「サービス詳細」欄に貼る', text: '<strong> の文字がそのまま見えていて正解です。消さないでください' },
      { title: '公開する', text: 'タイトルなど他の欄も同じように貼ってから、公開ボタンを押します' },
      { title: '見出しが太字で表示される', text: '公開ページでは <strong> が消えて、見出しだけが太字になります' },
    ]}
    caption="この動きは14秒でひとまわりして、くり返します。"
  >
    <svg viewBox="0 0 640 360" role="img" aria-label="このツールでサービス詳細をコピーし、スキルマーケットの出品画面の欄に貼って公開すると、見出しが太字で表示されるまでの動き" className="pasteGuide">
      <defs>
        <pattern id="pgDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="var(--color-stone-300)" opacity=".5" /></pattern>
      </defs>
      <rect x="0" y="0" width="640" height="360" fill="var(--color-stone-50)" />
      <rect x="0" y="0" width="640" height="360" fill="url(#pgDots)" />

      {/* 左: このツール */}
      <g>
        <rect x="20" y="40" width="240" height="280" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="36" y="66" fontSize="12" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <text x="36" y="84" fontSize="10" fill="var(--color-stone-400)">仕上げ ／ 出品文をスキルマーケットに貼る</text>
        <rect x="36" y="100" width="208" height="180" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="48" y="122" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">サービス詳細</text>
        <text x="48" y="146" fontSize="10" fontWeight="700" fill="var(--color-stone-800)">💭こんなお悩みありませんか？</text>
        <rect x="48" y="156" width="150" height="6" rx="3" fill="var(--color-stone-300)" />
        <rect x="48" y="168" width="120" height="6" rx="3" fill="var(--color-stone-300)" />
        <text x="48" y="194" fontSize="10" fontWeight="700" fill="var(--color-stone-800)">✅このサービスでできること</text>
        <rect x="48" y="204" width="140" height="6" rx="3" fill="var(--color-stone-300)" />
        <text x="48" y="230" fontSize="10" fontWeight="700" fill="var(--color-stone-800)">💰価格の目安</text>
        <rect x="48" y="240" width="90" height="6" rx="3" fill="var(--color-stone-300)" />
        {/* コピーボタン */}
        <g className="pg-anim pg-copybtn">
          <rect x="112" y="252" width="76" height="20" rx="10" fill="var(--color-stone-900)" />
          <text x="150" y="266" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text>
        </g>
        {/* コピーしました のトースト */}
        <g className="pg-anim pg-toast">
          <rect x="36" y="290" width="208" height="22" rx="11" fill="var(--color-stone-900)" />
          <text x="140" y="305" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">コピーしました → 出品画面へ</text>
        </g>
      </g>

      {/* 右: スキルマーケットの出品画面（貼る前〜公開前） */}
      <g className="pg-anim pg-form">
        <rect x="290" y="40" width="330" height="280" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <rect x="290" y="40" width="330" height="30" rx="14" fill="var(--color-stone-100)" />
        <rect x="290" y="56" width="330" height="14" fill="var(--color-stone-100)" />
        <text x="306" y="60" fontSize="11" fontWeight="700" fill="var(--color-stone-600)">スキルマーケット ｜ 出品ページの編集</text>
        <text x="306" y="92" fontSize="10" fill="var(--color-stone-500)">タイトル</text>
        <rect x="306" y="98" width="298" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="306" y="136" fontSize="10" fill="var(--color-stone-500)">サービス詳細</text>
        <rect x="306" y="142" width="298" height="140" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        {/* 貼られていく本文（タグが見えているのが正しい） */}
        <g fontSize="9.5" fill="var(--color-stone-700)" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <text x="316" y="160" className="pg-anim pg-l1">&lt;strong&gt;💭こんなお悩みありませんか？&lt;/strong&gt;</text>
          <text x="316" y="178" className="pg-anim pg-l2">・資料を作ったが反応が薄い</text>
          <text x="316" y="196" className="pg-anim pg-l3">&lt;strong&gt;✅このサービスでできること&lt;/strong&gt;</text>
          <text x="316" y="214" className="pg-anim pg-l4">・構成の組み直し</text>
          <text x="316" y="232" className="pg-anim pg-l5">&lt;strong&gt;💰価格の目安&lt;/strong&gt;</text>
        </g>
        {/* 公開ボタン */}
        <g className="pg-anim pg-pubbtn">
          <rect x="520" y="292" width="84" height="20" rx="10" fill="var(--color-brand-500)" />
          <text x="562" y="306" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">公開する</text>
        </g>
      </g>

      {/* 右: 公開されたページ（太字で表示） */}
      <g className="pg-anim pg-pub">
        <rect x="290" y="40" width="330" height="280" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <rect x="290" y="40" width="330" height="30" rx="14" fill="var(--color-stone-100)" />
        <rect x="290" y="56" width="330" height="14" fill="var(--color-stone-100)" />
        <text x="306" y="60" fontSize="11" fontWeight="700" fill="var(--color-stone-600)">スキルマーケット ｜ 公開ページ</text>
        <text x="306" y="100" fontSize="13" fontWeight="800" fill="var(--color-stone-900)">伝わる提案書に整えます</text>
        <g fontSize="10.5" fill="var(--color-stone-700)">
          <text x="306" y="136" fontWeight="800" fill="var(--color-stone-900)">💭こんなお悩みありませんか？</text>
          <text x="306" y="154">・資料を作ったが反応が薄い</text>
          <text x="306" y="182" fontWeight="800" fill="var(--color-stone-900)">✅このサービスでできること</text>
          <text x="306" y="200">・構成の組み直し</text>
          <text x="306" y="228" fontWeight="800" fill="var(--color-stone-900)">💰価格の目安</text>
          <text x="306" y="246">60分・修正2回込み 5,000円</text>
        </g>
        <g className="pg-anim pg-badge">
          <rect x="306" y="276" width="176" height="22" rx="11" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
          <text x="394" y="291" fontSize="10" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">見出しが太字で表示されました</text>
        </g>
      </g>

      {/* クリックの波紋 */}
      <circle cx="150" cy="262" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k1" />
      <circle cx="455" cy="212" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k2" />
      <circle cx="562" cy="302" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k3" />

      {/* カーソル */}
      <g className="pg-anim pg-cur" data-guide-cursor>
        <polygon points="0,0 0,17 5,13 8,20 11,19 8,12 14,12" fill="var(--color-stone-900)" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  </AnimatedGuide>
);

export default PasteGuide;
