import { DeckSlide } from './Deck';

/**
 * 作業画面に置く読み物スライドの中身。
 * PUBLISH = STEP1（出品アイデアを作る）向け／POLISH = STEP2（広める・改善する）向け。
 * 文字サイズはコンテナ幅基準なので、ここでは大きさを意識せず内容だけ書けばよい。
 */

// ────────────────────────────────
// STEP1：はじめての出品まで
// ────────────────────────────────
export const PUBLISH_SLIDES: DeckSlide[] = [
  {
    cover: true,
    html: `
      <div class="d-label d-label-mute">はじめての出品ガイド</div>
      <h1 class="d-h1">スキルマーケットを<br>出そう</h1>
      <div class="d-meta">港で準備ばかりしていても始まりません。<br>まずは小さな船でも、海に出てみましょう。</div>`,
  },
  {
    html: `
      <div class="d-label">ゴール</div>
      <h2 class="d-h2">「あとは出航ボタンを<br>押すだけ」まで</h2>
      <ul class="d-ul">
        <li>出品するときの<b>コツ・考え方</b>がわかる</li>
        <li>このツールの<b>使い方</b>がわかる</li>
        <li><b>あとは出品するだけ</b>の状態まで準備が整う</li>
      </ul>`,
  },
  {
    html: `
      <div class="d-label">そもそも</div>
      <h2 class="d-h2">スキルマーケットとは</h2>
      <div class="d-cols">
        <div class="d-card"><div class="d-num">どんな場所</div><h3>リベ会員のマッチング</h3><p>オンラインで完結するサービスを、出したい人と頼みたい人がつながる場所。</p></div>
        <div class="d-card"><div class="d-num">お金</div><h3>出品手数料は無料</h3><p>出すこと自体にお金はかかりません。</p></div>
        <div class="d-card"><div class="d-num">だれが</div><h3>会員なら全員</h3><p>リベシティの会員であれば、誰でも今日から出品できます。</p></div>
      </div>`,
  },
  {
    html: `
      <div class="d-label">出せない理由あるある</div>
      <h2 class="d-h2">だいたい、この3つ</h2>
      <ul class="d-ul">
        <li>どんなサービスを出したらいいか<b>わからない</b></li>
        <li>入力項目が多くて<b>文章の手が進まない</b></li>
        <li>準備が万全じゃないから<b>ためらってしまう</b></li>
      </ul>
      <div class="d-note">1つめはAIが20個のアイデアを出します。2つめは文章もAIが書きます。<b>3つめだけが、考え方の話です。</b></div>`,
  },
  {
    html: `
      <div class="d-label">マインドセット</div>
      <h2 class="d-h2"><span class="d-hl">60点</span>で出航する</h2>
      <div class="d-fig">
        <svg viewBox="0 0 1040 180" role="img" aria-label="60%地点で出航するという図">
          <rect x="2" y="58" width="1036" height="34" rx="17" fill="#fff" stroke="#e7e5e4" stroke-width="2"/>
          <rect x="4" y="60" width="620" height="30" rx="15" fill="#fff1f2"/>
          <line x1="624" y1="30" x2="624" y2="120" stroke="#e11d48" stroke-width="3"/>
          <text x="624" y="22" text-anchor="middle" font-size="27" font-weight="700" fill="#e11d48">60% ここで出航</text>
          <text x="624" y="152" text-anchor="middle" font-size="20" fill="#6b6560">小回りが利く船。海の上で育てられる</text>
          <text x="1032" y="152" text-anchor="end" font-size="20" fill="#a8a29e">100%＝永遠に来ない</text>
        </svg>
      </div>
      <div class="d-note">学長もよく言っていますよね。「<b>早よ出しや〜</b>」って。</div>`,
  },
  {
    html: `
      <div class="d-label">なぜ60点でいいのか</div>
      <h2 class="d-h2">変えられる<span class="d-hl">余白</span>を<br>残しておくため</h2>
      <div class="d-lead">100％作り込むと、お客さんの声に応える余白がなくなります。<br>60％の船なら、海に出たあとで育てていける。</div>
      <div class="d-note">このツールには<b>出したあとに磨く機能もそろっています。</b>だから、60点で大丈夫です。</div>`,
  },
  {
    html: `
      <div class="d-label">準備</div>
      <h2 class="d-h2">スキルの棚卸しから</h2>
      <ol class="d-ol">
        <li>リベのプロフィールを<b>全選択してコピー</b>（Command + A → C）</li>
        <li>そのまま入力欄に<b>貼り付ける</b></li>
        <li>書ききれていない<b>好き・得意・経験</b>を追記</li>
      </ol>
      <div class="d-note">きれいに整えなくて大丈夫。<b>雑に貼り付けてOK</b>です。</div>`,
  },
  {
    html: `
      <div class="d-label">アイデア</div>
      <h2 class="d-h2">AIが<span class="d-hl">20個</span>出します</h2>
      <div class="d-cols">
        <div class="d-card"><div class="d-num">最初の10個</div><h3>王道アイデア</h3><p>需要が安定していて、初心者でも参入しやすい手堅いもの。</p></div>
        <div class="d-card"><div class="d-num">残りの10個</div><h3>ニッチ＆ユニーク</h3><p>「え、こんなの売れるの？」という、あなたの個性が強烈に活きるもの。</p></div>
      </div>
      <div class="d-note">どの強みが活きるか、誰のどんな困りごとを解決するかも一緒に出ます。<b>悩みすぎず、走りきるのがコツ。</b></div>`,
  },
  {
    html: `
      <div class="d-label">文章を整える</div>
      <h2 class="d-h2">AI編集チャットで、<br><span class="d-hl">自分の言葉</span>に寄せる</h2>
      <div class="d-split">
        <div class="d-chat">
          <span>もっと親しみやすい文体にして</span>
          <span>もっと丁寧でプロフェッショナルに</span>
          <span>初心者にもわかる言葉に言い換えて</span>
          <span>絵文字を減らして落ち着いた印象に</span>
        </div>
        <div class="d-after">
          クリックすると入力欄に入るので、<b>そのまま送っても、書き足して送ってもOK</b>。<br>
          「〇〇の部分だけ短くして」のような細かい指示も通ります。
        </div>
      </div>
      <div class="d-note">大事なのは、<b>AIが書いた平均的な文章のままにしないこと。</b>1か所変えるだけで自分の顔になります。</div>`,
  },
  {
    html: `
      <div class="d-label">価格</div>
      <h2 class="d-h2">値付けはアート。<br>迷ったらモニターから</h2>
      <div class="d-lead">初めての出品で正規価格はハードルが高いことも。<br>モニター価格でレビューを集めながら上げていく手があります。</div>
      <div class="d-note"><b>価格モードを切り替えるだけ</b>で、①標準価格とモニター価格の併記 ②「先着○名限定」などの募集条件、が自動で付きます。</div>`,
  },
  {
    html: `
      <div class="d-label">入力</div>
      <h2 class="d-h2">コピー → 貼り付けの<br>繰り返しだけ</h2>
      <ol class="d-ol">
        <li>出品ページのURLを右クリック →「<b>分割ビュー</b>」</li>
        <li>左にツール、右に出品ページを<b>並べる</b></li>
        <li>各項目の<b>コピーボタン</b>（または全文コピー）で貼っていく</li>
      </ol>
      <div class="d-note">細かい修正は後回し。<b>まず全項目を埋めることを優先</b>してください。</div>`,
  },
  {
    html: `
      <div class="d-label">サムネイル</div>
      <h2 class="d-h2">トンマナを選んで、<br>プロンプトをコピー</h2>
      <ul class="d-ul">
        <li>標準・シンプル・水彩・ポップ・YouTube風など<b>8種類</b></li>
        <li>迷ったら「<b>AIおまかせ</b>」。サービス専用のトンマナを設計します</li>
        <li>貼り先は <b>ChatGPT か Gemini</b>。自分のアイコンを添付すれば自然に入ります</li>
      </ul>
      <div class="d-note">Geminiのときは2つだけ注意。<b>画像生成モード</b>を選ぶ／<b>「思考モード」</b>に切り替える。</div>`,
  },
  {
    html: `
      <div class="d-label">出航</div>
      <h2 class="d-h2">「これ出していいのかな」<br>——<span class="d-hl">いいんです</span></h2>
      <div class="d-lead">出品しても、全体に通知が飛ぶわけではありません。<br>そして一度出すと、脳みその使い方が変わります。</div>
      <div class="d-flow"><span>何を出そう？</span><i>→</i><span>どうやって提供しよう？</span></div>
      <div class="d-note">迷ったら<b>下書き保存</b>でもOK。それでも大きな前進です。</div>`,
  },
  {
    html: `
      <div class="d-label">おさらい</div>
      <h2 class="d-h2">やることは、この5つだけ</h2>
      <div class="d-fig">
        <svg viewBox="0 0 1040 130" role="img" aria-label="5ステップのフロー">
          <g stroke="#e7e5e4" stroke-width="2" fill="#fff">
            <rect x="2" y="20" width="188" height="76" rx="12"/>
            <rect x="214" y="20" width="188" height="76" rx="12"/>
            <rect x="426" y="20" width="188" height="76" rx="12"/>
            <rect x="638" y="20" width="188" height="76" rx="12"/>
            <rect x="850" y="20" width="188" height="76" rx="12"/>
          </g>
          <g font-size="19" font-weight="700" fill="#e11d48" text-anchor="middle">
            <text x="96" y="48">1</text><text x="308" y="48">2</text><text x="520" y="48">3</text><text x="732" y="48">4</text><text x="944" y="48">5</text>
          </g>
          <g font-size="25" font-weight="700" fill="#292524" text-anchor="middle">
            <text x="96" y="78">アイデアを出す</text>
            <text x="308" y="78">1つ選ぶ</text>
            <text x="520" y="78">言葉を整える</text>
            <text x="732" y="78">入力＋サムネ</text>
            <text x="944" y="78">出航する</text>
          </g>
          <g stroke="#e11d48" stroke-width="2.5" fill="none">
            <path d="M198 58 h8"/><path d="M410 58 h8"/><path d="M622 58 h8"/><path d="M834 58 h8"/>
          </g>
        </svg>
      </div>
      <div class="d-note">出したあとにやることは、STEP2「広める・改善する」にひととおり入っています。</div>`,
  },
  {
    html: `
      <div class="d-label">最後に</div>
      <h2 class="d-h2">「いつか出そう」ではなく<br><span class="d-hl">今週出航する</span></h2>
      <div class="d-lead">出せた方も、まだの方も。<br>次にやることを1つだけ決めてください。</div>`,
  },
];

// ────────────────────────────────
// STEP2：出したあとに磨く
// ────────────────────────────────
export const POLISH_SLIDES: DeckSlide[] = [
  {
    cover: true,
    html: `
      <div class="d-label d-label-mute">出したあとのガイド</div>
      <h1 class="d-h1">出品を<br>磨こう</h1>
      <div class="d-meta">出したあとの「次の一手」は3つだけ<br>サービス画像 ／ アンケート ／ つぶやき</div>`,
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
      <div class="d-note">画像だけ<b>生成に時間がかかる</b>ので、先に走らせて、待っている間にアンケートを作るのがおすすめ。</div>`,
  },
  {
    html: `
      <div class="d-label">まず準備・2分</div>
      <h2 class="d-h2">説明文を1回貼るだけで、<br>3つ全部が回ります</h2>
      <ol class="d-ol">
        <li>自分の出品ページを開いて、<b>説明文を全部コピー</b></li>
        <li>この画面の<b>「対象の本文」</b>に貼り付ける</li>
        <li>あとは3つのメニューを順に押すだけ</li>
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
          <g font-size="19" fill="#6b6560" text-anchor="middle">
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
