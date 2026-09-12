export interface UserInput {
  rawText: string;
}

export interface SkillIdea {
  id: string;
  title: string;
  strength: string;
  solution: string;
  type: 'standard' | 'niche';
  generatedContent?: string;
  thumbnailUrl?: string;
  pinned?: boolean;
}

export enum Step {
  INPUT = 'INPUT',
  IDEAS = 'IDEAS',
  GENERATING_DETAIL = 'GENERATING_DETAIL',
  DETAIL = 'DETAIL'
}

export enum ToolType {
  TOP = 'TOP',
  CREATOR = 'CREATOR',
  SUPPORT = 'SUPPORT',
  LEARN = 'LEARN'
}

// Survey Tool Types
// SCALE = Google Form の均等目盛（0〜10。NPS用）
export type QuestionType = 'TEXT' | 'PARAGRAPH' | 'RADIO' | 'CHECKBOX' | 'SCALE';

export interface SurveyQuestionDef {
  title: string;
  type: QuestionType;
  options?: string[]; // For RADIO or CHECKBOX
  required: boolean;
  helpText?: string;
}

export interface SurveyPattern {
  id: 'A' | 'B' | 'C';
  name: string; // "Light", "Balanced", "Improvement"
  description: string;
  formTitle: string;
  formDescription: string;
  questions: SurveyQuestionDef[];
}

// Thumbnail Prompt Version
export type ThumbnailPromptVersion = 'ai_auto' | 'standard' | 'simple' | 'watercolor' | 'pop' | 'my_style' | 'youtube' | 'puffy_3d' | 'benefit_banner';

// ChatGPTで1枚ずつ画像生成するための、1枚分の中身（トンマナ・レイアウト非依存）。
// トンマナ（共通デザイン仕様）と役割別レイアウトはコピー時に buildSlideImagePromptText で差し込む。
export interface SlideImagePrompt {
  no: number;    // 1始まりの通し番号
  role: string;  // cover / problem / can_do / strength / recommend / flow / voice / cta
  label: string; // カード見出し用の短いタグ（表紙 / お悩み など）
  title: string; // この画像の見出し
  body: string;  // この画像に描き込む文言（改行区切り）
}

// ===== チラシ（紙に印刷して配る）用 =====
// 1回の生成で「デザインの判断」と「紙に描き込む文言」を両方 AI に決めさせる（段A）。
// B5 の物理ルール・帯の比率・QR の扱いはクライアント側の buildFlyerPromptText が固定で差し込む（段B）。
// 判断の根拠は プロのチラシ20点の分析（チラシ再設計_01_参考デザイン分析.md）。
// チラシの切り口。紙は刷ってみるまで良し悪しが分からないので、デザイン方針は共通のまま
// 「見出しと、本文の帯で何を主役にするか」だけ変えた3案を作り、実際に画像を出してから選んでもらう。
export type FlyerAngleId = 'problem' | 'result' | 'trust';

export interface FlyerAngle {
  id: FlyerAngleId;
  headline: string;    // 一番大きく出す見出し
  emphasis: string[];  // 見出しの中で差し色にする語（1〜2語。見出しに含まれる語だけ）
  subCopy: string;     // 見出しを補う一言
}

// デザイン方針の系統。プロの作例から取り出した11型。主色の傾向・書体・装飾がひとまとまりで決まる。
export type FlyerStyleFamily =
  | 'trust'         // 信頼・専門（士業・コンサル・IT・BtoB・キャリア相談）
  | 'gentle'        // 寄り添い・やさしさ（相談・カウンセリング・福祉・シニア向け）
  | 'family'        // 子ども・家族
  | 'care_elegant'  // 健康・施術（上品型。整体・ヨガ・パーソナル指導）
  | 'care_promo'    // 健康・施術（集客型。初回割引で来店を取りに行く）
  | 'beauty'        // 美容・上質（美容・写真・ブランディング）
  | 'expert'        // 個人の専門家（顔＋実績数字。出品者の大半）
  | 'quiet'         // 静か・弔い（終活・供養・グリーフケア）
  | 'handmade'      // かわいい・手づくり（ハンドメイド・イラスト・占い）
  | 'clean'         // 清潔・作業（掃除・整理収納・代行）
  | 'bold';         // 強い・期間限定（キャンペーン全般）

export type FlyerHeadlineType =
  | 'round_bold'         // 極太の丸ゴシック（やさしい・子ども・にぎやか）
  | 'square_bold'        // 太い角ゴシック（信頼・専門・力強い）
  | 'mincho_bold'        // 太めの明朝（上品・和・食・落ち着き）
  | 'handwritten'        // 手書き風の丸い書体（手づくり・かわいい）
  | 'thin_latin_mincho'; // 細い欧文＋明朝（美容・上質）

export type FlyerHeroVisual =
  | 'provider_portrait'  // 提供者本人（添付アイコンを再現。無ければ代役の人物）
  | 'product'            // 成果物・商品（資料、作品、料理など）
  | 'scene'              // サービスの場面（相談中、作業中、レッスン中）
  | 'illustration';      // イラスト・モチーフ（写真的でない方が合うとき）

export type FlyerHeroCut = 'diagonal' | 'curve' | 'circle' | 'full' | 'wave';

// 紙面の型。日本のチラシでよく使われる骨格を、プロの作例20点から5つに絞った（チラシ再設計_01_参考デザイン分析.md 9章）。
// 型が見出しに使う切り口（FlyerAngleId）と帯の組み方を決める。段Aが本文に合う型を1つおすすめし、画面では5つとも選べる。
export type FlyerTemplateId =
  | 'classic'    // 定番（人物＋3カード）：ラベル／見出し＋主役右／3カード／CTA帯
  | 'checklist'  // お悩みチェック：問いかけの見出し／チェック3項目を大きく→矢印→解決できること
  | 'number'     // 実績ドン（数字主役）：見出しの下に実績数字を最大に／根拠の経歴（数字が無いと使えない）
  | 'visual'     // 全面ビジュアル（表紙風）：上半分を主役の絵で敷き、見出しを白抜きで重ねる
  | 'offer';     // オファー主役（価格ドン）：大きな丸バッジに初回価格／CTA帯を広く（価格が無いと使えない）

// 紙面の部品。プロの作例で繰り返し使われていたもの。系統に合わせて使う／使わないを決める。
export type FlyerDevice =
  | 'badge'          // 丸バッジ（価格・限定・実績を写真に重ねる）
  | 'yellow_marker'  // 黄色マーカー（本文の要点1か所）
  | 'three_cards'    // 3カード（アイコン＋題＋1行）
  | 'big_number'     // 実績数字を文字の2〜3倍で
  | 'reassurance'    // 不安払拭の1行
  | 'band_heading';  // 帯見出し（帯の切り替わりを1行で宣言）

export interface FlyerColor {
  name: string;  // 日本語の色名（例「くすみピンク」）
  hex: string;   // #RRGGBB
  why: string;   // その色にした理由（1行。画面に見せる）
}

export interface FlyerAnalysis {
  family: FlyerStyleFamily;
  audience: string;       // 誰向けか（1行）
  formality: number;      // 1（くだけた）〜5（かたい）
  warmth: number;         // 1（クール）〜5（あたたかい）
  energy: number;         // 1（静か）〜5（勢い）
  sellingWhat: 'person' | 'skill' | 'product' | 'experience';
}

export interface FlyerDesign {
  dominantColor: FlyerColor;
  accentColor: FlyerColor;
  headlineType: FlyerHeadlineType;
  decoration: 'none' | 'light' | 'standard' | 'lively';
  heroVisual: FlyerHeroVisual;
  heroSubject: string;    // 主役ビジュアルの具体（例「ノートPCに向かって微笑む提供者」）
  heroCut: FlyerHeroCut;
  template: FlyerTemplateId;  // 段Aがおすすめする紙面の型（画面では5つとも選べる）
  devices: FlyerDevice[];
  avoid: FlyerDevice[];
  moodWords: string[];    // 雰囲気を表す語 2〜3
}

export interface FlyerCard {
  icon: string;   // アイコンのモチーフ（名詞。例「手のひら」「時計」）
  title: string;  // 短い題
  body: string;   // 1行の説明
}

export interface FlyerCopy {
  audienceLabel: string;                 // 最上部のピル「〜の方へ」
  angles: FlyerAngle[];                  // 切り口3案
  problems: string[];                    // こんなことで困っていませんか（3つ）
  cards: FlyerCard[];                    // できること（3枚）
  bigNumber: { value: string; label: string } | null;  // 実績数字（本文に無ければ null）
  trustLines: string[];                  // 経歴・資格・経験（本文にある事実だけ。最大3）
  reassurance: string;                   // 不安払拭の1行（帯3と帯4のあいだに置く）
  cta: { firstStep: string; price: string; note: string };  // 最初の一歩・価格・添え書き
}

export interface FlyerContent {
  version: 2;             // 旧形式（見出し3案＋箇条書き）と区別する。旧データは読み捨てる
  analysis: FlyerAnalysis;
  design: FlyerDesign;
  copy: FlyerCopy;
}

// まとめチラシの1枠分（1サービス＝1枠）
export interface MultiFlyerItem {
  title: string;     // 枠の見出し（サービス名を短くしたもの）
  oneLiner: string;  // 何をしてくれるサービスかの1行
  forWhom: string;   // どんな人向けか
  price: string;     // 価格（記載が無ければ空文字）
}

export interface MultiFlyerContent {
  headline: string;  // 全体を束ねる見出し
  subCopy: string;   // 見出しを補う一言
  items: MultiFlyerItem[];
  cta: string;
}

// 自己紹介から抽出した「出品の根拠になる事実」。出品文の信頼と実績・出品者スキルの材料。
// 自己紹介の散文をそのまま渡すと無関係な話に引っ張られるため、行単位の事実に崩してから渡す。
// 文体は含めない（出品文はプロフィールの口調に合わせず、ビジネス寄りの文体で書く）。
export interface ProfileFacts {
  career: string[];        // 経歴・仕事
  achievements: string[];  // 実績・数字
  skills: string[];        // 資格・スキル・ツール
  context: string[];       // 状況・背景（稼働時間帯・顔出し可否など）
}
