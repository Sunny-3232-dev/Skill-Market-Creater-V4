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
// ChatGPTの画像生成に渡す「紙に描き込む文言」。
// トンマナ（共通デザイン仕様）と紙面ルールはコピー時に buildFlyerPromptText で差し込む。
// チラシの切り口。紙は刷ってみるまで良し悪しが分からないので、中身は共通のまま
// 「どこを主役にするか」だけ変えた3案を作り、実際に画像を出してから選んでもらう。
export type FlyerAngleId = 'problem' | 'result' | 'trust';

export interface FlyerAngle {
  id: FlyerAngleId;
  headline: string;  // 一番大きく出す見出し
  subCopy: string;   // 見出しを補う一言
}

export interface FlyerContent {
  angles: FlyerAngle[];  // 切り口の違う3案（見出しとサブコピー、紙面の主役が変わる）
  problems: string[];    // こんなことで困っていませんか
  benefits: string[];    // このサービスでできること
  trust: string;         // 作り手を信頼できる一行（本文に根拠が無ければ空文字）
  forWhom: string[];     // こんな方におすすめ（本文から読み取れなければ空配列）
  flow: string[];        // ご依頼の流れ（本文に書かれていなければ空配列）
  price: string;         // 価格の表記（本文に記載が無ければ空文字）
  cta: string;           // 行動をうながす一言
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
