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
export interface FlyerContent {
  headline: string;    // 一番大きく出す見出し
  subCopy: string;     // 見出しを補う一言
  problems: string[];  // こんなことで困っていませんか
  benefits: string[];  // このサービスでできること
  forWhom: string[];   // こんな方におすすめ
  flow: string[];      // ご依頼の流れ（1要素＝1ステップ）
  price: string;       // 価格の表記（本文に記載が無ければ空文字）
  cta: string;         // 行動をうながす一言
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
