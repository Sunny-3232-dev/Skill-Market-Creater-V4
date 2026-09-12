import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { generatePromotion, generateSurveyPatterns, getSlideDocPrompt, extractServiceTitle, generateAutoSlideStyle, generateSlideImageContents, buildSlideImagePromptText, buildSlideImageBatchPromptText, getFormBannerPrompt, generateFlyerContent, generateMultiFlyerContent, buildFlyerPromptText, buildMultiFlyerPromptText, FLYER_FAMILY_SPECS, FLYER_TEMPLATES, FLYER_TEMPLATE_IDS, flyerTemplateAvailable, flyerAngleForTemplate, FLYER_QR_URL_PLACEHOLDER, buildFlyerQrFollowupText } from '../services/geminiService';
import { FlyerTemplatePreview } from './FlyerTemplatePreview';
import { extractWords } from '../utils/textProcessing';
import { SkillIdea, SurveyPattern, SurveyQuestionDef, ThumbnailPromptVersion, SlideImagePrompt, FlyerContent, FlyerTemplateId, FlyerHeadlineType, FlyerHeroVisual, FlyerHeroCut, FlyerDevice, MultiFlyerContent } from '../types';
import { MegaphoneIcon, ClipboardListIcon, PresentationIcon, FlyerIcon } from './icons';
import { PromptPreview } from './promptPreviews';
import LoadingOverlay from './LoadingOverlay';
import TweetCard, { TweetPost } from './support/TweetCard';
import PatternCard from './support/PatternCard';
import CodeViewer from './support/CodeViewer';
import QuestionEditor from './support/QuestionEditor';
import CampaignTweetCard from './CampaignTweetCard';
import Troubleshoot from './Troubleshoot';
import QrFallback from './support/QrFallback';
import SupportGuide from './guide/SupportGuide';
import Tour, { TOUR_EVENT } from './guide/Tour';
import { jumpToSection } from '../utils/jumpToSection';
import NotebookLMGuide from './guide/NotebookLMGuide';

// メニューごとの案内。結果を表示中にヘッダの「画面の案内（1分）」を押すと、そのメニューの案内が開く
const MENU_TOURS: Record<MenuId, { sel: string; title: string; text: string }[]> = {
  promoter: [
    { sel: '[data-tour="menu-promoter-list"]', title: '宣伝文のたたき台が20本並びます', text: '困りごとに寄り添ってから解決策を添える形です。全部使う必要はありません。' },
    { sel: '[data-tour="menu-promoter-list"] > *', title: '気に入った1本を「コピー」→ リベシティの「つぶやき」に貼る', text: '文はカードの中で直せます。登録したサービスのURLは自動で入ります。' },
    { sel: '[data-tour="campaign"]', title: 'キャンペーン中は、この3行を付けて投稿', text: '9月30日まで。ボタンから3行入りのつぶやき画面が開きます。' },
  ],
  survey: [
    { sel: '[data-tour="menu-survey-patterns"]', title: '3パターンから1つ選びます', text: 'Light は短く、Balanced は標準、Improvement は改善点を深く聞く構成です。設問は選んだあとで編集できます。' },
    { sel: '[data-tour="menu-survey-code"]', title: 'GASコードをコピー → script.google.com に貼って実行', text: 'Google Apps Script の新しいプロジェクトに貼り、実行するとGoogleフォームができます。手順は下に書いてあります。' },
    { sel: '[data-tour="menu-survey-banner"]', title: 'フォーム上部のバナー画像はこのプロンプトで', text: 'ChatGPT に貼ると、フォームのヘッダー画像ができます。' },
  ],
  slidedoc: [
    { sel: '[data-tour="menu-slide-mode"]', title: '作り方を選びます', text: 'まとめて作るなら NotebookLM、画風をそろえて作るなら ChatGPT。ChatGPT は「1枚ずつ貼る」と「まとめて1回で貼る（試験的）」を選べます。' },
    { sel: '[data-tour="menu-slide-tones"]', title: 'トンマナを1つ選んで「プロンプトをコピー」', text: '迷ったら「AIおまかせ」。サービス本文から配色・書体を設計します。' },
    { sel: '[data-tour="menu-slide-notebooklm"]', title: 'NotebookLM の貼る場所は3つ。動きで見たいときはここを開く', text: '本文とアイコン画像は左の「ソース」。トンマナ・構成のプロンプトは右の「Studio」→「スライド資料」の鉛筆（カスタマイズ）欄。真ん中のチャットには貼りません。' },
    { sel: '[data-tour="menu-slide-steps"]', title: 'できたら PDF でダウンロード → JPG に', text: 'I Love PDF で1枚ずつの画像にして、スキルマーケットのサービス画像に追加します。' },
  ],
  flyer: [
    { sel: '[data-tour="menu-flyer-plan"]', title: 'デザインの方針は、本文から AI が決めます', text: '誰向けか・主色1色・見出しの書体・主役のビジュアルを、サービスの内容に合わせて決めています。プロのチラシ20点から取り出した型に沿っています。気に入らなければ作り直せます。' },
    { sel: '[data-tour="menu-flyer-copy"]', title: '紙面の型を選んで、ChatGPT に貼る', text: '定番・お悩みチェック・実績ドン・全面ビジュアル・オファー主役の5つ。図はこのサービスの色と見出しで描いた組み方のイメージです。AIのおすすめと定番の2枚を出して見比べるのが早いです。' },
    { sel: '[data-tour="menu-flyer-qr"]', title: 'QRが読めなかったときの保険', text: 'ここでこのツールがQR画像を作ります。ChatGPT にチラシ画像と一緒にアップロードして重ねてもらうか、Canva で重ねてください。' },
    { sel: '[data-tour="menu-flyer-print"]', title: '刷るところまで', text: 'プリンタが無くても、完成画像をセブン‐イレブンのネットプリントにアップロードすれば、予約番号で店頭のマルチコピー機から刷れます。チラシは B5 ちょうどの大きさで作ってあるので、用紙は B5 を選んでください。' },
  ],
};

const SUPPORT_TOUR = [
  { sel: '[data-tour="support-usage"]', title: 'この画面は3段で進みます', text: 'URLを登録して本文を貼る → メニューを選んで作る → 結果をコピーして使う。押すとその段へ飛びます。' },
  { sel: '[data-tour="support-guide"]', title: '流れを動きで見たいときは、ここを開く', text: 'URLを登録 → ページを開いて本文をコピー → 開いた欄に貼って保存 → 下のメニュー、を14秒の絵で見せます。見るだけのものです。' },
  { sel: '#register-url', title: 'まず、出品ページのURLを貼って登録', text: 'skill.libecity.com/services/… のURLだけ受け付けます。登録すると、その行の下に本文を貼る欄が開きます。' },
  { sel: '#support-body', title: '本文はここに貼ります', text: '自動では取りに行けないので、「ページを開く」で出品ページを開き、本文をコピーして貼ってください。口コミも一緒に貼ると精度が上がります。' },
  { sel: '[data-tour="support-menus"]', title: '本文が入ったら、ここから作ります', text: '宣伝文・サービス資料・チラシ・アンケート。結果はサービスごとに保存され、選び直せば戻ります。' },
];

interface SupportHubProps {
  ensureKeySet: () => Promise<boolean>;
  onHandleApiError: (error: any) => void;
  notify: (message: string, tone?: 'error' | 'info') => void;
  onGoToLearn: () => void;
}

type MenuId = 'promoter' | 'survey' | 'slidedoc' | 'flyer';
// ChatGPT に貼る形。one_by_one=1枚ずつ貼る（既定）／batch=全枚分を1本にまとめて1回で貼る（試験的）
type SlideChatMode = 'one_by_one' | 'batch';

// URLから取得して登録した自分の出品済みサービス
interface RegisteredService {
  id: string;
  url: string;
  title: string;
  content: string;
  fetchedAt: string;
}

const SKILL_URL_PATTERN = /^https:\/\/skill\.libecity\.com\/services\/\d+/;
const MAX_REGISTERED_SERVICES = 10;
// まとめチラシ1枚に載せられる件数。増やすほど1件あたりが小さくなり、配っても読まれない。
const MAX_MULTI_FLYER = 6;

const STORAGE_KEY = 'skill_market_support_v1';
const CREATOR_IDEAS_KEY = 'skill_market_ideas';

// --- Slide Doc tone variants ---
const SLIDE_DOC_VERSIONS: Array<{
  id: ThumbnailPromptVersion;
  label: string;
  description: string;
}> = [
  {
    id: 'ai_auto',
    label: 'AIおまかせ（おすすめ）',
    description: 'サービス本文の内容・ターゲット・雰囲気をAIが読み取り、最適なトンマナ（配色・書体・装飾）を自動で設計します。迷ったらこれ。',
  },
  {
    id: 'my_style',
    label: 'マイスタイル(参照モード)',
    description: 'リソースに添付した参考画像のトンマナを踏襲。既存のサムネイルと統一感を出したい方に。',
  },
  {
    id: 'standard',
    label: '標準',
    description: 'プロフェッショナルで信頼感のあるビジネスデザイン。落ち着いた上質な印象。',
  },
  {
    id: 'simple',
    label: 'シンプル',
    description: '丸みのあるやさしい印象のミニマルデザイン。清潔感と信頼感を両立。',
  },
  {
    id: 'watercolor',
    label: '水彩画',
    description: '手書き風・柔らかなタッチ。親しみやすく温かみのある印象。',
  },
  {
    id: 'pop',
    label: 'ポップ&フレンドリー',
    description: '鮮やかな多色使いとポップアート感。楽しくワクワクする初心者歓迎の印象。',
  },
  {
    id: 'youtube',
    label: 'YouTube風',
    description: '人気YouTuberのサムネイル調。派手・インパクト重視で思わずクリックしたくなる印象。',
  },
  {
    id: 'puffy_3d',
    label: 'ぷっくり3D',
    description: '粘土のようにぷっくり膨らんだ3D調。パステルカラーでやわらかく、思わず目を引く可愛い印象。',
  },
];

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2.5 mb-4 px-1">
    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">{label}</span>
    <span className="w-1 h-1 rounded-full bg-brand-300"></span>
    <div className="h-px bg-stone-200 flex-grow"></div>
  </div>
);

// 生成直後のつぶやきを読みやすく整形（URL行には手を入れない）
// 絵文字が単独行になるのを防ぐ：
//  1) 絵文字だけの行は直前の文末にくっつけて戻す
//  2) 「。」での改行は、直後が絵文字だけで行末になる場合は割らない（文末絵文字を残す）
// チラシは「文言だけAIが作る」形式から「デザイン方針＋文言」の形式（version 2）に変わった。
// 旧形式で保存されていたものは画面が組み立てられないので読み捨て、作り直してもらう。
const normalizeFlyerContent = (v: FlyerContent | null | undefined): FlyerContent | null =>
  v && (v as any).version === 2 && Array.isArray(v.copy?.angles) && v.copy.angles.length > 0 && Array.isArray(v.copy.cards) ? v : null;

// デザイン方針を画面に見せるときの日本語ラベル（プロンプト側の説明文は geminiService にある）
const FLYER_HEADLINE_TYPE_LABEL: Record<FlyerHeadlineType, string> = {
  round_bold: '極太の丸ゴシック', square_bold: '太い角ゴシック', mincho_bold: '太めの明朝', handwritten: '手書き風', thin_latin_mincho: '細めの明朝',
};
const FLYER_HERO_VISUAL_LABEL: Record<FlyerHeroVisual, string> = {
  provider_portrait: '提供者本人（アイコンを再現）', product: '成果物・商品', scene: 'サービスの場面', illustration: 'イラスト',
};
const FLYER_HERO_CUT_LABEL: Record<FlyerHeroCut, string> = { diagonal: '斜めに切る', curve: '曲線で切る', circle: '円形', full: '帯いっぱい', wave: '波形' };
const FLYER_DECORATION_LABEL: Record<FlyerContent['design']['decoration'], string> = { none: '無し', light: '控えめ', standard: '標準', lively: 'にぎやか' };
const FLYER_DEVICE_LABEL: Record<FlyerDevice, string> = {
  badge: '丸バッジ', yellow_marker: '黄色マーカー', three_cards: '3カード', big_number: '実績数字を大きく', reassurance: '不安払拭の1行', band_heading: '帯見出し',
};

// トンマナ（画風）を見本つきで選ぶグリッド。スライド資料とチラシで共用する。
const ToneGrid: React.FC<{
  value: ThumbnailPromptVersion;
  onChange: (v: ThumbnailPromptVersion) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => (
  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
    {SLIDE_DOC_VERSIONS.map(({ id, label }) => {
      const isActive = value === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={isActive}
          title={label}
          className={`relative rounded-xl border p-2 text-left transition-all ${
            isActive ? 'border-brand-400 ring-2 ring-brand-100 bg-brand-50/40' : 'border-stone-200 bg-white hover:border-brand-200'
          }`}
        >
          <PromptPreview version={id} badge="トンマナ見本" className="w-full rounded-lg border border-stone-100" />
          <div className="flex items-center gap-1.5 mt-2 px-0.5">
            <span className={`shrink-0 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-brand-500' : 'border-stone-300'}`}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>}
            </span>
            <span className="text-xs font-semibold text-stone-800 leading-tight">{label}</span>
          </div>
        </button>
      );
    })}
  </div>
);

// チラシの文言を、コピー前に「紙に何が載るか」として下読みするための行。
const FlyerPreviewRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-stone-100 last:border-b-0">
    <span className="text-[11px] font-semibold text-stone-400 sm:w-24 shrink-0 pt-0.5">{label}</span>
    <div className="text-xs text-stone-700 leading-relaxed min-w-0">{children}</div>
  </div>
);

// 見出しの中で差し色にする語を、画面でも同じ色で見せる（紙でどこが目立つかを先に分かるように）
const renderEmphasized = (headline: string, words: string[], hex: string): React.ReactNode => {
  const targets = words.filter(w => w && headline.includes(w));
  if (targets.length === 0) return headline;
  const pattern = new RegExp(`(${targets.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return headline.split(pattern).map((part, i) =>
    targets.includes(part) ? <span key={i} style={{ color: hex }}>{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>
  );
};

const EMOJI_CLASS = '\\p{Extended_Pictographic}\\uFE0F\\u200D';
const formatTweet = (raw: string): string => {
  // 1) 絵文字だけの行を直前の行末に結合
  const emojiOnlyLine = new RegExp(`^\\s*[${EMOJI_CLASS}]+\\s*$`, 'u');
  const merged: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim() !== '' && emojiOnlyLine.test(line) && merged.length > 0) {
      merged[merged.length - 1] = merged[merged.length - 1].replace(/\s+$/, '') + line.trim();
    } else {
      merged.push(line);
    }
  }
  // 2) 「。」で改行。ただし直後が（空白＋）絵文字だけで行末なら割らない
  const sentenceBreak = new RegExp(`。(?!\\s*[${EMOJI_CLASS}]*\\s*$)`, 'gu');
  return merged
    .map(line => (line.includes('http') ? line : line.replace(sentenceBreak, '。\n')))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// サービス本文から代表価格の数値を抽出する（アンケートの価格印象設問に使用）
// 対応: 「■ 標準価格 … 10,000円」/「価格：5,000円」/ 本文中の「〇〇円」
const extractPriceFromBody = (content: string): string => {
  let m = content.match(/■ 標準価格[\s\S]{0,200}?(\d[\d,]*)\s*円/);
  if (m) return m[1].replace(/,/g, '');
  m = content.match(/価格[：:][^\d]*(\d[\d,]*)\s*円/);
  if (m) return m[1].replace(/,/g, '');
  m = content.match(/(\d[\d,]{2,})\s*円/);
  if (m) return m[1].replace(/,/g, '');
  return '';
};

// URLからサービスIDを取り出す（/services/35369 → 35369）
const serviceIdFromUrl = (url: string): string => url.match(/services\/(\d+)/)?.[1] ?? '';

// 貼り付けた本文の先頭行からサービス名を推定する（自動取得できない代わり）
const deriveTitle = (body: string, url: string): string => {
  const firstLine = body.split('\n').map(l => l.trim()).find(l => l.length > 0);
  if (firstLine) return firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine;
  const sid = serviceIdFromUrl(url);
  return sid ? `サービス #${sid}` : 'サービス';
};

// サービス1件分の生成物（宣伝文・アンケート・スライド資料の表示状態）。サービスごとに保持する。
interface ResultsBundle {
  posts: TweetPost[];
  patterns: SurveyPattern[];
  patternsOriginal: SurveyPattern[];
  selectedPatternId: SurveyPattern['id'] | null;
  showCode: boolean;
  slideDocReady: boolean;
  activeMenu: MenuId | null;
  /** AIおまかせ：このサービス専用に生成したトンマナ指定（未生成なら空） */
  autoStyleDirective: string;
  /** ChatGPTで1枚ずつ作るための画像別の中身（未生成なら空配列） */
  slidePrompts: SlideImagePrompt[];
  /** このサービス1枚分のチラシ文言（未生成なら null） */
  flyerContent: FlyerContent | null;
}

const EMPTY_RESULTS: ResultsBundle = {
  posts: [], patterns: [], patternsOriginal: [], selectedPatternId: null,
  showCode: false, slideDocReady: false, activeMenu: null, autoStyleDirective: '', slidePrompts: [],
  flyerContent: null,
};

interface PersistedState {
  serviceBody: string;
  activeMenu: MenuId | null;
  posts: TweetPost[];
  patterns: SurveyPattern[];
  patternsOriginal: SurveyPattern[];
  selectedPatternId: SurveyPattern['id'] | null;
  showCode: boolean;
  slideDocReady: boolean;
  autoStyleDirective: string;
  slideMode: 'notebooklm' | 'chatgpt';
  // ChatGPT に貼る形。1枚ずつ貼るか、全枚分を1本にまとめて1回で貼るか（後者は試験的）
  slideChatMode: SlideChatMode;
  slideVersion: ThumbnailPromptVersion;
  slidePrompts: SlideImagePrompt[];
  registeredServices: RegisteredService[];
  selectedServiceId: string | null;
  resultsByServiceId: Record<string, ResultsBundle>;
  flyerContent: FlyerContent | null;
  flyerMode: 'single' | 'multi';
  flyerVersion: ThumbnailPromptVersion;
  // 配色をサービスのサムネイルに合わせるか（合わせないときは AI が決めた主色・差し色を使う）
  flyerMatchThumbnail: boolean;
  // まとめチラシはサービスをまたぐので、サービス別バケットではなく全体で1つ持つ
  multiFlyerIds: string[];
  multiFlyerContent: MultiFlyerContent | null;
}

const loadPersisted = (): Partial<PersistedState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to restore support state', e);
    return {};
  }
};

const SupportHub: React.FC<SupportHubProps> = ({ ensureKeySet, onHandleApiError, notify, onGoToLearn }) => {
  // 保存済み状態を同期的に読み込んで初期値にする（保存effectとの競合を避ける）
  const initRef = useRef<Partial<PersistedState> | null>(null);
  if (initRef.current === null) initRef.current = loadPersisted();
  const init = initRef.current;

  // Shared input
  const [serviceBody, setServiceBody] = useState(init.serviceBody ?? '');

  // Results (メニューごとに並存し、タブで切り替える)
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(init.activeMenu ?? null);
  const [posts, setPosts] = useState<TweetPost[]>(
    Array.isArray(init.posts) ? init.posts.filter(p => p && typeof p.text === 'string') : []
  );
  const [patterns, setPatterns] = useState<SurveyPattern[]>(Array.isArray(init.patterns) ? init.patterns : []);
  const [patternsOriginal, setPatternsOriginal] = useState<SurveyPattern[]>(
    Array.isArray(init.patternsOriginal) ? init.patternsOriginal : []
  );
  const [selectedPatternId, setSelectedPatternId] = useState<SurveyPattern['id'] | null>(init.selectedPatternId ?? null);
  const [showCode, setShowCode] = useState(init.showCode ?? false);
  const [slideDocReady, setSlideDocReady] = useState(init.slideDocReady ?? false);
  // AIおまかせ：このサービス専用に生成したトンマナ指定
  const [autoStyleDirective, setAutoStyleDirective] = useState<string>(init.autoStyleDirective ?? '');

  // スライド資料: NotebookLMで一括 / ChatGPTで1枚ずつ の切り替え
  const [slideMode, setSlideMode] = useState<'notebooklm' | 'chatgpt'>(init.slideMode ?? 'notebooklm');
  // ChatGPT に貼る形。既定は実績のある「1枚ずつ」。「まとめて1回」は Images 2.0 の複数枚一括生成向けで試験的
  const [slideChatMode, setSlideChatMode] = useState<SlideChatMode>(init.slideChatMode === 'batch' ? 'batch' : 'one_by_one');
  const [slideVersion, setSlideVersion] = useState<ThumbnailPromptVersion>(init.slideVersion ?? 'ai_auto');
  const [slidePrompts, setSlidePrompts] = useState<SlideImagePrompt[]>(
    Array.isArray(init.slidePrompts) ? init.slidePrompts : []
  );
  const [isSlideGenLoading, setIsSlideGenLoading] = useState(false);
  const [copiedSlideNo, setCopiedSlideNo] = useState<number | null>(null);
  const [copiedSlideBatch, setCopiedSlideBatch] = useState(false);

  // チラシ（紙に印刷して配る）
  const [flyerContent, setFlyerContent] = useState<FlyerContent | null>(normalizeFlyerContent(init.flyerContent));
  // まとめチラシは当面出さない（まず1種類で様子を見る）。保存値に関わらず single に固定し、状態と処理は残す
  const [flyerMode, setFlyerMode] = useState<'single' | 'multi'>('single');
  const [flyerVersion, setFlyerVersion] = useState<ThumbnailPromptVersion>(init.flyerVersion ?? 'my_style');
  const [flyerMatchThumbnail, setFlyerMatchThumbnail] = useState<boolean>(init.flyerMatchThumbnail ?? false);
  const [multiFlyerIds, setMultiFlyerIds] = useState<string[]>(Array.isArray(init.multiFlyerIds) ? init.multiFlyerIds : []);
  const [multiFlyerContent, setMultiFlyerContent] = useState<MultiFlyerContent | null>(init.multiFlyerContent ?? null);
  const [isMultiFlyerLoading, setIsMultiFlyerLoading] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<FlyerTemplateId | null>(null);
  const [copiedQrFollowup, setCopiedQrFollowup] = useState(false);
  const [copiedMultiFlyer, setCopiedMultiFlyer] = useState(false);

  // 出品済みサービスのURL登録
  const [registeredServices, setRegisteredServices] = useState<RegisteredService[]>(
    Array.isArray(init.registeredServices) ? init.registeredServices : []
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(init.selectedServiceId ?? null);
  // サービスごとの生成物（宣伝文・アンケート・スライド画像プロンプト）を保持する台帳
  const [resultsByServiceId, setResultsByServiceId] = useState<Record<string, ResultsBundle>>(
    init.resultsByServiceId && typeof init.resultsByServiceId === 'object' ? init.resultsByServiceId : {}
  );
  // いま画面に読み込んでいるサービス（切替中に保存effectが誤って上書きしないためのガード）
  const loadedServiceRef = useRef<string | null>(init.selectedServiceId ?? null);
  const [registerUrl, setRegisterUrl] = useState('');
  const [isRegisteringBody, setIsRegisteringBody] = useState(false);
  // URLを登録せずに本文だけ貼りたい人向けの欄を開くか
  const [showLooseBody, setShowLooseBody] = useState(false);


  const [copiedSlideDocVersion, setCopiedSlideDocVersion] = useState<ThumbnailPromptVersion | null>(null);
  const [copiedBannerPrompt, setCopiedBannerPrompt] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Loading / error
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState<MenuId | null>(null);
  const [errorMenu, setErrorMenu] = useState<MenuId | null>(null);
  const runTokenRef = useRef(0); // キャンセル時に進め、古いレスポンスを破棄する


  const resultRef = useRef<HTMLDivElement>(null);

  const selectedPattern = useMemo(
    () => patterns.find(p => p.id === selectedPatternId) ?? null,
    [patterns, selectedPatternId]
  );
  // 選択中の登録サービスのURL（宣伝文のリンク差し込みに使う）
  const selectedServiceUrl = useMemo(
    () => registeredServices.find(sv => sv.id === selectedServiceId)?.url ?? '',
    [registeredServices, selectedServiceId]
  );
  // まとめチラシ用: 選んだサービスの出品ページURL（items と同じ順）
  const multiFlyerUrls = useMemo(
    () => multiFlyerIds.map(id => registeredServices.find(sv => sv.id === id)?.url ?? ''),
    [multiFlyerIds, registeredServices]
  );
  const inputWords = useMemo(() => extractWords(serviceBody), [serviceBody]);
  const hasInput = serviceBody.trim().length > 0;

  // ---- 永続化: 保存 ----
  useEffect(() => {
    try {
      const s: PersistedState = {
        serviceBody, activeMenu,
        posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady,
        autoStyleDirective, slideMode, slideChatMode, slideVersion, slidePrompts,
        registeredServices, selectedServiceId, resultsByServiceId,
        flyerContent, flyerMode, flyerVersion, flyerMatchThumbnail, multiFlyerIds, multiFlyerContent,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed to save support state', e);
    }
  }, [serviceBody, activeMenu, posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, autoStyleDirective, slideMode, slideChatMode, slideVersion, slidePrompts, registeredServices, selectedServiceId, resultsByServiceId, flyerContent, flyerMode, flyerVersion, flyerMatchThumbnail, multiFlyerIds, multiFlyerContent]);

  // ---- サービスごとの生成物を保存: 表示中の結果を選択中サービスのバケットへ同期 ----
  useEffect(() => {
    if (!selectedServiceId) return;
    // 切替直後は loadedServiceRef を先に更新しているので、一致する時だけ保存する
    if (loadedServiceRef.current !== selectedServiceId) return;
    setResultsByServiceId(prev => ({
      ...prev,
      [selectedServiceId]: { posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, activeMenu, autoStyleDirective, slidePrompts, flyerContent },
    }));
  }, [posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, activeMenu, autoStyleDirective, slidePrompts, flyerContent, selectedServiceId]);

  // ---- アンケートカードのヘッダー高さ同期 ----
  const surveyHeaderRefs = useRef<(HTMLDivElement | null)[]>([]);
  const syncSurveyHeaders = useCallback(() => {
    const refs = surveyHeaderRefs.current.filter(Boolean) as HTMLDivElement[];
    if (refs.length < 2) return;
    refs.forEach(r => { r.style.minHeight = ''; });
    const max = Math.max(...refs.map(r => r.offsetHeight));
    refs.forEach(r => { r.style.minHeight = `${max}px`; });
  }, []);
  useEffect(() => {
    if (patterns.length === 0 || activeMenu !== 'survey') return;
    syncSurveyHeaders();
    window.addEventListener('resize', syncSurveyHeaders);
    return () => window.removeEventListener('resize', syncSurveyHeaders);
  }, [patterns, activeMenu, syncSurveyHeaders]);
  const setSurveyHeaderRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    surveyHeaderRefs.current[index] = el;
  }, []);

  // ページ全体（window）がスクロールする構造のため、scrollIntoViewで結果セクションへ移動する
  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const scrollToResults = useCallback(() => {
    resultRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, []);

  // ---- Creator連携 ----
  // ---- 実行 ----
  const handleRunPromoter = async () => {
    if (!hasInput) return;
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    // 登録サービスを選択していれば、そのURLをつぶやきに差し込む
    const url = selectedServiceUrl;

    const token = ++runTokenRef.current;
    setIsLoading(true);
    setLoadingMenu('promoter');
    setErrorMenu(null);
    try {
      const data = await generatePromotion(serviceBody, url);
      if (token !== runTokenRef.current) return; // キャンセル済み
      setPosts(data.map(t => ({ text: formatTweet(t), used: false })));
      setActiveMenu('promoter');
      setTimeout(scrollToResults, 100);
    } catch (error) {
      if (token !== runTokenRef.current) return;
      setErrorMenu('promoter');
      onHandleApiError(error);
    } finally {
      if (token === runTokenRef.current) {
        setIsLoading(false);
        setLoadingMenu(null);
      }
    }
  };

  const handleRunSurvey = async () => {
    if (!hasInput) return;
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    // 価格はサービス本文から自動抽出（見つからなければ空でOK）
    const priceDigits = extractPriceFromBody(serviceBody);

    const token = ++runTokenRef.current;
    setIsLoading(true);
    setLoadingMenu('survey');
    setErrorMenu(null);
    try {
      const data = await generateSurveyPatterns(serviceBody, priceDigits);
      if (token !== runTokenRef.current) return;
      setPatterns(data);
      setPatternsOriginal(JSON.parse(JSON.stringify(data)));
      const defaultPattern = data.find(p => p.id === 'B') || data[1] || data[0];
      setSelectedPatternId(defaultPattern?.id ?? null);
      setShowCode(true);
      setActiveMenu('survey');
      setTimeout(scrollToResults, 100);
    } catch (error) {
      if (token !== runTokenRef.current) return;
      setErrorMenu('survey');
      onHandleApiError(error);
    } finally {
      if (token === runTokenRef.current) {
        setIsLoading(false);
        setLoadingMenu(null);
      }
    }
  };

  // 出品済みサービスをURLで登録する（本文はページを開いて貼り付ける運用）。
  // ※skill.libecity.com はGoogleのクローラをログインへ弾くため自動取得は不可。
  //   URLは「ページを開く」と宣伝文へのリンク添付に使う。
  const handleRegisterUrl = () => {
    const url = registerUrl.trim();
    if (!url) return;
    if (!SKILL_URL_PATTERN.test(url)) {
      notify('スキルマーケットの出品ページURL（https://skill.libecity.com/services/…）を入力してください。', 'error');
      return;
    }
    // 既に登録済みなら、それを選択するだけ（保存済み生成物を復元）
    const existing = registeredServices.find(sv => sv.url === url);
    if (existing) {
      if (existing.id !== selectedServiceId) {
        loadedServiceRef.current = existing.id;
        setSelectedServiceId(existing.id);
        setServiceBody(existing.content);
        applyResults(resultsByServiceId[existing.id]);
      }
      setRegisterUrl('');
      notify(`登録済みの「${existing.title}」を選択しました。`);
      return;
    }
    if (registeredServices.length >= MAX_REGISTERED_SERVICES) {
      notify(`登録できるのは最大${MAX_REGISTERED_SERVICES}件です。不要なサービスを削除してから登録してください。`, 'error');
      return;
    }
    const sid = serviceIdFromUrl(url);
    const service: RegisteredService = {
      id: crypto.randomUUID(),
      url,
      title: sid ? `サービス #${sid}` : 'サービス',
      content: '',
      fetchedAt: new Date().toISOString(),
    };
    setRegisteredServices(prev => [service, ...prev]);
    loadedServiceRef.current = service.id;
    setSelectedServiceId(service.id);
    setServiceBody('');
    applyResults(EMPTY_RESULTS); // 新規サービスは生成物なしから開始
    setRegisterUrl('');
    notify('登録しました。「ページを開く」で本文をコピーして、開いた欄に貼り付けてください。');
    setTimeout(() => document.getElementById('support-body')?.focus(), 50);
  };

  // サービスカードをクリックして「対象」を切り替える
  // 生成物（宣伝文・アンケート・スライド資料・結果タブ）だけを初期化する。
  // 本文や登録サービスは触らない。対象を切り替えたら結果もそれに連動させるために使う。
  const resetGeneratedResults = () => {
    setPosts([]);
    setPatterns([]);
    setPatternsOriginal([]);
    setSelectedPatternId(null);
    setShowCode(false);
    setSlideDocReady(false);
    setActiveMenu(null);
    setErrorMenu(null);
    setAutoStyleDirective('');
    setSlidePrompts([]);
    setFlyerContent(null);
  };

  // 保存済みバケットを画面（表示中の結果）に反映する
  const applyResults = (b: ResultsBundle | undefined) => {
    const r = b ?? EMPTY_RESULTS;
    setPosts(r.posts ?? []);
    setPatterns(r.patterns ?? []);
    setPatternsOriginal(r.patternsOriginal ?? []);
    setSelectedPatternId(r.selectedPatternId ?? null);
    setShowCode(r.showCode ?? false);
    setSlideDocReady(r.slideDocReady ?? false);
    setActiveMenu(r.activeMenu ?? null);
    setErrorMenu(null);
    setAutoStyleDirective(r.autoStyleDirective ?? '');
    setSlidePrompts(Array.isArray(r.slidePrompts) ? r.slidePrompts : []);
    setFlyerContent(normalizeFlyerContent(r.flyerContent));
  };

  const handleSelectService = (sv: RegisteredService) => {
    if (sv.id === selectedServiceId) return; // 同じサービスなら何もしない（結果を保持）
    // 別サービスに切り替え：そのサービスの保存済み生成物を復元する
    loadedServiceRef.current = sv.id; // 保存effectが新バケットを正しく扱えるよう先に更新
    setSelectedServiceId(sv.id);
    setServiceBody(sv.content);
    applyResults(resultsByServiceId[sv.id]);
    notify(`「${sv.title}」を選択しました。`);
  };

  // 本文の編集。サービスを選択中なら本文として保存する（タイトルの確定は「登録する」で行う）
  const handleBodyChange = (val: string) => {
    const changed = val !== serviceBody;
    setServiceBody(val);
    if (selectedServiceId) {
      setRegisteredServices(prev => prev.map(sv =>
        sv.id === selectedServiceId ? { ...sv, content: val } : sv
      ));
    }
    // 内容が更新されたら、その本文由来の生成物（宣伝文・アンケート・スライド資料）は
    // 古くなるので初期化する。選択中サービスのバケットも保存effect経由で空になる。
    const hasAnyResult = posts.length > 0 || patterns.length > 0 || slideDocReady || activeMenu !== null || autoStyleDirective !== '' || slidePrompts.length > 0 || flyerContent !== null;
    if (changed && hasAnyResult) resetGeneratedResults();
    // まとめチラシに載せているサービスの本文が変わったら、その文言も古くなる
    if (changed && multiFlyerContent && selectedServiceId && multiFlyerIds.includes(selectedServiceId)) {
      setMultiFlyerContent(null);
    }
  };

  // 貼り付けた本文からGeminiでサービス名を認識し、カード（ラジオボタンの右）に確定表示する
  const handleRegisterBody = async () => {
    if (!selectedServiceId || !serviceBody.trim()) return;
    const sv = registeredServices.find(s => s.id === selectedServiceId);
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setIsRegisteringBody(true);
    try {
      // ページ取得ではなく手元の本文を読むだけなので確実。失敗時は先頭行にフォールバック
      const recognized = await extractServiceTitle(serviceBody);
      const title = recognized || deriveTitle(serviceBody, sv?.url ?? '');
      setRegisteredServices(prev => prev.map(s =>
        s.id === selectedServiceId ? { ...s, content: serviceBody, title } : s
      ));
      notify(`「${title}」として登録しました。`);
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setIsRegisteringBody(false);
    }
  };

  const handleRemoveRegistered = (id: string) => {
    setRegisteredServices(prev => prev.filter(sv => sv.id !== id));
    // まとめチラシの選択に入っていたら、選択と生成済みの文言を破棄する
    if (multiFlyerIds.includes(id)) {
      setMultiFlyerIds(prev => prev.filter(x => x !== id));
      setMultiFlyerContent(null);
    }
    // そのサービスの保存済み生成物も破棄
    setResultsByServiceId(prev => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // 選択中を削除したら、対象・結果もクリア
    if (selectedServiceId === id) {
      loadedServiceRef.current = null;
      setSelectedServiceId(null);
      setServiceBody('');
      resetGeneratedResults();
    }
  };

  // 「作成する」を押したタイミングで、AIおまかせ用のサービス専用トンマナをここで設計しておく。
  // コピー時は生成済みの結果を貼るだけにする。
  const handleRunSlideDoc = async () => {
    if (!hasInput) return;
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    const token = ++runTokenRef.current;
    setIsLoading(true);
    setLoadingMenu('slidedoc');
    setErrorMenu(null);
    try {
      const auto = await generateAutoSlideStyle(serviceBody);
      if (token !== runTokenRef.current) return; // キャンセル済み
      // 生成できなくても他のトンマナは使えるので、資料メニュー自体は開く（ai_autoは汎用指定にフォールバック）
      setAutoStyleDirective(auto.trim());
      if (!auto.trim()) {
        notify('AIおまかせのトンマナを設計できませんでした。他のトンマナは利用できます。', 'error');
      }
      setSlideDocReady(true);
      setCopiedSlideDocVersion(null);
      setActiveMenu('slidedoc');
      setTimeout(scrollToResults, 100);
    } catch (error) {
      if (token !== runTokenRef.current) return;
      setErrorMenu('slidedoc');
      onHandleApiError(error);
    } finally {
      if (token === runTokenRef.current) {
        setIsLoading(false);
        setLoadingMenu(null);
      }
    }
  };

  const handleCancelRun = () => {
    runTokenRef.current++;
    setIsLoading(false);
    setLoadingMenu(null);
    notify('生成をキャンセルしました。');
  };

  // コピーは生成済みの結果を貼るだけ（AIおまかせのトンマナは「作成する」時に設計済み）
  const handleCopySlideDocPrompt = (version: ThumbnailPromptVersion) => {
    const prompt = getSlideDocPrompt(serviceBody, version, version === 'ai_auto' ? autoStyleDirective : undefined);
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedSlideDocVersion(version);
      setTimeout(() => setCopiedSlideDocVersion(null), 2000);
    });
  };

  // ChatGPTで1枚ずつ作るための「画像ごとの中身」を生成する（トンマナ・レイアウト非依存）
  const handleGenerateSlidePrompts = async () => {
    if (!hasInput) return;
    const keyReady = await ensureKeySet();
    if (!keyReady) return;
    setIsSlideGenLoading(true);
    try {
      const data = await generateSlideImageContents(serviceBody);
      if (data.length === 0) {
        notify('画像プロンプトを生成できませんでした。本文を増やして再度お試しください。', 'error');
        return;
      }
      setSlidePrompts(data);
      setCopiedSlideNo(null);
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setIsSlideGenLoading(false);
    }
  };

  // ---- チラシ（紙に印刷して配る） ----
  // 「作成する」で、このサービス1枚分の文言を作る。
  // AIおまかせ用のトンマナは資料メニューと共用なので、未設計のときだけここで一緒に作る。
  const handleRunFlyer = async () => {
    if (!hasInput) return;
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    const token = ++runTokenRef.current;
    setIsLoading(true);
    setLoadingMenu('flyer');
    setErrorMenu(null);
    try {
      const content = await generateFlyerContent(serviceBody);
      if (token !== runTokenRef.current) return; // キャンセル済み
      if (!content) {
        setErrorMenu('flyer');
        notify('チラシの方針と文言を作れませんでした。本文を増やして再度お試しください。', 'error');
        return;
      }
      setFlyerContent(content);
      setFlyerMode('single');
      setCopiedTemplateId(null);
      setActiveMenu('flyer');
      setTimeout(scrollToResults, 100);
    } catch (error) {
      if (token !== runTokenRef.current) return;
      setErrorMenu('flyer');
      onHandleApiError(error);
    } finally {
      if (token === runTokenRef.current) {
        setIsLoading(false);
        setLoadingMenu(null);
      }
    }
  };

  // まとめチラシに載せるサービスの選び直し。組み合わせが変われば文言は作り直しになる。
  const toggleMultiFlyerId = (id: string) => {
    const has = multiFlyerIds.includes(id);
    if (!has && multiFlyerIds.length >= MAX_MULTI_FLYER) {
      notify(`1枚に載せられるのは${MAX_MULTI_FLYER}件までです。`, 'error');
      return;
    }
    setMultiFlyerIds(has ? multiFlyerIds.filter(x => x !== id) : [...multiFlyerIds, id]);
    setMultiFlyerContent(null);
    setCopiedMultiFlyer(false);
  };

  // 選んだサービスをまとめて1枚に載せる文言を作る（並び順は登録順に合わせる）
  const handleGenerateMultiFlyer = async () => {
    const targets = registeredServices.filter(sv => multiFlyerIds.includes(sv.id) && sv.content.trim());
    if (targets.length < 2) return;
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setIsMultiFlyerLoading(true);
    try {
      const data = await generateMultiFlyerContent(targets.map(sv => ({ title: sv.title, body: sv.content })));
      if (!data) {
        notify('まとめチラシの文言を作れませんでした。各サービスの本文が登録されているか確認してください。', 'error');
        return;
      }
      setMultiFlyerContent(data);
      setCopiedMultiFlyer(false);
      setActiveMenu('flyer');
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setIsMultiFlyerLoading(false);
    }
  };

  const handleCopyFlyerPrompt = (templateId: FlyerTemplateId) => {
    if (!flyerContent) return;
    const text = buildFlyerPromptText(flyerContent, templateId, {
      matchThumbnail: flyerMatchThumbnail,
      serviceUrl: selectedServiceUrl || undefined,
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTemplateId(templateId);
      setTimeout(() => setCopiedTemplateId(prev => (prev === templateId ? null : prev)), 2000);
    });
  };

  // まとめチラシは複数サービスにまたがるため、1サービス専用トンマナは渡さない（汎用のおまかせ指定になる）
  const handleCopyMultiFlyerPrompt = () => {
    if (!multiFlyerContent) return;
    const text = buildMultiFlyerPromptText(multiFlyerContent, flyerVersion, undefined, multiFlyerUrls);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMultiFlyer(true);
      setTimeout(() => setCopiedMultiFlyer(false), 2000);
    });
  };

  // コピー時に、選択トンマナ（＋AIおまかせの専用トンマナ）を差し込んでプロンプトを組み立てる
  const handleCopySlidePrompt = (slide: SlideImagePrompt) => {
    const text = buildSlideImagePromptText(
      slide, slideVersion, slidePrompts.length,
      slideVersion === 'ai_auto' ? autoStyleDirective : undefined
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSlideNo(slide.no);
      setTimeout(() => setCopiedSlideNo(prev => (prev === slide.no ? null : prev)), 2000);
    });
  };

  // 【試験的】全枚分を1本にまとめたプロンプトをコピーする（ChatGPT の複数枚一括生成に1回で貼る）
  const handleCopySlideBatchPrompt = () => {
    if (slidePrompts.length === 0) return;
    const text = buildSlideImageBatchPromptText(
      slidePrompts, slideVersion,
      slideVersion === 'ai_auto' ? autoStyleDirective : undefined
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSlideBatch(true);
      setTimeout(() => setCopiedSlideBatch(false), 2000);
    });
  };

  // Googleフォームのヘッダーバナー用プロンプトをコピーする
  // （トップ画像をChatGPTに添付してもらう前提の静的プロンプト。API呼び出しなし）
  const handleCopyBannerPrompt = () => {
    if (!selectedPattern) return;
    navigator.clipboard.writeText(getFormBannerPrompt(selectedPattern.formTitle)).then(() => {
      setCopiedBannerPrompt(true);
      setTimeout(() => setCopiedBannerPrompt(false), 2000);
    });
  };

  const handleGenerateCode = () => {
    if (!selectedPattern) return;
    setShowCode(true);
    setTimeout(() => {
      document.getElementById('gas-code-section')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }, 100);
  };

  const handleUpdateQuestions = (questions: SurveyQuestionDef[]) => {
    if (!selectedPatternId) return;
    setPatterns(prev => prev.map(p => (p.id === selectedPatternId ? { ...p, questions } : p)));
  };

  const handleResetQuestions = () => {
    if (!selectedPatternId) return;
    const original = patternsOriginal.find(p => p.id === selectedPatternId);
    if (original) {
      setPatterns(prev => prev.map(p => (p.id === selectedPatternId ? JSON.parse(JSON.stringify(original)) : p)));
    }
  };

  const selectedIsDirty = useMemo(() => {
    if (!selectedPattern) return false;
    const original = patternsOriginal.find(p => p.id === selectedPattern.id);
    return !!original && JSON.stringify(original.questions) !== JSON.stringify(selectedPattern.questions);
  }, [selectedPattern, patternsOriginal]);

  // 「入力と結果をクリア」は生成物だけ消す。登録した出品サービスURLは消さない（消すまで残す）
  const handleClearAll = () => {
    setServiceBody('');
    loadedServiceRef.current = null;
    setSelectedServiceId(null);
    resetGeneratedResults();
    setResultsByServiceId({}); // サービスごとの保存済み生成物も全消去
    setMultiFlyerIds([]);
    setMultiFlyerContent(null);
    setShowClearConfirm(false);
  };

  const handleTweetChange = (index: number, next: TweetPost) => {
    setPosts(prev => prev.map((p, i) => (i === index ? next : p)));
  };

  // ---- メニュー定義 ----
  const retryHandlers: Record<MenuId, () => void> = {
    promoter: handleRunPromoter,
    survey: handleRunSurvey,
    slidedoc: handleRunSlideDoc,
    flyer: handleRunFlyer,
  };

  const supportMenus = [
    {
      id: 'promoter' as MenuId,
      title: '宣伝文を作る',
      description: 'リベシティの文化に合う「前向き・丁寧・押しつけない」つぶやきを生成。口コミがあれば自然に反映します。',
      highlight: '20本を一括生成',
      icon: <MegaphoneIcon />,
      onRun: handleRunPromoter,
    },
    {
      id: 'slidedoc' as MenuId,
      title: 'サービス資料を作る',
      description: 'NotebookLMでスライド資料を作るためのプロンプトを用意。サービス画像としてそのまま使えます。',
      highlight: 'トンマナ8種から選択',
      icon: <PresentationIcon />,
      onRun: handleRunSlideDoc,
    },
    {
      id: 'flyer' as MenuId,
      title: 'チラシを作る（検証中）',
      description: 'オフ会で手渡す前提の、B5たて1枚のチラシ。本文からデザインの方針をAIが決め、日本のチラシでよく使う5つの型から選んでプロンプトにします。コンビニのネットプリントでそのまま刷れます。',
      highlight: 'B5たて・方針はAIが設計・紙面の型5つ',
      icon: <FlyerIcon />,
      onRun: handleRunFlyer,
    },
    {
      id: 'survey' as MenuId,
      title: 'アンケートを作る',
      description: '購入者の声を集めるGoogleフォームを自動設計。価格印象などもサービス情報から自動反映します。',
      highlight: 'フォーム3案を自動設計',
      icon: <ClipboardListIcon />,
      onRun: handleRunSurvey,
    },
  ];

  // ---- 結果タブ ----
  const resultTabs = [
    posts.length > 0 && { id: 'promoter' as MenuId, label: `宣伝文 ${posts.length}本` },
    slideDocReady && { id: 'slidedoc' as MenuId, label: 'スライド資料' },
    (flyerContent || multiFlyerContent) && { id: 'flyer' as MenuId, label: 'チラシ（検証中）' },
    patterns.length > 0 && { id: 'survey' as MenuId, label: 'アンケート 3案' },
  ].filter(Boolean) as Array<{ id: MenuId; label: string }>;

  const hasResults = resultTabs.length > 0;
  // ---- 案内（幕と穴） ----
  // 基本の案内と、表示中のメニューの案内を1つの Tour で切り替える。自動では始めない（ヘッダのボタンからだけ）
  const [tourOpen, setTourOpen] = useState(false);
  const shownMenu: MenuId | null = resultTabs.some(t => t.id === activeMenu)
    ? activeMenu
    : (resultTabs[0]?.id ?? null);
  const tourSteps = shownMenu ? MENU_TOURS[shownMenu] : SUPPORT_TOUR;
  useEffect(() => {
    const open = () => setTourOpen(true);
    window.addEventListener(TOUR_EVENT, open);
    return () => window.removeEventListener(TOUR_EVENT, open);
  }, []);
  const closeTour = () => setTourOpen(false);

  const usedCount = posts.filter(p => p.used).length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 md:p-10">

        {/* Header */}
        <Tour steps={tourSteps} open={tourOpen} onClose={closeTour} />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="eyebrow mb-1 block">Support</span>
            <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">サポートメニュー</h2>
            <p className="text-stone-500 text-sm mt-2">サービス詳細を入力すると、各メニューが実行できます。入力と結果は自動保存されます。</p>
          </div>
          {(hasInput || hasResults) && (
            showClearConfirm ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <span className="text-xs text-stone-500">入力と結果を消去しますか？</span>
                <button onClick={handleClearAll} className="btn-dark py-2 px-4 text-xs">はい</button>
                <button onClick={() => setShowClearConfirm(false)} className="btn-quiet py-2 px-4 text-xs">いいえ</button>
              </div>
            ) : (
              <button onClick={() => setShowClearConfirm(true)} className="btn-secondary py-2 px-4 text-xs">
                入力と結果をクリア
              </button>
            )
          )}
        </div>

        {/* この画面の使い方: 3段。押すとその段へ飛んで、枠を光らせる */}
        <ol data-tour="support-usage" aria-label="この画面の使い方" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8 list-none m-0 p-0">
          {[
            { id: 'support-service', title: 'URLを登録して、本文を貼る', hint: '出品ページを開いてコピー → 貼って保存' },
            { id: 'support-menus', title: 'メニューを選んで作る', hint: '宣伝文・資料・チラシ・アンケート' },
            { id: 'support-results', title: '結果をコピーして使う', hint: 'つぶやき・ChatGPT・NotebookLM・GAS へ' },
          ].map((st, i) => (
            <li key={st.id}>
              <button type="button" onClick={() => jumpToSection(st.id)} className="w-full text-left card-hoverable px-3 py-2.5 flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-stone-900 leading-snug">{st.title}</span>
                  <span className="block text-[11px] text-stone-500 leading-snug">{st.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* ① 登録済みサービス（台帳＝登録・一覧・閲覧） */}
        <div id="support-service" className="mb-6 scroll-mt-24 rounded-2xl">
          <SectionLabel label="対象のサービス" />
          {/* 使い方の絵は求められたときだけ（画面の主役は入力なので、既定では閉じる） */}
          <details className="mb-3 group" data-tour="support-guide">
            <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-500 transition-colors [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">▾</span>
              使い方を動きで見る（URLを登録 → 本文をコピー → 貼って保存 → メニュー）
            </summary>
            <div className="mt-3"><SupportGuide /></div>
          </details>
          <div className="card p-5">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <label htmlFor="register-url" className="text-sm font-semibold text-stone-700">
                出品済みサービスをURLで登録
                <span className="text-xs text-stone-400 font-normal ml-2">URLを登録 → 本文を貼る → 下のメニューを選ぶ、の順です</span>
              </label>
              <span className={`text-xs font-semibold ${registeredServices.length >= MAX_REGISTERED_SERVICES ? 'text-brand-600' : 'text-stone-400'}`}>
                {registeredServices.length}/{MAX_REGISTERED_SERVICES}件
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="register-url"
                type="url"
                value={registerUrl}
                onChange={(e) => setRegisterUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRegisterUrl(); } }}
                placeholder="https://skill.libecity.com/services/…"
                className="field flex-grow px-4 py-2.5 text-sm rounded-full bg-white"
              />
              <button
                type="button"
                onClick={handleRegisterUrl}
                disabled={!registerUrl.trim()}
                className="btn-secondary px-5 py-2.5 text-xs shrink-0"
              >
                URLを追加
              </button>
            </div>

            {/* 登録済み一覧（閲覧・選択） */}
            {registeredServices.length > 0 ? (
              <div className="mt-5 pt-5 border-t border-stone-100">
                <p className="text-xs text-stone-500 mb-2 font-medium">改善したいサービスを選択してください</p>
                <div className="flex flex-col gap-2">
                  {registeredServices.map(sv => {
                    const isSelected = selectedServiceId === sv.id;
                    return (
                      <React.Fragment key={sv.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectService(sv)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectService(sv); } }}
                        className={`cursor-pointer rounded-xl border px-4 py-3 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-brand-400 ring-2 ring-brand-100 bg-brand-50/40'
                            : 'border-stone-200 bg-white hover:border-brand-200'
                        }`}
                      >
                        <span className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-brand-500' : 'border-stone-300'
                        }`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-brand-500"></span>}
                        </span>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-semibold text-stone-800 leading-snug break-words" title={sv.title}>{sv.title}</p>
                          {sv.content.trim() ? (
                            <p className="text-[11px] text-emerald-600 font-medium">本文あり</p>
                          ) : (
                            <p className="text-[11px] text-brand-500 font-medium">本文 未貼り付け</p>
                          )}
                        </div>
                        <a
                          href={sv.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 chip px-2.5 py-1 text-[10px] inline-flex items-center gap-1"
                          title="このサービスの出品ページを新しいタブで開く（本文をコピーして貼り付け）"
                        >
                          ページを開く<span aria-hidden>↗</span>
                        </a>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveRegistered(sv.id); }}
                          aria-label={`${sv.title} の登録を削除`}
                          className="shrink-0 w-6 h-6 rounded-full text-stone-300 hover:text-brand-500 hover:bg-brand-50 text-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      {/* 選ぶと、その場で本文を貼る欄が開く（台帳と本文を1つの流れにする） */}
                      {isSelected && (
                        <div className="rounded-xl border border-brand-100 bg-white p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <label htmlFor="support-body" className="text-sm font-semibold text-stone-700">
                              このサービスの本文
                              <span className="text-xs text-stone-400 font-normal ml-2">出品ページを開いて本文をコピー → ここに貼り付け（口コミも一緒に貼るとGood）</span>
                            </label>
                            <a href={sv.url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-4 py-1.5 text-xs shrink-0">
                              ページを開く<span aria-hidden>↗</span>
                            </a>
                          </div>
                          <textarea
                            id="support-body"
                            value={serviceBody}
                            onChange={(e) => handleBodyChange(e.target.value)}
                            className="field w-full p-4 min-h-[160px] text-sm leading-relaxed"
                            placeholder="出品ページの本文をコピーして、ここに貼り付けてください。"
                          />
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={handleRegisterBody}
                              disabled={!hasInput || isRegisteringBody}
                              className="btn-dark px-5 py-2 text-xs shrink-0"
                            >
                              {isRegisteringBody ? 'サービス名を認識中…' : 'この本文を保存'}
                            </button>
                            {hasInput && (
                              <p className="text-xs text-emerald-600 font-medium animate-in fade-in">
                                保存するとこのサービスに紐付き、下のメニューがすぐ使えます
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 mt-4">
                まだ登録がありません。出品ページのURLを追加すると、本文を貼る欄が開きます。
              </p>
            )}
          </div>
        </div>

        {/* URLを登録しない人向け: 本文だけ貼る（サービス未選択のときだけ） */}
        {!selectedServiceId && (
          <div className="mb-8">
            {(showLooseBody || hasInput) ? (
              <div className="card p-5">
                <label htmlFor="support-body" className="font-semibold text-stone-700 text-sm block mb-2">
                  本文だけ貼る
                  <span className="text-xs text-stone-400 font-normal ml-2">URLを登録しない場合はこちら。口コミも一緒に貼るとGood</span>
                </label>
                <textarea
                  id="support-body"
                  value={serviceBody}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  className="field w-full p-5 min-h-[160px] text-sm leading-relaxed"
                  placeholder="出品ページの本文をコピーして、ここに貼り付けてください。"
                />
                {hasInput && <p className="mt-2 text-xs text-emerald-600 font-medium animate-in fade-in">入力済み — 下のメニューを実行できます</p>}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLooseBody(true)}
                className="text-xs text-stone-400 hover:text-brand-500 underline decoration-stone-200 underline-offset-2 transition-colors"
              >
                URLを登録せずに、本文だけ貼って使う
              </button>
            )}
          </div>
        )}

        {/* Menu List — この1入力で3つのAIメニューが動く、を強調 */}
        <div id="support-menus" data-tour="support-menus" className="mb-8 scroll-mt-24 rounded-2xl">
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">AI メニュー</span>
            <span className="w-1 h-1 rounded-full bg-brand-300"></span>
            <span className="text-[11px] text-stone-400">入力はこれだけ。あとはワンクリックで完成</span>
            <div className="h-px bg-stone-200 flex-grow"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportMenus.map((menu) => {
              const hasResult = resultTabs.some(t => t.id === menu.id);
              const isBusy = loadingMenu === menu.id;
              return (
                <div
                  key={menu.id}
                  className={`relative rounded-2xl border p-5 flex flex-col transition-all duration-300 ease-smooth ${
                    hasInput
                      ? 'bg-white border-stone-200/80 hover:border-brand-200 hover:shadow-card-hover'
                      : 'bg-white border-stone-200/60 opacity-60'
                  }`}
                >
                  {hasResult && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">結果あり</span>
                  )}
                  <div
                    className="bg-brand-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center mb-4 shadow-brand"
                  >
                    {menu.icon}
                  </div>
                  <span className="inline-flex self-start items-center text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-2">
                    {menu.highlight}
                  </span>
                  <h4 className="text-base font-bold text-stone-900 mb-1.5">{menu.title}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed flex-grow">{menu.description}</p>
                  <button
                    onClick={menu.onRun}
                    disabled={!hasInput || isLoading}
                    className="btn-primary w-full mt-4 py-2.5 text-xs"
                  >
                    {isBusy ? '生成中…' : (hasResult ? '再作成' : '作成する')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* エラー時のリトライ導線 */}
          {errorMenu && !isLoading && (
            <div className="mt-4 card p-4 border-brand-200 bg-brand-50/50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <p className="text-sm text-stone-600">
                「{supportMenus.find(m => m.id === errorMenu)?.title}」の生成に失敗しました。時間をおいて再試行してください。
              </p>
              <button onClick={() => retryHandlers[errorMenu]()} className="btn-dark px-5 py-2 text-xs">
                再試行
              </button>
            </div>
          )}
        </div>

        {/* Results Area */}
        {hasResults && (
          <div id="support-results" ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8 scroll-mt-24 rounded-2xl">
            <SectionLabel label="結果" />

            {/* 結果タブ（1つだけでもラベルを出して、何の結果かを明示する） */}
            {resultTabs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {resultTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMenu(tab.id)}
                    aria-pressed={shownMenu === tab.id}
                    className={`px-4 py-2 text-xs ${shownMenu === tab.id ? 'seg-active' : 'seg'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Promoter Results */}
            {shownMenu === 'promoter' && posts.length > 0 && (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">生成されたつぶやき ({posts.length}本)</h3>
                    <p className="text-xs text-stone-500 mt-1">編集してからコピーできます。投稿したら「使用済み」にしておくと管理が楽です。</p>
                  </div>
                  {usedCount > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                      {usedCount}/{posts.length} 本 使用済み
                    </span>
                  )}
                </div>
                <div className="space-y-5 pb-6" data-tour="menu-promoter-list">
                  {posts.map((post, idx) => (
                    <TweetCard key={idx} post={post} index={idx} onChange={handleTweetChange} />
                  ))}
                </div>
              </div>
            )}

            {/* Slide Doc Results */}
            {shownMenu === 'slidedoc' && slideDocReady && (
              <div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-stone-900">スライド資料をつくる</h3>
                  <p className="text-xs text-stone-500 mt-1">作り方を選べます。まとめて作るなら NotebookLM、画風をそろえて作るなら ChatGPT（1枚ずつ貼る／まとめて1回で貼る）。トンマナ（画風）はどちらも同じ{SLIDE_DOC_VERSIONS.length}種から選べます。</p>
                </div>

                {/* 作り方の切り替え */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button type="button" data-tour="menu-slide-mode" onClick={() => setSlideMode('notebooklm')} aria-pressed={slideMode === 'notebooklm'} className={`px-4 py-2 text-xs ${slideMode === 'notebooklm' ? 'seg-active' : 'seg'}`}>NotebookLMで一括</button>
                  <button type="button" onClick={() => setSlideMode('chatgpt')} aria-pressed={slideMode === 'chatgpt'} className={`px-4 py-2 text-xs ${slideMode === 'chatgpt' ? 'seg-active' : 'seg'}`}>ChatGPTで作る</button>
                </div>

                {slideMode === 'notebooklm' && (
                <div>
                <div className="mb-6">
                  <h4 className="text-base font-bold text-stone-900">トンマナを選んでコピー（{SLIDE_DOC_VERSIONS.length}パターン）</h4>
                  <p className="text-xs text-stone-500 mt-1">お好みのトンマナをコピーし、NotebookLM のスライド作成カスタマイズ欄に貼り付けてください。</p>
                  <p className="text-[11px] text-stone-400 mt-1">※画像は雰囲気を伝えるトンマナ見本です。実際に作られるのはサムネイルではなくスライド資料です。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-8" data-tour="menu-slide-tones">
                  {SLIDE_DOC_VERSIONS.map(({ id, label, description }) => {
                    const isCopied = copiedSlideDocVersion === id;
                    const isWide = id === 'my_style' || id === 'ai_auto';
                    const isRecommended = id === 'ai_auto';
                    return (
                      <div key={id} className={`card p-5 ${isWide ? 'md:col-span-2' : ''} ${isRecommended ? 'ring-1 ring-brand-200 bg-brand-50/20' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-stone-900">{label}</h4>
                            <p className="text-xs text-stone-500 leading-relaxed mt-1">{description}</p>
                            {isRecommended && (
                              <p className="text-[11px] text-brand-600 font-medium mt-1.5">
                                {autoStyleDirective
                                  ? 'この本文をもとに、AIがこのサービス専用のトンマナを設計済みです。'
                                  : '専用トンマナは未設計です。「再作成」で設計し直せます（今は汎用のおまかせ指定でコピーされます）。'}
                              </p>
                            )}
                          </div>
                          <PromptPreview version={id} badge="トンマナ見本" className="w-[120px] shrink-0 rounded-lg border border-stone-100" />
                          <button
                            type="button"
                            onClick={() => handleCopySlideDocPrompt(id)}
                            className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors shrink-0 ${
                              isCopied
                                ? 'bg-brand-50 text-brand-600'
                                : 'bg-stone-900 text-white hover:bg-stone-700'
                            }`}
                          >
                            {isCopied ? 'コピーしました' : 'コピー'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* NotebookLM のどこに何を貼るか。絵は求められたときだけ開く（既定は閉じる） */}
                <details className="mb-4 group" data-tour="menu-slide-notebooklm">
                  <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-500 transition-colors [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">▾</span>
                    NotebookLM のどこに何を貼るかを動きで見る（本文・画像はソース、指示は Studio のカスタマイズ欄）
                  </summary>
                  <div className="mt-3"><NotebookLMGuide /></div>
                </details>

                {/* Usage guide */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 mb-6" data-tour="menu-slide-steps">
                  <h4 className="text-sm font-bold text-stone-900 mb-3">スライド生成から画像化までの手順</h4>
                  <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside leading-relaxed mb-4">
                    <li>「NotebookLM を開く」ボタンから新規ノートブックを作成</li>
                    <li>左の「ソース」→「＋ 追加」→「コピーしたテキスト」に、サービス詳細文章を貼って「挿入」。アイコン画像を入れるなら、もう一度「＋ 追加」→「ファイルをアップロード」（<span className="font-semibold">どちらもソース。真ん中のチャット欄ではありません</span>）</li>
                    <li>右の「Studio」→「スライド資料」の<span className="font-semibold">鉛筆（カスタマイズ）</span>→ 開いた欄にコピーしたプロンプトを貼り付け（<span className="font-semibold">チャット欄に貼ると資料に反映されません</span>）</li>
                    <li>生成を実行してスライドを確認し、<span className="font-semibold">PDF形式でダウンロード</span></li>
                    <li>「I Love PDF を開く」ボタンから PDF→JPG のページに移動し、ダウンロードした PDF をアップロード</li>
                    <li>「ページを抽出」→ 変換を実行 → 各スライドを JPG 化した ZIP ファイルがダウンロードされます（解凍すると 1 枚ずつの画像になります）</li>
                    <li>このあとは、<span className="font-semibold">スキルマーケットのサービス画像に追加</span>しましょう</li>
                  </ol>
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href="https://notebooklm.google.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        // PWAに吸われず、必ずブラウザの新しいタブで開く
                        window.open('https://notebooklm.google.com/new', '_blank', 'noopener,noreferrer');
                      }}
                      className="btn-dark px-4 py-2 text-xs"
                    >
                      NotebookLM を開く
                    </a>
                    <a
                      href="https://www.ilovepdf.com/ja/pdf_to_jpg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary px-4 py-2 text-xs"
                    >
                      I Love PDF を開く
                    </a>
                  </div>
                </div>
                </div>
                )}

                {slideMode === 'chatgpt' && (
                <div>
                  <div className="mb-5">
                    <h4 className="text-base font-bold text-stone-900">トンマナを選んで、ChatGPT に貼るプロンプトを作る</h4>
                    <p className="text-xs text-stone-500 mt-1">ChatGPTの画像生成（GPT Image）用です。<span className="font-medium text-stone-600">画風・配色・書体は全画像で統一しつつ、レイアウトは各ページの内容に最適化</span>する指示にしています。</p>
                  </div>

                  {/* 貼り方の切り替え。1枚ずつ（実績あり）／まとめて1回（Images 2.0 の複数枚一括生成向け・試験的） */}
                  <div className="flex flex-wrap items-center gap-2 mb-2" data-tour="menu-slide-chat-mode">
                    <button type="button" onClick={() => setSlideChatMode('one_by_one')} aria-pressed={slideChatMode === 'one_by_one'} className={`px-4 py-2 text-xs ${slideChatMode === 'one_by_one' ? 'seg-active' : 'seg'}`}>1枚ずつ貼る</button>
                    <button type="button" onClick={() => setSlideChatMode('batch')} aria-pressed={slideChatMode === 'batch'} className={`px-4 py-2 text-xs ${slideChatMode === 'batch' ? 'seg-active' : 'seg'}`}>まとめて1回で貼る<span className="ml-1.5 text-[10px] font-semibold opacity-70">試験的</span></button>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-5">
                    {slideChatMode === 'one_by_one'
                      ? '同じチャットに上から順に貼ります。1枚ずつ確認しながら進めたいときはこちら。'
                      : 'ChatGPT の複数枚一括生成（Images 2.0 以降・有料プラン）向けに、全枚分を1本にまとめます。1回で作れる枚数には上限があるので、止まったら「続き」と送ってください。1枚ずつと同じ設計内容を使うので、作り直しは不要です。'}
                  </p>

                  {/* トンマナ選択（サンプル画像ボタン。NotebookLMと同じ8種） */}
                  <ToneGrid value={slideVersion} onChange={setSlideVersion} className="mb-3" />
                  <p className="text-[11px] text-stone-400 mb-4">
                    選んだトンマナと貼り方はコピーに即反映されます（切り替えても作り直しは不要）。
                    {slideVersion === 'ai_auto' && (autoStyleDirective ? '「AIおまかせ」はこのサービス専用に設計済みのトンマナを使います。' : '「AIおまかせ」は汎用のおまかせ指定になります（専用設計は「作成する」で行われます）。')}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {slidePrompts.length === 0 && (
                      <button type="button" onClick={handleGenerateSlidePrompts} disabled={isSlideGenLoading} className="btn-primary px-6 py-2.5 text-xs">
                        {isSlideGenLoading ? '画像の中身を設計中…' : '各画像に入れる文字を設計する'}
                      </button>
                    )}
                    <a
                      href="https://chatgpt.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.preventDefault(); window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); }}
                      className="btn-dark px-4 py-2.5 text-xs"
                    >
                      ChatGPT を開く
                    </a>
                  </div>

                  {slidePrompts.length > 0 && slideChatMode === 'one_by_one' && (
                    <>
                      <p className="text-xs text-stone-500 mb-3 font-medium">上から順番に、同じ ChatGPT のチャットへ貼り付けて画像を生成してください（全{slidePrompts.length}枚）。</p>
                      <div className="space-y-3 mb-8">
                        {slidePrompts.map((slide) => {
                          const isCopied = copiedSlideNo === slide.no;
                          return (
                            <div key={slide.no} className="card p-5">
                              <div className="flex items-start gap-3">
                                <span className="shrink-0 w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">{slide.no}</span>
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">{slide.label}</span>
                                    <h5 className="text-sm font-bold text-stone-900 truncate">{slide.title}</h5>
                                  </div>
                                  <p className="text-xs text-stone-500 leading-relaxed whitespace-pre-line line-clamp-4">{slide.body}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopySlidePrompt(slide)}
                                  className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors shrink-0 ${isCopied ? 'bg-brand-50 text-brand-600' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                                >
                                  {isCopied ? 'コピー済み' : 'プロンプトをコピー'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Usage guide (ChatGPT / 1枚ずつ) */}
                      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 mb-6">
                        <h4 className="text-sm font-bold text-stone-900 mb-3">ChatGPTで1枚ずつ作る手順</h4>
                        <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside leading-relaxed mb-4">
                          <li>「ChatGPT を開く」ボタンから新しいチャットを開く（画像生成／GPT Image に対応したモデルを選択）</li>
                          <li>参考にしたい画像（既存サムネ等）があれば、先に添付するとより狙い通りの画風になります</li>
                          <li><span className="font-semibold">1枚目のプロンプトをコピーして送信</span> → 画風・配色・書体が決まります</li>
                          <li><span className="font-semibold">同じチャットのまま</span>、2枚目以降を順番に送信（画風は引き継ぎ、レイアウトはページごとに最適化されます）</li>
                          <li>気になる箇所は「ここだけ直して」と同じチャットで微調整</li>
                          <li>各画像をダウンロードし、<span className="font-semibold">スキルマーケットのサービス画像に追加</span></li>
                        </ol>
                        <a
                          href="https://chatgpt.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.preventDefault(); window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); }}
                          className="btn-dark px-4 py-2 text-xs"
                        >
                          ChatGPT を開く
                        </a>
                      </div>
                    </>
                  )}

                  {slidePrompts.length > 0 && slideChatMode === 'batch' && (
                    <>
                      {/* 全枚分を1本にまとめたプロンプト。1回貼れば ChatGPT が番号順に全枚を生成する */}
                      <div className="card p-5 mb-5" data-tour="menu-slide-batch">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h5 className="text-sm font-bold text-stone-900">全{slidePrompts.length}枚をまとめて1回で作るプロンプト</h5>
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">試験的</span>
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">
                              1本のプロンプトに、共通のデザイン仕様と画像1〜{slidePrompts.length}の文言をすべて入れています。ChatGPT に1回貼ると、独立した{slidePrompts.length}枚の画像が番号順にできます。
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopySlideBatchPrompt}
                            className={`text-xs font-semibold px-5 py-2 rounded-full transition-colors shrink-0 ${copiedSlideBatch ? 'bg-brand-50 text-brand-600' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                          >
                            {copiedSlideBatch ? 'コピー済み' : 'まとめてコピー'}
                          </button>
                        </div>
                        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                          {slidePrompts.map((slide) => (
                            <li key={slide.no} className="flex items-center gap-2 min-w-0 text-xs">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center">{slide.no}</span>
                              <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">{slide.label}</span>
                              <span className="text-stone-700 truncate">{slide.title}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Usage guide (ChatGPT / まとめて1回) */}
                      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 mb-6">
                        <h4 className="text-sm font-bold text-stone-900 mb-3">ChatGPTでまとめて1回で作る手順</h4>
                        <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside leading-relaxed mb-4">
                          <li>「ChatGPT を開く」ボタンから新しいチャットを開く（画像生成／GPT Image 対応モデル。複数枚の一括生成は有料プランで使えます）</li>
                          <li>参考にしたい画像（既存サムネ等）があれば、先に添付するとより狙い通りの画風になります</li>
                          <li><span className="font-semibold">「まとめてコピー」したプロンプトを1回送信</span> → 画像1から順に、全{slidePrompts.length}枚が独立した画像で出てきます</li>
                          <li>途中で止まったら「<span className="font-semibold">続き</span>」と送る。1枚にまとまってしまったら「<span className="font-semibold">独立した{slidePrompts.length}枚の画像として作り直して</span>」と送る</li>
                          <li>気になる1枚は「画像3だけ、ここを直して」のように番号で指定して微調整</li>
                          <li>各画像をダウンロードし、<span className="font-semibold">スキルマーケットのサービス画像に追加</span></li>
                        </ol>
                        <p className="text-[11px] text-stone-400 leading-relaxed mb-4">
                          うまく画風がそろわない・文字が崩れるときは、上の「1枚ずつ貼る」に切り替えてください（同じ設計内容をそのまま使えます）。
                        </p>
                        <a
                          href="https://chatgpt.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.preventDefault(); window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); }}
                          className="btn-dark px-4 py-2 text-xs"
                        >
                          ChatGPT を開く
                        </a>
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>
            )}

            {/* Flyer Results */}
            {shownMenu === 'flyer' && (flyerContent || multiFlyerContent) && (
              <div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-stone-900">チラシをつくる（検証中）</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    オフ会で手渡す前提の、B5（182×257mm）1枚のチラシです。コンビニのネットプリントで刷れる大きさに合わせています。本文から<span className="font-medium text-stone-600">誰向けか・主色・書体・主役のビジュアル</span>を AI が決め、
                    日本のチラシでよく使う<span className="font-medium text-stone-600">5つの紙面の型</span>から選んで、ChatGPTの画像生成（GPT Image）に貼ります。2〜3枚出して、良かった1枚を刷ってください。
                    QRコードは、画像のあとに <span className="font-medium text-stone-600">ChatGPT がコード実行で本物を作って右下に重ねます</span>（プロンプトに手順入り）。
                  </p>
                </div>

                {flyerMode === 'single' && (
                  flyerContent ? (
                    <>
                      {/* AIが決めたデザイン方針。プリセットから選ばせず、本文から主色・書体・主役を決める */}
                      <div className="card p-5 mb-5" data-tour="menu-flyer-plan">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">デザインの方針（本文から AI が決めました）</p>
                          <button type="button" onClick={handleRunFlyer} disabled={isLoading} className="btn-secondary px-3 py-1.5 text-[11px]">方針と文言を作り直す</button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{FLYER_FAMILY_SPECS[flyerContent.analysis.family].label}</span>
                          <span className="text-xs text-stone-600">{flyerContent.analysis.audience}</span>
                          {flyerContent.design.moodWords.map(w => (
                            <span key={w} className="text-[11px] text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full">{w}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          {[{ label: '主色', c: flyerContent.design.dominantColor }, { label: '差し色', c: flyerContent.design.accentColor }].map(({ label, c }) => (
                            <div key={label} className="flex items-start gap-3">
                              <span className="shrink-0 w-10 h-10 rounded-lg border border-stone-200" style={{ backgroundColor: c.hex }} aria-hidden />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-800">
                                  {label}：{c.name} <span className="font-mono text-[11px] text-stone-400">{c.hex}</span>
                                </p>
                                {c.why && <p className="text-[11px] text-stone-500 leading-relaxed">{c.why}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <FlyerPreviewRow label="見出しの書体">
                          {FLYER_HEADLINE_TYPE_LABEL[flyerContent.design.headlineType]}／装飾：{FLYER_DECORATION_LABEL[flyerContent.design.decoration]}
                        </FlyerPreviewRow>
                        <FlyerPreviewRow label="主役のビジュアル">
                          {FLYER_HERO_VISUAL_LABEL[flyerContent.design.heroVisual]}
                          {flyerContent.design.heroSubject ? `：${flyerContent.design.heroSubject}` : ''}
                          （{FLYER_HERO_CUT_LABEL[flyerContent.design.heroCut]}）
                        </FlyerPreviewRow>
                        <FlyerPreviewRow label="使う部品">
                          {flyerContent.design.devices.length ? flyerContent.design.devices.map(d => FLYER_DEVICE_LABEL[d]).join('／') : '無し（線・面・余白だけ）'}
                        </FlyerPreviewRow>
                        <label className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-rose-600"
                            checked={flyerMatchThumbnail}
                            onChange={(e) => setFlyerMatchThumbnail(e.target.checked)}
                          />
                          <span>
                            <span className="font-semibold">配色はサービスのサムネイルに合わせる</span>
                            <span className="block text-stone-400">
                              ChatGPTにサムネイル画像も添付してもらい、上の主色・差し色の代わりにサムネイルの色で組みます。紙で見た人が、あとでサービスページを開いたとき同じ出品者だと気づきます。
                            </span>
                          </span>
                        </label>
                      </div>

                      {/* 3案で共通して使う中身。切り口が変わっても同じ */}
                      <div className="card p-5 mb-5">
                        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-3">どの型でも共通の中身</p>
                        <FlyerPreviewRow label="対象者ラベル">{flyerContent.copy.audienceLabel}</FlyerPreviewRow>
                        <FlyerPreviewRow label="お困りごと">{flyerContent.copy.problems.join(' ／ ')}</FlyerPreviewRow>
                        <FlyerPreviewRow label="できること">{flyerContent.copy.cards.map(c => `${c.title}（${c.body}）`).join(' ／ ')}</FlyerPreviewRow>
                        <FlyerPreviewRow label="実績数字">
                          {flyerContent.copy.bigNumber
                            ? <>{flyerContent.copy.bigNumber.value} <span className="text-stone-400">{flyerContent.copy.bigNumber.label}</span></>
                            : <span className="text-stone-400">本文に件数・年数などの数字が見つからなかったので、入れていません。出品文の「信頼と実績」に数字を足すと、紙の説得力が上がります。</span>}
                        </FlyerPreviewRow>
                        {flyerContent.copy.trustLines.length > 0 && (
                          <FlyerPreviewRow label="経歴・資格">{flyerContent.copy.trustLines.join(' ／ ')}</FlyerPreviewRow>
                        )}
                        {flyerContent.copy.reassurance && <FlyerPreviewRow label="不安払拭">{flyerContent.copy.reassurance}</FlyerPreviewRow>}
                        <FlyerPreviewRow label="最初の一歩">
                          {flyerContent.copy.cta.firstStep}
                          {flyerContent.copy.cta.price ? `　${flyerContent.copy.cta.price}` : ''}
                          {flyerContent.copy.cta.note ? <span className="text-stone-400">　{flyerContent.copy.cta.note}</span> : null}
                        </FlyerPreviewRow>
                      </div>

                      {/* QRにするURL。未登録だとプロンプトの URL 欄が空のままになり、ChatGPT が先に URL を聞き返す */}
                      <div className={`rounded-xl border px-4 py-3 mb-5 text-xs leading-relaxed ${selectedServiceUrl ? 'border-stone-200 bg-stone-50 text-stone-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        <span className="font-semibold">QRコードにするURL：</span>
                        {selectedServiceUrl
                          ? <>{selectedServiceUrl}<span className="block text-stone-400">プロンプトに入っています。ChatGPT が画像のあとにコード実行で本物のQRを作り、右下の白い枠に重ねて完成画像を出します。</span></>
                          : <>未登録<span className="block">出品ページのURLを登録すると自動で入ります。このまま使う場合は、プロンプト末尾の「{FLYER_QR_URL_PLACEHOLDER}」をURLに書き換えてから送ってください（空欄のままだと ChatGPT が先にURLを聞き返します）。</span></>}
                        {/* ChatGPT は画像生成で返答を終え、QRを重ねる手順に自動では進まない。画像が出たあとに、この2本目を貼ってもらう */}
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(buildFlyerQrFollowupText(selectedServiceUrl || undefined)).then(() => {
                                setCopiedQrFollowup(true);
                                setTimeout(() => setCopiedQrFollowup(false), 2000);
                              });
                            }}
                            className="btn-secondary px-3 py-1.5 text-[11px]"
                          >
                            {copiedQrFollowup ? 'コピーしました' : '2本目：QRを重ねる指示をコピー'}
                          </button>
                          <span className="text-[11px] text-stone-500">画像が出たら、同じチャットにこれを貼ります。ChatGPT は画像を出したところで一度止まるためです。</span>
                        </div>
                      </div>

                      {/* 紙面の型5つ。日本のチラシでよく使われる骨格を、生成済みの色と見出しで描いたワイヤーフレームつきで選ぶ。AIのおすすめに印 */}
                      <div className="mb-3">
                        <h4 className="text-base font-bold text-stone-900">紙面の型を選ぶ</h4>
                        <p className="text-xs text-stone-500 mt-1">
                          日本のチラシでよく使われる5つの型です。図はこのサービスの主色・差し色と見出しで描いた組み方のイメージで、実際の絵柄は ChatGPT が描きます。
                          本文に合う型に<span className="font-medium text-stone-600">「AIのおすすめ」</span>を付けています。迷ったら、おすすめと定番の2枚を出して見比べてください。
                        </p>
                      </div>
                      <div data-tour="menu-flyer-copy" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-5 items-stretch">
                        {FLYER_TEMPLATE_IDS.map((id) => {
                          const tpl = FLYER_TEMPLATES[id];
                          const available = flyerTemplateAvailable(id, flyerContent);
                          const recommended = flyerContent.design.template === id;
                          const angle = flyerAngleForTemplate(flyerContent, id);
                          return (
                            <div key={id} className={`card p-3 flex flex-col ${recommended ? 'border-brand-400 ring-2 ring-brand-100' : ''} ${available ? '' : 'opacity-60'}`}>
                              <FlyerTemplatePreview content={flyerContent} template={id} className="w-full rounded-lg border border-stone-100 mb-2" />
                              <div className="flex items-center gap-1.5 mb-1 min-h-[18px]">
                                <span className="text-xs font-bold text-stone-900 leading-tight">{tpl.label}</span>
                                {recommended && <span className="shrink-0 text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">AIのおすすめ</span>}
                              </div>
                              <p className="text-[11px] text-stone-500 leading-relaxed mb-1">{tpl.lead}</p>
                              <p className="text-[11px] text-stone-700 leading-snug mb-3 flex-grow">
                                見出し：{renderEmphasized(angle.headline, angle.emphasis, flyerContent.design.accentColor.hex)}
                              </p>
                              {available ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyFlyerPrompt(id)}
                                  className="btn-dark w-full px-3 py-2 text-[11px]"
                                >
                                  {copiedTemplateId === id ? 'コピーしました' : 'この型のプロンプトをコピー'}
                                </button>
                              ) : (
                                <p className="text-[10px] text-stone-400 leading-relaxed">
                                  {tpl.requires === 'bigNumber' ? '本文に件数・人数・年数の数字が無いので、この型は使えません' : '本文に価格が無いので、この型は使えません'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <a
                          href="https://chatgpt.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.preventDefault(); window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); }}
                          className="btn-secondary px-4 py-2.5 text-xs"
                        >
                          ChatGPT を開く
                        </a>
                      </div>

                      <details className="group mb-8" data-tour="menu-flyer-qr">
                        <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-500 transition-colors [&::-webkit-details-marker]:hidden">
                          <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">▾</span>
                          QRが読めなかったときは（このツールでQRを作る）
                        </summary>
                        <div className="mt-3">
                          <QrFallback targets={selectedServiceUrl ? [{ label: flyerContent.copy.angles[0].headline, url: selectedServiceUrl }] : []} />
                        </div>
                      </details>
                    </>
                  ) : (
                    <p className="text-sm text-stone-500 mb-8">上のメニューの「チラシを作る」から、選択中のサービスのチラシ文言を作ってください。</p>
                  )
                )}

                {/* Usage guide */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-stone-900 mb-3">印刷して配るまでの手順</h4>
                  <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside leading-relaxed mb-4">
                    <li>
                      「ChatGPT を開く」から新しいチャットを開く。
                      {flyerContent?.design.heroVisual === 'provider_portrait'
                        ? <><span className="font-medium text-stone-700">出品者のアイコン画像（顔写真かイラスト）を先に添付</span>すると、紙面の主役の位置にその人物が描かれます。</>
                        : 'この方針では主役は提供者本人ではないので、アイコンの添付は不要です。'}
                      「配色をサムネイルに合わせる」にチェックした場合は、サムネイル画像も添付します
                    </li>
                    <li>紙面の型を1つ選んでプロンプトをコピーし、貼る。同じチャットで別の型も試すと、配色のそろった数枚を見比べられます</li>
                    <li>画像が出たら、上の「2本目：QRを重ねる指示をコピー」を同じチャットに貼る。ChatGPT がコード実行で本物のQRを右下に重ねた完成画像（ファイル）を出し、読み取り結果も報告します。文字が崩れていたら「◯◯の文字が崩れているので直して」で描き直せます</li>
                    <li>良かった1枚にお名前・連絡先を入れて完成。家のプリンタなら<span className="font-medium text-stone-700">B5用紙にそのまま印刷</span>（B5が無ければA4に印刷して余白を切る）。プリンタが無ければ、下のコンビニ印刷へ</li>
                  </ol>

                  {/* コンビニで刷る。作って終わりにならないよう、刷る手段までここで案内する。用紙は B5（ネットプリントで選べる最小の普通紙）に合わせて作っている */}
                  <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4" data-tour="menu-flyer-print">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-stone-800">プリンタが無いときは、セブン‐イレブンのネットプリントで刷れます</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="https://www.printing.ne.jp/index_p.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.preventDefault(); window.open('https://www.printing.ne.jp/index_p.html', '_blank', 'noopener,noreferrer'); }}
                          className="btn-secondary px-3 py-1.5 text-[11px]"
                        >
                          ネットプリントを開く
                        </a>
                        <a
                          href="https://lite.printing.ne.jp/web"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.preventDefault(); window.open('https://lite.printing.ne.jp/web', '_blank', 'noopener,noreferrer'); }}
                          className="btn-secondary px-3 py-1.5 text-[11px]"
                        >
                          登録なしで使う（かんたんnetprint）
                        </a>
                      </div>
                    </div>
                    <ol className="text-[11px] text-stone-600 list-decimal list-inside space-y-1 leading-relaxed">
                      <li>完成した画像をアップロードし、用紙は<span className="font-medium text-stone-700">「B5」</span>、カラーを選ぶ（チラシはB5ちょうどの大きさで作ってあります）</li>
                      <li>予約番号（またはQR）を控える。通常版は30日、かんたん版は翌日まで有効</li>
                      <li>店頭のマルチコピー機で予約番号を入れて印刷する（白黒は1枚20円から。カラーの料金は店頭の表示を確認）</li>
                    </ol>
                    <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                      枚数が多いときは B4 を選ぶと B5 が2枚分（半分に切る）になり、1枚あたりの料金を抑えられます。その場合は先に B4 横に2枚並べた画像を用意してください。
                    </p>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    QRを重ねる手順の最後で、画像の上下を切って B5 の比率（182:257）にそろえるよう指示しています。そろえずに 2:3 のまま出てきた場合は、幅を B5 に合わせ、上下にはみ出た余白を切り落としてください。
                    文字は画像として描かれるので、印刷前に誤字がないか必ず自分の目で確認してください。
                  </p>
                </div>
              </div>
            )}

            {/* Survey Results */}
            {shownMenu === 'survey' && patterns.length > 0 && (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">アンケート構成案 (3パターン)</h3>
                    <p className="text-xs text-stone-500 mt-1">目的に合うパターンを選んで、Googleフォーム作成コードを発行してください。</p>
                  </div>
                  <button
                    onClick={handleRunSurvey}
                    disabled={isLoading}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    別の3案を生成する
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch" data-tour="menu-survey-patterns">
                  {patterns.map((pattern, index) => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedPattern?.id === pattern.id}
                      onSelect={() => setSelectedPatternId(pattern.id)}
                      headerRef={setSurveyHeaderRef(index)}
                    />
                  ))}
                </div>
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleGenerateCode}
                    disabled={!selectedPattern}
                    className="btn-primary text-sm py-3.5 px-10"
                  >
                    この構成でコードを生成する
                  </button>
                </div>
                {showCode && selectedPattern && (
                  <>
                    <QuestionEditor
                      pattern={selectedPattern}
                      onUpdate={handleUpdateQuestions}
                      onReset={handleResetQuestions}
                      isDirty={selectedIsDirty}
                    />
                    <div data-tour="menu-survey-code"><CodeViewer pattern={selectedPattern} /></div>

                    {/* 仕上げ：Googleフォームの上部に載せるヘッダーバナー画像 */}
                    <div className="card p-6 mt-6">
                      <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">仕上げ（任意）</span>
                      <h4 className="text-base font-bold text-stone-900 mt-2">フォーム上部のバナー画像も、おそろいのトンマナで</h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Googleフォームのヘッダー画像（1600×400）を、サービスの<span className="font-semibold text-stone-700">トップ画像と同じ雰囲気</span>で作るプロンプトです。回答者がひと目で「あのサービスのアンケートだ」と分かります。
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_1fr] gap-x-8 gap-y-4 items-center my-5">
                        {/* 図解：トップ画像 → 同じトンマナ → フォームのヘッダー */}
                        <svg viewBox="0 0 340 140" className="w-full max-w-[340px] mx-auto" aria-label="添付したトップ画像と同じトンマナで、フォーム上部のバナーが作られる図" role="img">
                          <rect x="8" y="36" width="84" height="56" rx="8" fill="#0f172a"/>
                          <rect x="16" y="50" width="52" height="8" rx="3" fill="#fff" opacity="0.95"/>
                          <rect x="16" y="64" width="38" height="5" rx="2.5" fill="#fff" opacity="0.4"/>
                          <circle cx="78" cy="78" r="7" fill="#fbbf24"/>
                          <text x="50" y="112" fontSize="11" fill="#78716c" textAnchor="middle">トップ画像（添付）</text>
                          <path d="M102 64 L142 64" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round"/>
                          <polygon points="138,57 152,64 138,71" fill="#f43f5e"/>
                          <text x="127" y="48" fontSize="10" fontWeight="600" fill="#f43f5e" textAnchor="middle">同じトンマナ</text>
                          <text x="249" y="13" fontSize="10" fontWeight="600" fill="#e11d48" textAnchor="middle">ここを作る（1600×400）</text>
                          <rect x="166" y="20" width="166" height="104" rx="10" fill="#fff" stroke="#e7e5e4" strokeWidth="2"/>
                          <rect x="166" y="20" width="166" height="34" rx="10" fill="#0f172a" stroke="#f43f5e" strokeWidth="2"/>
                          <rect x="180" y="30" width="70" height="7" rx="3" fill="#fff" opacity="0.95"/>
                          <rect x="180" y="42" width="46" height="4" rx="2" fill="#fff" opacity="0.4"/>
                          <circle cx="316" cy="37" r="6" fill="#fbbf24"/>
                          <rect x="180" y="66" width="120" height="6" rx="3" fill="#d6d3d1"/>
                          <rect x="180" y="80" width="138" height="5" rx="2.5" fill="#e7e5e4"/>
                          <rect x="180" y="92" width="138" height="5" rx="2.5" fill="#e7e5e4"/>
                          <rect x="180" y="104" width="96" height="5" rx="2.5" fill="#e7e5e4"/>
                          <text x="249" y="137" fontSize="11" fill="#78716c" textAnchor="middle">Googleフォーム</text>
                        </svg>
                        {/* 手順 */}
                        <ol className="text-xs text-stone-600 space-y-2.5 list-decimal list-inside leading-relaxed">
                          <li>「ChatGPT を開く」で新しいチャットを開く（画像生成／GPT Image 対応モデル）</li>
                          <li><span className="font-semibold">サービスのトップ画像（1枚目のサムネ）をチャットに添付</span>する</li>
                          <li>「バナー用プロンプトをコピー」を押して、そのまま貼り付けて送信</li>
                          <li>できた画像を保存し、Googleフォームの<span className="font-semibold">テーマをカスタマイズ（パレットのアイコン）→ ヘッダー画像</span>にアップロード</li>
                        </ol>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyBannerPrompt}
                          data-tour="menu-survey-banner"
                          className={`text-xs font-semibold px-5 py-2.5 rounded-full transition-colors ${copiedBannerPrompt ? 'bg-brand-50 text-brand-600' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                        >
                          {copiedBannerPrompt ? 'コピーしました' : 'バナー用プロンプトをコピー'}
                        </button>
                        <a
                          href="https://chatgpt.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.preventDefault(); window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); }}
                          className="btn-secondary px-4 py-2.5 text-xs"
                        >
                          ChatGPT を開く
                        </a>
                      </div>
                    </div>
                  </>
                )}
                <div className="pb-6"></div>
              </div>
            )}
          </div>
        )}

        {/* 期間限定: 選択中サービスのURLを入れた状態でつぶやきを作らせる。
            作業の流れ（登録 → メニュー → 結果）を遮らないよう、メニューと結果の下に置く */}
        {selectedServiceUrl && (
          <CampaignTweetCard
            variant="polish"
            serviceUrl={selectedServiceUrl}
            className="card p-5 mb-8"
          />
        )}

        <Troubleshoot className="mb-8" items={[
          {
            q: 'URLを登録したのに本文が入らない',
            a: <>本文は自動では取りに行きません（出品ページは会員向けで、機械からの取得が弾かれるため）。登録したサービスの「ページを開く」で出品ページを開き、本文をコピーして開いた欄に貼ってください。口コミも一緒に貼ると、宣伝文やアンケートの精度が上がります。</>,
          },
          {
            q: '「出品ページURLを入力してください」と出て登録できない',
            a: <>受け付けるのは <code>https://skill.libecity.com/services/数字</code> の形だけです。出品ページのアドレスバーからそのままコピーしてください。マイページや一覧のURLは登録できません。</>,
          },
          {
            q: '宣伝文にサービスのリンクが入らない',
            a: <>URLを登録したサービスを選んでいるときだけ、そのURLが入ります。「本文だけ貼って使う」で作った場合はリンクなしになるので、投稿するときにご自身で足してください。</>,
          },
          {
            q: '作った結果が消えた',
            a: <>結果はサービスごとに保存されています。別のサービスを選ぶと表示が切り替わるだけなので、元のサービスを選び直せば戻ります。「入力と結果をクリア」は、選んでいるサービスの結果だけを消します。</>,
          },
          {
            q: 'チラシのQRコードが読み取れない',
            a: <>プロンプトには「画像ができたあと、コード実行で本物のQRを作って重ねる」手順が入っています。それでも読めないときは、チラシメニューの「QRが読めなかったときは」でこのツールがQR画像を作るので、チラシ画像と一緒に ChatGPT にアップロードして「そのまま重ねて」と頼むか、Canva で重ねてください。画像生成で描かれたQRは読めません。</>,
          },
        ]} />

        {/* 学長・先輩出品者の記事は「参考資料」へ集約 */}
        <div className="mb-2 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mt-0.5">
              <BookIcon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-900">売れている人の考え方も参考に</p>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">価格・宣伝・改善のコツを学長や先輩出品者の記事で無料で読めます。</p>
            </div>
          </div>
          <button onClick={onGoToLearn} className="btn-secondary px-4 py-2 text-xs shrink-0">
            参考資料を見る
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingOverlay
          expectedSeconds={[10, 40]}
          message={
            loadingMenu === 'promoter'
              ? '困りごとに寄り添ってから、解決策をそっと添える形で。読んだ方が気持ちよく受け取れる文にしています。'
              : loadingMenu === 'slidedoc'
              ? 'サービス本文を読み取り、このサービスに合ったスライド資料のトンマナを設計しています…'
              : loadingMenu === 'flyer'
              ? '手に取った人が5秒で分かるように、紙に載せる文言を削り込んでいます…'
              : 'アンケート設問構成を3パターン設計しています…'
          }
          title={
            loadingMenu === 'promoter' ? '投稿のたたき台を20本用意しています'
            : loadingMenu === 'slidedoc' ? 'スライド資料のデザインを準備しています'
            : loadingMenu === 'flyer' ? 'チラシのデザイン方針と文言を決めています'
            : 'アンケートを設計しています'
          }
          sourceWords={inputWords}
          onCancel={handleCancelRun}
        />
      )}
    </div>
  );
};

export default SupportHub;
