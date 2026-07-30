import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 勉強会「スキルマーケットを磨こう」のハンズオン資料。
 * 文字サイズはコンテナ幅（cqw）基準なので、埋め込み表示でも全画面でも同じ見え方になる。
 * スライドの追加・修正は SLIDES 配列だけを編集すればよい。
 */

const SLIDES: { cover?: boolean; html: string }[] = [
  {
    cover: true,
    html: `
      <div class="d-label d-label-mute">ハンズオン資料</div>
      <h1 class="d-h1">スキルマーケットを<br>磨こう</h1>
      <div class="d-meta">出品したあとの「次の一手」を、3つだけ持ち帰る<br>サービス画像 ／ アンケート ／ つぶやき</div>`,
  },
  {
    html: `
      <div class="d-label">ゴール</div>
      <h2 class="d-h2">やり切ると、<br>これが手元に残ります</h2>
      <div class="d-goal">
        <div><div class="d-n">7<small>枚</small></div><div class="d-t">サービス画像</div><div class="d-s">悩み・できること・流れ・声…</div></div>
        <div><div class="d-n">1<small>つ</small></div><div class="d-t">アンケートのフォーム</div><div class="d-s">Googleフォームがそのまま完成</div></div>
        <div><div class="d-n">20<small>本</small></div><div class="d-t">つぶやきのストック</div><div class="d-s">1本ずつ小出しにしていける</div></div>
      </div>`,
  },
  {
    html: `
      <div class="d-label">やること</div>
      <h2 class="d-h2">磨くところは、この3つ</h2>
      <div class="d-cols">
        <div class="d-card"><div class="d-num">1つめ</div><h3>サービス画像</h3><p>1枚目だけで買う人はいない。説明文は読まれない前提で、画像で答える。</p></div>
        <div class="d-card"><div class="d-num">2つめ</div><h3>アンケート</h3><p>磨く材料は自分の頭の中ではなく、お客さんの中にしかない。</p></div>
        <div class="d-card"><div class="d-num">3つめ</div><h3>つぶやき</h3><p>置いてあるだけでは見つからない。人が止まるのは「自分の悩み」が書いてあるとき。</p></div>
      </div>`,
  },
  {
    html: `
      <div class="d-label">進め方</div>
      <h2 class="d-h2">3つ全部でも、<br>1つに絞ってもOK</h2>
      <div class="d-lead">「ここがまだ磨けてないな」というところを1つ選んで、それをやりきる。それくらいがちょうどいいです。</div>
      <div class="d-flow"><span>サービス画像</span><i>→</i><span>アンケート</span><i>→</i><span>画像のつづき</span><i>→</i><span>つぶやき</span></div>
      <div class="d-note">画像だけ<b>生成に時間がかかる</b>ので、先に走らせて、待っている間にアンケートを作ります。</div>`,
  },
  {
    html: `
      <div class="d-label">まず準備・2分</div>
      <h2 class="d-h2">説明文を1回貼るだけで、<br>3つ全部が回ります</h2>
      <ol class="d-ol">
        <li>自分の出品ページを開いて、<b>説明文を全部コピー</b></li>
        <li>この <b>サポートメニュー</b> を開く</li>
        <li>真ん中の入力欄に<b>そのまま貼る</b></li>
      </ol>
      <div class="d-note">お客さんの個人情報が入っている場合は、消してから貼ってください。</div>`,
  },
  {
    html: `
      <div class="d-label">1つめ ／ サービス画像</div>
      <h2 class="d-h2">1枚目は「顔」。2枚目からは<span class="d-hl">「答え」</span>。</h2>
      <div class="d-fig">
        <svg viewBox="0 0 1040 250" role="img" aria-label="1枚目が顔、2枚目以降が答えの図">
          <rect x="2" y="12" width="300" height="215" rx="14" fill="#fff" stroke="#e11d48" stroke-width="2.5"/>
          <circle cx="152" cy="92" r="30" fill="#fff1f2"/>
          <rect x="82" y="142" width="140" height="12" rx="6" fill="#e7e5e4"/>
          <rect x="102" y="166" width="100" height="10" rx="5" fill="#f0eeec"/>
          <text x="152" y="205" text-anchor="middle" font-size="22" font-weight="700" fill="#e11d48">1枚目＝顔</text>
          <g fill="#fff" stroke="#e7e5e4" stroke-width="2">
            <rect x="336" y="12" width="164" height="215" rx="14"/>
            <rect x="516" y="12" width="164" height="215" rx="14"/>
            <rect x="696" y="12" width="164" height="215" rx="14"/>
            <rect x="876" y="12" width="164" height="215" rx="14"/>
          </g>
          <g font-size="25" font-weight="700" fill="#292524" text-anchor="middle">
            <text x="418" y="106">何をして</text><text x="418" y="134">くれるの？</text>
            <text x="598" y="106">どういう</text><text x="598" y="134">流れ？</text>
            <text x="778" y="106">他の人は</text><text x="778" y="134">どうだった？</text>
            <text x="958" y="106">自分でも</text><text x="958" y="134">大丈夫？</text>
          </g>
          <g font-size="20" fill="#6b6560" text-anchor="middle">
            <text x="418" y="205">2枚目</text><text x="598" y="205">3枚目</text><text x="778" y="205">4枚目</text><text x="958" y="205">5枚目</text>
          </g>
        </svg>
      </div>
      <div class="d-note">買う人が2枚目以降で確かめたいことは、だいたい決まっています。</div>`,
  },
  {
    html: `
      <div class="d-label">1つめ ／ サービス画像</div>
      <h2 class="d-h2">「サービス資料を作る」で<br>7枚まとめて出ます</h2>
      <div class="d-slim">
        <div><span>01</span>こんなお悩みありませんか？</div>
        <div><span>02</span>このサービスでできること</div>
        <div><span>03</span>このサービスの強み</div>
        <div><span>04</span>こんな方におすすめ</div>
        <div><span>05</span>ご依頼の流れ</div>
        <div><span>06</span>CTA（次にすること）</div>
        <div><span>07</span>お客様の声<em>レビューがある人だけ</em></div>
      </div>`,
  },
  {
    html: `
      <div class="d-label">1つめ ／ 手を動かす</div>
      <h2 class="d-h2">トンマナを選んで、<br>NotebookLMで生成</h2>
      <ol class="d-ol">
        <li>「サービス資料を作る」→ トンマナを1つ選んで<b>コピー</b></li>
        <li>「NotebookLM を開く」→ <b>新規ノートブック</b>を作成</li>
        <li><b>ソースにサービスの説明文</b>を追加（統一感を出すなら参考画像も）</li>
        <li>スタジオ → <b>スライド作成</b> → カスタマイズ欄に貼る</li>
        <li>生成を実行 → <b>待っている間に</b>アンケートへ</li>
      </ol>`,
  },
  {
    html: `
      <div class="d-label">2つめ ／ アンケート</div>
      <h2 class="d-h2">磨く材料は、<br><span class="d-hl">お客さんの中</span>にしかない</h2>
      <div class="d-lead">自分が「売り」だと思っていたところはどうでもよくて、<br>当たり前だと思ってやっていたことのほうが喜ばれていた。<br>——よくあります。</div>`,
  },
  {
    html: `
      <div class="d-label">2つめ ／ アンケート</div>
      <h2 class="d-h2">聞くのは、この4つ</h2>
      <ul class="d-ul">
        <li><b>申し込んだ理由</b> — 何が刺さったか</li>
        <li><b>決め手</b> — 最後の一押し。理由の焼き直しにしない</li>
        <li><b>満足度と、物足りなかったところ</b> — 改善のネタ</li>
        <li><b>ひとこと感想</b> — 出品ページとスライド7枚目に載る</li>
      </ul>`,
  },
  {
    html: `
      <div class="d-label">2つめ ／ アンケート</div>
      <h2 class="d-h2">聞く量は、相手との距離で決める</h2>
      <div class="d-cols">
        <div class="d-card"><div class="d-num">A ／ 2〜3分</div><h3>軽く</h3><p>関係性が浅い・単価が低いとき。答えてもらえないアンケートは0点。</p></div>
        <div class="d-card"><div class="d-num">B ／ 3〜4分</div><h3>バランス</h3><p>ふつうの取引はここ。</p></div>
        <div class="d-card"><div class="d-num">C ／ 4〜5分</div><h3>しっかり</h3><p>モニター・お知り合い・高単価。フィードバック前提なら堂々と多めに。</p></div>
      </div>`,
  },
  {
    html: `
      <div class="d-label">2つめ ／ 手を動かす</div>
      <h2 class="d-h2">コードを貼るだけで、<br>Googleフォームになります</h2>
      <ol class="d-ol">
        <li>A / B / C から1つ選んで <b>「コードを表示」→ コピー</b></li>
        <li><b>script.google.com</b> →「新しいプロジェクト」</li>
        <li>最初のコードを消して<b>貼り付け → 実行</b>（初回は権限を許可）</li>
        <li>ログに出たURLを開くと<b>フォームが完成</b></li>
      </ol>
      <div class="d-note">ゼロから作るより、<b>できたものを削るほうが速い</b>です。</div>`,
  },
  {
    html: `
      <div class="d-label">1つめのつづき</div>
      <h2 class="d-h2">スライドを、サービス画像にする</h2>
      <div class="d-fig">
        <svg viewBox="0 0 1040 150" role="img" aria-label="スライドからPDF、JPG、出品ページへの流れ">
          <g stroke="#e7e5e4" stroke-width="2" fill="#fff">
            <rect x="2" y="24" width="215" height="88" rx="12"/>
            <rect x="277" y="24" width="215" height="88" rx="12"/>
            <rect x="552" y="24" width="215" height="88" rx="12"/>
            <rect x="827" y="24" width="211" height="88" rx="12"/>
          </g>
          <g font-size="27" font-weight="700" fill="#292524" text-anchor="middle">
            <text x="110" y="66">スライド</text>
            <text x="385" y="66">PDF</text>
            <text x="660" y="66">JPG ×7枚</text>
            <text x="932" y="66">出品ページ</text>
          </g>
          <g font-size="19" fill="#6b6560" text-anchor="middle">
            <text x="110" y="94">NotebookLM</text>
            <text x="385" y="94">ダウンロード</text>
            <text x="660" y="94">I Love PDF</text>
            <text x="932" y="94">サービス画像に追加</text>
          </g>
          <g stroke="#e11d48" stroke-width="2.5" fill="none">
            <path d="M232 68 h30"/><path d="M252 61 l10 7 l-10 7"/>
            <path d="M507 68 h30"/><path d="M527 61 l10 7 l-10 7"/>
            <path d="M782 68 h30"/><path d="M802 61 l10 7 l-10 7"/>
          </g>
        </svg>
      </div>
      <div class="d-note">画像が手元にできたら、あとは出品ページに追加するだけです。</div>`,
  },
  {
    html: `
      <div class="d-label">3つめ ／ つぶやき</div>
      <h2 class="d-h2">人が止まるのは、<br><span class="d-hl">自分の悩み</span>が<br>書かれているときだけ</h2>
      <div class="d-note">「〇〇を始めました！」から書き始めると、読む側には関係のない話になってしまう。</div>`,
  },
  {
    html: `
      <div class="d-label">3つめ ／ つぶやき</div>
      <h2 class="d-h2">4行の型</h2>
      <div class="d-split">
        <ul class="d-steps">
          <li><b>1. 悩み</b><i>よくある困りごと（1〜2文）</i></li>
          <li><b>2. 軽い共感</b><i>押しつけず、やさしく（1文）</i></li>
          <li><b>3. 解決方法</b><i>サービスの特徴を自然に</i></li>
          <li><b>4. URL</b><i>注釈として置く</i></li>
        </ul>
        <div class="d-tweet">
          <span>スプレッドシートの関数、毎回ネットで調べ直して30分溶けていませんか。</span>
          <span>最初はみんなそうなので大丈夫です☺️</span>
          <span>よく使う型だけまとめて、そのまま動く形でお渡ししています。</span>
          <span class="d-url">※必要な方へ：https://skill.libecity.com/...</span>
        </div>
      </div>
      <div class="d-note">共感は<b>軽く</b>／<b>「詳細はこちら」は使わない</b>／3行合わせて<b>125文字</b>まで</div>`,
  },
  {
    html: `
      <div class="d-label">まとめ</div>
      <h2 class="d-h2">3つは、1周でつながる</h2>
      <div class="d-fig">
        <svg viewBox="0 0 1000 330" role="img" aria-label="アンケートの声が画像とつぶやきに回る循環図">
          <g fill="#fff" stroke="#e7e5e4" stroke-width="2">
            <rect x="360" y="6" width="280" height="82" rx="16"/>
            <rect x="20" y="228" width="300" height="82" rx="16"/>
            <rect x="680" y="228" width="300" height="82" rx="16"/>
          </g>
          <g font-size="29" font-weight="700" fill="#292524" text-anchor="middle">
            <text x="500" y="42">アンケートの声</text>
            <text x="170" y="264">サービス画像</text>
            <text x="830" y="264">つぶやき</text>
          </g>
          <g font-size="20" fill="#6b6560" text-anchor="middle">
            <text x="500" y="70">申し込んだ理由・ひとこと感想</text>
            <text x="170" y="292">7枚目「お客様の声」になる</text>
            <text x="830" y="292">1行目の「悩み」になる</text>
          </g>
          <g stroke="#e11d48" stroke-width="2.5" fill="none">
            <path d="M370 78 C250 110 190 160 172 218"/>
            <path d="M164 205 l8 16 l16 -6"/>
            <path d="M322 272 C430 300 560 300 700 268"/>
            <path d="M684 265 L700 268 L687 278"/>
            <path d="M828 218 C812 160 750 110 632 78"/>
            <path d="M645 90 l-14 -12 l11 -12"/>
          </g>
        </svg>
      </div>
      <div class="d-note">1周回すと、放っておいても良くなっていく状態になります。</div>`,
  },
  {
    html: `
      <div class="d-label">最後に</div>
      <h2 class="d-h2">やるものを、<br><span class="d-hl">1つだけ</span>決める</h2>
      <div class="d-lead">3つ全部やろうとすると、だいたい何も残りません。1つだけ。</div>
      <div class="d-note">迷ったら、いちばん効くのは<b>つぶやき</b>です。作った20本のうち1本、今日出す。それだけで動きが変わります。</div>`,
  },
];

const DECK_CSS = `
.deck-view { container-type: inline-size; }
.deck-stage {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #fafaf9;
  background-image:
    radial-gradient(at 88% 4%, hsla(22,100%,72%,.13) 0, hsla(22,100%,72%,0) 46%),
    radial-gradient(at 4% 96%, hsla(339,100%,60%,.10) 0, hsla(339,100%,60%,0) 46%);
  color: #292524;
  overflow: hidden;
}
.deck-inner {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center;
  padding: 6cqw 6cqw 7.5cqw;
}
.deck-inner.is-cover { justify-content: center; }
@keyframes deckRise { from { opacity: 0; transform: translateY(1.2cqw); } to { opacity: 1; transform: none; } }
.deck-inner > * { animation: deckRise .42s cubic-bezier(.2,.7,.3,1) both; }
.deck-inner > *:nth-child(2) { animation-delay: .07s; }
.deck-inner > *:nth-child(3) { animation-delay: .14s; }
.deck-inner > *:nth-child(4) { animation-delay: .21s; }
@media (prefers-reduced-motion: reduce) { .deck-inner > * { animation: none; } }

.deck-stage .d-label { font-size: 1.75cqw; font-weight: 700; letter-spacing: .12em; color: #e11d48; margin-bottom: 1.6cqw; }
.deck-stage .d-label-mute { color: #6b6560; }
.deck-stage .d-h1 { font-size: 7.2cqw; font-weight: 700; line-height: 1.22; letter-spacing: -.02em; }
.deck-stage .d-h2 { font-size: 5.2cqw; font-weight: 700; line-height: 1.32; letter-spacing: -.01em; }
.deck-stage .d-meta { margin-top: 3cqw; font-size: 2.05cqw; color: #6b6560; line-height: 1.85; }
.deck-stage .d-lead { margin-top: 1.8cqw; font-size: 2.45cqw; color: #6b6560; line-height: 1.75; }
.deck-stage .d-note { margin-top: 2.2cqw; font-size: 2cqw; color: #6b6560; line-height: 1.8; }
.deck-stage .d-note b, .deck-stage .d-lead b { color: #292524; font-weight: 700; }
.deck-stage .d-hl { background: linear-gradient(transparent 60%, rgba(225,29,72,.17) 60%); padding: 0 .06em; }

.deck-stage .d-ul, .deck-stage .d-ol { list-style: none; margin-top: 2.6cqw; padding: 0; }
.deck-stage .d-ul li {
  font-size: 2.7cqw; line-height: 1.6; padding: 1.1cqw 0 1.1cqw 1.3em;
  position: relative; border-bottom: 1px solid #e7e5e4; font-weight: 500;
}
.deck-stage .d-ul li:last-child { border-bottom: none; }
.deck-stage .d-ul li::before { content: "—"; position: absolute; left: 0; color: #e7e5e4; }
.deck-stage .d-ol { counter-reset: dstep; }
.deck-stage .d-ol li {
  font-size: 2.6cqw; line-height: 1.6; padding: 1.1cqw 0 1.1cqw 2.1em;
  position: relative; border-bottom: 1px solid #e7e5e4; font-weight: 500;
}
.deck-stage .d-ol li:last-child { border-bottom: none; }
.deck-stage .d-ol li::before {
  counter-increment: dstep; content: counter(dstep);
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  font-size: .68em; font-weight: 700; color: #e11d48; background: #fff1f2;
  width: 1.9em; height: 1.9em; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
}
.deck-stage .d-ul b, .deck-stage .d-ol b { font-weight: 700; }

.deck-stage .d-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.8cqw; margin-top: 2.8cqw; }
.deck-stage .d-card { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.4cqw; padding: 2.4cqw; }
.deck-stage .d-card .d-num { font-size: 1.55cqw; font-weight: 700; letter-spacing: .12em; color: #e11d48; margin-bottom: .7em; }
.deck-stage .d-card h3 { font-size: 2.8cqw; font-weight: 700; line-height: 1.35; margin: 0 0 .45em; }
.deck-stage .d-card p { font-size: 1.9cqw; color: #6b6560; line-height: 1.65; margin: 0; }

.deck-stage .d-goal { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.2cqw; margin-top: 3.2cqw; }
.deck-stage .d-goal > div { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.6cqw; padding: 2.6cqw; text-align: center; }
.deck-stage .d-goal .d-n { font-size: 6.8cqw; font-weight: 700; color: #e11d48; line-height: 1; letter-spacing: -.03em; }
.deck-stage .d-goal .d-n small { font-size: .38em; margin-left: .12em; }
.deck-stage .d-goal .d-t { margin-top: .6em; font-size: 2.2cqw; font-weight: 700; }
.deck-stage .d-goal .d-s { margin-top: .35em; font-size: 1.75cqw; color: #6b6560; }

.deck-stage .d-slim { display: grid; grid-template-columns: repeat(2, 1fr); gap: .6cqw 4cqw; margin-top: 2.6cqw; }
.deck-stage .d-slim > div {
  display: flex; align-items: baseline; gap: .7em;
  font-size: 2.5cqw; line-height: 1.45; padding: 1cqw 0;
  border-bottom: 1px solid #e7e5e4; font-weight: 700;
}
.deck-stage .d-slim span { font-size: .6em; color: #e11d48; letter-spacing: .06em; flex-shrink: 0; }
.deck-stage .d-slim em { font-style: normal; font-weight: 400; color: #6b6560; font-size: .7em; }

.deck-stage .d-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2cqw; margin-top: 2.8cqw; font-size: 2.2cqw; font-weight: 700; }
.deck-stage .d-flow span { background: #fff; border: 1px solid #e7e5e4; border-radius: 999px; padding: .5em 1.1em; }
.deck-stage .d-flow i { color: #e7e5e4; font-style: normal; }

.deck-stage .d-split { display: grid; grid-template-columns: 1fr 1fr; gap: 3cqw; align-items: start; margin-top: 2.6cqw; }
.deck-stage .d-steps { list-style: none; padding: 0; margin: 0; }
.deck-stage .d-steps li { display: flex; gap: .6em; align-items: baseline; padding: .8cqw 0; font-size: 2.35cqw; font-weight: 700; }
.deck-stage .d-steps li b { color: #e11d48; font-size: .72em; min-width: 5.2em; display: inline-block; }
.deck-stage .d-steps li i { font-style: normal; font-weight: 400; color: #6b6560; font-size: .78em; }
.deck-stage .d-tweet { background: #fff; border: 1px solid #e7e5e4; border-radius: 1.6cqw; padding: 2.4cqw; font-size: 2.05cqw; line-height: 1.9; }
.deck-stage .d-tweet span { display: block; margin-bottom: .45em; }
.deck-stage .d-tweet .d-url { color: #6b6560; font-size: .85em; margin: .3em 0 0; }

.deck-stage .d-fig { margin-top: 2.8cqw; }
.deck-stage .d-fig svg { width: 100%; height: auto; display: block; }

.deck-bar { position: absolute; left: 0; bottom: 0; height: .35cqw; background: #e11d48; transition: width .25s ease; }
.deck-pager { position: absolute; right: 2.4cqw; bottom: 2.2cqw; font-size: 1.35cqw; color: #6b6560; letter-spacing: .1em; }
`;

const HandsonDeck: React.FC = () => {
  const [index, setIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 連打しても取りこぼさないよう、直前の値からの相対移動で更新する
  const step = useCallback((delta: number) => {
    setIndex(prev => Math.max(0, Math.min(SLIDES.length - 1, prev + delta)));
  }, []);

  // 資料にフォーカスがあるときだけ矢印キーで送る（ページ全体のスクロールは奪わない）
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = DECK_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const slide = SLIDES[index];

  return (
    <section>
      <div className="flex items-start gap-3 mb-4">
        <span className="shrink-0 w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
          </svg>
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-stone-900">出品を磨く3つの型（勉強会の資料）</h3>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">全{SLIDES.length}枚</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            サービス画像・アンケート・つぶやき。各メニューを「なぜそう作るのか」から使えるようにまとめた資料です。いつでも見返せます。
          </p>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="deck-view card overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-200"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label="勉強会の資料スライド"
      >
        <div className="deck-stage">
          <div
            key={index}
            className={`deck-inner${slide.cover ? ' is-cover' : ''}`}
            dangerouslySetInnerHTML={{ __html: slide.html }}
          />
          <div className="deck-bar" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
          <div className="deck-pager">{index + 1} / {SLIDES.length}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={index === 0}
            className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← 前へ
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={index === SLIDES.length - 1}
            className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            次へ →
          </button>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
        >
          ⛶ 大きく見る
        </button>
      </div>
    </section>
  );
};

export default HandsonDeck;
