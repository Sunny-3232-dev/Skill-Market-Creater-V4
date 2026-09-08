import React from 'react';
import AnimatedGuide from './AnimatedGuide';

// 仕上げ画面の「貼り方」を一本の流れで。22秒で1周。
//  ① 「スキルマーケット出品画面へ」を右クリック（トラックパッドは2本指でタップ）
//  ② メニューの上から3つ目「分割ビューで開く」
//  ③ 左にこのツール、右に出品画面が並ぶ
//  ④〜⑥ タイトル → キャッチコピー → サービス詳細の順に、左の「コピー」→ 右の同じ名前の欄へ
//  ⑦ 公開すると、サービス詳細の見出しが太字で表示される
// 動きは index.css の pf-* キーフレーム（全要素22s、% が時刻）
const PasteFlowGuide: React.FC<{ className?: string }> = ({ className }) => (
  <AnimatedGuide
    className={className}
    title="画面を2分割して、項目ごとに貼る"
    cycleMs={22000}
    edges={[1980, 4840, 7920, 10780, 13420, 18480]}
    steps={[
      { title: '「スキルマーケット出品画面へ」を右クリック', text: 'MacBook のトラックパッドなら、ボタンの上で2本指でタップ。メニューが出ます' },
      { title: '上から3つ目「分割ビューで開く」を押す', text: '「新しいタブで開く」「新しいウィンドウで開く」の下にあります' },
      { title: '左にこのツール、右に出品画面が並ぶ', text: 'この状態で、項目ごとに左でコピーして右に貼っていきます' },
      { title: 'タイトルをコピーして、右の「タイトル」欄に貼る', text: '左の一覧の「コピー」→ 右の同じ名前の欄をクリックして貼り付け' },
      { title: 'キャッチコピーも同じように', text: '項目ごとに、左でコピー → 右に貼る、をくり返します' },
      { title: 'サービス詳細をコピーして貼る', text: '<strong> の文字が見えていて正解です。消さないでください' },
      { title: '公開すると、見出しが太字で表示される', text: '公開ページでは <strong> が消えて、見出しだけが太字になります' },
    ]}
    caption="この動きは22秒でひとまわりして、くり返します。"
  >
    <svg viewBox="0 0 640 360" role="img" aria-label="「スキルマーケット出品画面へ」を右クリックして分割ビューで開き、左のこのツールでタイトル・キャッチコピー・サービス詳細を順にコピーして右の出品画面の同じ欄に貼り、公開すると見出しが太字で表示されるまでの動き" className="pasteFlow">
      <defs>
        <pattern id="pfDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="var(--color-stone-300)" opacity=".5" /></pattern>
      </defs>
      <rect x="0" y="0" width="640" height="360" fill="var(--color-stone-50)" />
      <rect x="0" y="0" width="640" height="360" fill="url(#pfDots)" />

      {/* 分割前: このツールが画面いっぱい */}
      <g className="pf-anim pf-full">
        <rect x="20" y="30" width="600" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="40" y="58" fontSize="12" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <text x="40" y="76" fontSize="10" fill="var(--color-stone-400)">仕上げ ／ さいごに：スキルマーケットに貼る</text>
        <g className="pf-anim pf-btn">
          <rect x="440" y="48" width="160" height="26" rx="13" fill="var(--color-brand-600)" />
          <text x="520" y="65" fontSize="10.5" fontWeight="700" fill="#fff" textAnchor="middle">スキルマーケット出品画面へ</text>
        </g>
        <rect x="40" y="100" width="560" height="44" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="52" y="127" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">1 タイトル</text>
        <rect x="40" y="154" width="560" height="44" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="52" y="181" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">2 キャッチコピー</text>
        <rect x="40" y="208" width="560" height="100" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="52" y="235" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">3 サービス詳細</text>
        <g className="pf-anim pf-hint">
          <rect x="200" y="86" width="236" height="22" rx="11" fill="var(--color-stone-900)" />
          <text x="318" y="101" fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">右クリック ＝ トラックパッドは2本指でタップ</text>
        </g>
        <g className="pf-anim pf-menu">
          <rect x="452" y="78" width="160" height="118" rx="8" fill="#fff" stroke="var(--color-stone-300)" />
          <text x="464" y="98" fontSize="9.5" fill="var(--color-stone-700)">新しいタブで開く</text>
          <text x="464" y="120" fontSize="9.5" fill="var(--color-stone-700)">新しいウィンドウで開く</text>
          <rect x="456" y="128" width="152" height="20" rx="4" fill="var(--color-brand-600)" className="pf-anim pf-menuhl" />
          <text x="464" y="142" fontSize="9.5" fontWeight="700" className="pf-anim pf-menutx">分割ビューで開く</text>
          <text x="464" y="164" fontSize="9.5" fill="var(--color-stone-700)">シークレット ウィンドウで開く</text>
          <text x="464" y="186" fontSize="9.5" fill="var(--color-stone-700)">リンク先を名前を付けて保存…</text>
          <text x="600" y="142" fontSize="8" fontWeight="700" fill="var(--color-brand-600)" textAnchor="end" className="pf-anim pf-menutx">3つ目</text>
        </g>
      </g>

      {/* 分割後: 左にこのツール、右に出品画面 */}
      <g className="pf-anim pf-split">
        {/* 左: このツール（貼る順の一覧） */}
        <rect x="20" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="36" y="56" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">Skill Market Creator Pro</text>
        <rect x="36" y="76" width="260" height="40" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="91" fontSize="9" fontWeight="700" fill="var(--color-stone-500)">1 タイトル</text>
        <text x="46" y="107" fontSize="9.5" fill="var(--color-stone-800)">伝わる提案書に整えます</text>
        <g className="pf-anim pf-b1"><rect x="236" y="86" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="99" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text></g>
        <rect x="36" y="124" width="260" height="40" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="139" fontSize="9" fontWeight="700" fill="var(--color-stone-500)">2 キャッチコピー</text>
        <text x="46" y="155" fontSize="9.5" fill="var(--color-stone-800)">あと一歩で通る資料を、90分で。</text>
        <g className="pf-anim pf-b2"><rect x="236" y="134" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="147" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text></g>
        <rect x="36" y="172" width="260" height="140" rx="10" fill="var(--color-stone-50)" stroke="var(--color-stone-100)" />
        <text x="46" y="187" fontSize="9" fontWeight="700" fill="var(--color-stone-500)">3 サービス詳細</text>
        <text x="46" y="210" fontSize="9.5" fontWeight="700" fill="var(--color-stone-900)">💭こんなお悩みありませんか？</text>
        <rect x="46" y="218" width="160" height="5" rx="2.5" fill="var(--color-stone-300)" />
        <text x="46" y="244" fontSize="9.5" fontWeight="700" fill="var(--color-stone-900)">✅このサービスでできること</text>
        <rect x="46" y="252" width="140" height="5" rx="2.5" fill="var(--color-stone-300)" />
        <text x="46" y="278" fontSize="9.5" fontWeight="700" fill="var(--color-stone-900)">💰価格の目安</text>
        <rect x="46" y="286" width="100" height="5" rx="2.5" fill="var(--color-stone-300)" />
        <g className="pf-anim pf-b3"><rect x="236" y="182" width="50" height="18" rx="9" fill="var(--color-stone-900)" /><text x="261" y="195" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">コピー</text></g>

        {/* 右: 出品画面（公開前） */}
        <g className="pf-anim pf-form">
          <rect x="328" y="30" width="292" height="300" rx="14" fill="#fff" stroke="var(--color-stone-200)" />
          <rect x="328" y="30" width="292" height="28" rx="14" fill="var(--color-stone-100)" />
          <rect x="328" y="44" width="292" height="14" fill="var(--color-stone-100)" />
          <text x="344" y="49" fontSize="10.5" fontWeight="700" fill="var(--color-stone-600)">スキルマーケット ｜ 出品ページの編集</text>
          <text x="344" y="84" fontSize="9.5" fill="var(--color-stone-500)">タイトル</text>
          <rect x="344" y="90" width="260" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <text x="352" y="103" fontSize="9.5" fill="var(--color-stone-800)" className="pf-anim pf-t1">伝わる提案書に整えます</text>
          <text x="344" y="130" fontSize="9.5" fill="var(--color-stone-500)">キャッチコピー</text>
          <rect x="344" y="136" width="260" height="18" rx="5" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <text x="352" y="149" fontSize="9.5" fill="var(--color-stone-800)" className="pf-anim pf-t2">あと一歩で通る資料を、90分で。</text>
          <text x="344" y="176" fontSize="9.5" fill="var(--color-stone-500)">サービス詳細</text>
          <rect x="344" y="182" width="260" height="100" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
          <g fontSize="8.5" fill="var(--color-stone-700)" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            <text x="352" y="198" className="pf-anim pf-l1">&lt;strong&gt;💭こんなお悩みありませんか？&lt;/strong&gt;</text>
            <text x="352" y="214" className="pf-anim pf-l2">・資料を作ったが反応が薄い</text>
            <text x="352" y="230" className="pf-anim pf-l3">&lt;strong&gt;✅このサービスでできること&lt;/strong&gt;</text>
            <text x="352" y="246" className="pf-anim pf-l4">・構成の組み直し</text>
            <text x="352" y="262" className="pf-anim pf-l5">&lt;strong&gt;💰価格の目安&lt;/strong&gt;</text>
          </g>
          <g className="pf-anim pf-pubbtn">
            <rect x="524" y="296" width="80" height="20" rx="10" fill="var(--color-brand-600)" />
            <text x="564" y="310" fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">公開する</text>
          </g>
        </g>

        {/* 右: 公開されたページ（太字で表示） */}
        <g className="pf-anim pf-pub">
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
          <g className="pf-anim pf-badge2">
            <rect x="344" y="280" width="176" height="22" rx="11" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
            <text x="432" y="295" fontSize="10" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">見出しが太字で表示されました</text>
          </g>
        </g>

        <g className="pf-anim pf-badge">
          <rect x="220" y="336" width="200" height="20" rx="10" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
          <text x="320" y="350" fontSize="9.5" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">左がこのツール、右が出品画面</text>
        </g>
      </g>

      {/* クリックの波紋（右クリックは二重の輪） */}
      <circle cx="520" cy="61" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k1" />
      <circle cx="520" cy="61" r="8" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k1b" />
      <circle cx="532" cy="138" r="14" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k2" />
      <circle cx="261" cy="95" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k3" />
      <circle cx="474" cy="99" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k4" />
      <circle cx="261" cy="143" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k5" />
      <circle cx="474" cy="145" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k6" />
      <circle cx="261" cy="191" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k7" />
      <circle cx="474" cy="232" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k8" />
      <circle cx="564" cy="306" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="pf-anim pf-k pf-k9" />

      {/* カーソル */}
      <g className="pf-anim pf-cur" data-guide-cursor>
        <polygon points="0,0 0,17 5,13 8,20 11,19 8,12 14,12" fill="var(--color-stone-900)" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  </AnimatedGuide>
);

export default PasteFlowGuide;
