import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { generatePromotion, generateSurveyPatterns, getSlideDocPrompt, fetchServiceFromUrl } from '../services/geminiService';
import { extractWords } from '../utils/textProcessing';
import { SkillIdea, SurveyPattern, SurveyQuestionDef, ThumbnailPromptVersion } from '../types';
import { MegaphoneIcon, ClipboardListIcon, PresentationIcon, SparkleIcon } from './icons';
import { PromptPreview } from './promptPreviews';
import { MAGAZINE_ARTICLES, KNOWHOW_ARTICLES } from '../data/articles';
import LoadingOverlay from './LoadingOverlay';
import TweetCard, { TweetPost } from './support/TweetCard';
import PatternCard from './support/PatternCard';
import CodeViewer from './support/CodeViewer';
import QuestionEditor from './support/QuestionEditor';
import ArticleList from './support/ArticleList';

interface SupportHubProps {
  ensureKeySet: () => Promise<boolean>;
  onHandleApiError: (error: any) => void;
  notify: (message: string, tone?: 'error' | 'info') => void;
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

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2.5 mb-4 px-1">
    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">{label}</span>
    <span className="w-1 h-1 rounded-full bg-brand-300"></span>
    <div className="h-px bg-stone-200 flex-grow"></div>
  </div>
);

// 生成直後のつぶやきを読みやすく整形（URL行には手を入れない）
const formatTweet = (raw: string): string =>
  raw
    .split('\n')
    .map(line => (line.includes('http') ? line : line.replace(/。(?!$)/g, '。\n')))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

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

const SupportHub: React.FC<SupportHubProps> = ({ ensureKeySet, onHandleApiError, notify }) => {
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
  const [registerUrl, setRegisterUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [refetchingId, setRefetchingId] = useState<string | null>(null);

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
        registeredServices, selectedServiceId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed to save support state', e);
    }
  }, [serviceBody, activeMenu, posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady, registeredServices, selectedServiceId]);

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

  // 出品済みサービスのURLを取得して登録し、本文欄にセットする
  const handleRegisterUrl = async () => {
    const url = registerUrl.trim();
    if (!url) return;
    if (!SKILL_URL_PATTERN.test(url)) {
      notify('スキルマーケットの出品ページURL（https://skill.libecity.com/services/…）を入力してください。', 'error');
      return;
    }
    const isUpdate = registeredServices.some(sv => sv.url === url);
    if (!isUpdate && registeredServices.length >= MAX_REGISTERED_SERVICES) {
      notify(`登録できるのは最大${MAX_REGISTERED_SERVICES}件です。不要なサービスを削除してから登録してください。`, 'error');
      return;
    }
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setIsFetchingUrl(true);
    try {
      const fetched = await fetchServiceFromUrl(url);
      const service: RegisteredService = {
        id: crypto.randomUUID(),
        url,
        title: fetched.title,
        content: fetched.content,
        fetchedAt: new Date().toISOString(),
      };
      // 同じURLは上書き（再取得扱い）
      setRegisteredServices(prev => [service, ...prev.filter(sv => sv.url !== url)]);
      // 登録したサービスをそのまま選択状態にする
      setSelectedServiceId(service.id);
      setServiceBody(fetched.content);
      setRegisterUrl('');
      notify(`「${fetched.title}」を登録して選択しました（口コミ込み）。`);
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // サービスカードをクリックして「対象」を切り替える
  const handleSelectService = (sv: RegisteredService) => {
    setSelectedServiceId(sv.id);
    setServiceBody(sv.content);
    notify(`「${sv.title}」を選択しました。`);
  };

  // 口コミが増えたとき等にページを再取得して内容を更新する
  const handleRefetchService = async (sv: RegisteredService) => {
    const keyReady = await ensureKeySet();
    if (!keyReady) return;
    setRefetchingId(sv.id);
    try {
      const fetched = await fetchServiceFromUrl(sv.url);
      setRegisteredServices(prev => prev.map(x =>
        x.id === sv.id ? { ...x, title: fetched.title, content: fetched.content, fetchedAt: new Date().toISOString() } : x
      ));
      if (selectedServiceId === sv.id) setServiceBody(fetched.content);
      notify(`「${fetched.title}」を最新の内容に更新しました。`);
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setRefetchingId(null);
    }
  };

  const handleRemoveRegistered = (id: string) => {
    setRegisteredServices(prev => prev.filter(sv => sv.id !== id));
    if (selectedServiceId === id) setSelectedServiceId(null);
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
    setSelectedServiceId(null);
    setPosts([]);
    setPatterns([]);
    setPatternsOriginal([]);
    setSelectedPatternId(null);
    setShowCode(false);
    setSlideDocReady(false);
    setActiveMenu(null);
    setErrorMenu(null);
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
      runLabel: '作成する',
      onRun: handleRunPromoter,
    },
    {
      id: 'slidedoc' as MenuId,
      title: 'サービス資料を作る',
      description: 'NotebookLMでスライド資料を作るためのプロンプトを用意。サービス画像としてそのまま使えます。',
      highlight: 'トンマナ8種から選択',
      icon: <PresentationIcon />,
      runLabel: '表示する', // AIは呼ばずプロンプト一覧を表示するだけなので「実行」とは言わない
      onRun: handleRunSlideDoc,
    },
    {
      id: 'survey' as MenuId,
      title: 'アンケートを作る',
      description: '購入者の声を集めるGoogleフォームを自動設計。価格印象などもサービス情報から自動反映します。',
      highlight: 'フォーム3案を自動設計',
      icon: <ClipboardListIcon />,
      runLabel: '作成する',
      onRun: handleRunSurvey,
    },
  ];

  // ---- 結果タブ ----
  const resultTabs = [
    posts.length > 0 && { id: 'promoter' as MenuId, label: `宣伝文 ${posts.length}本` },
    patterns.length > 0 && { id: 'survey' as MenuId, label: 'アンケート 3案' },
    slideDocReady && { id: 'slidedoc' as MenuId, label: 'スライド資料' },
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

        {/* あなたのサービス: URL登録＋対象選択（最大10件） */}
        <div className="mb-8">
          <SectionLabel label="あなたのサービス" />
          <div className="card p-5">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <label htmlFor="register-url" className="text-sm font-semibold text-stone-700">
                出品済みサービスをURLで登録
                <span className="text-xs text-stone-400 font-normal ml-2">口コミも含めて自動で読み込みます</span>
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
                disabled={isFetchingUrl}
              />
              <button
                type="button"
                onClick={handleRegisterUrl}
                disabled={isFetchingUrl || !registerUrl.trim()}
                className="btn-dark px-5 py-2.5 text-xs shrink-0"
              >
                {isFetchingUrl ? '取得中…（10秒ほど）' : '取得して登録'}
              </button>
            </div>

            {registeredServices.length > 0 && (
              <>
                <p className="text-xs text-stone-500 mt-4 mb-2 font-medium">改善したいサービスを選択してください</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {registeredServices.map(sv => {
                    const isSelected = selectedServiceId === sv.id;
                    const isRefetching = refetchingId === sv.id;
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
                          <p className="text-sm font-semibold text-stone-800 truncate" title={sv.title}>{sv.title}</p>
                          <p className="text-[11px] text-stone-400">
                            {new Date(sv.fetchedAt).toLocaleDateString('ja-JP')} 取得
                          </p>
                        </div>
                        <a
                          href={sv.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 chip px-2.5 py-1 text-[10px] inline-flex items-center gap-1"
                          title="このサービスの出品ページを新しいタブで開く"
                        >
                          ページを開く<span aria-hidden>↗</span>
                        </a>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRefetchService(sv); }}
                          disabled={isRefetching}
                          className="shrink-0 chip px-2.5 py-1 text-[10px]"
                          title="ページを再取得して口コミ等を最新化"
                        >
                          {isRefetching ? '更新中…' : '再取得'}
                        </button>
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
              </>
            )}
          </div>
        </div>

        {/* 対象の本文（選択したサービスが入る／手動貼り付けも可） */}
        <div className="mb-8">
          <label htmlFor="support-body" className="font-semibold text-stone-700 text-sm block mb-2">
            対象の本文
            <span className="text-xs text-stone-400 font-normal ml-2">選択したサービスの内容が入ります（直接貼り付け・編集も可）</span>
          </label>
          <textarea
            id="support-body"
            value={serviceBody}
            onChange={(e) => setServiceBody(e.target.value)}
            className="field w-full p-5 min-h-[180px] text-base leading-relaxed"
            placeholder="上でサービスを選択するか、ここにサービス説明文を直接貼り付けてください…"
          />
          {hasInput && (
            <p className="text-xs text-emerald-600 mt-2 font-medium animate-in fade-in">
              {selectedServiceId
                ? `選択中: 「${registeredServices.find(sv => sv.id === selectedServiceId)?.title ?? ''}」 — 下のメニューを実行できます`
                : '入力済み — 下のメニューを実行できます'}
            </p>
          )}
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
                    {isBusy ? '生成中…' : menu.runLabel}
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

            {/* 結果タブ（複数の結果が並存する） */}
            {resultTabs.length > 1 && (
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
                  <h3 className="text-lg font-bold text-stone-900">スライド資料プロンプト ({SLIDE_DOC_VERSIONS.length}パターン)</h3>
                  <p className="text-xs text-stone-500 mt-1">お好みのトンマナをコピーし、NotebookLM のスライド作成カスタマイズ欄に貼り付けてください。</p>
                  <p className="text-[11px] text-stone-400 mt-1">※画像は雰囲気を伝えるトンマナ見本です。実際に作られるのはサムネイルではなくスライド資料です。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-8">
                  {SLIDE_DOC_VERSIONS.map(({ id, label, description }) => {
                    const isCopied = copiedSlideDocVersion === id;
                    const isMyStyle = id === 'my_style';
                    return (
                      <div key={id} className={`card p-5 ${isMyStyle ? 'md:col-span-2' : ''}`}>
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

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-5 px-1">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">売れる出品者のヒント</span>
            <span className="w-1 h-1 rounded-full bg-brand-300"></span>
            <span className="text-[11px] text-stone-400">迷ったら先人の知恵をのぞいてみましょう</span>
            <div className="h-px bg-stone-200 flex-grow"></div>
          </div>

          <div className="space-y-8">
            <ArticleList
              title="学長に学ぶ、売る前の基本"
              subtitle="リベ大の両学長が「価格の決め方」「嫌われない宣伝のコツ」を解説。出品する前に押さえておきたい考え方です。"
              articles={MAGAZINE_ARTICLES}
            />
            <ArticleList
              title="先輩出品者のノウハウ図書館"
              subtitle="実際に売れている出品者が実践しているコツを無料で読めます。「売れない…」のつまずきポイントの解決策も。"
              articles={KNOWHOW_ARTICLES}
            />
          </div>
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
