import React from 'react';
import AnimatedGuide from './AnimatedGuide';

// スライド資料（NotebookLMで一括）の手順。迷いやすいのは「どこに何を貼るか」。
//  ・サービス本文 → 左の「ソース」（＋ 追加 → コピーしたテキスト）
//  ・アイコン画像 → 同じ「ソース」（＋ 追加 → ファイルをアップロード）
//  ・トンマナ・構成の指示 → 右の「Studio」→「スライド資料」の鉛筆（カスタマイズ）欄。チャット欄ではない
// この3つの置き場所を、NotebookLM の3列（ソース／チャット／Studio）の上で16秒で見せる。動きは index.css の nb-*
const NotebookLMGuide: React.FC<{ className?: string }> = ({ className }) => (
  <AnimatedGuide
    className={className}
    title="NotebookLM のどこに何を貼るか"
    cycleMs={16000}
    edges={[4960, 8160, 9760, 13440]}
    steps={[
      { title: '左「ソース」の「＋ 追加」→「コピーしたテキスト」に本文を貼る', text: 'サービス詳細文章はここ。チャット欄ではありません' },
      { title: 'もう一度「＋ 追加」→「ファイルをアップロード」でアイコン画像', text: '画像もソースに入れます。無ければ飛ばして構いません' },
      { title: '右「Studio」→「スライド資料」の鉛筆（カスタマイズ）', text: 'カードをそのまま押すと既定のスライドになるので、先に鉛筆を押します' },
      { title: '開いた欄に、コピーしたトンマナ・構成のプロンプトを貼る', text: 'ここが指示の置き場所。真ん中のチャット欄に貼ると資料に反映されません' },
      { title: '「生成」→ できたスライドを PDF でダウンロード', text: 'このあと I Love PDF で JPG にして、サービス画像に追加します' },
    ]}
    caption="この動きは16秒でひとまわりして、くり返します。NotebookLM の画面の並び（ソース／チャット／Studio）に合わせています。"
  >
    <svg viewBox="0 0 640 360" role="img" aria-label="NotebookLM で、左のソースに本文とアイコン画像を追加し、右の Studio のスライド資料のカスタマイズ欄にプロンプトを貼って生成し、PDF でダウンロードするまでの動き" className="notebookGuide">
      <rect x="0" y="0" width="640" height="360" fill="var(--color-stone-50)" />
      {/* 上のバー */}
      <rect x="0" y="0" width="640" height="26" fill="#fff" stroke="var(--color-stone-200)" />
      <text x="14" y="17" fontSize="10" fontWeight="700" fill="var(--color-stone-800)">NotebookLM</text>
      <text x="96" y="17" fontSize="9.5" fill="var(--color-stone-500)">無題のノートブック</text>

      {/* 左: ソース */}
      <rect x="8" y="34" width="176" height="318" rx="12" fill="#fff" stroke="var(--color-stone-200)" />
      <text x="20" y="54" fontSize="10.5" fontWeight="700" fill="var(--color-stone-900)">ソース</text>
      <g className="nb-anim nb-addbtn">
        <rect x="20" y="64" width="152" height="22" rx="11" fill="#fff" stroke="var(--color-stone-300)" />
        <text x="96" y="79" fontSize="9.5" fontWeight="700" fill="var(--color-stone-800)" textAnchor="middle">＋ 追加</text>
      </g>
      <g className="nb-anim nb-src1">
        <rect x="20" y="96" width="152" height="26" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="30" y="113" fontSize="9" fill="var(--color-stone-800)">📄 サービス本文.txt</text>
      </g>
      <g className="nb-anim nb-src2">
        <rect x="20" y="128" width="152" height="26" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="30" y="145" fontSize="9" fill="var(--color-stone-800)">🖼 アイコン.png</text>
      </g>
      <text x="20" y="340" fontSize="8.5" fill="var(--color-brand-600)" fontWeight="700" className="nb-anim nb-lab1">本文とアイコンはここ</text>

      {/* 中央: チャット */}
      <rect x="192" y="34" width="232" height="318" rx="12" fill="#fff" stroke="var(--color-stone-200)" />
      <text x="204" y="54" fontSize="10.5" fontWeight="700" fill="var(--color-stone-900)">チャット</text>
      <rect x="204" y="312" width="208" height="26" rx="13" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
      <text x="216" y="329" fontSize="8.5" fill="var(--color-stone-400)">ソースについて質問する…</text>
      <g className="nb-anim nb-nochat">
        <rect x="216" y="150" width="184" height="40" rx="8" fill="#fff" stroke="var(--color-brand-300)" />
        <text x="308" y="167" fontSize="9" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">プロンプトはここではなく</text>
        <text x="308" y="181" fontSize="9" fontWeight="700" fill="var(--color-brand-600)" textAnchor="middle">右の Studio に貼ります →</text>
      </g>

      {/* 右: Studio */}
      <rect x="432" y="34" width="200" height="318" rx="12" fill="#fff" stroke="var(--color-stone-200)" />
      <text x="444" y="54" fontSize="10.5" fontWeight="700" fill="var(--color-stone-900)">Studio</text>
      <g className="nb-anim nb-cards">
        <rect x="444" y="64" width="84" height="40" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="452" y="88" fontSize="8.5" fill="var(--color-stone-700)">音声概要</text>
        <rect x="536" y="64" width="84" height="40" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="544" y="88" fontSize="8.5" fill="var(--color-stone-700)">動画概要</text>
        <rect x="444" y="112" width="84" height="40" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="452" y="136" fontSize="8.5" fill="var(--color-stone-700)">マインドマップ</text>
        <rect x="536" y="112" width="84" height="40" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="544" y="136" fontSize="8.5" fill="var(--color-stone-700)">レポート</text>
        {/* スライド資料 + 鉛筆 */}
        <rect x="444" y="160" width="176" height="40" rx="8" fill="var(--color-stone-50)" stroke="var(--color-brand-300)" />
        <text x="452" y="184" fontSize="8.5" fontWeight="700" fill="var(--color-stone-900)">スライド資料</text>
        <g className="nb-anim nb-pencil">
          <circle cx="602" cy="180" r="10" fill="#fff" stroke="var(--color-stone-300)" />
          <text x="602" y="184" fontSize="9" textAnchor="middle">✎</text>
        </g>
        <text x="452" y="216" fontSize="7.5" fill="var(--color-stone-400)">鉛筆＝カスタマイズ（先に押す）</text>
      </g>
      {/* カスタマイズ欄 */}
      <g className="nb-anim nb-custom">
        <rect x="444" y="64" width="176" height="230" rx="8" fill="#fff" stroke="var(--color-brand-300)" />
        <text x="454" y="82" fontSize="9" fontWeight="700" fill="var(--color-stone-900)">スライド資料をカスタマイズ</text>
        <rect x="454" y="90" width="156" height="150" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <text x="462" y="104" fontSize="7.5" fill="var(--color-stone-400)" className="nb-anim nb-ph">指示を入力（トンマナ・構成）</text>
        <g fontSize="7.5" fill="var(--color-stone-700)">
          <text x="462" y="104" className="nb-anim nb-p1">あなたはプロのプレゼン資料デザイナーです。</text>
          <text x="462" y="118" className="nb-anim nb-p2">■ リソースの扱い：本文が主たる情報源…</text>
          <text x="462" y="132" className="nb-anim nb-p3">■ スライド構成：①表紙 ②お悩み ③できること</text>
          <text x="462" y="146" className="nb-anim nb-p4">④強み ⑤おすすめ ⑥流れ ⑦声 ⑧CTA</text>
          <text x="462" y="160" className="nb-anim nb-p5">■ トンマナ：配色・書体・装飾の指定…</text>
        </g>
        <g className="nb-anim nb-genbtn">
          <rect x="454" y="256" width="156" height="24" rx="12" fill="var(--color-stone-900)" />
          <text x="532" y="272" fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">生成</text>
        </g>
      </g>
      {/* 生成結果 */}
      <g className="nb-anim nb-result">
        <rect x="444" y="64" width="176" height="230" rx="8" fill="#fff" stroke="var(--color-stone-200)" />
        <text x="454" y="82" fontSize="9" fontWeight="700" fill="var(--color-stone-900)">スライド資料</text>
        <rect x="454" y="92" width="156" height="88" rx="6" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
        <text x="466" y="122" fontSize="10" fontWeight="800" fill="var(--color-stone-900)">伝わる提案書に整えます</text>
        <text x="466" y="138" fontSize="7.5" fill="var(--color-stone-600)">あと一歩で通る資料を、90分で。</text>
        <rect x="466" y="150" width="60" height="18" rx="4" fill="var(--color-brand-500)" opacity=".85" />
        <text x="454" y="200" fontSize="8" fill="var(--color-stone-500)">1 / 8</text>
        <g>
          <rect x="454" y="256" width="156" height="24" rx="12" fill="#fff" stroke="var(--color-stone-300)" />
          <text x="532" y="272" fontSize="9.5" fontWeight="700" fill="var(--color-stone-800)" textAnchor="middle">⬇ PDF をダウンロード</text>
        </g>
      </g>
      <text x="444" y="340" fontSize="8.5" fill="var(--color-brand-600)" fontWeight="700" className="nb-anim nb-lab3">指示（プロンプト）はここ</text>

      {/* ソースを追加ダイアログ（本文） */}
      <g className="nb-anim nb-dlg1">
        <rect x="60" y="70" width="400" height="220" rx="12" fill="#fff" stroke="var(--color-stone-300)" />
        <text x="76" y="94" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">ソースを追加</text>
        <rect x="76" y="106" width="118" height="28" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="86" y="124" fontSize="8.5" fill="var(--color-stone-700)">Google ドライブ</text>
        <rect x="202" y="106" width="118" height="28" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="212" y="124" fontSize="8.5" fill="var(--color-stone-700)">リンク</text>
        <rect x="328" y="106" width="118" height="28" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="338" y="124" fontSize="8.5" fill="var(--color-stone-700)">ファイルをアップロード</text>
        <rect x="76" y="142" width="370" height="28" rx="8" fill="var(--color-brand-50)" stroke="var(--color-brand-300)" className="nb-anim nb-opt1" />
        <text x="86" y="160" fontSize="8.5" fontWeight="700" fill="var(--color-stone-900)">コピーしたテキスト</text>
        <rect x="76" y="178" width="370" height="72" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" />
        <g fontSize="7.5" fill="var(--color-stone-700)">
          <text x="86" y="194" className="nb-anim nb-b1">💭こんなお悩みありませんか？ ・資料を作ったが反応が薄い</text>
          <text x="86" y="208" className="nb-anim nb-b2">✅このサービスでできること ・構成の組み直し</text>
          <text x="86" y="222" className="nb-anim nb-b3">💰価格の目安 60分・修正2回込み 5,000円</text>
        </g>
        <g className="nb-anim nb-ins1">
          <rect x="386" y="256" width="60" height="22" rx="11" fill="var(--color-stone-900)" />
          <text x="416" y="271" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">挿入</text>
        </g>
      </g>
      {/* ソースを追加ダイアログ（画像） */}
      <g className="nb-anim nb-dlg2">
        <rect x="60" y="70" width="400" height="220" rx="12" fill="#fff" stroke="var(--color-stone-300)" />
        <text x="76" y="94" fontSize="11" fontWeight="700" fill="var(--color-stone-900)">ソースを追加</text>
        <rect x="76" y="106" width="118" height="28" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="86" y="124" fontSize="8.5" fill="var(--color-stone-700)">Google ドライブ</text>
        <rect x="202" y="106" width="118" height="28" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="212" y="124" fontSize="8.5" fill="var(--color-stone-700)">リンク</text>
        <rect x="328" y="106" width="118" height="28" rx="8" fill="var(--color-brand-50)" stroke="var(--color-brand-300)" className="nb-anim nb-opt2" />
        <text x="338" y="124" fontSize="8.5" fontWeight="700" fill="var(--color-stone-900)">ファイルをアップロード</text>
        <rect x="76" y="142" width="370" height="28" rx="8" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" /><text x="86" y="160" fontSize="8.5" fill="var(--color-stone-700)">コピーしたテキスト</text>
        <g className="nb-anim nb-img">
          <rect x="76" y="178" width="370" height="72" rx="6" fill="var(--color-stone-50)" stroke="var(--color-stone-200)" strokeDasharray="4 3" />
          <rect x="92" y="190" width="48" height="48" rx="24" fill="var(--color-brand-100)" />
          <text x="116" y="220" fontSize="18" textAnchor="middle">🙂</text>
          <text x="152" y="210" fontSize="9" fontWeight="700" fill="var(--color-stone-900)">アイコン.png</text>
          <text x="152" y="226" fontSize="8" fill="var(--color-stone-500)">PNG / JPG の画像もソースになります</text>
        </g>
      </g>

      {/* クリックの波紋 */}
      <circle cx="96" cy="75" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k1" />
      <circle cx="140" cy="156" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k2" />
      <circle cx="416" cy="267" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k3" />
      <circle cx="96" cy="75" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k4" />
      <circle cx="387" cy="120" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k5" />
      <circle cx="602" cy="180" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k6" />
      <circle cx="532" cy="165" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k7" />
      <circle cx="532" cy="268" r="12" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" className="nb-anim nb-k nb-k8" />

      {/* カーソル */}
      <g className="nb-anim nb-cur" data-guide-cursor>
        <polygon points="0,0 0,17 5,13 8,20 11,19 8,12 14,12" fill="var(--color-stone-900)" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  </AnimatedGuide>
);

export default NotebookLMGuide;
