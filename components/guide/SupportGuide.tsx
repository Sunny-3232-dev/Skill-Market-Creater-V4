import React from 'react';
import AnimatedGuide from './AnimatedGuide';

// サポート画面の「使い方」。1枚の絵の中で
// 出品ページのURLを貼って登録 → ページを開いて本文をコピー → 開いた欄に貼って保存 → 下のメニューを選ぶ
// までを14秒で見せる。動きは index.css の sg-* キーフレーム
const SupportGuide: React.FC<{ className?: string }> = ({ className }) => (
  <AnimatedGuide
    className={className}
    title="サポートの使い方"
    cycleMs={14000}
    edges={[3360, 6440, 9520]}
    steps={[
      { title: '出品ページのURLを登録', text: 'skill.libecity.com/services/… のURLを貼って「URLを追加」' },
      { title: 'ページを開いて本文をコピー', text: '本文は自動では取れません。「ページを開く」から全文をコピーします' },
      { title: '開いた欄に貼って保存', text: 'サービスを選ぶと本文欄が開きます。貼って「この本文を保存」' },
      { title: '下のメニューを選ぶ', text: '宣伝文・資料・チラシ・アンケートが、この本文から作れます' },
    ]}
    caption="この動きは14秒でひとまわりして、くり返します。"
  >
    <svg viewBox="0 0 640 360" role="img" aria-label="出品ページのURLを登録し、ページを開いて本文をコピーして欄に貼って保存すると、下のメニューが使えるようになるまでの動き" className="supportGuide">
      <defs>
        <pattern id="sgDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="var(--color-stone-300)" opacity=".5" /></pattern>
      </defs>
      <rect x="0" y="0" width="640" height="360" fill="var(--color-stone-50)" />
      <rect x="0" y="0" width="640" height="360" fill="url(#sgDots)" />

      {/* 左: スキルマーケットの出品ページ（公開済み） */}
      <g>
        <rect x="20" y="40" width="250" height="280" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <rect x="20" y="40" width="250" height="30" rx="14" fill="var(--color-stone-100)" />
        <rect x="20" y="56" width="250" height="14" fill="var(--color-stone-100)" />
        <rect x="32" y="48" width="226" height="14" rx="7" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="42" y="58.5" fontSize="8.5" fill="var(--color-stone-500)" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>skill.libecity.com/services/12345</text>
        <text x="36" y="96" fontSize="12" fontWeight="800" fill="var(--color-stone-900)">伝わる提案書に整えます</text>
        {/* 本文の選択ハイライト */}
        <rect x="32" y="108" width="226" height="130" rx="6" fill="var(--color-brand-100)" className="sg-anim sg-sel" />
        <g fontSize="10" fill="var(--color-stone-700)">
          <text x="36" y="126" fontWeight="800" fill="var(--color-stone-900)">💭こんなお悩みありませんか？</text>
          <text x="36" y="144">・資料を作ったが反応が薄い</text>
          <text x="36" y="170" fontWeight="800" fill="var(--color-stone-900)">✅このサービスでできること</text>
          <text x="36" y="188">・構成の組み直し</text>
          <text x="36" y="214" fontWeight="800" fill="var(--color-stone-900)">💰価格の目安</text>
          <text x="36" y="232">60分・修正2回込み 5,000円</text>
        </g>
        <g className="sg-anim sg-toast">
          <rect x="32" y="288" width="226" height="22" rx="11" fill="var(--color-stone-900)" />
          <text x="145" y="303" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">本文をコピーしました</text>
        </g>
      </g>

      {/* 右: このツールのサポート画面 */}
      <g>
        <rect x="300" y="40" width="320" height="280" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="316" y="66" fontSize="12" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <text x="316" y="84" fontSize="10" fill="var(--color-stone-400)">サポート ／ 対象のサービス</text>
        {/* URL 入力 */}
        <rect x="316" y="96" width="210" height="20" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="326" y="110" fontSize="8.5" fill="var(--color-stone-400)" className="sg-anim sg-urlph">https://skill.libecity.com/services/…</text>
        <text x="326" y="110" fontSize="8.5" fill="var(--color-stone-800)" className="sg-anim sg-url" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>skill.libecity.com/services/12345</text>
        <g className="sg-anim sg-addbtn">
          <rect x="532" y="96" width="72" height="20" rx="10" fill="#fff" stroke="var(--color-stone-300)" />
          <text x="568" y="110" fontSize="9.5" fontWeight="700" fill="var(--color-stone-700)" textAnchor="middle">URLを追加</text>
        </g>
        {/* 登録されたサービスの行 */}
        <g className="sg-anim sg-row">
          <rect x="316" y="128" width="288" height="26" rx="8" fill="var(--color-brand-50)" stroke="var(--color-brand-300)" />
          <circle cx="330" cy="141" r="4" fill="var(--color-brand-500)" />
          <text x="340" y="145" fontSize="10" fontWeight="700" fill="var(--color-stone-900)">伝わる提案書に整えます</text>
          <rect x="522" y="133" width="76" height="16" rx="8" fill="#fff" stroke="var(--color-stone-300)" />
          <text x="560" y="144.5" fontSize="8.5" fontWeight="700" fill="var(--color-stone-600)" textAnchor="middle">ページを開く ↗</text>
        </g>
        {/* 本文欄 */}
        <g className="sg-anim sg-panel">
          <rect x="316" y="160" width="288" height="118" rx="8" fill="#fff" stroke="var(--color-brand-200)" />
          <text x="326" y="176" fontSize="9.5" fontWeight="700" fill="var(--color-stone-700)">このサービスの本文</text>
          <rect x="326" y="184" width="268" height="60" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <g fontSize="8.5" fill="var(--color-stone-700)">
            <text x="334" y="198" className="sg-anim sg-l1">💭こんなお悩みありませんか？</text>
            <text x="334" y="211" className="sg-anim sg-l2">・資料を作ったが反応が薄い</text>
            <text x="334" y="224" className="sg-anim sg-l3">✅このサービスでできること ・構成の組み直し</text>
            <text x="334" y="237" className="sg-anim sg-l4">💰価格の目安 60分・修正2回込み 5,000円</text>
          </g>
          <g className="sg-anim sg-savebtn">
            <rect x="326" y="252" width="90" height="18" rx="9" fill="var(--color-stone-900)" />
            <text x="371" y="264.5" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">この本文を保存</text>
          </g>
          <g className="sg-anim sg-saved">
            <text x="426" y="264.5" fontSize="9" fontWeight="700" fill="var(--color-emerald-600, #059669)">本文あり ✓</text>
          </g>
        </g>
        {/* メニュー行 */}
        <g className="sg-anim sg-menus">
          <rect x="316" y="288" width="66" height="22" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <text x="349" y="303" fontSize="9" fontWeight="700" fill="var(--color-stone-700)" textAnchor="middle">宣伝文</text>
          <rect x="390" y="288" width="66" height="22" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <text x="423" y="303" fontSize="9" fontWeight="700" fill="var(--color-stone-700)" textAnchor="middle">資料</text>
          <rect x="464" y="288" width="66" height="22" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <text x="497" y="303" fontSize="9" fontWeight="700" fill="var(--color-stone-700)" textAnchor="middle">チラシ</text>
          <rect x="538" y="288" width="66" height="22" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <text x="571" y="303" fontSize="9" fontWeight="700" fill="var(--color-stone-700)" textAnchor="middle">アンケート</text>
        </g>
      </g>

      {/* クリックの波紋 */}
      <circle cx="568" cy="106" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sg-anim sg-k sg-k1" />
      <circle cx="145" cy="170" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sg-anim sg-k sg-k2" />
      <circle cx="460" cy="214" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sg-anim sg-k sg-k3" />
      <circle cx="371" cy="261" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sg-anim sg-k sg-k4" />

      {/* カーソル */}
      <g className="sg-anim sg-cur" data-guide-cursor>
        <polygon points="0,0 0,17 5,13 8,20 11,19 8,12 14,12" fill="var(--color-stone-900)" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  </AnimatedGuide>
);

export default SupportGuide;
