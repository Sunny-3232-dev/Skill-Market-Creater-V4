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
export type ThumbnailPromptVersion = 'standard' | 'simple' | 'watercolor' | 'pop' | 'my_style' | 'youtube' | 'puffy_3d';

// ChatGPTで1枚ずつ画像生成するための、1枚分の中身（トンマナ非依存）。
// トンマナ（画風）はコピー時に buildSlideImagePromptText で差し込むだけなので、
// トンマナを切り替えても作り直し（再生成）は不要。
export interface SlideImagePrompt {
  no: number;        // 1始まりの通し番号
  role: string;      // cover / problem / can_do / strength / recommend / flow / voice / cta
  label: string;     // カード見出し用の短いタグ（表紙 / お悩み など）
  title: string;     // 画像の見出し
  body: string;      // 画像に描き込む文言（改行区切り）
}
