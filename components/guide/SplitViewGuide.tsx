import React from 'react';
import AnimatedGuide from './AnimatedGuide';

// 仕上げ画面の「まず画面を2分割する」。ここが一番つまずく。
// 「スキルマーケット出品画面へ」を右クリック（MacBook のトラックパッドは2本指でタップ）→
// メニューの上から3つ目「分割ビューで開く」→ 左にこのツール、右に出品画面が並ぶ、までを14秒で見せる。
// 動きは index.css の sv-* キーフレーム
const SplitViewGuide: React.FC<{ className?: string }> = ({ className }) => (
  <AnimatedGuide
    className={className}
    title="画面を2分割する"
    cycleMs={14000}
    edges={[2380, 5600]}
    steps={[
      { title: '「スキルマーケット出品画面へ」を右クリック', text: 'MacBook のトラックパッドなら、ボタンの上で2本指でタップします。メニューが出ます' },
      { title: '上から3つ目「分割ビューで開く」を押す', text: '「新しいタブで開く」「新しいウィンドウで開く」の下にあります' },
      { title: '左にこのツール、右に出品画面が並ぶ', text: 'この状態で、項目ごとに左でコピーして右に貼っていきます（次の絵）' },
    ]}
    caption="この動きは14秒でひとまわりして、くり返します。"
  >
    <svg viewBox="0 0 640 360" role="img" aria-label="「スキルマーケット出品画面へ」を右クリックしてメニューの上から3つ目「分割ビューで開く」を押すと、左にこのツール、右に出品画面が並ぶまでの動き" className="splitGuide">
      <defs>
        <pattern id="svDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="var(--color-stone-300)" opacity=".5" /></pattern>
      </defs>
      <rect x="0" y="0" width="640" height="360" fill="var(--color-stone-50)" />
      <rect x="0" y="0" width="640" height="360" fill="url(#svDots)" />

      {/* 分割前: このツールが画面いっぱい */}
      <g className="sv-anim sv-full">
        <rect x="20" y="30" width="600" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="40" y="58" fontSize="12" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <text x="40" y="76" fontSize="10" fill="var(--color-stone-400)">仕上げ ／ 出品文をスキルマーケットに貼る</text>
        {/* 主ボタン */}
        <g className="sv-anim sv-btn">
          <rect x="440" y="48" width="160" height="26" rx="13" fill="var(--color-brand-500)" />
          <text x="520" y="65" fontSize="10.5" fontWeight="700" fill="#fff" textAnchor="middle">スキルマーケット出品画面へ</text>
        </g>
        <rect x="40" y="100" width="560" height="44" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="52" y="127" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">タイトル</text>
        <rect x="40" y="154" width="560" height="44" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="52" y="181" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">キャッチコピー</text>
        <rect x="40" y="208" width="560" height="100" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="52" y="235" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">サービス詳細</text>
        {/* トラックパッドのヒント */}
        <g className="sv-anim sv-hint">
          <rect x="200" y="86" width="236" height="22" rx="11" fill="var(--color-stone-900)" />
          <text x="318" y="101" fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">右クリック ＝ トラックパッドは2本指でタップ</text>
        </g>
        {/* 右クリックメニュー（上から3つ目が分割ビュー） */}
        <g className="sv-anim sv-menu">
          <rect x="452" y="78" width="160" height="118" rx="8" fill="#fff" stroke="var(--color-stone-300)" />
          <text x="464" y="98" fontSize="9.5" fill="var(--color-stone-700)">新しいタブで開く</text>
          <text x="464" y="120" fontSize="9.5" fill="var(--color-stone-700)">新しいウィンドウで開く</text>
          <rect x="456" y="128" width="152" height="20" rx="4" fill="var(--color-brand-500)" className="sv-anim sv-menuhl" />
          <text x="464" y="142" fontSize="9.5" fontWeight="700" className="sv-anim sv-menutx">分割ビューで開く</text>
          <text x="464" y="164" fontSize="9.5" fill="var(--color-stone-700)">シークレット ウィンドウで開く</text>
          <text x="464" y="186" fontSize="9.5" fill="var(--color-stone-700)">リンク先を名前を付けて保存…</text>
          <text x="600" y="142" fontSize="8" fontWeight="700" fill="var(--color-brand-600)" textAnchor="end" className="sv-anim sv-menutx">3つ目</text>
        </g>
      </g>

      {/* 分割後: 左にこのツール、右に出品画面 */}
      <g className="sv-anim sv-split">
        <rect x="20" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="36" y="56" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <rect x="36" y="76" width="260" height="40" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="100" fontSize="10.5" fontWeight="700" fill="var(--color-stone-900)">タイトル</text>
        <rect x="236" y="86" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="99" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text>
        <rect x="36" y="124" width="260" height="40" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="148" fontSize="10.5" fontWeight="700" fill="var(--color-stone-900)">キャッチコピー</text>
        <rect x="236" y="134" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="147" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text>
        <rect x="36" y="172" width="260" height="140" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="196" fontSize="10.5" fontWeight="700" fill="var(--color-stone-900)">サービス詳細</text>
        <rect x="236" y="182" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="195" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text>

        <rect x="328" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <rect x="328" y="30" width="292" height="28" rx="14" fill="var(--color-stone-100)" />
        <rect x="328" y="44" width="292" height="14" fill="var(--color-stone-100)" />
        <text x="344" y="49" fontSize="10.5" fontWeight="700" fill="var(--color-stone-600)">スキルマーケット ｜ 出品ページの編集</text>
        <text x="344" y="84" fontSize="9.5" fill="var(--color-stone-500)">タイトル</text>
        <rect x="344" y="90" width="260" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="344" y="130" fontSize="9.5" fill="var(--color-stone-500)">キャッチコピー</text>
        <rect x="344" y="136" width="260" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="344" y="176" fontSize="9.5" fill="var(--color-stone-500)">サービス詳細</text>
        <rect x="344" y="182" width="260" height="100" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <rect x="524" y="296" width="80" height="20" rx="10" fill="var(--color-brand-500)" /><text x="564" y="310" fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">公開する</text>

        <g className="sv-anim sv-badge">
          <rect x="220" y="336" width="200" height="20" rx="10" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
          <text x="320" y="350" fontSize="9.5" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">左がこのツール、右が出品画面</text>
        </g>
      </g>

      {/* クリックの波紋（右クリックは二重の輪で表す） */}
      <circle cx="520" cy="61" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sv-anim sv-k sv-k1" />
      <circle cx="520" cy="61" r="8" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sv-anim sv-k sv-k1b" />
      <circle cx="532" cy="138" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="sv-anim sv-k sv-k2" />

      {/* カーソル */}
      <g className="sv-anim sv-cur" data-guide-cursor>
        <polygon points="0,0 0,17 5,13 8,20 11,19 8,12 14,12" fill="var(--color-stone-900)" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  </AnimatedGuide>
);

export default SplitViewGuide;
