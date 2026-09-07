import React from 'react';
import AnimatedGuide from './AnimatedGuide';

// 仕上げ画面の「項目ごとにコピーして貼る」。画面を2分割したあと（SplitViewGuide の続き）。
// 左のこのツールで「コピー」→ 右の出品画面の同じ名前の欄に貼る、をタイトル → キャッチコピー → サービス詳細の順に。
// 最後に公開すると、サービス詳細の見出しが太字で表示される。動きは index.css の pg-* キーフレーム
const PasteGuide: React.FC<{ className?: string }> = ({ className }) => (
  <AnimatedGuide
    className={className}
    cycleMs={14000}
    edges={[3080, 5320, 9240]}
    steps={[
      { title: 'タイトルをコピーして、右の「タイトル」欄に貼る', text: '左のカードの「コピー」→ 右の同じ名前の欄をクリックして貼り付け' },
      { title: 'キャッチコピーも同じように', text: '項目ごとに、左でコピー → 右に貼る、をくり返します' },
      { title: 'サービス詳細をコピーして貼る', text: '<strong> の文字が見えていて正解です。消さないでください' },
      { title: '公開すると、見出しが太字で表示される', text: '公開ページでは <strong> が消えて、見出しだけが太字になります' },
    ]}
    caption="この動きは14秒でひとまわりして、くり返します。"
  >
    <svg viewBox="0 0 640 360" role="img" aria-label="左のこのツールでタイトル・キャッチコピー・サービス詳細を順にコピーし、右のスキルマーケットの出品画面の同じ欄に貼って公開すると、見出しが太字で表示されるまでの動き" className="pasteGuide">
      <defs>
        <pattern id="pgDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="var(--color-stone-300)" opacity=".5" /></pattern>
      </defs>
      <rect x="0" y="0" width="640" height="360" fill="var(--color-stone-50)" />
      <rect x="0" y="0" width="640" height="360" fill="url(#pgDots)" />

      {/* 左: このツール */}
      <g>
        <rect x="20" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="36" y="56" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <rect x="36" y="76" width="260" height="40" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="91" fontSize="9" fontWeight="700" fill="var(--color-stone-500)">タイトル</text>
        <text x="46" y="107" fontSize="9.5" fill="var(--color-stone-800)">伝わる提案書に整えます</text>
        <g className="pg-anim pg-b1"><rect x="236" y="86" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="99" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text></g>
        <rect x="36" y="124" width="260" height="40" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="139" fontSize="9" fontWeight="700" fill="var(--color-stone-500)">キャッチコピー</text>
        <text x="46" y="155" fontSize="9.5" fill="var(--color-stone-800)">あと一歩で通る資料を、90分で。</text>
        <g className="pg-anim pg-b2"><rect x="236" y="134" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="147" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text></g>
        <rect x="36" y="172" width="260" height="140" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="187" fontSize="9" fontWeight="700" fill="var(--color-stone-500)">サービス詳細</text>
        <text x="46" y="210" fontSize="9.5" fontWeight="700" fill="var(--color-stone-900)">💭こんなお悩みありませんか？</text>
        <rect x="46" y="218" width="160" height="5" rx="2.5" fill="var(--color-stone-300)" />
        <text x="46" y="244" fontSize="9.5" fontWeight="700" fill="var(--color-stone-900)">✅このサービスでできること</text>
        <rect x="46" y="252" width="140" height="5" rx="2.5" fill="var(--color-stone-300)" />
        <text x="46" y="278" fontSize="9.5" fontWeight="700" fill="var(--color-stone-900)">💰価格の目安</text>
        <rect x="46" y="286" width="100" height="5" rx="2.5" fill="var(--color-stone-300)" />
        <g className="pg-anim pg-b3"><rect x="236" y="182" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="195" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text></g>
      </g>

      {/* 右: 出品画面（公開前） */}
      <g className="pg-anim pg-form">
        <rect x="328" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <rect x="328" y="30" width="292" height="28" rx="14" fill="var(--color-stone-100)" />
        <rect x="328" y="44" width="292" height="14" fill="var(--color-stone-100)" />
        <text x="344" y="49" fontSize="10.5" fontWeight="700" fill="var(--color-stone-600)">スキルマーケット ｜ 出品ページの編集</text>
        <text x="344" y="84" fontSize="9.5" fill="var(--color-stone-500)">タイトル</text>
        <rect x="344" y="90" width="260" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="352" y="103" fontSize="9.5" fill="var(--color-stone-800)" className="pg-anim pg-t1">伝わる提案書に整えます</text>
        <text x="344" y="130" fontSize="9.5" fill="var(--color-stone-500)">キャッチコピー</text>
        <rect x="344" y="136" width="260" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="352" y="149" fontSize="9.5" fill="var(--color-stone-800)" className="pg-anim pg-t2">あと一歩で通る資料を、90分で。</text>
        <text x="344" y="176" fontSize="9.5" fill="var(--color-stone-500)">サービス詳細</text>
        <rect x="344" y="182" width="260" height="100" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <g fontSize="8.5" fill="var(--color-stone-700)" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <text x="352" y="198" className="pg-anim pg-l1">&lt;strong&gt;💭こんなお悩みありませんか？&lt;/strong&gt;</text>
          <text x="352" y="214" className="pg-anim pg-l2">・資料を作ったが反応が薄い</text>
          <text x="352" y="230" className="pg-anim pg-l3">&lt;strong&gt;✅このサービスでできること&lt;/strong&gt;</text>
          <text x="352" y="246" className="pg-anim pg-l4">・構成の組み直し</text>
          <text x="352" y="262" className="pg-anim pg-l5">&lt;strong&gt;💰価格の目安&lt;/strong&gt;</text>
        </g>
        <g className="pg-anim pg-pubbtn">
          <rect x="524" y="296" width="80" height="20" rx="10" fill="var(--color-brand-500)" />
          <text x="564" y="310" fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">公開する</text>
        </g>
      </g>

      {/* 右: 公開されたページ（太字で表示） */}
      <g className="pg-anim pg-pub">
        <rect x="328" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <rect x="328" y="30" width="292" height="28" rx="14" fill="var(--color-stone-100)" />
        <rect x="328" y="44" width="292" height="14" fill="var(--color-stone-100)" />
        <text x="344" y="49" fontSize="10.5" fontWeight="700" fill="var(--color-stone-600)">スキルマーケット ｜ 公開ページ</text>
        <text x="344" y="86" fontSize="12.5" fontWeight="800" fill="var(--color-stone-900)">伝わる提案書に整えます</text>
        <text x="344" y="104" fontSize="9.5" fill="var(--color-stone-600)">あと一歩で通る資料を、90分で。</text>
        <g fontSize="10" fill="var(--color-stone-700)">
          <text x="344" y="140" fontWeight="800" fill="var(--color-stone-900)">💭こんなお悩みありませんか？</text>
          <text x="344" y="157">・資料を作ったが反応が薄い</text>
          <text x="344" y="184" fontWeight="800" fill="var(--color-stone-900)">✅このサービスでできること</text>
          <text x="344" y="201">・構成の組み直し</text>
          <text x="344" y="228" fontWeight="800" fill="var(--color-stone-900)">💰価格の目安</text>
          <text x="344" y="245">60分・修正2回込み 5,000円</text>
        </g>
        <g className="pg-anim pg-badge">
          <rect x="344" y="280" width="176" height="22" rx="11" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
          <text x="432" y="295" fontSize="10" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">見出しが太字で表示されました</text>
        </g>
      </g>

      {/* クリックの波紋 */}
      <circle cx="261" cy="95" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k1" />
      <circle cx="474" cy="99" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k2" />
      <circle cx="261" cy="143" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k3" />
      <circle cx="474" cy="145" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k4" />
      <circle cx="261" cy="191" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k5" />
      <circle cx="474" cy="232" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k6" />
      <circle cx="564" cy="306" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pg-anim pg-k pg-k7" />

      {/* カーソル */}
      <g className="pg-anim pg-cur" data-guide-cursor>
        <polygon points="0,0 0,17 5,13 8,20 11,19 8,12 14,12" fill="var(--color-stone-900)" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  </AnimatedGuide>
);

export default PasteGuide;
