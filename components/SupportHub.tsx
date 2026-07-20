import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { generatePromotion, generateSurveyPatterns, getSlideDocPrompt, extractServiceTitle } from '../services/geminiService';
import { extractWords } from '../utils/textProcessing';
import { SkillIdea, SurveyPattern, SurveyQuestionDef, ThumbnailPromptVersion } from '../types';
import { MegaphoneIcon, ClipboardListIcon, PresentationIcon, SparkleIcon } from './icons';
import { PromptPreview } from './promptPreviews';
import LoadingOverlay from './LoadingOverlay';
import TweetCard, { TweetPost } from './support/TweetCard';
import PatternCard from './support/PatternCard';
import CodeViewer from './support/CodeViewer';
import QuestionEditor from './support/QuestionEditor';

interface SupportHubProps {
  ensureKeySet: () => Promise<boolean>;
  onHandleApiError: (error: any) => void;
  notify: (message: string, tone?: 'error' | 'info') => void;
  onGoToLearn: () => void;
}

type MenuId = 'promoter' | 'survey' | 'slidedoc';

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
}

const EMPTY_RESULTS: ResultsBundle = {
  posts: [], patterns: [], patternsOriginal: [], selectedPatternId: null,
  showCode: false, slideDocReady: false, activeMenu: null,
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
  registeredServices: RegisteredService[];
  selectedServiceId: string | null;
  resultsByServiceId: Record<string, ResultsBundle>;
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

  const [copiedSlideDocVersion, setCopiedSlideDocVersion] = useState<ThumbnailPromptVersion | null>(null);
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
  const inputWords = useMemo(() => extractWords(serviceBody), [serviceBody]);
  const hasInput = serviceBody.trim().length > 0;

  // ---- 永続化: 保存 ----
  useEffect(() => {
    try {
      const s: PersistedState = {
        serviceBody, activeMenu,
        posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady,
        registeredServices, selectedServiceId, resultsByServiceId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed to save support state', e);
    }
  }, [serviceBody, activeMenu, posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, registeredServices, selectedServiceId, resultsByServiceId]);

  // ---- サービスごとの生成物を保存: 表示中の結果を選択中サービスのバケットへ同期 ----
  useEffect(() => {
    if (!selectedServiceId) return;
    // 切替直後は loadedServiceRef を先に更新しているので、一致する時だけ保存する
    if (loadedServiceRef.current !== selectedServiceId) return;
    setResultsByServiceId(prev => ({
      ...prev,
      [selectedServiceId]: { posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, activeMenu },
    }));
  }, [posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, activeMenu, selectedServiceId]);

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
    notify('登録しました。「ページを開く」で本文をコピーし、下の「対象の本文」に貼り付けてください。');
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
    const hasAnyResult = posts.length > 0 || patterns.length > 0 || slideDocReady || activeMenu !== null;
    if (changed && hasAnyResult) resetGeneratedResults();
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

  const handleRunSlideDoc = () => {
    if (!hasInput) return;
    setSlideDocReady(true);
    setCopiedSlideDocVersion(null);
    setActiveMenu('slidedoc');
    setTimeout(scrollToResults, 100);
  };

  const handleCancelRun = () => {
    runTokenRef.current++;
    setIsLoading(false);
    setLoadingMenu(null);
    notify('生成をキャンセルしました。');
  };

  const handleCopySlideDocPrompt = (version: ThumbnailPromptVersion) => {
    const prompt = getSlideDocPrompt(serviceBody, version);
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedSlideDocVersion(version);
      setTimeout(() => setCopiedSlideDocVersion(null), 2000);
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
    patterns.length > 0 && { id: 'survey' as MenuId, label: 'アンケート 3案' },
  ].filter(Boolean) as Array<{ id: MenuId; label: string }>;

  const hasResults = resultTabs.length > 0;
  const shownMenu: MenuId | null = resultTabs.some(t => t.id === activeMenu)
    ? activeMenu
    : (resultTabs[0]?.id ?? null);

  const usedCount = posts.filter(p => p.used).length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 md:p-10">

        {/* Header */}
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

        {/* ① 登録済みサービス（台帳＝登録・一覧・閲覧） */}
        <div className="mb-6">
          <SectionLabel label="登録済みサービス" />
          <div className="card p-5">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <label htmlFor="register-url" className="text-sm font-semibold text-stone-700">
                出品済みサービスをURLで登録
                <span className="text-xs text-stone-400 font-normal ml-2">登録しておくと各メニューの対象にできます</span>
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
                      <div
                        key={sv.id}
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
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 mt-4">
                まだ登録がありません。URLを追加するか、下の「対象の本文」に貼り付ければそのまま使えます。
              </p>
            )}
          </div>
        </div>

        {/* ② 対象の本文（作業エリア＝各メニューの入力） */}
        <div className="mb-8">
          <SectionLabel label="対象の本文" />
          <div className="card p-5">
            <label htmlFor="support-body" className="font-semibold text-stone-700 text-sm block mb-2">
              ここに本文を貼り付け
              <span className="text-xs text-stone-400 font-normal ml-2">出品ページを開いて本文をコピー → 貼り付け（口コミも一緒に貼るとGood）</span>
            </label>
            <textarea
              id="support-body"
              value={serviceBody}
              onChange={(e) => handleBodyChange(e.target.value)}
              className="field w-full p-5 min-h-[180px] text-base leading-relaxed"
              placeholder="出品ページの本文をコピーして、ここに貼り付けてください。&#10;（上で登録したサービスは「ページを開く」から本文をコピーできます）"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {selectedServiceId && (
                <>
                  <span className="text-xs text-stone-500">
                    選択中：<span className="font-semibold text-stone-800">{registeredServices.find(sv => sv.id === selectedServiceId)?.title || '登録サービス'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegisterBody}
                    disabled={!hasInput || isRegisteringBody}
                    className="btn-dark px-5 py-2 text-xs shrink-0"
                  >
                    {isRegisteringBody ? 'サービス名を認識中…' : 'この本文を保存'}
                  </button>
                </>
              )}
              {hasInput && (
                <p className="text-xs text-emerald-600 font-medium animate-in fade-in">
                  {selectedServiceId
                    ? '「この本文を保存」でこのサービスに紐付け＆AIが名前を認識（メニューはすぐ実行できます）'
                    : '入力済み — 下のメニューを実行できます'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Menu List — この1入力で3つのAIメニューが動く、を強調 */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">AI メニュー</span>
            <span className="w-1 h-1 rounded-full bg-brand-300"></span>
            <span className="text-[11px] text-stone-400">入力はこれだけ。あとはワンクリックで完成</span>
            <div className="h-px bg-stone-200 flex-grow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="w-12 h-12 rounded-2xl text-white flex items-center justify-center mb-4 shadow-brand"
                    style={{ backgroundImage: 'var(--gradient-brand)' }}
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
          <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            <SectionLabel label="結果" />

            {/* 結果タブ（1つだけでもラベルを出して、何の結果かを明示する） */}
            {resultTabs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {resultTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMenu(tab.id)}
                    aria-pressed={shownMenu === tab.id}
                    className={`px-4 py-2 ${shownMenu === tab.id ? 'chip-active' : 'chip'}`}
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
                <div className="space-y-5 pb-6">
                  {posts.map((post, idx) => (
                    <TweetCard key={idx} post={post} index={idx} onChange={handleTweetChange} />
                  ))}
                </div>
              </div>
            )}

            {/* Slide Doc Results */}
            {shownMenu === 'slidedoc' && slideDocReady && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-stone-900">スライド資料をつくる（{SLIDE_DOC_VERSIONS.length}パターン）</h3>
                  <p className="text-xs text-stone-500 mt-1">お好みのトンマナをコピーし、NotebookLM のスライド作成カスタマイズ欄に貼り付けてください。</p>
                  <p className="text-[11px] text-stone-400 mt-1">※画像は雰囲気を伝えるトンマナ見本です。実際に作られるのはサムネイルではなくスライド資料です。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-8">
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

                {/* Usage guide */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-stone-900 mb-3">スライド生成から画像化までの手順</h4>
                  <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside leading-relaxed mb-4">
                    <li>「NotebookLM を開く」ボタンから新規ノートブックを作成</li>
                    <li>「ソース」にサービス詳細文章を追加（必要に応じてキャラアイコン画像も添付）</li>
                    <li>「スタジオ」→「スライド作成」→ カスタマイズ欄にコピーしたプロンプトを貼り付け</li>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
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
                    <CodeViewer pattern={selectedPattern} />
                  </>
                )}
                <div className="pb-6"></div>
              </div>
            )}
          </div>
        )}

        {/* 「売れる出品者のヒント」記事はトップの第3入口（ヒント集）へ集約 */}
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
            ヒント集を見る
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingOverlay
          message={
            loadingMenu === 'promoter'
              ? '困りごとに寄り添ってから、解決策をそっと添える形で。読んだ方が気持ちよく受け取れる文にしています。'
              : 'アンケート設問構成を3パターン設計しています…'
          }
          title={
            loadingMenu === 'promoter' ? '投稿のたたき台を20本用意しています'
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
