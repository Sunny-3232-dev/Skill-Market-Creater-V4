
import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, SkillIdea, SurveyPattern, ThumbnailPromptVersion, SlideImagePrompt, FlyerContent, FlyerAngle, FlyerAngleId, FlyerStyleFamily, FlyerHeadlineType, FlyerHeroVisual, FlyerHeroCut, FlyerDevice, FlyerColor, FlyerCard, FlyerDesign, MultiFlyerContent, ProfileFacts } from "../types";

// モデルIDはここだけで管理する（以前は12か所に直書きされていた）。
// 文章モデルは検証用に ?model=xxx で差し替えられ、localStorage に残る。?model=default で元に戻す。
// 画像生成はアプリ内では行わない（ChatGPT の GPT Image に貼ってもらう）。文章モデルだけを持つ
export const MODELS = {
  text: 'gemini-3.5-flash',
} as const;
const MODEL_OVERRIDE_KEY = 'skill_market_model_override';
/** ?model= で差し替え中のモデル名。無ければ null */
export const getModelOverride = (): string | null => {
  try { return localStorage.getItem(MODEL_OVERRIDE_KEY); } catch { return null; }
};
/** 差し替えをやめて標準モデルに戻す（指定モデルが使えなかったときの保険） */
export const clearModelOverride = (): void => {
  try { localStorage.removeItem(MODEL_OVERRIDE_KEY); } catch { /* noop */ }
};

export const resolveTextModel = (): string => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('model');
    if (fromUrl !== null) {
      if (fromUrl === '' || fromUrl === 'default') localStorage.removeItem(MODEL_OVERRIDE_KEY);
      else localStorage.setItem(MODEL_OVERRIDE_KEY, fromUrl);
    }
    return localStorage.getItem(MODEL_OVERRIDE_KEY) || MODELS.text;
  } catch {
    return MODELS.text;
  }
};

const generateUniqueId = (): string => {
  return crypto.randomUUID();
};

export const getThumbnailPrompt = (
  idea: SkillIdea,
  useHighQuality: boolean = false,
  promptVersion: ThumbnailPromptVersion = 'standard'
): string => {
  let catchphrase = "";
  let title = idea.title; // Default to the idea title

  // Check if content is provided in the idea or externally
  const content = idea.generatedContent || "";

  // Extract Catchphrase
  const catchMatch = content.match(/キャッチコピー[：:]\s*(.*)/);
  if (catchMatch) {
    catchphrase = catchMatch[1].trim();
  }

  // Extract Title from content if available (to match the UI)
  const titleMatch = content.match(/タイトル[：:]\s*(.*)/);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  if (!useHighQuality) {
    return `スキルマーケット出品ページ用のサムネイル画像を生成してください。
■ コンテキスト：「${title}」、${idea.strength}
■ 要件：画像内にテキストは一切含めないこと。純粋なビジュアル表現のみ。プロフェッショナルで魅力的なデザイン。`;
  }

  // ── 共通パート（全バージョン共通） ──
  const commonBase = `あなたはプロのデザイナーです。以下の要件のサービスのスキルマーケット出品ページ用のサムネイル画像を生成してください。

■ 共通要件：
・タイトル：「${title}」を維持したまま、サービス名に変換して使用すること。文末を体言止めにする程度の微修正は許容する。
・キャッチコピー：「${catchphrase}」からキーワードを抽出して使用すること（全文をそのまま使わない）。
・アスペクト比：3:2（横長）。推奨サイズは 幅660×高さ440px。
・タイトルは大きく太く、読みやすく表示すること。
・テキストは視覚的に美しく、画像を圧迫しないように配置すること。
・アイコン画像が添付されている場合、そのアイコンを自然とサムネイルに反映させる。
`;


  // ── バージョン別パート（統一セクション構成） ──
  const versionStyles: Record<ThumbnailPromptVersion, string> = {
    ai_auto: `
■ デザインスタイル：AIおまかせ（内容に合わせて自動設計）
・サービス内容・ターゲット・価格帯・雰囲気を読み取り、最も伝わるデザイン方針をあなた自身が決めて適用する。

■ 方針の目安（内容に応じて調整）：
・IT/士業/コンサル/BtoB → 信頼感のあるネイビー系、装飾控えめ、洗練
・クリエイティブ/ハンドメイド/占い → 温かいパステル・手書き感
・教育/子ども/初心者向け → 明るく親しみやすい丸ゴシック
・副業入門/エンタメ/集客系 → 目を引くポップな配色と強い見出し
・美容/健康/癒やし → 清潔感のある淡色、余白多め、上品

■ 共通：
・配色はベース＋アクセント2〜3色に絞る。見出しは大きく可読性優先。情報を詰め込みすぎない。`,

    standard: `
■ デザインスタイル：
・プロフェッショナルで信頼感のあるビジネスデザイン。
・高精細で洗練された印象。

■ レイアウト構成：
・タイトルを中央または上部に大きく配置し、キャッチコピーをその下に配置する。
・余白を適度に取り、すっきりとした構成にする。
・背景はサービスの雰囲気に合うビジネス系のイメージ。

■ タイポグラフィ（文字デザイン）：
・信頼感のある太めのゴシック体。
・背景とのコントラストを確保し、視認性を高める。

■ 装飾：
・最小限の装飾で、洗練された印象を保つ。
・ビジネス感のあるシンプルな幾何学的要素を控えめに使用。

■ デザインの雰囲気：
・洗練されたプロフェッショナル感。
・信頼性と実績を感じさせる。
・高品質で上質な印象。

`,

    simple: `
■ デザインスタイル：
・清潔感があり、信頼できて、やさしく丁寧な印象のシンプルデザイン。

■ レイアウト構成：
・全体は横長の長方形バナー。四辺に細いフレーム枠あり。
・背景はサービスの雰囲気にあうイメージ。
・余白を適度に取り、すっきりとした構成にする。
・最上部に横長の「ゆるいアーチ型バナー」を配置し、サービスのジャンル名やカテゴリ名が入る想定。色は薄いアクセントカラー。
・アーチの下に大きな横長の楕円エリア（メインコピーエリア）を配置。ここが最も目立つゾーンで、サービスのタイトルが入る想定。
・画面左下に大きな円形エリアを配置。出品者の顔写真、または親しみやすい人物イラストが入る想定。
・右側には横長の楕円を上下に2つ配置。上の楕円はサブコピー用で安心材料の短文が入る想定。下の楕円は信頼性を示す情報。
・一番下に細い横長ライン（フッターのような装飾帯）。全体のデザインを引き締める役割。情報はほぼ入れず、視覚的な安定感を出す。

■ タイポグラフィ（文字デザイン）：
・メインコピーは太めで読みやすく、信頼感のあるフォント。
・サブテキストは短く落ち着いたフォントで控えめに。

■ 装飾：
・アイコンや図形は丸みのあるデザイン。
・配色はベース＋アクセント1色まで。

■ デザインの雰囲気：
・ごちゃごちゃしない。
・余白多め。
・やさしいビジネスデザイン。
・信頼感、誠実さ、安心感が伝わる。`,

    watercolor: `
■ デザインスタイル：
・手書き感のある、柔らかで優しいタッチ（水彩画風、色鉛筆風）。輪郭線は強すぎず、自然な印象。
・親しみやすさ、安心感、信頼性を感じさせる、穏やかで落ち着いたムード。
・サービスの内容に合ったモチーフや情景をイラストで表現する。

■ レイアウト構成：
・画面の片側（例：左側）にテキストエリアを設け、もう片側（例：右側）にメインとなるイラストを配置する、情報と視覚要素が分離した構成。
・主要なキャッチコピーを最も目立つ位置（例：左上）に配置し、補足情報（箇条書きなど）をその下に整理して配置する。

■ タイポグラフィ（文字デザイン）：
・親しみやすく、可読性の高い書体。
・背景のイラストに埋もれないよう、文字に縁取りやドロップシャドウなどの処理を施し、視認性を高める。

■ 装飾：
・デザインのテーマに沿った、小さく控えめな装飾イラストを複数配置し、画面に温かみや動きを加える。
・配色は水彩絵の具のにじみを活かした柔らかいトーンで統一する。

■ デザインの雰囲気：
・手描きの温かみと柔らかさ。
・親しみやすく、リラックスした印象。
・自然体で気負わない安心感。`,

    pop: `
■ トンマナ（世界観・雰囲気）：
・ポップ＆フレンドリー: 鮮やかな多色使いと丸みのある造形で、「楽しそう」と感じさせる、心理的ハードルの低い雰囲気。
・賑やかさと期待感: 多くの要素（文字、装飾、商品写真）を詰め込むことで、サービスの選択肢の豊富さとワクワク感を演出する。
・手書き風の矢印やキラキラした装飾で親近感を生む。

■ デザインスタイル：
・配色（カラーパレット）はレインボー・パステル: 原色に近い鮮やかさを持ちつつ、少し白を混ぜたような「元気で明るい」多色配色。
・高コントラストな縁取り: 背景色に文字が埋もれないよう、強い白縁やドロップシャドウを多用し、視認性を確保する。
・ハーフトーン（ドット）: 背景のグラデーションにドットパターンを重ねることで、漫画やアメコミのような「ポップアート」の質感を与える。
・マンガ的記号（漫符）: 矢印、キラキラ、吹き出しのラインなど、動きを感じさせる装飾が視線を誘導する。

■ レイアウト構成：
・左：文字情報 / 右：視覚情報の典型的な「F型」または「Z型」の視線誘導。
  1. 左上の大きなタイトルでキャッチ。
  2. 左側のリストでサービス内容を理解。
  3. 右側の実物写真（モックアップ）で完成イメージを補完。
・重なりの演出（レイヤー感）: 商品写真をあえて重ねて配置することで、立体感と「たくさんある」というボリューム感を表現する。背景の斜めのラインで動的なリズムを生む。

■ タイポグラフィ（文字デザイン）：
・極太の角丸ゴシック: メインコピーは、力強さと柔らかさを兼ね備えたフォント。
・情報の階層化: 商品名は、視認性の高い白背景のボックスに入れることで、メニューとしての役割を明確にする。

■ 装飾：
・手書き風の矢印やキラキラした装飾で、手作り感と親近感を演出。
・吹き出し、星形、ハートなどのポップな記号を随所に配置。
・背景にドットパターンやグラデーションを重ね、奥行きとポップアート感を出す。

■ デザインの雰囲気：
・楽しくてワクワクする、お祭り感。
・初心者歓迎の明るくフレンドリーな印象。
・多色使いによる賑やかで豊かなイメージ。`,

    // my_style追加
    my_style: `
■ デザインスタイル：
・添付した参考画像のレイアウト・配色・トーン・キャラクターアイコンの配置スタイルを忠実に踏襲する。
・参考画像の雰囲気や世界観をそのまま継承する。

■ レイアウト構成：
・参考画像と同じ要素配置を再現すること。（タイトル位置・キャッチコピー位置・アイコン位置・キャラクター位置など）
・余白・フレーム・帯などの装飾構造も参考画像に合わせる。

■ アイコン・図解：
・参考画像のアイコンや図解はそのまま使わず、新しいサービス内容に合ったものに自動で差し替えること。（例：スプレッドシート→表アイコン、ITサポート→PCやヘルプデスクアイコン）
・アイコンの種類・数・配置スタイルは参考画像に合わせる。

■ タイポグラフィ（文字デザイン）：
・参考画像のフォントスタイル・サイズ感・文字の配置構造を踏襲する。

■ カラー：
・参考画像の配色・グラデーション・アクセントカラーをそのまま使用する。
・参考にしないのはサムネイル内の文章・サービス名のみ。

■ 制約：
・既存の参考画像をそのまま模倣しない（抽象化して使う）。
・画像サイズ：幅660px × 高さ440px（3:2）

■ デザインの雰囲気：
・参考画像のトーン・世界観を忠実に継承しつつ、新しいサービスの内容が自然に伝わるデザイン。`,

    youtube: `
■ デザインスタイル：
・人気YouTuberのサムネイル風。一目で内容が伝わる強いビジュアルインパクト。
・派手で目を引くが、チープにならない程度に整えられた仕上がり。

■ レイアウト構成：
・タイトルは左側または上部に大きく配置し、右側〜中央に人物の顔や象徴的なオブジェクトを置く。
・視線誘導を意識し、注目ポイントに矢印・丸囲み・稲妻などの記号を添える。
・背景に斜めの太いカラー帯や放射線を入れて勢いとエネルギーを演出。

■ タイポグラフィ（文字デザイン）：
・極太で視認性の高いゴシック体。
・文字には太い白縁＋黒縁のダブルアウトラインを施し、背景から完全に浮き立たせる。
・数字・強調ワードは黄色／赤／白のカラーブロックで飾り、情報のメリハリをつける。

■ カラー：
・赤・黄・青・ピンク・ネオングリーンなど、高彩度・高コントラストな配色。
・2〜3色の強い色面で画面を分割し、視覚的なリズムを作る。

■ 装飾：
・大きな矢印、吹き出し、スター、稲妻、手書き風の丸囲みなどインフォグラフィック要素を適度に使用。
・キラキラ・ドット・放射線で"勢い"を補強。

■ デザインの雰囲気：
・気になって思わずクリックしてしまう、インパクトとワクワク感。
・情報量は多めだが、視線誘導が明確で内容がすぐ伝わる。
・親しみやすさと勢いを両立した"エンタメ寄り"の印象。`,


    puffy_3d: `
■ デザインスタイル：
・ぷっくりと膨らんだクレイ（粘土）風の3Dレンダリング調。丸みと厚みのある立体オブジェクトが主役。
・やわらかい質感、マットな表面、優しい光沢。思わず触りたくなる可愛さ。

■ レイアウト構成：
・中央〜右側にサービスを象徴する3Dオブジェクト（モチーフ）を大きく配置する。
・タイトルは左側または上部に大きく置き、キャッチコピーのキーワードを小さく添える。
・背景は単色〜ごく淡いグラデーションにして、オブジェクトの立体感を引き立てる。

■ タイポグラフィ（文字デザイン）：
・太めの丸ゴシック体。文字自体もぷっくりした立体・エンボス風の加工で世界観を統一する。
・背景とのコントラストを確保し、視認性を最優先にする。

■ カラー：
・パステル調（ミントグリーン／ベビーピンク／クリームイエロー／ラベンダー等）を2〜3色に絞る。
・ぼかしの強いソフトシャドウと淡いハイライトで、柔らかい立体感を出す。

■ 装飾：
・小さな3Dの星・ハート・雲などの浮遊オブジェクトを控えめに散らす。
・強い縁取りや硬い影は使わず、丸く・柔らかくを徹底する。

■ デザインの雰囲気：
・かわいい・やわらかい・親しみやすい。
・清潔感がありつつ、一覧の中で思わず目を引くぷっくり質感。
・初心者でも安心して頼めそうな優しい印象。`,

    benefit_banner: `
■ デザインスタイル：
・販促バナー風の「ベネフィット訴求型」サムネイル。ひと目で「誰が・何を・どう良くしてくれるか」が伝わる、勢いと信頼感を両立したフラットベクターイラスト調。
・実写・3D・複雑なグラデーションは使わず、フラットなベクターイラスト＋極太タイポグラフィで構成する。

■ まず本文から次を読み取り、要素を内容に合わせて決める（このサービス固有ではなく、どんなサービスでも同じテイストで出す）：
・提供者を表す親しみやすい「人物」キャラクターを1体設定（例：転職エージェント→スーツの人物、デザイナー→クリエイター風、コーチ→朗らかな人物 等）。半身〜全身のフラットイラスト。動物・マスコット・ゆるキャラは使わず、必ず人間の姿で描くこと。
・最も刺さる訴求メッセージを、短い見出し1本に凝縮する（例「あなたの〇〇を全力でサポート！」）。
・利用者が得られる具体的ベネフィットを3つ、短い名詞句＋一言補足で抽出（例「通過率が上がる！／職務経歴書の書き方」）。
・サービスの雰囲気に合う配色を決める（かっちり系＝ネイビー×白×赤／やわらか系＝ペールトーン／元気系＝ビビッド 等）。

■ レイアウト構成（上・中・下の3ゾーン）：
・上部：メイン見出しを2〜3行で大きく配置。最重要キーワードだけ色付きの塗り箱で囲んで強調し、視線を集める。
・中〜右：設定したキャラクターを、メガホン・拳を上げる・指をさす等の前向きでダイナミックなポーズで配置。効果線や「！」で勢いを添える。
・下部：3つのベネフィットを丸型（またはピル型）のバッジで横並びに配置。バッジは2〜3色で色分けし、各バッジに短い見出し＋補足を入れる。

■ タイポグラフィ：
・見出しは極太ゴシック＋二重アウトライン（白フチ＋濃色フチ）で背景から浮かせ、可読性を最優先にする。
・強調語はサイズと色でメリハリをつける。日本語は誤字なく正確に描画する。

■ 装飾・背景：
・斜めのカラー帯・幾何学シェイプ・ハーフトーン（ドット）で“動き”と勢いを演出する（情報を詰め込みすぎない）。
・全体は2〜3色のアクセントに絞り、まとまりを保つ。

■ デザインの雰囲気：
・「プロがしっかりサポートしてくれそう」という信頼感と、思わずクリックしたくなる勢いの両立。
・どんなジャンル・ターゲットのサービスでも、その内容に合わせて上記テイスト（大見出し＋キャラクター＋3ベネフィットのバッジ）を必ず適用する。`,
  };

  return commonBase + versionStyles[promptVersion];
};

// スライド資料のデザインスタイル（トンマナ）指定。NotebookLM のカスタマイズ欄用プロンプトに差し込む。
const SLIDE_STYLE_DIRECTIVES: Record<ThumbnailPromptVersion, string> = {
  ai_auto: `■ デザインスタイル：AIおまかせ（内容に合わせて自動設計）
・まずサービス詳細文章を読み取り、次の4点を推定する：
  ① ジャンル・業種（例：IT/士業/コンサル、クリエイティブ/ハンドメイド、教育/子ども、美容/健康、副業入門/エンタメ など）
  ② 主なターゲット層（年齢・立場・フォーマル度）
  ③ 価格帯と本気度（高単価・専門的か／気軽・低単価か）
  ④ 伝えたい雰囲気（信頼・誠実／やさしい・温かい／楽しい・にぎやか）
・推定結果に最も合うデザイン方針を、あなた自身が決めて全スライドに一貫して適用する：
  - 配色：ベース＋アクセントの2〜3色に絞る（内容に合うトーンで）
  - 書体：見出しと本文の2種、可読性を最優先
  - 装飾レベル：フォーマルなら最小限、カジュアルなら図形・アイコンを適度に
  - 余白：情報過多にせず、ゆとりを持たせる
・方針の目安（あくまで参考。内容に応じて調整すること）：
  - IT/士業/コンサル/BtoB   → 信頼感（ネイビー・チャコール＋差し色）、装飾控えめ、洗練
  - クリエイティブ/ハンドメイド/占い → 温かいパステル・手書き風の柔らかさ
  - 教育/子ども/初心者向け   → 明るく親しみやすい丸ゴシック、やさしい配色
  - 副業入門/エンタメ/集客系 → 目を引くポップな配色と強めの見出し
  - 美容/健康/癒やし         → 清潔感のある淡色、余白多め、上品
`,
  standard: `■ デザインスタイル：標準
・プロフェッショナルで信頼感のあるビジネスデザイン
・落ち着いたカラーパレット（ネイビー／チャコール＋ゴールドのアクセント）
・洗練されたタイポグラフィ、余白を確保した大人な印象
・装飾は最小限で、情報の伝達を最優先に
`,
  simple: `■ デザインスタイル：シンプル
・丸みのあるやさしい印象のミニマル・ビジネスデザイン
・ベースカラー＋アクセント1色に抑えたクリーンな配色
・太めで読みやすいフォント、行間ゆったり
・フレーム枠や楕円・角丸の図形で親しみやすく
`,
  watercolor: `■ デザインスタイル：水彩画
・手書き風・柔らかいタッチ（水彩画風／色鉛筆風）
・水彩のにじみを思わせるパステル配色
・イラストとテキストの住み分けを意識した構成（左右分離に限らず、スライドの内容に応じて変える）
・温かみ・安心感のある穏やかなムード
`,
  pop: `■ デザインスタイル：ポップ＆フレンドリー
・鮮やかな多色使い、ポップアートのような賑やかさ
・文字に高コントラストな縁取り（白縁／黒縁）
・ドットパターン・星・吹き出しなど漫符を適度に配置
・楽しくワクワクする、初心者歓迎のフレンドリーな印象
`,
  my_style: `■ デザインスタイル：マイスタイル（参照モード）
・リソースに添付された参考画像（サムネイル・アイコン）があれば、そのレイアウト・配色・トーン・世界観を忠実に踏襲すること
・参考画像と同じトンマナで、新しいサービス内容に自然に差し替える（アイコンや装飾の配置スタイルもミラー）
・参考画像がリソースに無い場合は、シンプル寄りの落ち着いたトンマナで作成すること
`,
  youtube: `■ デザインスタイル：YouTube風
・人気YouTuberのサムネイル調で、一目で内容が伝わる強いビジュアルインパクト
・極太ゴシック＋太い白縁・黒縁のダブルアウトラインで文字を浮き立たせる
・赤・黄・青・ネオン系の高彩度配色、2〜3色の強い色面で画面を分割
・矢印・吹き出し・稲妻・星・手書き風の丸囲みなどで注目点を誘導
・背景に斜めの太いカラー帯や放射線で"勢い"を演出
・情報量は多めでも、視線誘導を明確にしてメッセージを即理解できる構成
`,
  puffy_3d: `■ デザインスタイル：ぷっくり3D
・クレイ（粘土）風のぷっくりした3Dオブジェクトをアクセントに使う
・パステル調2〜3色、太めの丸ゴシック、ソフトシャドウ
・かわいく親しみやすいが、余白を確保して情報は読みやすく
`,
  // ※ benefit_banner はサムネイル用スタイル（スライド資料の一覧には出さない）。型充足のために定義。
  benefit_banner: `■ デザインスタイル：訴求バナー（ベネフィット型）
・大きな見出し＋提供者キャラクター＋3つのベネフィット提示で、勢いと信頼感を両立した販促バナー調
・極太ゴシック＋二重アウトライン、斜めのカラー帯で動きを演出。2〜3色に絞る
`,
};

// AIおまかせ用：サービス本文を解析し、「このサービス専用」のスライド資料トンマナ指定を作る。
// 出力は SLIDE_STYLE_DIRECTIVES と同じ形式なので、そのまま commonBase に連結して使える。
export const generateAutoSlideStyle = async (serviceBody: string): Promise<string> => {
  const body = serviceBody?.trim();
  if (!body) return '';
  const ai = createClient();

  const prompt = `
あなたはプレゼン資料のアートディレクターです。
以下のサービス本文を読み、「このサービス専用」のスライド資料デザイン指定（トンマナ）を作成してください。
これは NotebookLM のスライド作成カスタマイズ欄に貼る文章の一部として使われます。

【まず内部で分析する（分析結果そのものは出力しない）】
・ジャンル・業種／主なターゲット層／価格帯とフォーマル度／伝えたい雰囲気

【出力フォーマット】必ず次の形式・見出しで、日本語で出力すること。
■ デザインスタイル：<このサービスに付けた短いスタイル名>
・全体の方向性：1〜2行。業種やターゲットに触れ、なぜその方向かが伝わるように。
・配色：ベースとアクセントを具体的な色名で2〜3色（例：ネイビー×ホワイト×ゴールド）。
・書体：見出しと本文それぞれの方向性（例：見出しは太めのゴシック、本文は可読性重視の細め）。
・図版・あしらい：このサービスに合うモチーフや装飾（例：チェックリスト、吹き出し、ステップ矢印、アイコン）。
・避けること：このサービスの雰囲気に合わない表現を1行。

【ルール】
・本文に書かれた情報だけを根拠にする。創作・誇張はしない。
・レイアウトを全スライド同じに固定する指示は書かない（版面はスライドの内容ごとに変える前提）。
・マークダウン記法（#、* など）は使わない。箇条書きは「・」を使う。
・出力は上記フォーマットのみ。前置き・後書き・説明文は一切書かない。

【サービス本文】
${body.slice(0, 4000)}
`;

  try {
    const response = await ai.models.generateContent({
      model: resolveTextModel(),
      contents: prompt,
    });
    let text = (response.text || '').trim();
    // 念のためコードフェンスやマークダウン見出しが混ざった場合は除去する
    text = text.replace(/^```[a-zA-Z]*\n?/,'').replace(/```$/,'').trim();
    text = text.replace(/^#+\s*/gm, '').trim();
    if (!text.startsWith('■')) {
      const idx = text.indexOf('■');
      if (idx > 0) text = text.slice(idx).trim();
    }
    return text;
  } catch {
    return '';
  }
};

// ※①〜⑧のスライド構成・役割別レイアウトは、ChatGPTで1枚ずつ側の
//   generateSlideImageContents／SLIDE_ROLE_LAYOUTS と対で管理。変更時は両方を更新すること。
export const getSlideDocPrompt = (
  serviceBody: string,
  toneVersion: ThumbnailPromptVersion = 'my_style',
  // ai_auto のとき、generateAutoSlideStyle が作ったサービス専用トンマナを差し込む
  autoStyle?: string
): string => {
  const raw = serviceBody?.trim() || '';
  const bodyExcerpt = !raw
    ? '(リソースに登録されたサービス詳細文章を参照してください)'
    : raw.length > 600
      ? raw.slice(0, 600) + '\n…（以下略。全文はリソースに登録されたサービス詳細文章を参照）'
      : raw;

  const commonBase = `あなたはプロのプレゼン資料デザイナーです。リソースに登録されたサービス詳細文章をもとに、リベシティ「スキルマーケットonline」出品者向けのサービス紹介スライド資料を作成してください。

■ リソースの扱い
・サービス詳細文章が主たる情報源です。価格・所要時間・実績・レビューなど本文にある具体情報は、創作せず正確に反映してください。
・キャラクターアイコン画像がリソースに添付されている場合は、各スライドに自然に配置してください（全スライドに入れず、2〜4枚に控えめに）。
・キャラクターアイコン画像がリソースに無い場合は、キャラ要素は一切使わないでください。

■ スライド構成（以下の順で、原則 各1枚ずつ。各スライドはその内容に適したレイアウトにする）
① 表紙（トップ）
   サービス名と一言キャッチを大きく配置。あわせて、このサービスの「目玉（一番の売り）」がひと目で伝わる主役級のトップ画像を大きく入れてください（ヒーロー型レイアウト）。
② こんなお悩みありませんか？
   ターゲット層が抱える悩みを3〜5点、共感を呼ぶ言い回しで。チェックマークや吹き出しで縦に並べる共感型レイアウト
③ このサービスでできること
   提供価値・解決できることを3〜4点、簡潔に。アイコン付きカードの横並び／格子レイアウト
④ このサービスの強み
   他と違う差別化ポイントを2〜3点、具体的に。数字やビフォーアフターを強調するレイアウト
⑤ こんな方におすすめ
   具体的なペルソナ像を3点、ターゲットがイメージしやすく。人物アイコン＋一言のペルソナカードを横並びに
⑥ ご依頼の流れ
   依頼から納品までをステップ形式（1 → 2 → 3 ...）で分かりやすく。矢印でつなぐフロー図レイアウト
⑦ お客様の声（条件付き）
   サービス本文にレビュー・感想の記載があれば、2〜3件を抜粋して紹介。引用カード（吹き出し）に星や名前を添えるレイアウト
   ※サービス本文にレビュー記述が無い場合は、このスライドは作らずスキップ
⑧ CTA（行動喚起）
   申し込み・問い合わせを促す1枚。次のアクションを明記。ボタン風の要素を大きく、余白広めの行動喚起型レイアウト

■ 全体ルール
・日本語で作成
・レイアウトは各スライドの内容に合わせて変えること（全スライドを同じ型の繰り返しにしない）。表紙・箇条書き・ステップ図・引用・CTAは、それぞれ内容に適した構成にする。
・一方で配色・書体・世界観は資料全体で共通にし、シリーズとしてのまとまりを保つ。
・1スライド1メッセージ。情報過多にせず、視覚的余白を確保
・読みやすく太めのフォントを基本に、強調は色で表現
・アイコンや絵文字は親しみやすさのため適度に使用（使いすぎ注意）
・マークダウン記法（#、** など）は一切使わない

■ サービス詳細文章（抜粋／詳細はリソース参照）
${bodyExcerpt}

`;

  // ai_auto は、このサービス専用に生成したトンマナがあればそれを優先（無ければ汎用の指定にフォールバック）
  const directive = toneVersion === 'ai_auto' && autoStyle && autoStyle.trim()
    ? `${autoStyle.trim()}\n`
    : SLIDE_STYLE_DIRECTIVES[toneVersion];
  return commonBase + directive;
};

// ===== ChatGPTで「1枚ずつ」画像生成するための構成生成＋プロンプト組み立て =====

const SLIDE_ROLE_LABELS: Record<string, string> = {
  cover: '表紙', problem: 'お悩み', can_do: 'できること', strength: '強み',
  recommend: 'おすすめ', flow: 'ご依頼の流れ', voice: 'お客様の声', cta: 'CTA',
};

// 役割ごとの「適したレイアウト」。トンマナ（画風）は共通のまま、版面だけページ内容に最適化させる。
// ※構成・レイアウトは NotebookLM側の getSlideDocPrompt（①〜⑧）と対で管理。変更時は両方を更新すること。
const SLIDE_ROLE_LAYOUTS: Record<string, string> = {
  cover: 'ヒーロー型。サービス名とキャッチを大きく置き、目玉（一番の売り）が伝わる主役ビジュアルを大きく配置する。',
  problem: '共感型。悩みを3〜5個、チェックマークや吹き出しで縦に並べる。',
  can_do: '提供価値をアイコン付きカードで横並び／格子に並べる。',
  strength: '差別化ポイントを2〜3個、数字やビフォーアフターで強調する。',
  recommend: 'ペルソナ像を3枚、人物アイコン＋一言で横並びにする。',
  flow: 'ステップ図。1→2→3…を矢印でつなぐ横または縦のフロー。',
  voice: '利用者の声を引用カード（吹き出し）で2〜3件。星や名前を添える。',
  cta: '行動喚起型。ボタン風の要素と申込先を大きく、余白広めのシンプル構成にする。',
};

// サービス本文から、ChatGPTで1枚ずつ作る各画像の「中身」を生成する（トンマナ・レイアウト非依存）。
export const generateSlideImageContents = async (serviceBody: string): Promise<SlideImagePrompt[]> => {
  const body = serviceBody?.trim();
  if (!body) return [];
  const ai = createClient();

  const prompt = `
あなたはSNS・スキルマーケット向けの「サービス紹介画像」を設計するアートディレクターです。
以下のサービス本文をもとに、ChatGPTの画像生成（GPT Image）で「1枚ずつ」作るサービス紹介画像の、各枚に文字として描き込む中身を作成してください。
※これはプレゼン資料（PowerPoint／スライド）ではなく、文字を一緒にデザインした画像を1枚ずつ生成する用途です。

【画像の構成（この順。各1枚の画像）】
- cover（表紙）: サービス名＋一言キャッチ＋目玉（一番の売り）
- problem（こんなお悩みありませんか？）: ターゲットの悩みを3〜5点
- can_do（このサービスでできること）: 提供価値・解決できることを3〜4点
- strength（このサービスの強み）: 他と違う差別化ポイントを2〜3点
- recommend（こんな方におすすめ）: 具体的なペルソナ像を3点
- flow（ご依頼の流れ）: 依頼から納品までをステップ（1. → 2. → 3. …）で
- voice（お客様の声）: 本文にレビュー・感想があれば2〜3件を抜粋。無ければこの画像は配列に含めない
- cta（行動喚起）: 申し込み・問い合わせを促す一言＋次のアクション

【ルール】
- 各画像の title は、その画像に大きく描き込む見出しにする（cover はサービス名）。
- 各画像の body は、見出し以外に文字として描き込む文言そのものにする（箇条書きは改行で区切る。ステップは「1. …」形式）。title と同じ文を body に重複させない。
- 本文に書かれている情報だけを使う。創作・誇張はしない。価格・特典・所要時間など本文にあれば具体的に反映する。
- 省略しすぎず、しっかり載せる（1枚あたり箇条書き3〜5行程度を目安に、詰め込みすぎない）。
- マークダウン記法（#、* など）は使わない。
- voice は、本文にレビュー・感想の記載が無ければ配列に含めないこと。

【サービス本文】
${body.slice(0, 4000)}
`;

  let slidesRaw: Array<{ role: string; title: string; body: string }> = [];
  try {
    const response = await ai.models.generateContent({
      model: resolveTextModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  title: { type: Type.STRING },
                  body: { type: Type.STRING },
                },
                required: ['role', 'title', 'body'],
              },
            },
          },
          required: ['slides'],
        },
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    if (Array.isArray(parsed?.slides)) slidesRaw = parsed.slides;
  } catch {
    return [];
  }

  return slidesRaw.map((s, i) => ({
    no: i + 1,
    role: s.role,
    label: SLIDE_ROLE_LABELS[s.role] ?? `画像${i + 1}`,
    title: String(s.title || '').trim(),
    body: String(s.body || '').trim(),
  }));
};

// ChatGPTモード用のトンマナ上書き。SLIDE_STYLE_DIRECTIVES は NotebookLM 前提の文言
// （「リソース」「サービス詳細文章」参照）があるため、単発の画像生成プロンプトとして
// 参照先が成立しないものだけ、ChatGPTのチャット文脈に合わせた文面に差し替える。
const CHATGPT_STYLE_OVERRIDES: Partial<Record<ThumbnailPromptVersion, string>> = {
  ai_auto: `■ デザインスタイル：AIおまかせ（内容に合わせて自動設計）
・下の「画像に入れる文字」の内容から、ジャンル・ターゲット・雰囲気を読み取り、最も伝わるデザイン方針をあなた自身が決めて適用する：
  - 配色：ベース＋アクセントの2〜3色に絞る（内容に合うトーンで）
  - 書体：見出しと本文の2種、可読性を最優先
  - 装飾レベル：フォーマルなら最小限、カジュアルなら図形・アイコンを適度に
・1枚目で決めたデザイン方針（配色・書体・装飾・世界観）は、2枚目以降の全画像で必ずそのまま使い続ける。
`,
  my_style: `■ デザインスタイル：マイスタイル（参照モード）
・このチャットに添付した参考画像（サムネイル・アイコン）があれば、その配色・トーン・装飾・世界観を忠実に踏襲すること
・参考画像と同じトンマナのまま、文字やモチーフだけ新しい内容に自然に差し替える（構図は各ページのレイアウト指定に従う）
・参考画像を添付していない場合は、シンプル寄りの落ち着いたトンマナで作成すること
`,
};

// チャットに貼る単発プロンプト用のトンマナ指定を解決する。
// ai_auto はサービス専用トンマナがあればそれを優先し、無ければ汎用指定にフォールバックする。
const resolveChatToneSpec = (
  toneVersion: ThumbnailPromptVersion,
  autoStyle?: string
): string =>
  (toneVersion === 'ai_auto' && autoStyle && autoStyle.trim())
    ? autoStyle.trim()
    : (CHATGPT_STYLE_OVERRIDES[toneVersion] ?? SLIDE_STYLE_DIRECTIVES[toneVersion]);

// ChatGPTに貼るプロンプトの共通部分。「1枚ずつ」「まとめて1回」のどちらでも同じ文面を使い、
// 画風・配色・書体・世界観が全画像でそろうようにする。
const buildSlideImageCommonBlock = (designSpec: string, mode: 'one_by_one' | 'batch'): string => {
  const outputRule = mode === 'batch'
    ? '・各画像は、それぞれ独立した1枚の画像（横長／landscape）。プレゼン資料・PowerPoint・複数ページにはしない。'
    : '・出力は1枚の画像（横長／landscape）。プレゼン資料・PowerPoint・複数ページにはしない。';
  return `■ 全画像で共通のデザイン仕様（毎回この仕様どおりに作り、画風・配色・書体・世界観は全画像で必ず統一する）
${designSpec.trim()}

■ 画像ルール
${outputRule}
・アスペクト比：3:2（横長）。推奨サイズは 幅660×高さ440px（スキルマーケットのサービス画像規格）。全画像で同じ比率にする。
・レイアウト構成は「そのページの役割」に最適化する。他の画像と同じ版面のコピーにはしない（共通に保つのは画風・配色・書体・世界観だけ）。
・文字はすべて日本語で、画像内にくっきり読めるように描く。下に指定した文言だけを正確に入れ、誤字なく、勝手に文章を足さない。
・キャラクターやアイコン画像をこのチャットに添付している場合は、全画像には入れず、表紙・CTAなど要所でのみ世界観を壊さない範囲で自然に使う。
・マークダウン記号（#、* など）は画像に出さない。`;
};

// 1枚分の「レイアウト＋描き込む文字」。見出し行（heading）だけをモードごとに変える
const buildSlideImagePageBlock = (slide: SlideImagePrompt, heading: string): string => {
  const layout = SLIDE_ROLE_LAYOUTS[slide.role] ?? 'このページの内容に合った、読みやすいレイアウトにする。';
  return `■ ${heading}
・レイアウト：${layout}
（画像に入れる文字）
【見出し（大きく）】
${slide.title}
【本文】
${slide.body}`;
};

// 1枚分の中身＋選択トンマナから、ChatGPTにそのまま貼れる画像生成プロンプトを組み立てる。
// ★改善点：共通デザイン仕様（画風・配色・書体・世界観）は毎回明記して統一する一方、
//   レイアウト構成は各ページの役割に最適化させ、「前と同じ版面のコピー」を明確に禁止する。
export const buildSlideImagePromptText = (
  slide: SlideImagePrompt,
  toneVersion: ThumbnailPromptVersion,
  total: number,
  // ai_auto のとき、generateAutoSlideStyle が作ったサービス専用トンマナを差し込む
  autoStyle?: string
): string => {
  const designSpec = resolveChatToneSpec(toneVersion, autoStyle);
  const roleLabel = SLIDE_ROLE_LABELS[slide.role] ?? `${slide.no}枚目`;
  const commonBlock = buildSlideImageCommonBlock(designSpec, 'one_by_one');
  const pageBlock = buildSlideImagePageBlock(slide, `このページ（${slide.no}枚目：${roleLabel}）`);

  if (slide.no === 1) {
    return `ChatGPTの画像生成（GPT Image）で、サービス紹介画像を1枚ずつ作ります（全${total}枚）。まず1枚目です。これは「1枚のグラフィック画像」です。

${commonBlock}

${pageBlock}`;
  }
  return `続けて${slide.no}枚目の画像を1枚作ってください。前の画像とデザイン仕様（画風・配色・書体・世界観）は必ず同じに保ちますが、レイアウト構成はこのページの内容に合わせて変えます（前と同じ版面のコピーにはしない）。

${commonBlock}

${pageBlock}`;
};

// 【試験的】全枚分を1本にまとめ、ChatGPT（Images 2.0 以降の複数枚一括生成）に1回で貼るプロンプト。
// 枚数だけ書くと「N案入りのコラージュ1枚」にまとめられやすいので、
// 「独立したN枚」「番号順に確認なしで続ける」「止まったら番号を明記して続ける」を先頭で強く指定する。
// 1回で作れる枚数には上限がある（有料プラン・8枚前後）ため、上限に当たったときの続け方も書いておく。
export const buildSlideImageBatchPromptText = (
  slides: SlideImagePrompt[],
  toneVersion: ThumbnailPromptVersion,
  autoStyle?: string
): string => {
  const total = slides.length;
  const designSpec = resolveChatToneSpec(toneVersion, autoStyle);
  const commonBlock = buildSlideImageCommonBlock(designSpec, 'batch');
  const roleOf = (s: SlideImagePrompt) => SLIDE_ROLE_LABELS[s.role] ?? `${s.no}枚目`;
  const lineup = slides.map(s => `画像${s.no}＝${roleOf(s)}`).join('、');
  const pages = slides.map(s => buildSlideImagePageBlock(s, `画像${s.no}（${roleOf(s)}）`)).join('\n\n');

  return `ChatGPTの画像生成（GPT Image）で、サービス紹介画像を全${total}枚、この1回の指示でまとめて作ります（${lineup}）。

■ 出力の形式（最優先で守る）
・${total}枚の「それぞれ独立した画像」を、画像1から画像${total}まで番号順に生成する。
・${total}枚を1枚にまとめない。コラージュ・グリッド・一覧・分割レイアウト・スライド資料（PDF／PowerPoint）にはしない。
・各画像には、その番号の「画像に入れる文字」だけを描き込む。別の番号の文言を混ぜない。
・私が「次」と言わなくても、確認を挟まずに続けて生成する。途中で止まった場合は、最後に作った画像の番号を明記し、残りを続けて作る。
・1回で作れる枚数の上限に当たった場合は、作れるところまで作り、私が「続き」と送ったら次の番号から同じデザイン仕様で続ける。

${commonBlock}

${pages}`;
};

const getApiKey = (): string => {
  try {
    // 環境変数から取得（開発環境向け）
    const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (envKey) return envKey;

    // Google AI Studio 環境（ブラウザ）では、@google/genai が自動的にセッションキーを使用
    // この関数が呼ばれるということはセッションが有効な状態なので空文字列を返す
    // GoogleGenAI 初期化時にキーが不可欠な場合は、上位で処理される
    return "";
  } catch {
    return "";
  }
};

// 通信先の決め方
// - 通常（ローカル開発／Google AI Studio）: ブラウザから Gemini API へ直接。キーは .env か AI Studio のセッション
// - プロキシモード（VITE_GEMINI_PROXY=1 でビルド）: 同一オリジンの /api/gemini へ送り、Cloudflare Worker が
//   Secrets のキーを付けて中継する。バンドルにキーは含まれない（worker/index.ts 参照）
export const GEMINI_PROXY_MODE = import.meta.env.VITE_GEMINI_PROXY === '1';
export const GEMINI_PROXY_PATH = '/api/gemini';

const createClient = (): GoogleGenAI => {
  if (GEMINI_PROXY_MODE) {
    return new GoogleGenAI({
      apiKey: 'proxy', // SDK が空キーを拒むためのダミー。Worker 側で本物に差し替える
      httpOptions: { baseUrl: `${window.location.origin}${GEMINI_PROXY_PATH}` },
    });
  }
  const apiKey = getApiKey();
  return new GoogleGenAI(apiKey ? { apiKey } : {});
};

export interface GenerateIdeasOptions {
  // 「もっと副業向けに」等、再生成時の追加指示
  instruction?: string;
  // すでにピン留め済みのアイデア（重複を避けるためAIに伝える）
  pinnedIdeas?: Pick<SkillIdea, 'title'>[];
}

export const generateIdeas = async (input: UserInput, options: GenerateIdeasOptions = {}): Promise<SkillIdea[]> => {
  const ai = createClient();

  const instructionBlock = options.instruction?.trim()
    ? `\n【今回の追加リクエスト（最優先で反映）】\n${options.instruction.trim()}\n`
    : '';

  const pinnedBlock = options.pinnedIdeas && options.pinnedIdeas.length > 0
    ? `\n【すでに採用済み（ピン留め）のアイデア】\n以下は残すので、これらと重複しない・かぶらない新しい切り口のアイデアを出してください。\n${options.pinnedIdeas.map(p => `・${p.title}`).join('\n')}\n`
    : '';

  const prompt = `
あなたはプロのスキルマーケット・コンサルタントです。
入力されたテキストから「好きなこと」「得意なこと」「経験」の情報を読み取り、それらを掛け合わせてスキルマーケット（ココナラなど）の出品アイデアを提案してください。

【入力された生データ】
${input.rawText}
${instructionBlock}${pinnedBlock}
【タスク】
以下の2つのカテゴリで、それぞれ10個ずつ、合計20個のアイデアを出力してください。

1. **standard（王道・スタンダード）**: 市場で需要が安定しており、初心者でも参入しやすい手堅いアイデア。
2. **niche（ニッチ・ユニーク）**: 「えっ、そんなこと？」と思うような隙間産業や、ユーザーの個性が強烈に活きる差別化されたアイデア。

【出力形式】
JSON配列で出力してください。各要素は以下のキーを持つオブジェクトにしてください。
- "title": 出品サービスのタイトル
- "strength": このサービスで活かせる、ユーザーの潜在的な強みや独自性（具体的に）
- "solution": 誰のどんな悩みを解決するか
- "type": 文字列として "standard" または "niche" を指定

【ガイドライン】
- 最初に、入力データから「好きなこと」「得意なこと」「経験」をAIとして整理・解釈してください。
- 入力データの中に「〜を出品したい」「〜のサービスを出す」と本人が決めている具体的なサービスが書かれている場合は、その案を意図も言葉も変えずに standard の1番目に入れてください（残りはその案の周辺・発展・別角度の案にする）。
- 各アイデアは具体的で、すぐにでも出品できそうな具体的な内容にしてください。${options.instruction?.trim() ? '\n- 上記【今回の追加リクエスト】の意図を全アイデアに強く反映してください。' : ''}
`;

  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            strength: { type: Type.STRING },
            solution: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["standard", "niche"] }
          },
          required: ["title", "strength", "solution", "type"]
        }
      }
    }
  });

  const rawIdeas = JSON.parse(response.text || "[]");

  return rawIdeas.map((idea: any) => ({
    ...idea,
    id: generateUniqueId()
  }));
};

// 自己紹介・プロフィールから「その人らしい特徴キーワード」を抽出する
// （アイデア再生成バーの絞り込みチップに使う）
export const extractProfileKeywords = async (rawText: string): Promise<string[]> => {
  const text = rawText?.trim();
  if (!text) return [];
  const ai = createClient();

  const prompt = `
以下は、ある人の自己紹介・プロフィール文です。
この人「ならでは」の特徴的なキーワードを、スキル・得意・経験・好き・分野の観点から5〜7個抽出してください。

【ルール】
- 各キーワードは1〜6文字程度の短い単語（名詞）にする。例：「英語」「スプレッドシート」「採用面接」「猫」「ヨガ」
- 「得意」「経験」「好き」「こと」「もの」などの一般語・抽象語は含めない。
- 文中に実際に出てくる、その人固有の具体的な言葉を優先する。
- 重複や似た語はまとめる。

【プロフィール文】
${text}
`;

  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  try {
    const arr = JSON.parse(response.text || "[]");
    return Array.isArray(arr)
      ? arr.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 7)
      : [];
  } catch {
    return [];
  }
};

// 貼り付けたサービス本文から「出品タイトル」を認識して返す。
// ページ取得ではなく手元のテキストを読むだけなので確実に動く（失敗時は空文字）。
// 自己紹介から「出品の根拠になる事実」だけを行単位で抜き出す。プロフィール1回につき1回だけ走らせ、保存して使い回す。
// 失敗したら null（呼び出し側は事実なしで本流を続ける）
export const extractProfileFacts = async (rawText: string): Promise<ProfileFacts | null> => {
  const text = rawText?.trim();
  if (!text) return null;
  const ai = createClient();

  const prompt = `
以下は、ある人の自己紹介・プロフィール文です。趣味や家族の話など、仕事と無関係な内容も混ざっています。
この中から「サービスを出品するときの根拠」になる事実だけを、4つの区分に分けて箇条書きで抜き出してください。

【ルール】
- 原文に書かれていることだけを書く。推測・補完・言い換えによる誇張はしない
- 数字（年数・件数・人数・金額）は原文のまま写す。原文に数字がなければ数字を作らない
- 1項目は40文字以内の短い文にする
- 該当がない区分は空の配列にする
- 本名・住所・電話番号・メールアドレスなど個人を特定できる情報は含めない
- 文体や口調に関する情報は含めない（出品文の文体は別に決める）

【区分】
career: 経歴・仕事（職種、業界、在籍年数、現在の立ち位置）
achievements: 実績・数字（成果、件数、受賞、担当規模）
skills: 資格・スキル・使えるツール
context: 状況・背景（稼働できる時間帯、顔出し可否、対応できる形式。地域は都道府県までの粒度）

【プロフィール文】
${text.slice(0, 3000)}
`;

  try {
    const response = await ai.models.generateContent({
      model: resolveTextModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            career: { type: Type.ARRAY, items: { type: Type.STRING } },
            achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            context: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['career', 'achievements', 'skills', 'context'],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const clean = (v: unknown): string[] =>
      Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean).slice(0, 8) : [];
    return {
      career: clean(parsed?.career),
      achievements: clean(parsed?.achievements),
      skills: clean(parsed?.skills),
      context: clean(parsed?.context),
    };
  } catch {
    return null;
  }
};

// 事実リストをプロンプトに差し込む形に整える。全区分が空なら空文字（ブロックごと省く）
export const formatProfileFacts = (facts: ProfileFacts | null | undefined): string => {
  if (!facts) return '';
  const section = (label: string, items: string[]) =>
    items.length > 0 ? `${label}：\n${items.map(i => `・${i}`).join('\n')}` : '';
  const body = [
    section('経歴・仕事', facts.career),
    section('実績・数字', facts.achievements),
    section('資格・スキル', facts.skills),
    section('状況・背景', facts.context),
  ].filter(Boolean).join('\n');
  return body ? `\n【自己紹介から抽出した事実（根拠として使う）】\n${body}\n` : '';
};

export const extractServiceTitle = async (rawText: string): Promise<string> => {
  const text = rawText?.trim();
  if (!text) return '';
  const ai = createClient();

  const prompt = `
以下は、リベシティ「スキルマーケットonline」の出品ページからコピーした本文です。
このサービスの「出品タイトル（サービス名）」だけを抜き出してください。

【ルール】
- 本文中に実在するタイトル表記をそのまま返す（要約・言い換え・創作は禁止）。
- 価格・説明文・口コミ・見出し記号（■など）はタイトルではない。
- 見出しが複数ある場合は、サービスを最もよく表す一番上位の名称を選ぶ。
- 前置き・引用符・記号の追加は不要。タイトルの文字列のみ。
- 40文字を超える場合は、意味が通る範囲で先頭40文字までにする。

【本文】
${text.slice(0, 4000)}
`;

  try {
    const response = await ai.models.generateContent({
      model: resolveTextModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { title: { type: Type.STRING } },
          required: ['title'],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const title = String(parsed?.title ?? '').trim();
    return title.length > 40 ? title.slice(0, 40) : title;
  } catch {
    return '';
  }
};

export const generateServicePage = async (selectedIdea: SkillIdea, facts?: ProfileFacts | null): Promise<string> => {
  const factsBlock = formatProfileFacts(facts);
  const ai = createClient();

  const prompt = `
【役割】
あなたは、リベシティ「スキルマーケットonline」に出品するプロの出品ページクリエイターです。
以下の「カテゴリマスター」と「カテゴリ自動決定ルール」を厳守し、出品ページとしてそのまま使える魅力的な文章を作成してください。

【カテゴリマスター】
イラスト・マンガ（SNSアイコン／イラスト／マンガ／その他）
デザイン（ロゴ／チラシ・フライヤー・パンフレット／メニュー・POP／名刺・カード／書籍・カバー／結婚式・イベント／建築・インテリア・図面／プロダクト・3Dモデリング／その他）
Web制作・Webデザイン（HP・LP／ブログ／EC／HTML・CSSコーディング／Webサイトデザイン／モバイルアプリデザイン／UI・UX／素材／図解／ヘッダー・バナー／サムネイル／サービス画像・商品画像／Web制作のディレクション／その他）
IT・プログラミング（作業自動化・効率化／Webアプリ／モバイルアプリ／Mac・Windowsアプリ／サーバー・インフラ／ゲーム／システムアーキテクチャ／AI・機械学習／バグチェック・テストプレイ／保守・運用・管理／システム開発のディレクション／その他）
写真・撮影（撮影・素材提供／編集・加工／その他）
動画（撮影・素材提供／編集／サムネイル／アニメーション／データ変換・ディスク化／結婚式・イベント／PR・プロモーション／SNS／その他）
音楽・音響・ナレーション（作曲・編曲／楽譜・譜面／歌唱・楽器演奏／ナレーション／キャラクターボイス／ミックス・マスタリング／編集・加工／その他）
マーケティング（SEO対策／MEO対策／リスティング広告／ディスプレイ広告／メールマーケティング／SNSマーケティング／Webサイト分析／その他）
ハンドメイド（ワークショップ／オーダーメイド／その他）
ライティング（コピーライティング／記事作成／文章校正・編集・リライト／取材・インタビュー／シナリオ・脚本・台本／その他）
翻訳（翻訳／その他）
せどり・物販（オーダーメイドツール／各種代行／その他）
コンサル・ビジネス代行（会計・経理・財務・税務／行政法務／オンライン秘書／営業・集客／資料・企画書／起業・事業・経営／補助金・助成金／DX／データ分析・整理・集計／人事・労務／スカウト・ヘッドハント／文字起こし・データ入力／イベント企画・運営／不動産／YouTube・音声配信／SNS／ブログ・アフィリエイト／コンテンツ販売／EC／せどり・物販／家計見直し／通信費見直し／その他）
コーチング（自己理解・強みを活かす／キャリア・転職相談／人生お悩み相談／恋愛・結婚の相談／子育て・教育・進路相談／資格取得の相談／オンライン家庭教師／話術・コミュニケーション／その他）
スキルアップ支援（イラスト・マンガ／デザイン／写真・撮影／動画／音楽・音響・ナレーション／ITスキル／Web制作・Webデザイン／プログラミング／マーケティング／ハンドメイド／ライティング／その他）
ライフスタイル（ヨガ・ピラティス／フィットネス／ダイエット／ダンス／ファッション／美容／話し相手／DIY／整理収納・インテリア／グルメ・料理・献立／旅行・お出かけ／ペット／その他）
占い（恋愛・結婚／自己分析・資質・適性／仕事／対人関係／人生総合／その他）

【カテゴリ自動決定ルール】
・テーマ文から主要キーワードを抽出
・もっとも関連性が高いカテゴリとサブカテゴリを採用
・複数候補が一致した場合は一覧の上位カテゴリを優先

【入力情報】
テーマ：${selectedIdea.title}
活かせる強み：${selectedIdea.strength}
解決する悩み：${selectedIdea.solution}
${factsBlock}
【出力形式】
カテゴリ：
サブカテゴリ：
タイトル：
キャッチコピー：
サービス詳細（以下の構成と順序）
　💭こんなお悩みありませんか？
　✅このサービスでできること
　🌟信頼と実績
　📦ご依頼の流れ
　💬こんな方におすすめ！
　💰価格の目安（※以下2つのサブセクションを必ず両方記載・各ブロックには金額とプラン名のみ）
　　■ 標準価格
　　（サービス内容・カテゴリの相場に基づく標準的な価格。単一価格／レンジ／複数プランのいずれか、サービスに最適な形式で記載）
　　■ モニター価格
　　（標準価格と同じプラン構造・同じ項目名で記載し、金額は標準価格のおよそ70%（30%OFF目安）。端数は100円単位で切りの良い数字に調整）
　　※「先着○名限定」「期間限定」「感想をいただける方」などの募集条件・注意書きはUIで動的に付与するため、この2ブロックには一切含めないこと（見出しの括弧書きや注釈もNG）
　🔚さいごに
　⚠️キャンセル時の注意事項
　🎯出品者スキル
　📝依頼テンプレート

【出力条件】
・絵文字を適度に使用し、初心者にもわかりやすい親しみやすいトーンで構成
・タイトルは30文字以内
・キャッチコピーは100文字以内
・価格はカテゴリの一般相場を自動反映
・「💰価格の目安」の直下に「■ 標準価格」「■ モニター価格」の2ブロックを必ず両方この文字列のまま出力し、同じプラン構造（単一／レンジ／複数プラン）をミラーで揃えること
・「■ モニター価格」ブロックには募集条件（先着○名限定・期間限定・感想をいただける方・レビュー協力など）を一切書かないこと。金額・プラン名以外の文言を入れるとUI側の動的付与と矛盾する
・「さいごに」の後に必ず「キャンセル時の注意事項」を配置すること
・「🌟信頼と実績」「🎯出品者スキル」は、【自己紹介から抽出した事実】のうちテーマに関係する項目だけを根拠にすること。関係のない項目は使わない。事実の提示がない場合は「活かせる強み」を根拠にする
・「🎯出品者スキル」は箇条書きで3〜5個記載すること
・事実にない実績・数字・資格を書かないこと。根拠が少ない場合は数字を作らず、進め方や姿勢で信頼を伝えること
・本名・住所・連絡先など、個人が特定できる情報は書かないこと
・文体は自己紹介の口調に合わせず、出品ページとして読みやすいビジネス寄りの丁寧な文体にすること
・弁解・謙遜の表現を使わないこと（「初心者ですが」「まだ経験は浅いですが」「ご期待に添えないかもしれませんが」「よろしければ」など）。できることは言い切る。安さや経験の浅さを先に断らない
・価格のプラン名には提供範囲を入れること（例「60分・修正2回込み 5,000円」「A4チラシ1枚・修正2回 8,000円」）。金額だけの行にしない。同じ金額でも、何が含まれてその値段かが見えると安さが値踏みではなく設計に読める
・マークダウンの書式（# や ** など）は一切使わないこと

`;

  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {}
  });

  let text = response.text || "";
  
  // Clean up any stray markdown formatting just in case
  text = text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#+\s/gm, "")
    .replace(/`/g, "")
    .replace(/^\s*-\s/gm, "・");

  return text;
};

export interface ServiceRevision {
  summary: string;
  content: string;
}

// 出品ページ本文を、ユーザーのチャット指示にもとづいてAIが編集する（Step 3の「AIに編集を依頼」機能）
export const reviseServiceContent = async (
  currentContent: string,
  instruction: string
): Promise<ServiceRevision> => {
  const ai = createClient();

  const prompt = `
【役割】
あなたは、リベシティ「スキルマーケットonline」の出品ページを編集するプロの編集者です。
以下の【現在の出品ページ本文】を、【編集指示】の内容だけを反映して改稿してください。

【編集ルール】
・【編集指示】に関係のない箇所の文言・順序は変更しないこと。
・見出し行（カテゴリ：／サブカテゴリ：／タイトル：／キャッチコピー：／サービス詳細（…）／💰価格の目安／■ 標準価格／■ モニター価格／🔚さいごに／⚠️キャンセル時の注意事項／🎯出品者スキル／📝依頼テンプレート）は、絵文字・記号・文言ともにそのまま維持し、削除・改変しないこと。
・「💰価格の目安」ブロックがある場合、「■ 標準価格」→「■ モニター価格」の順・同じプラン構造は崩さないこと。編集指示が価格変更を求める場合のみ金額を変更してよい（モニター価格は標準価格のおよそ70%を目安に追随させる）。
・タイトルは30文字以内、キャッチコピーは100文字以内を維持すること。
・マークダウンの書式（# や ** など）は一切使わないこと。

【現在の出品ページ本文】
${currentContent}

【編集指示】
${instruction}

【出力形式（厳守。この4行構成以外は出力しない）】
【変更点サマリー】
（今回の変更点を1〜2文で要約。絵文字は使わない）
【本文】
（編集後の出品ページ本文の全文。見出し構成は元の本文と同じにすること）
`;

  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {}
  });

  let text = response.text || "";
  text = text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#+\s/gm, "")
    .replace(/`/g, "");

  const marker = '【本文】';
  const markerIdx = text.indexOf(marker);
  if (markerIdx === -1) {
    // 想定外の形式で返ってきた場合は全文を本文として扱う（フォールバック）
    return { summary: '変更を反映しました。', content: text.trim() };
  }
  const summary = text.substring(0, markerIdx).replace('【変更点サマリー】', '').trim();
  const content = text.substring(markerIdx + marker.length).trim();
  return { summary: summary || '変更を反映しました。', content };
};

// スキルマーケットの出品ページURLから、本文と口コミ全件を取得する。
// ブラウザから直接fetchするとCORSでブロックされるため、GeminiのURL Contextツール
// （Google側のサーバーがページを取得してモデルに渡す仕組み）を使う。
// ※口コミはページのHTMLに全件埋め込まれているため「もっと見る」の操作は不要（検証済み）
export interface FetchedService {
  title: string;
  content: string;
}

export const fetchServiceFromUrl = async (url: string): Promise<FetchedService> => {
  const ai = createClient();

  const prompt = `
以下のURLは、リベシティ「スキルマーケットonline」の出品ページです。
ページを読み、内容を次の形式で忠実に抽出して出力してください。
要約・言い換え・省略はせず、原文をそのまま保持すること。前置きや説明は一切不要。

URL: ${url}

出力形式:
タイトル：（サービスタイトル）
価格：（表示されている価格。見つからなければこの行は省略）
サービス本文：
（出品説明の全文。改行も原文どおり）

依頼した人の感想：
（口コミを全件、「・(投稿日) 本文」の形式で列挙。1件もなければ「なし」とだけ書く）
`;

  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {
      tools: [{ urlContext: {} }],
    },
  });

  // ページ取得に失敗している場合はモデルの創作を防ぐためエラーにする
  const meta: any = (response.candidates?.[0] as any)?.urlContextMetadata;
  const status = meta?.urlMetadata?.[0]?.urlRetrievalStatus;
  if (status && status !== 'URL_RETRIEVAL_STATUS_SUCCESS') {
    throw new Error(`ページを取得できませんでした（${status}）`);
  }

  const text = (response.text || '').trim();
  if (!text) throw new Error('ページの内容を読み取れませんでした');

  const titleMatch = text.match(/^タイトル[：:]\s*(.+)$/m);
  return {
    title: titleMatch ? titleMatch[1].trim() : url,
    content: text,
  };
};

export const generatePromotion = async (serviceBody: string, serviceUrl: string): Promise<string[]> => {
  const ai = createClient();
  const prompt = `
あなたは「リベシティのつぶやき投稿」を作るプロのコピーライターです。
以下の【出品サービスページ本文】を読み取り、リベシティの雰囲気に合う
「前向き・丁寧・押しつけない」文章で、つぶやき投稿を20本作成してください。

【出品サービスページ本文】
${serviceBody}

【差し込み情報】
- 出品サービスURL：${serviceUrl}

【必須フォーマット（1投稿＝4行）】
各投稿は必ず次の4行で構成してください（行数を増やさない）：
1) 悩み（1〜2文：サービス内容に関連するよくある困りごと）
2) 軽い共感（1文：押しつけず、やさしく寄り添う）
3) 解決方法（1〜2文：出品サービスの特徴・価値を自然に提示）
4) URL（注釈として1行）
   例：「※必要な方へ：${serviceUrl}」「※リンクを置いてます：${serviceUrl}」
   ※「詳細はこちら」は使用禁止

【レビュー起点の投稿ルール】
- 20本のうち「ちょうど3本」は、必ず次の書き出しで開始してください：
  「〇〇な嬉しいレビューをいただきました。🙏」
- 〇〇には、【出品サービスページ本文】に実際に記載されているレビュー内容を要約して入れてください。
  ※本文にないレビューの捏造は禁止。
- レビュー起点の3本は、上記4行フォーマットのまま作成してください。
  （1行目＝レビュー要約、2行目＝感謝/共感、3行目＝特徴、4行目＝URL）
- レビュー起点の3本は配列内で分散させ、連続しないようにしてください。
- もし本文にレビューが存在しない/読み取れない場合は、レビュー起点投稿は作らず、通常型の投稿を3本増やしてください。

【絵文字ルール（厳守）】
- 絵文字は「文末」にのみ使用し、必ず句点の代わりにに置くこと。
  例：「〜です☺️」「〜ありがとうございます🙏」
- 絵文字を単独行にしない（絵文字の直前で改行しない）。
- 行頭に絵文字は禁止（「☺️〜」はNG）。
- 1投稿あたり絵文字は2〜4個。別々の文末に分散させる。
- URL行（4行目）には絵文字を入れない。

【文字数制限（重要）】
- 各投稿の「1〜3行目合計」は、改行・句読点を含めて125文字以内にしてください（URL行は除外）。
- 125文字を超えそうな場合は次の順で短縮する：
  1) 悩みを1文にする
  2) 解決方法を1文にする
  3) 重複表現を削る
  4) 絵文字を減らす（最少2個まで）
- 最終出力前に自己チェックし、130文字超過があれば必ず修正してから出力する。

【トーン＆禁止事項】
- 口調：丁寧でやさしい。煽り・断定・強いセールスは禁止。
- 「今すぐ」「絶対」「最安」「限定で急げ」など煽り表現は禁止。
- 「購入」「申し込み」「依頼」など直接的な販売ワードは極力避ける。
  「置いてます」「まとめています」「必要な方へ」など柔らかい表現を使う。
- 同じ言い回しの連発を避け、切り口を毎回変える。
- レビューは原文引用ではなく要約でOK（個人情報は出さない）。

【出力形式】
JSON配列 (string[]) で出力してください。
各要素は、上記4行を改行（\n）で含む文字列とすること。

`;

  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

// --- Survey Tool Functions ---

export const generateSurveyPatterns = async (serviceBody: string, priceHint: string): Promise<SurveyPattern[]> => {
  const ai = createClient();
  const servicePrice = priceHint || "価格未定";
  const selectedPattern = "";

  const prompt = `
あなたは「サービス提供後アンケート（Google Form前提）」の設計者です。
入力されたサービス本文を踏まえ、改善に役立つ情報を集めるアンケートを
3パターン（A/B/C）で設計してください。
Aは2〜3分、Bは3〜4分、Cは4〜5分を目安に、設問量を段階的に増やしてください。

【入力】
- サービス本文: ${serviceBody}
- サービス価格（数値・円）: ${servicePrice}   // 例: 5000
- パターン選択（任意）: ${selectedPattern}      // "A"|"B"|"C" または空（空なら3パターンすべて出力）

────────────────────────────────────────
【全体ルール（最重要）】
- 個人情報（本名、住所、連絡先）は収集しない。
- 記述式の設問は必要最小限にし、必ず「1〜2行でOK」「箇条書きOK」等の短文誘導を helpText に入れる。
- 選択式で回収できるものは選択式を優先し、自由記述は理由の深掘りに限定する。
- serviceBodyから読み取れる提供価値（例：ヒアリング、提案の具体性、スピード、丁寧さ、成果物品質など）を、
  optionsに反映して“サービスに沿った選択肢”にする（serviceBodyに無い要素の捏造は禁止）。
- 「動機」と「ご受講の動機」は重複させない（動機は1問に統合する）。
- 「決め手」は“最後の一押し”にフォーカスする（動機の焼き直しにしない）。
- 断定表現（例：改善に繋げます）は避け、「今後の参考に」「見直しのヒントとして」などにする。
- 体験形式（対面/オンライン面談/非対面の納品型）に関わらず自然な設問にするため、
  「当日の対応」という表現は避け、「やりとり・進行（連絡〜納品まで）」の満足度として統一する。
- 最後に、ひとこと（任意）
　「もしよければ、ひとこと感想をいただけると励みになります（任意）。」で締める。

────────────────────────────────────────
【必須設問（全パターン共通・順序厳守）】
※以下8問は必ず全パターンに含め、順序も固定する。
1) リベネーム（TEXT・必須）
  title: 「リベシティでの表示名（リベネーム）を教えてください。」
2) 申し込んだ動機（CHECKBOX・必須）
  title: 「今回お申し込みいただいた理由を教えてください（複数選択可）。」
  options: serviceBodyを参考に作成し「その他」を必ず含める
3) 申込の決め手（RADIO・必須）
  title: 「お申し込みの“決め手”として最も近いものを1つ選んでください。」
  options: serviceBodyを参考に作成し「その他」を含める
    （例：内容の具体性／レビュー・実績／人柄・安心感／価格／納期／やりとりの丁寧さ など）
4) サービス全体の満足度（RADIO・必須）
  title: 「サービス全体の満足度を教えてください。」
  options: 「とても満足」「満足」「どちらともいえない」「やや不満」「不満」
5) 期待との比較（RADIO・必須）
  title: 「事前の期待と比べて、今回の内容はいかがでしたか？」
  options: 「期待以上」「期待どおり」「期待より少し下」「期待以下」
6) やりとり・進行の満足度（RADIO・必須）
  title: 「やりとりや進行（連絡・ヒアリング・納品までの流れ）はいかがでしたか？」
  options: 「とても満足」「満足」「どちらともいえない」「やや不満」「不満」
7) おすすめ（PARAGRAPH・必須）
  title: 「このサービスは、どんな方におすすめだと思いますか？（1〜2行でOKです。）」
  helpText: 「1〜2行でOKです。『どんな悩みの人に合いそうか』があると参考になります。」
8) 改善点（PARAGRAPH・必須）
  title: 「より良くするために、改善できそうな点があれば教えてください（1〜2行でOK／箇条書きでも可）。」
  helpText: 「1〜2行でOKです。箇条書きでも構いません。」


────────────────────────────────────────
【価格に関する設問（必須ではなく“任意”で追加する）】
※「適正価格レンジ」は作らない。代わりに「価格印象（5段階）」を任意で追加する。
- 価格印象（RADIO・任意）
  title: 「今回の価格（${servicePrice}円）の印象に最も近いものを選んでください（任意）。」
  options: 「とても安い」「やや安い」「妥当」「やや高い」「とても高い」
  helpText: 「目安でOKです。迷ったら『妥当』で大丈夫です。」
- 理由（TEXTまたはPARAGRAPH・任意）
  title: 「（任意）そう感じた理由があれば、一言で教えてください。」
  helpText: 「1行でOKです。『高い/安い』と感じた場合は理由があると参考になります。」

※パターンCでは、価格印象＋理由の2問セットを原則採用する（任意のまま）。
※パターンAでは価格設問は入れない（最短優先）。B以上で採用を検討する。

────────────────────────────────────────
【追加で使える設問候補（serviceBodyに沿って採用・優先度順）】
※必須8問に加えて、各パターンの時間内に収まる範囲で追加する。
優先1：良かった点（CHECKBOX・任意）
  title: 「特に良かった点があれば選んでください（任意／複数選択可）。」
  options: serviceBodyに沿って作成＋「その他」
  （例：説明の分かりやすさ／提案の具体性／やりとりの丁寧さ／スピード感／安心感／成果物の品質 など）
優先2：事前サポートで役立った点（CHECKBOX・任意）
  title: 「事前サポートで役立った点があれば選んでください（任意／複数選択可）。」
  options: serviceBodyに沿って作成＋「その他」
優先3：期待以下の理由（分岐・TEXTまたはPARAGRAPH・任意）
  title: 「（『期待以下』を選んだ方へ）差し支えなければ理由を教えてください（任意）。」
  helpText: 「差し支えない範囲で大丈夫です。1〜2行でOKです。」
優先4：NPS（SCALE・任意）
  title: 「知人・同僚にこのサービスを勧めたい度合いを教えてください（任意）。」
  type: "SCALE"（Google Formの均等目盛 0〜10。optionsは付けない）
  helpText: 「0=まったく勧めたくない、10=ぜひ勧めたい」
優先5：価格印象（RADIO・任意）＋理由（任意）
  ※上記「価格に関する設問」ブロックを採用する

────────────────────────────────────────
【パターン別の設問量（目安）】
- パターンA：サクッと（2〜3分）
  - 必須8問のみ（追加0〜1問まで）
  - 追加するなら「良かった点（CHECKBOX・任意）」のみ推奨
  - 価格印象/NPS/理由記述は入れない
- パターンB：ちょうど良い（3〜4分）
  - 必須8問 + 追加1〜3問
  - 推奨：良かった点、事前サポートで役立った点
  - 価格印象（任意）＋理由（任意）は余裕があれば追加
- パターンC：改善に活かす（4〜5分）
  - 必須8問 + 追加3〜6問
  - 推奨：良かった点、事前サポートで役立った点、NPS、価格印象（任意）＋理由（任意）
  - 期待以下の理由は分岐の任意として追加

────────────────────────────────────────
【導入文（formDescription）要件】
- 丁寧・前向き・押しつけない文体。
- 「所要時間：A=2〜3分/B=3〜4分/C=4〜5分」相当の表現を入れる（表示は簡潔でOK）。
- 例：ご利用のお礼＋今後の参考にしたい旨＋短時間で終わる旨＋協力への感謝。

────────────────────────────────────────
【出力形式（厳守）】
JSON配列 Array<SurveyPattern> で出力する。JSON以外の文章は出さない。
Questions配列内の type は "TEXT", "PARAGRAPH", "RADIO", "CHECKBOX", "SCALE" のいずれか。
RADIO/CHECKBOX のみ options を付与する。TEXT/PARAGRAPH/SCALE には options を付けない。
SCALE は 0〜10 の均等目盛として扱う（NPS用）。

Schema:
Array<SurveyPattern>
where SurveyPattern is:
{
  id: "A" | "B" | "C",
  name: string,
  description: string,
  formTitle: string,
  formDescription: string,
  questions: Array<{
    title: string,
    type: "TEXT" | "PARAGRAPH" | "RADIO" | "CHECKBOX" | "SCALE",
    options?: string[],
    required: boolean,
    helpText?: string
  }>
}

────────────────────────────────────────
【最終チェック（必須）】
- 必須8問が全パターンに含まれ、順序が一致していること。
- 価格印象（任意）を入れる場合は、servicePrice（${servicePrice}円）を文面に含めること。
- 記述設問に短文誘導の helpText が付いていること。
- A=2〜3分、B=3〜4分、C=4〜5分になるように設問数・記述量を調整していること。
- 重複質問（動機系など）が無いこと。
- 出力はJSONとしてパースできること（クォートの閉じ忘れや全角記号の混入に注意）。


`;


  const response = await ai.models.generateContent({
    model: resolveTextModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, enum: ["A", "B", "C"] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            formTitle: { type: Type.STRING },
            formDescription: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["TEXT", "PARAGRAPH", "RADIO", "CHECKBOX", "SCALE"] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  required: { type: Type.BOOLEAN },
                  helpText: { type: Type.STRING }
                },
                required: ["title", "type", "required"]
              }
            }
          },
          required: ["id", "name", "description", "formTitle", "formDescription", "questions"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

/**
 * Googleフォームの上部に載せるヘッダーバナー画像用のプロンプトを組み立てる。
 * サービスの「トップ画像（サムネイル）」を先に添付してもらう前提で、
 * そのトンマナに合わせた 1600×400（4:1）のバナーを画像生成AIに作らせる。
 * API呼び出しは不要（コピーするだけで使える静的プロンプト）。
 */
export const getFormBannerPrompt = (formTitle: string): string => `ChatGPTの画像生成（GPT Image）で、Googleフォームの上部に表示するヘッダーバナー画像を1枚作ります。

■ 前提（重要）
・この直前に添付した画像は、このサービスの「トップ画像（サムネイル）」です。
・バナーは、ひと目で「同じサービスのアンケートだ」と分かるように、添付画像の配色・書体の雰囲気・装飾・世界観に必ず合わせてください。
・ただし構図はコピーせず、横長バナー用にレイアウトを作り直してください。

■ 出力サイズ
・横1600 × 縦400 ピクセル（横長・比率4:1）。Googleフォームのヘッダー画像の推奨サイズです。
・表示環境により上下端が少し切れることがあるため、文字・主要素は中央に寄せ、上下にじゅうぶん余白を取る。

■ 画像に入れる文字（この文言だけを正確に。誤字なく、勝手に文章を足さない）
・メイン（大きく）：${formTitle}
・サブ（小さく）：ご協力ありがとうございます

■ 雰囲気
・購入後のお客様への「お願い＋感謝」のバナーなので、宣伝感のない、やわらかく丁寧なトーンにする。
・文字はすべて日本語で、スマホの小さな画面でもくっきり読めるように描く。
・マークダウン記号（#、* など）は画像に出さない。`;

// ===== チラシ（紙に印刷して配って認知を広げる）用 =====
// 2段構え。段A（この関数）は Gemini に「デザインの判断」と「紙に描き込む文言」を一度に決めさせる。
// 段B（buildFlyerPromptText）は、B5 の物理ルール・帯の比率・QR の扱いを固定で差し込み、GPT Image 用の本文に組み立てる。

// 1枚もののチラシの用紙。B5（JIS）にした理由：セブン‐イレブンのネットプリントで刷れる用紙（A3/A4/B4/B5）のうち手渡しに向く最小で、
// A5 と同じ 1:√2 系なので帯の比率はそのまま使える。GPT Image の出力（1024×1536・2:3）は上下 45px ずつ切ると B5 比率になる。
// 数字の根拠は チラシ再設計_01_参考デザイン分析.md の 8 章（1024px = 182mm → 1mm = 5.63px、1pt ≈ 2px、143dpi）。
export const FLYER_PAPER = {
  name: 'B5',
  widthMm: 182,
  heightMm: 257,
  label: 'B5（182×257mm）',
  marginMm: 12,          // 外周余白（幅の 6.6%）。マルチコピー機の印刷不可領域 4〜5mm と「用紙に合わせる」縮小を吸収
  minFontPt: 11,         // これより小さい文字は 143dpi で崩れる（3.9mm ≈ 22px）
  headlinePt: 36,        // 見出し（幅の 7%・約13mm）。1行 6〜8 字で最大3行
  bigNumberPt: 44,       // 価格・実績数字（幅の 8%・約15mm）
  qrMm: 36,              // QR の白枠（幅の 1/5）
  bands: { label: 12, hero: 70, body: 82, cta: 47 } as const,  // 帯の高さ（mm）。比率 5:30:35:20、残り 23mm が帯間の余白
} as const;
// 判断の物差しはプロのチラシ20点の分析（チラシ再設計_01_参考デザイン分析.md）。プリセットのトンマナから選ばせるのをやめ、
// 「業種と感情から主色1色を決める」「個人サービスは人を主役にする」「CTAは最初の一歩」をサービスごとにAIに判断させる。

// 系統ごとの視覚仕様。段Aには判断材料として渡し、段Bでは選ばれた系統の説明文として使う。
export const FLYER_FAMILY_SPECS: Record<FlyerStyleFamily, {
  label: string;
  fit: string;       // どんなサービスに向くか
  colors: string;    // 主色の傾向
  headline: string;  // 見出し書体
  cut: string;       // 写真の切り方
  decoration: string;
}> = {
  trust:        { label: '信頼・専門',          fit: '士業・コンサル・IT・BtoB・キャリア相談', colors: '深緑／紺／チャコール＋白', headline: '太い角ゴシック（白抜き）', cut: '斜めの直線', decoration: 'ほぼ無し。バッジもマーカーも使わない' },
  gentle:       { label: '寄り添い・やさしさ',  fit: '相談・カウンセリング・福祉・シニア向け', colors: '淡いピンク／ミント／クリーム／落ち着いた緑', headline: '丸ゴシック か 明朝', cut: '曲線・円形', decoration: 'ドットや点描を少し' },
  family:       { label: '子ども・家族',        fit: '子ども向けレッスン・家庭向け', colors: '黄＋ピンク＋オレンジ', headline: '極太の丸ゴシック', cut: '円形・自由形', decoration: '数字入りの丸、アイコン多め' },
  care_elegant: { label: '健康・施術（上品型）', fit: '整体・ヨガ・パーソナル指導・鍼灸', colors: 'くすみピンク＋和柄／紺＋黄', headline: '太めの明朝 か 太ゴシック', cut: '提供者の顔を右上に', decoration: '症状チップ・声を控えめに' },
  care_promo:   { label: '健康・施術（集客型）', fit: '初回割引で来店を取りに行くとき', colors: '赤＋黄', headline: '極太の丸ゴシック・袋文字', cut: '写真は補助', decoration: '高コントラスト、吹き出し' },
  beauty:       { label: '美容・上質',          fit: '美容・写真撮影・ブランディング', colors: '水色＋ピンク＋白', headline: '細い欧文＋明朝', cut: '波形', decoration: '余白を主役に' },
  expert:       { label: '個人の専門家',        fit: '個人が専門性を売るサービス全般（出品者の大半）', colors: 'オレンジなど暖色1色＋白', headline: '太ゴシック（黒）＋差し色の強調', cut: '提供者の顔写真（正面〜斜め、笑顔）', decoration: '月桂樹つきの実績数字、LINEのQR' },
  quiet:        { label: '静か・弔い',          fit: '終活・供養・グリーフケア', colors: '藤色＋セピア', headline: '明朝', cut: '写真をぼかして重ねる', decoration: '白い円で悩みを散らす' },
  handmade:     { label: 'かわいい・手づくり',  fit: 'ハンドメイド・イラスト・占い', colors: 'ラベンダー／黄緑＋パステル', headline: '手書き風の丸い書体', cut: 'イラスト中心', decoration: '有機的な色の塊' },
  clean:        { label: '清潔・作業',          fit: '掃除・整理収納・代行', colors: '水色＋白', headline: '太ゴシック（青）', cut: '作業中の写真＋before/after', decoration: '泡・光' },
  bold:         { label: '強い・期間限定',      fit: '期間限定キャンペーン全般', colors: '赤＋黒＋黄', headline: '超極太ゴシック', cut: '商品の切り抜き', decoration: '期間バッジ' },
};

const FLYER_FAMILY_IDS = Object.keys(FLYER_FAMILY_SPECS) as FlyerStyleFamily[];
const FLYER_HEADLINE_TYPES: FlyerHeadlineType[] = ['round_bold', 'square_bold', 'mincho_bold', 'handwritten', 'thin_latin_mincho'];
const FLYER_HERO_VISUALS: FlyerHeroVisual[] = ['provider_portrait', 'product', 'scene', 'illustration'];
const FLYER_HERO_CUTS: FlyerHeroCut[] = ['diagonal', 'curve', 'circle', 'full', 'wave'];
const FLYER_DEVICES: FlyerDevice[] = ['badge', 'yellow_marker', 'three_cards', 'big_number', 'reassurance', 'band_heading'];

/** サービス本文から、B5たて片面チラシの「デザイン方針」と「紙に描き込む文言」を一度に作る。 */
export const generateFlyerContent = async (serviceBody: string): Promise<FlyerContent | null> => {
  const body = serviceBody?.trim();
  if (!body) return null;
  const ai = createClient();

  const familyTable = FLYER_FAMILY_IDS
    .map(id => {
      const f = FLYER_FAMILY_SPECS[id];
      return `- ${id}（${f.label}）：向く＝${f.fit}／主色＝${f.colors}／見出し＝${f.headline}／写真＝${f.cut}／装飾＝${f.decoration}`;
    })
    .join('\n');

  const prompt = `
あなたは紙のチラシを専門にするアートディレクター兼コピーライターです。
以下のサービス本文をもとに、B5（182×257mm）たて片面チラシの「デザイン方針」と「紙に描き込む文言」を決めてください。
出力はあとで画像生成AIへの指示に組み立てられます。あなたの判断がそのまま紙になります。

【配る場面】
リベシティのオフ会で、会員に手渡しします。
- 相手はリベシティの会員です。リベシティやスキルマーケットが何かの説明は要りません。
- ただし、あなたのサービスはまだ知りません。手に取って5秒で「誰向けの、何をしてくれる人か」が伝わることを最優先にしてください。
- 持ち帰ってあとで見る人もいます。あとから見ても分かる書き方にしてください。

【プロのチラシに共通する作り方（この物差しで判断する）】
1. 主色は1色。業種と伝えたい感情から決め、紙面は「主色＋白＋差し色1色」だけで組む。最下部の帯は主色のベタ塗り。
2. 最上部に「誰向けか」のラベルを置く。見出しより先に、自分宛かどうかを判断させる。
3. 個人が売るサービスは「人」が主役。提供者の顔を見せ、名前と肩書きが最初に来る。実績があれば数字を文字の2〜3倍で置く。
4. 見出しは「対象／悩み」＋「約束」の2段か、1段の言い切り。見出しの中の1〜2語だけ差し色で強調して、読む順番を作る。
5. 本文は「3つ」に揃える。3カード（アイコン＋題＋1行）にすると、読み手は比較せずに読める。
6. 不安払拭を1つ入れる（「初めての方でも安心」「途中で相談できます」など）。反論処理を紙面でやる。
7. 行動の呼びかけは「リスクの低い最初の一歩」にする。体験・お試し・初回・無料相談。「お問い合わせください」で終わらせない。
8. 装飾の量は系統で決める。信頼・専門はほぼ無し、子ども・集客は多め。迷ったら減らす。

【デザイン方針の系統（この11型から1つ選ぶ。fit と本文の相性で決める）】
${familyTable}
選び方の補足：
- 個人が自分の専門性を売っている（相談・添削・作成代行・レッスン）なら、まず expert を検討する。相手がフォーマル（経営者・士業）なら trust、相手が不安や痛みを抱えているなら gentle か care_elegant に寄せる。
- care_promo と bold は、本文に期間限定や大きな割引の記載があるときだけ選ぶ。
- 色は系統の傾向を出発点にして、このサービスの題材に合う具体的な1色を hex で決める。系統が同じでも、題材が違えば色は変えてよい。

【文言のルール】
- 本文に書かれている情報だけを使う。創作・誇張はしない。数字・資格・年数は本文にあるものだけ。
- B5 は手に取って読む小さな紙。下の文字数を必ず守り、短く言い切る。
- 読んだ人が自分のことだと感じる言い回しにする。体言止めばかりにしない。
- 「〜かもしれません」「〜だと思います」のように自信の無い言い回しは使わない。
- マークダウン記法（#、* など）と絵文字は使わない。
- 電話番号・メールアドレス・URL・氏名は書かない（配る本人があとで手を入れる）。
- 数字と記号は半角（12年、800通、5,000円）。全角数字は使わない。
- 日本語の文の中にローマ字や英単語を混ぜない（「2児 de 母」のような混入は誤り）。

【出力する項目】
analysis：
- family：上の11型から1つ
- audience：誰向けか。1行、30文字以内（例「開業3年以内の個人事業主」）
- formality／warmth／energy：それぞれ1〜5の整数
- sellingWhat：person（提供者の専門性）／skill（技術・作業）／product（成果物・商品）／experience（体験・レッスン）

design：
- dominantColor：主色。name（日本語の色名）・hex（#RRGGBB）・why（その色にした理由。1行、40文字以内）。最下部の帯にこの色をベタ塗りして白い文字を乗せるので、白が読める濃さにする（#FCE4EC のような淡いパステルは不可。やさしい系統でも、くすみピンク #C97B8B やセージグリーン #6E9A80 のように一段濃い色を選ぶ。淡い色は使わない）
- accentColor：差し色。name・hex・why。主色と明度差をつけ、見出しの強調語と丸バッジに使える色
- headlineType：round_bold／square_bold／mincho_bold／handwritten／thin_latin_mincho から1つ
- decoration：none／light／standard／lively から1つ
- heroVisual：provider_portrait／product／scene／illustration から1つ。sellingWhat が person のとき、また相手が不安や痛みを抱えて「人」で選ぶサービス（施術・相談・レッスン・添削）のときは provider_portrait にする。成果物そのものが売りのとき（作品・料理・デザイン）だけ product を選ぶ
- heroSubject：主役ビジュアルの具体を1行、30文字以内（例「ノートPCに向かって微笑む提供者」「木の机に並んだ手づくりの器」）。provider_portrait のときは表情と仕草だけを書き、性別・年齢・髪型・服装など見た目は書かない（見た目は添付されたアイコンに従うため）
- heroCut：diagonal／curve／circle／full／wave から1つ
- devices：使う部品。badge／yellow_marker／three_cards／big_number／reassurance／band_heading から、系統に合うものだけ。three_cards と reassurance は原則入れる。big_number は bigNumber を出すときは入れる（無いときだけ外す）
- avoid：使わない部品。devices と重複させない
- moodWords：雰囲気を表す語を2〜3語（例「誠実」「静か」「あたたかい」）

copy：
- audienceLabel：最上部のラベル。「〜の方へ」「〜向け」の形で18文字以内。「リベシティ」「リベ会員」は入れない（相手は皆そうなので、それ以外の絞り込みを書く）
- angles：切り口の違う見出しを3案。実際に3枚とも作って見比べるので、3案とも本気で作る
  - problem：困りごとから入る。「〜で困っていませんか」「〜を諦めていませんか」のように問いかける
  - result：手に入る結果から入る。できるようになることを言い切る
  - trust：作り手への信頼から入る。年数・件数・資格など本文の事実を見出しに使う。事実が無ければ経験の中身で言い切る
  各案とも headline は18文字以内（2行に折ってよい）、subCopy は28文字以内。emphasis は headline の中に実際に含まれる語を1〜2語。見出しにサービス名をそのまま置かない。3案は言い回しだけでなく着眼点を変える
- problems：「こんなことで困っていませんか」。3個、各16文字以内
- cards：「このサービスでできること」を3枚。icon はアイコンのモチーフ（名詞、8文字以内）、title は10文字以内、body は22文字以内
- bigNumber：実績の数字。value は8文字以内（例「2,300名」「800通」）、label は12文字以内で、何の数かが分かる名詞にする。本文にある言葉を使い、別の職名や役割に言い換えない（例：本文が「52名のアイコンを描いた」なら「アイコン制作」、本文が「書類選考を担当」なら「書類選考の担当」）。年数より件数・人数・通数のような量を優先し、両方あれば量を bigNumber に、年数は trustLines に回す。本文に人数・件数・年数のどれかがあれば必ず入れる（36名のように小さく見える数でも、無いより信頼が伝わる）。本文に数字の実績が無いときだけ null
- trustLines：経歴・資格・経験の事実。本文にあるものだけ、最大3行、各20文字以内。無ければ空配列
- reassurance：不安払拭の1行。24文字以内
- cta：firstStep は最初の一歩（14文字以内）。本文に安い・短いプラン（添削のみ、お試し、初回、単発）があれば、それを最初の一歩にする（例「まずは添削だけ」「初回60分お試し」）。無ければ無料の一歩（例「無料で15分相談」）。「お問い合わせ」「ご相談ください」だけの行にしない。price はその一歩の価格を短く（12文字以内。例「5,000円」「3,000円〜」）、本文に価格が無ければ空文字。note は添え書き（18文字以内。例「「チラシを見た」とお伝えください」「標準プランは15,000円」）

【出力する前に確認すること】
- 各項目が上の文字数に収まっているか数え、超えていれば短く言い直してから出力する
- emphasis の語が headline に含まれているか確認する
- 数字・資格・年数が本文に無いのに書いていないか、本文の言葉を別の言葉に言い換えていないか確認する
- 誤字（例：経歴を「経暦」）が無いか確認する

【サービス本文】
${body.slice(0, 4000)}
`;

  const colorSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, why: { type: Type.STRING } },
    required: ['name', 'hex', 'why'],
  };

  try {
    const response = await ai.models.generateContent({
      model: resolveTextModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                family: { type: Type.STRING, enum: FLYER_FAMILY_IDS },
                audience: { type: Type.STRING },
                formality: { type: Type.INTEGER },
                warmth: { type: Type.INTEGER },
                energy: { type: Type.INTEGER },
                sellingWhat: { type: Type.STRING, enum: ['person', 'skill', 'product', 'experience'] },
              },
              required: ['family', 'audience', 'formality', 'warmth', 'energy', 'sellingWhat'],
            },
            design: {
              type: Type.OBJECT,
              properties: {
                dominantColor: colorSchema,
                accentColor: colorSchema,
                headlineType: { type: Type.STRING, enum: FLYER_HEADLINE_TYPES },
                decoration: { type: Type.STRING, enum: ['none', 'light', 'standard', 'lively'] },
                heroVisual: { type: Type.STRING, enum: FLYER_HERO_VISUALS },
                heroSubject: { type: Type.STRING },
                heroCut: { type: Type.STRING, enum: FLYER_HERO_CUTS },
                devices: { type: Type.ARRAY, items: { type: Type.STRING, enum: FLYER_DEVICES } },
                avoid: { type: Type.ARRAY, items: { type: Type.STRING, enum: FLYER_DEVICES } },
                moodWords: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['dominantColor', 'accentColor', 'headlineType', 'decoration', 'heroVisual', 'heroSubject', 'heroCut', 'devices', 'avoid', 'moodWords'],
            },
            copy: {
              type: Type.OBJECT,
              properties: {
                audienceLabel: { type: Type.STRING },
                angles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, enum: ['problem', 'result', 'trust'] },
                      headline: { type: Type.STRING },
                      emphasis: { type: Type.ARRAY, items: { type: Type.STRING } },
                      subCopy: { type: Type.STRING },
                    },
                    required: ['id', 'headline', 'emphasis', 'subCopy'],
                  },
                },
                problems: { type: Type.ARRAY, items: { type: Type.STRING } },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { icon: { type: Type.STRING }, title: { type: Type.STRING }, body: { type: Type.STRING } },
                    required: ['icon', 'title', 'body'],
                  },
                },
                bigNumber: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: { value: { type: Type.STRING }, label: { type: Type.STRING } },
                  required: ['value', 'label'],
                },
                trustLines: { type: Type.ARRAY, items: { type: Type.STRING } },
                reassurance: { type: Type.STRING },
                cta: {
                  type: Type.OBJECT,
                  properties: { firstStep: { type: Type.STRING }, price: { type: Type.STRING }, note: { type: Type.STRING } },
                  required: ['firstStep', 'price', 'note'],
                },
              },
              required: ['audienceLabel', 'angles', 'problems', 'cards', 'bigNumber', 'trustLines', 'reassurance', 'cta'],
            },
          },
          required: ['analysis', 'design', 'copy'],
        },
      },
    });
    return normalizeFlyerResponse(JSON.parse(response.text || '{}'));
  } catch {
    return null;
  }
};

// 全角の数字・英字・記号を半角に寄せる（モデルが「１２年」「５，０００円」と返すことがある。紙面では半角で揃える）
const toHalfWidth = (v: string): string =>
  v.replace(/[０-９Ａ-Ｚａ-ｚ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/，/g, ',').replace(/．/g, '.');

// 主色は最下部の帯にベタ塗りして白い文字を乗せる。淡すぎる色が返ってきたら、色味（色相・彩度）は保ったまま明度だけ下げる
const ensureDarkEnough = (hex: string): string => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  // 判定は相対輝度で行う（HSL の明度は人の見た目の濃さとずれる。#E67E22 のオレンジや #9581B8 のラベンダーは白文字が読めるので触らない）
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  if (luminance <= 0.5) return hex; // 十分に濃い
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let l = (max + min) / 2;
  const d = max - min;
  let sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  // 明度 0.45 まで下げる。灰色にならないよう彩度は 0.35 以上、どぎつくならないよう 0.5 以下に収める（くすみ色になる）
  l = 0.45;
  sat = Math.min(0.5, Math.max(sat, 0.35));
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
  const pp = 2 * l - q;
  const out = [hue2rgb(pp, q, h + 1 / 3), hue2rgb(pp, q, h), hue2rgb(pp, q, h - 1 / 3)];
  return '#' + out.map(v => Math.round(v * 255).toString(16).padStart(2, '0').toUpperCase()).join('');
};

// Gemini の返答を型に揃える。列挙値の外れ・空欄・並び順のばらつきをここで吸収し、画面と段Bが前提にできる形にする。
export const normalizeFlyerResponse = (parsed: any): FlyerContent | null => {
  const str = (v: any): string => toHalfWidth(String(v ?? '').trim());
  const list = (v: any): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
  const clamp = (v: any): number => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
  const pick = <T extends string>(v: any, allowed: readonly T[], fallback: T): T =>
    (allowed as readonly string[]).includes(str(v)) ? (str(v) as T) : fallback;
  const hex = (v: any, fallback: string): string => (/^#[0-9a-fA-F]{6}$/.test(str(v)) ? str(v).toUpperCase() : fallback);
  const color = (v: any, fallbackHex: string, mustBeDark = false): FlyerColor => ({
    name: str(v?.name) || '指定なし',
    hex: mustBeDark ? ensureDarkEnough(hex(v?.hex, fallbackHex)) : hex(v?.hex, fallbackHex),
    why: str(v?.why),
  });

  const a = parsed?.analysis ?? {};
  const d = parsed?.design ?? {};
  const c = parsed?.copy ?? {};

  // 3案の順番は problem → result → trust に揃える（画面の並びを毎回同じにするため）
  const rawAngles: any[] = Array.isArray(c.angles) ? c.angles : [];
  const angles: FlyerAngle[] = (['problem', 'result', 'trust'] as FlyerAngleId[])
    .map(id => {
      const found = rawAngles.find((x: any) => str(x?.id) === id);
      if (!found) return null;
      const headline = str(found.headline);
      // 差し色にする語は、見出しに実際に含まれるものだけ残す（無い語を指定すると画像側で勝手に足される）
      const emphasis = list(found.emphasis).filter(w => headline.includes(w)).slice(0, 2);
      return { id, headline, emphasis, subCopy: str(found.subCopy) };
    })
    .filter((x): x is FlyerAngle => !!x && !!x.headline);
  if (angles.length === 0) return null;

  const devices = Array.from(new Set(list(d.devices))).filter((x): x is FlyerDevice => (FLYER_DEVICES as string[]).includes(x));
  const avoid = list(d.avoid).filter((x): x is FlyerDevice => (FLYER_DEVICES as string[]).includes(x) && !devices.includes(x as FlyerDevice));
  const bigNumber = c.bigNumber && str(c.bigNumber.value) ? { value: str(c.bigNumber.value), label: str(c.bigNumber.label) } : null;
  const cards: FlyerCard[] = (Array.isArray(c.cards) ? c.cards : [])
    .map((x: any) => ({ icon: str(x?.icon), title: str(x?.title), body: str(x?.body) }))
    .filter((x: FlyerCard) => x.title)
    .slice(0, 3);
  if (cards.length === 0) return null;

  return {
    version: 2,
    analysis: {
      family: pick(a.family, FLYER_FAMILY_IDS, 'expert'),
      audience: str(a.audience),
      formality: clamp(a.formality),
      warmth: clamp(a.warmth),
      energy: clamp(a.energy),
      sellingWhat: pick(a.sellingWhat, ['person', 'skill', 'product', 'experience'] as const, 'person'),
    },
    design: {
      dominantColor: color(d.dominantColor, '#2F4F4F', true),
      accentColor: color(d.accentColor, '#C0392B'),
      headlineType: pick(d.headlineType, FLYER_HEADLINE_TYPES, 'square_bold'),
      decoration: pick(d.decoration, ['none', 'light', 'standard', 'lively'] as const, 'light'),
      heroVisual: pick(d.heroVisual, FLYER_HERO_VISUALS, 'provider_portrait'),
      heroSubject: str(d.heroSubject),
      heroCut: pick(d.heroCut, FLYER_HERO_CUTS, 'circle'),
      devices,
      avoid,
      moodWords: list(d.moodWords).slice(0, 3),
    },
    copy: {
      audienceLabel: str(c.audienceLabel),
      angles,
      problems: list(c.problems).slice(0, 3),
      cards,
      bigNumber,
      trustLines: list(c.trustLines).slice(0, 3),
      reassurance: str(c.reassurance),
      cta: { firstStep: str(c.cta?.firstStep), price: str(c.cta?.price), note: str(c.cta?.note) },
    },
  };
};

/** 複数サービスを1枚にまとめるチラシの文言を作る。 */
export const generateMultiFlyerContent = async (
  services: Array<{ title: string; body: string }>
): Promise<MultiFlyerContent | null> => {
  const targets = services.filter(s => s.body?.trim());
  if (targets.length === 0) return null;
  const ai = createClient();

  const serviceBlocks = targets
    .map((s, i) => `【サービス${i + 1}：${s.title || '（名称未登録）'}】\n${s.body.trim().slice(0, 1500)}`)
    .join('\n\n');

  const prompt = `
あなたは紙のチラシ（A4たて）を設計するコピーライターです。
同じ出品者が提供する${targets.length}つのサービスを、1枚のチラシにまとめて紹介します。その文言を作成してください。
受け取るのはこの出品者をまだ知らない人です。「この人には何を頼めるのか」が一目で分かることを最優先にしてください。

【ルール】
- 各サービスの本文に書かれている情報だけを使う。創作・誇張はしない。
- items は、下に並んだサービス${targets.length}件と同じ順番・同じ件数で作る。増やしても減らしてもいけない。
- 紙は文字を詰め込めない。下の文字数の目安を必ず守り、短く言い切る。
- マークダウン記法（#、* など）と絵文字は使わない。
- 電話番号・メールアドレス・URL・氏名は書かない（配る本人があとで手を入れる）。

【各項目の目安】
- headline：${targets.length}つのサービスを束ねる見出し。20文字以内。個々のサービス名ではなく、この出品者に頼めることの共通点を言う。
- subCopy：見出しを補う一言。30文字以内。
- items[].title：枠の見出し。サービス名を15文字以内に短くする。意味が変わる省略はしない。
- items[].oneLiner：何をしてくれるサービスかの1行。25文字以内。
- items[].forWhom：どんな人向けか。15文字以内。
- items[].price：本文に価格の記載があれば「3,000円〜」のように短く。記載が無ければ空文字。
- cta：最後に置く、行動をうながす一言。20文字以内。

${serviceBlocks}
`;

  try {
    const response = await ai.models.generateContent({
      model: resolveTextModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            subCopy: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  oneLiner: { type: Type.STRING },
                  forWhom: { type: Type.STRING },
                  price: { type: Type.STRING },
                },
                required: ['title', 'oneLiner', 'forWhom', 'price'],
              },
            },
            cta: { type: Type.STRING },
          },
          required: ['headline', 'subCopy', 'items', 'cta'],
        },
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((it: any) => ({
          title: String(it?.title || '').trim(),
          oneLiner: String(it?.oneLiner || '').trim(),
          forWhom: String(it?.forWhom || '').trim(),
          price: String(it?.price || '').trim(),
        })).filter((it: any) => it.title)
      : [];
    if (items.length === 0) return null;
    return {
      headline: String(parsed.headline || '').trim(),
      subCopy: String(parsed.subCopy || '').trim(),
      items,
      cta: String(parsed.cta || '').trim(),
    };
  } catch {
    return null;
  }
};

// 紙に印刷して配ることが前提。画面で見る画像との違い（余白・文字の太さ・QRの扱い）をここで縛る。
// QR は画像生成で描かせない（読み取れない偽物になる）。枠だけ空けさせ、あとからコード実行で本物を重ねる。
const flyerPrintRules = (qrSpot: string, paper: string) => `■ 紙に印刷して配る前提のルール（必ず守る）
・出力は1枚の画像。たて長で作る。プレゼン資料や複数ページにはしない。
・仕上がりは${paper}。手に取って読む小さめの紙なので、文字は大きく太めにする。細い線・薄いグレーの文字・小さすぎる注釈は使わない。
・載せるのは下で指定した文言だけ。余白を惜しまず、要素の間をしっかり空ける。詰め込むと印刷でつぶれて読めない。
・紙の外周は幅の 6〜7%（${paper === FLYER_PAPER.label ? `${FLYER_PAPER.marginMm}mm` : '1割'}ほど）を余白として空け、文字や主要な絵を端ギリギリに置かない（印刷のときに切れるため）。
・視線が上から下へ素直に流れる構成にする。要素を斜めに散らしたり、読む順番が分からない配置にしない。
・QRコードは、この指示の最後にある手順で、画像を作ったあとにコード実行で本物を生成して重ねる（画像生成で描いたQRは読み取れないため）。画像生成の段階では QR を描かず、${qrSpot}
・URL・メールアドレス・電話番号・氏名は書かない（配る本人があとで入れる）。
・文字はすべて日本語で、印刷してもくっきり読めるように描く。下に指定した文言だけを正確に、誤字なく入れる。勝手に文章を足さない。
・指定に無い文字は1文字も足さない。手書き風の添え書き・スローガン・英字・ロゴ風の文字も入れない（画像生成は雰囲気づくりで文字を足しがちだが、紙面では誤情報になる）。
・絵も、主役ビジュアルと3カードのアイコン以外は足さない。挿絵・写真風の人物・葉や花などの飾りは、上の「装飾」の指定を超えて置かない。
・マークダウン記号（#、* など）は画像に出さない。`;

const QR_SPOT_SINGLE = `右下へ、一辺が紙の幅の5分の1（${FLYER_PAPER.name}で約${FLYER_PAPER.qrMm}mm）の「白い正方形の枠」を空け、そのすぐ下に小さく「詳しくはこちら」と入れる。あとの手順で本物のQRコードを重ねる場所。`;
const QR_SPOT_MULTI = '各サービスの枠の右端に、枠の高さの8割を一辺とする「白い正方形」を空ける。あとの手順で本物のQRコードを重ねる場所。';

// URL が未登録のときに、プロンプトの中で「ここに貼る」と示す空欄。画面側でも同じ文言を探して注意を出す
export const FLYER_QR_URL_PLACEHOLDER = '＜ここに出品ページのURLを貼ってください＞';

/** 画像ができたあとに、コード実行で本物のQRを作って重ねさせる指示。
 *  1枚ものは URL が無くても手順を必ず入れる（無いとQRの無いチラシで終わってしまう）。URL は空欄にして貼ってもらう。
 *  まとめチラシは URL の無いサービスを載せられないので、1件も無ければ空。 */
const flyerQrStep = (targets: { label: string; url: string }[], multi: boolean): string => {
  const valid = targets.filter(t => t.url.trim());
  if (valid.length === 0 && multi) return '';
  const list = valid.length === 0
    ? FLYER_QR_URL_PLACEHOLDER
    : valid.map(t => (multi ? `・${t.label}：${t.url}` : t.url)).join('\n');
  const where = multi
    ? '各サービスの枠の右端に空けた白い正方形の中に、対応するサービスのQRを収める（枠の順番どおりに）'
    : '右下に空けた白い正方形の枠の中に収める';
  return `

■ QRコードの入れ方（ここまでやって完成。QRの無い画像で終わらせない）
1. まず上の仕様で画像を1枚作る。白い正方形の枠は空けたままにする。
2. 次に Python（コード実行）で、下のURLのQRコードを作る。誤り訂正レベルはM、周囲に4モジュール分の白い余白を付ける。
3. 作ったQRを、${where}大きさに縮小して重ね、完成した画像を1枚出力する。QRの余白は消さない。${multi ? '' : `
4. 仕上げに、画像の上下を同じだけ切って ${FLYER_PAPER.name} の比率（幅${FLYER_PAPER.widthMm}：高さ${FLYER_PAPER.heightMm}）にそろえる（元が 1024×1536 なら上下 45px ずつ切って 1024×1446 にする）。左右は切らない。`}
・QRは必ずコードで生成すること。画像生成で描いたQRは読み取れない。
・生成した画像をコードから読めない場合は、その旨を短く伝えること。こちらが画像をアップロードしたら、同じ手順でQRを重ねる。
・下のURLが空欄のままなら、先に「QRにするURLを教えてください」と聞き、URLをもらってから手順2に進む。
【QRにするURL】
${list}`;
};

const flyerBullets = (items: string[]): string => items.map(v => `・${v}`).join('\n');

/** 画像が出たあとに続けて貼る、QRを重ねさせる短い指示。
 *  ChatGPT は画像生成で返答を終えてしまい、1本目に書いた手順2へ自動では進まない（2026-09-12 実測）。
 *  この一言を送ると、コード実行が直前の生成画像を読み、読み取れるQRを重ねた完成画像を出す。 */
export const buildFlyerQrFollowupText = (serviceUrl?: string): string => {
  const url = serviceUrl?.trim() || FLYER_QR_URL_PLACEHOLDER;
  return `手順2に進んでください。いま作った画像に、Python（コード実行）で次のURLのQRコード（誤り訂正レベルM、周囲に4モジュール分の白い余白）を作り、右下に空けた白い正方形の枠の中に収まる大きさに縮小して重ね、完成した画像を1枚出力してください。
QRにするURL：${url}
生成した画像をコードから読めない場合は、その旨を短く伝えてください。こちらが画像をアップロードしたら、同じ手順でQRを重ねてください。
重ねたあと、その完成画像のQRをコードで読み取って、デコードした文字列を1行で報告してください。`;
};

// ===== 段B：段Aの判断を、GPT Image にそのまま貼れる文面に組み立てる =====
// 印刷ルール・帯の比率・QR の扱いはここで固定する（崩れると刷り直しになるので AI に書かせない）。

// 切り口ごとに「本文の帯（帯3）で何を主役にするか」を変える。3枚出して見比べたとき、見出しだけでなく紙の重心が変わる。
export const FLYER_ANGLE_SPECS: Record<FlyerAngleId, { label: string; lead: string }> = {
  problem: { label: '困りごとから', lead: '「これ、自分のことだ」と思ってもらう1枚。本文の帯は困りごと3つが主役' },
  result:  { label: '結果から',     lead: '手に入るものを先に見せる1枚。本文の帯はできること3カードが主役' },
  trust:   { label: '信頼から',     lead: '「この人なら任せられる」と思ってもらう1枚。本文の帯は実績と経歴が主役' },
};

const FLYER_HEADLINE_TYPE_TEXT: Record<FlyerHeadlineType, string> = {
  round_bold: '極太の丸ゴシック。角が丸く、やわらかい印象',
  square_bold: '太い角ゴシック。まっすぐで力強い印象',
  mincho_bold: '太めの明朝。上品で落ち着いた印象',
  handwritten: '手書き風の丸い書体。手づくり感のある印象',
  thin_latin_mincho: '細めの明朝。余白と一緒に上質さを出す。太らせない',
};

const FLYER_HERO_CUT_TEXT: Record<FlyerHeroCut, string> = {
  diagonal: '斜めの直線で切り取り、見出し側に少し食い込ませる',
  curve: 'ゆるやかな曲線で切り取る',
  circle: '円形に切り取る',
  full: '帯いっぱいに敷き、見出しをその上に重ねる（文字の下だけ薄く暗くして読ませる）',
  wave: '波形の縁で切り取る',
};

const FLYER_DECORATION_TEXT: Record<FlyerDesign['decoration'], string> = {
  none: '装飾は入れない。線・面・余白だけで組む。バッジ・マーカー・吹き出し・飾りの図形は無し（3カードの中の小さなアイコンだけ可）',
  light: '装飾は最小限。区切り線と薄い面だけ。アイコンは3カードの中だけ',
  standard: '3カードのアイコンと丸バッジを使ってよい（帯見出しは「使う部品」にあるときだけ）。効果線・キラキラは使わない',
  lively: 'アイコン・丸バッジ・吹き出し・数字入りの丸でにぎやかに（部品の使う／使わないは下の指定に従う）。それでも効果線・放射線は使わない',
};

const FLYER_DEVICE_TEXT: Record<FlyerDevice, string> = {
  badge: '丸バッジ（主役ビジュアルに重ねる円の中に、価格か実績を白抜きで）',
  yellow_marker: '黄色マーカー（本文の中で1か所だけ、語の下に黄色の帯）',
  three_cards: '3カード（アイコン＋題＋1行を、同じ大きさの箱で横に3つ）',
  big_number: '実績数字（数字だけ周りの文字の3倍の大きさ。単位と説明は小さく添える）',
  reassurance: '不安払拭の1行（帯と帯のあいだに、やわらかい言い回しで）',
  band_heading: '帯見出し（帯の切り替わりに、主色の細い帯へ白抜きで1行）',
};

// 主役ビジュアルの描き方。提供者本人を主役にするときは、添付アイコンを再現させる（サムネイル機能の「提供者の代役に動物を立てない」と同じ考え方）。
const flyerHeroVisualText = (design: FlyerDesign): string => {
  const subject = design.heroSubject ? `（${design.heroSubject}）` : '';
  switch (design.heroVisual) {
    case 'provider_portrait':
      return `提供者本人${subject}。このチャットに添付したアイコン画像の人物を、同じ顔立ち・髪型・服装のまま胸から上で描く（写真ならその人の雰囲気を保ったイラスト調にしてよい）。添付が無ければ、このサービスの提供者として自然な人物を1人描く。動物やマスコットを代役にしない`;
    case 'product':
      return `成果物・商品${subject}。本物らしく、主役として大きく`;
    case 'scene':
      return `サービスの場面${subject}。何をしてくれる人かが一目で分かる瞬間を切り取る`;
    case 'illustration':
      return `モチーフのイラスト${subject}。写真的にせず、紙面の書体と同じ手触りで`;
  }
};

// 帯2の丸バッジに何を入れるか。実績があれば実績、無ければ価格。信頼の切り口では実績が帯3の主役になるので、バッジは価格に回す
const flyerBadgeText = (content: FlyerContent, angle: FlyerAngle): string => {
  const { design, copy } = content;
  if (!design.devices.includes('badge')) return '';
  if (angle.id !== 'trust' && copy.bigNumber) return `${copy.bigNumber.label} ${copy.bigNumber.value}`;
  if (copy.cta.price) return `${copy.cta.firstStep} ${copy.cta.price}`;
  return '';
};

// 帯3（本文の帯）の構成と文言。切り口で主役が変わる
const flyerBodyBand = (content: FlyerContent, angle: FlyerAngle): { layout: string; texts: string[] } => {
  const { copy, design } = content;
  // 帯の小見出し。帯見出しを部品として使う系統では主色の帯に白抜き、使わない系統では太字1行に留める
  const heading = design.devices.includes('band_heading') ? '主色の細い帯に白抜きの帯見出し' : '小さな太字の見出し1行';
  const cardTitles = copy.cards.map(c => c.title).join('　／　');
  const cardsFull = copy.cards.map(c => `・${c.title}（アイコン：${c.icon}）：${c.body}`).join('\n');
  switch (angle.id) {
    case 'problem':
      return {
        layout: `${heading}「こんなことで困っていませんか」→ チェックマーク付きの3行を主役として大きく → 矢印1本 → その下に「できること」の題3つを小さく横一列に。`,
        texts: [
          `【帯3の小見出し】\nこんなことで困っていませんか`,
          `【帯3の主役（チェック3行）】\n${flyerBullets(copy.problems)}`,
          `【帯3の下段（できること・題だけ横一列）】\n${cardTitles}`,
        ],
      };
    case 'result':
      return {
        layout: `${heading}「このサービスでできること」→ 3カード（アイコン＋題＋1行）を主役として、同じ大きさの箱で横に3つ。`,
        texts: [
          `【帯3の小見出し】\nこのサービスでできること`,
          `【帯3の主役（3カード）】\n${cardsFull}`,
        ],
      };
    case 'trust': {
      const hasNumber = !!copy.bigNumber;
      const hasLines = copy.trustLines.length > 0;
      const layout = hasNumber
        ? '左に実績数字を主役として大きく（数字は周りの文字の3倍。説明は小さく添える）、右にその根拠となる経歴・資格を2〜3行 → その下に「できること」の題3つを小さく横一列に。'
        : '経歴・資格・経験を主役として、落ち着いた組みで2〜3行大きめに → その下に「できること」の題3つを小さく横一列に。';
      const texts: string[] = [];
      if (hasNumber) texts.push(`【帯3の主役（実績数字）】\n${copy.bigNumber!.value}\n（説明）${copy.bigNumber!.label}`);
      if (hasLines) texts.push(`【帯3の${hasNumber ? '右側' : '主役'}（経歴・資格）】\n${flyerBullets(copy.trustLines)}`);
      if (!hasNumber && !hasLines) texts.push(`【帯3の主役（できること）】\n${cardsFull}`);
      else texts.push(`【帯3の下段（できること・題だけ横一列）】\n${cardTitles}`);
      return { layout, texts };
    }
  }
};

/** 1サービス分のチラシプロンプトを組み立てる（ChatGPTにそのまま貼れる形）。切り口ごとに1本ずつ作る。 */
export const buildFlyerPromptText = (
  content: FlyerContent,
  angle: FlyerAngle,
  options: { matchThumbnail?: boolean; serviceUrl?: string } = {}
): string => {
  const { analysis, design, copy } = content;
  const family = FLYER_FAMILY_SPECS[analysis.family];
  const qrStep = flyerQrStep([{ label: angle.headline, url: options.serviceUrl ?? '' }], false);
  const badge = flyerBadgeText(content, angle);
  const body = flyerBodyBand(content, angle);
  const emphasis = angle.emphasis.length ? angle.emphasis.map(w => `「${w}」`).join('') : '';

  // 提供者本人が主役のときはアイコンの添付を先に頼む。配色をサムネイルに合わせるときは、サムネイルも添付させて色の指定を差し替える
  const attachLines: string[] = [];
  if (design.heroVisual === 'provider_portrait') {
    attachLines.push('・出品者のアイコン画像（顔写真かイラスト）。紙面の主役の位置に、この人物を描きます。');
  }
  if (options.matchThumbnail) {
    attachLines.push('・このサービスのサムネイル画像。配色と雰囲気はこのサムネイルに合わせます（紙で受け取った人が、あとでサービスページを開いたとき同じ出品者だと分かるように）。');
  }
  const attachStep = attachLines.length
    ? `
■ 先にやること
このチャットに次の画像を添付してから、この指示を送ってください。
${attachLines.join('\n')}
添付が無いときは、下の指定だけで作ってかまいません。
`
    : '';

  const colorLines = options.matchThumbnail
    ? [
        '・配色：添付したサムネイルの主色を紙面の主色に、サムネイルの差し色を紙面の差し色にする。紙面はその2色＋白だけで組む。最下部の帯は主色のベタ塗り。',
        `・サムネイルが無いときの配色：主色は${design.dominantColor.name}（${design.dominantColor.hex}）、差し色は${design.accentColor.name}（${design.accentColor.hex}）。`,
      ]
    : [
        `・主色：${design.dominantColor.name}（${design.dominantColor.hex}）。紙面の色はこの1色＋白＋差し色だけ。最下部の帯はこの主色のベタ塗り。`,
        `・差し色：${design.accentColor.name}（${design.accentColor.hex}）。見出しの強調語と丸バッジにだけ使う。それ以外の場所に差し色を広げない。`,
      ];

  const deviceLines = design.devices.length
    ? `・使う部品：\n${design.devices.map(dv => `  - ${FLYER_DEVICE_TEXT[dv]}`).join('\n')}`
    : '・使う部品：無し（線・面・余白だけ）';
  const avoidLine = design.avoid.length
    ? `・使わない部品：${design.avoid.map(dv => FLYER_DEVICE_TEXT[dv].split('（')[0]).join('、')}`
    : '';

  const heroLayout = `主役ビジュアルを右に（版面の幅の4割まで）、見出しを左に。見出しは紙面でいちばん大きな文字（下の「大きさの目安」の見出しの高さ）で、1行 6〜8 文字で折って最大3行${emphasis ? `。${emphasis}だけ差し色` : ''}。サブコピーはその下に小さく。`
    + (badge ? `主役ビジュアルの左下に重ねて丸バッジを1つ置き、「${badge}」を白抜きで入れる。` : '丸バッジは置かない。');

  const textBlocks = [
    `【対象者ラベル（最上部・ピル型）】\n${copy.audienceLabel}`,
    `【見出し（いちばん大きく）】\n${angle.headline}${emphasis ? `\n（差し色にする語：${emphasis}）` : ''}`,
    `【サブコピー】\n${angle.subCopy}`,
    ...(badge ? [`【丸バッジ】\n${badge}`] : []),
    ...body.texts,
    ...(copy.reassurance ? [`【つなぎの1行（帯3と帯4のあいだ）】\n${copy.reassurance}`] : []),
    `【締めの帯（最下部・主色ベタ）】\n${copy.cta.firstStep}${copy.cta.price ? `\n${copy.cta.price}` : ''}${copy.cta.note ? `\n（小さく）${copy.cta.note}` : ''}\n（QR枠の下に小さく）詳しくはこちら`,
  ];

  return `ChatGPTの画像生成（GPT Image）で、紙に印刷して配るチラシを1枚作ります。${FLYER_PAPER.label}たての片面チラシです。

■ 完成までの手順（2段階。どちらもこのチャットの中でやる）
1. 画像生成でチラシ本体を1枚作る（右下にQR用の白い枠を空けておく）
2. コード実行で本物のQRコードを作り、その白い枠に重ねて、完成した画像を1枚出力する（手順はいちばん下）
QRが載っていない画像は完成ではありません。
${attachStep}
■ このチラシの方針（この方針どおりに作る）
・系統：${family.label}。読む相手は「${analysis.audience}」。雰囲気は${design.moodWords.map(w => `「${w}」`).join('')}。
・調子：かたさ ${analysis.formality}/5、あたたかさ ${analysis.warmth}/5、勢い ${analysis.energy}/5。
${colorLines.join('\n')}
・見出しの書体：${FLYER_HEADLINE_TYPE_TEXT[design.headlineType]}。本文は読みやすい太めのゴシック。書体は見出しと本文の2種だけ。
・装飾：${FLYER_DECORATION_TEXT[design.decoration]}。
・主役ビジュアル：${flyerHeroVisualText(design)}。${FLYER_HERO_CUT_TEXT[design.heroCut]}。
${deviceLines}
${avoidLine}

${flyerPrintRules(QR_SPOT_SINGLE, FLYER_PAPER.label)}

■ この1枚の主役
${FLYER_ANGLE_SPECS[angle.id].lead}。

■ 紙面の構成（上から4つの帯。高さの比率はおおよそ 5：30：35：20。残りは帯と帯のあいだの余白）
${FLYER_PAPER.name}（${FLYER_PAPER.widthMm}×${FLYER_PAPER.heightMm}mm）で刷ったときの高さの目安：帯1 約${FLYER_PAPER.bands.label}mm／帯2 約${FLYER_PAPER.bands.hero}mm／帯3 約${FLYER_PAPER.bands.body}mm／帯4 約${FLYER_PAPER.bands.cta}mm。外周の余白 ${FLYER_PAPER.marginMm}mm。
1. 対象者ラベル：左上に、小さなピル型（角の丸い横長の枠、高さは紙の幅の5%）で1行。主色の細い枠線に主色の文字。
2. 見出しの帯：${heroLayout}
3. 本文の帯：${body.layout}
4. 締めの帯：主色のベタ塗り。左に「最初の一歩」を白抜きで大きく、その下に価格をいちばん大きな数字で、さらに小さく添え書き。右にQR用の白い正方形の枠と、その下に「詳しくはこちら」。
帯3と帯4のあいだに、つなぎの1行を小さく1行だけ置く。

■ 大きさの目安（紙の幅を 100 としたときの文字の高さ。${FLYER_PAPER.name}での実寸）
・見出し：7（約13mm・${FLYER_PAPER.headlinePt}pt）。3行に折っても帯2に収まる
・価格・実績数字：8（約15mm・${FLYER_PAPER.bigNumberPt}pt）。周りの文字の3倍
・サブコピー・最初の一歩・困りごとの3行：3（約5.5mm・16pt）
・カードの題・小見出し：2.7（約5mm・14pt）
・カードの本文・添え書き・つなぎの1行：2.1（約4mm・${FLYER_PAPER.minFontPt}pt）。これが最小。これより小さい文字を1つも置かない
・3カード：同じ幅の箱を横に3つ（1つ約49mm）。アイコンは箱の幅の3割（約14mm）。本文は1行 12 字で2行まで
・丸バッジ：直径は紙の幅の14%（約26mm）
・QRの白枠：一辺は紙の幅の20%（約${FLYER_PAPER.qrMm}mm）。帯4の中に収め、下に「詳しくはこちら」

■ 紙に入れる文字（この文言だけを正確に。ここに無い文章を足さない）
${textBlocks.join('\n')}${qrStep}`;
};

// 枠の数によって紙面の割り方を変える。全部同じグリッドにすると、2件はスカスカ、6件は窮屈になる。
const multiFlyerLayoutHint = (count: number): string => {
  if (count <= 2) return '2件なので、上下に大きな枠を2つ積む。1枠あたりの面積を大きく取り、写真的な装飾を添えてよい。';
  if (count === 3) return '3件なので、たてに帯状の枠を3つ積む。横幅いっぱいを使い、左に見出し、右に説明を置く。';
  if (count === 4) return '4件なので、2列×2段のグリッドにする。4枠の大きさは完全にそろえる。';
  return `${count}件なので、2列のグリッドに上から詰めて並べる。枠の大きさは全てそろえ、装飾より読みやすさを優先する。`;
};

/** 複数サービスをまとめたチラシのプロンプトを組み立てる。 */
export const buildMultiFlyerPromptText = (
  content: MultiFlyerContent,
  toneVersion: ThumbnailPromptVersion,
  autoStyle?: string,
  // items と同じ順の出品ページURL（無い枠は空文字）
  urls: string[] = []
): string => {
  const designSpec = resolveChatToneSpec(toneVersion, autoStyle);
  const qrStep = flyerQrStep(content.items.map((it, i) => ({ label: it.title, url: urls[i] ?? '' })), true);
  const itemBlocks = content.items.map((it, i) => {
    const lines = [
      `［${i + 1}枠目］`,
      `見出し：${it.title}`,
      `1行紹介：${it.oneLiner}`,
      `おすすめの人：${it.forWhom}`,
    ];
    if (it.price) lines.push(`価格：${it.price}`);
    return lines.join('\n');
  }).join('\n\n');

  return `ChatGPTの画像生成（GPT Image）で、紙に印刷して配るチラシを1枚作ります。A4たての片面チラシで、${content.items.length}つのサービスをまとめて紹介します。

■ デザイン仕様（この仕様どおりに作る）
${designSpec}

${flyerPrintRules(QR_SPOT_MULTI, 'A4（210×297mm）')}

■ 紙面の構成（上から順に）
1. 見出しとサブコピー。紙の上4分の1を使い、「この人に何を頼めるのか」が一目で分かるようにする。
2. サービス一覧。${multiFlyerLayoutHint(content.items.length)}
   各枠には「見出し／1行紹介／おすすめの人／価格」を、全ての枠で同じ配置・同じ文字の大きさで入れる。
   枠ごとに色や形を変えて散らかさない。区別はアイコンか差し色の1点だけにする。
3. 行動をうながす一言。最下部に帯を敷いて置く。

■ 紙に入れる文字（この文言だけを正確に。枠の順番も下のとおりにする）
【見出し（いちばん大きく）】
${content.headline}
【サブコピー】
${content.subCopy}

${itemBlocks}

【行動をうながす一言（最下部の帯）】
${content.cta}${qrStep}`;
};
