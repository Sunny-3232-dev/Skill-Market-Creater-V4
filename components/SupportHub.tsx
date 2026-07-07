import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { generatePromotion, generateSurveyPatterns, getSlideDocPrompt } from '../services/geminiService';
import { extractWords } from '../utils/textProcessing';
import { SkillIdea, SurveyPattern, SurveyQuestionDef, ThumbnailPromptVersion } from '../types';
import { MegaphoneIcon, ClipboardListIcon, PresentationIcon } from './icons';
import { PROMPT_PREVIEWS } from './promptPreviews';
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
    id: 'pivot',
    label: 'PIVOT風',
    description: 'ビジネスインタビュー番組のトンマナ。深緑ベースで知的・上質な印象。',
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

// Creatorの生成文から標準価格の数値を抽出（例: 「■ 標準価格 … 10,000円」→ "10000"）
const extractPriceHint = (content: string): string => {
  const m = content.match(/■ 標準価格[\s\S]{0,200}?(\d[\d,]*)\s*円/);
  return m ? m[1].replace(/,/g, '') : '';
};

interface PersistedState {
  serviceBody: string;
  serviceUrl: string;
  priceHint: string;
  activeMenu: MenuId | null;
  posts: TweetPost[];
  patterns: SurveyPattern[];
  patternsOriginal: SurveyPattern[];
  selectedPatternId: SurveyPattern['id'] | null;
  showCode: boolean;
  slideDocReady: boolean;
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
  const [serviceUrl, setServiceUrl] = useState(init.serviceUrl ?? '');
  const [priceHint, setPriceHint] = useState(init.priceHint ?? '');

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

  const [copiedSlideDocVersion, setCopiedSlideDocVersion] = useState<ThumbnailPromptVersion | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Loading / error
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState<MenuId | null>(null);
  const [errorMenu, setErrorMenu] = useState<MenuId | null>(null);
  const runTokenRef = useRef(0); // キャンセル時に進め、古いレスポンスを破棄する

  // Creatorで作成済みのサービス（本文入力のワンクリック連携用）
  const [creatorServices, setCreatorServices] = useState<Array<{ id: string; title: string; content: string }>>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedPattern = useMemo(
    () => patterns.find(p => p.id === selectedPatternId) ?? null,
    [patterns, selectedPatternId]
  );
  const inputWords = useMemo(() => extractWords(serviceBody), [serviceBody]);
  const hasInput = serviceBody.trim().length > 0;

  // ---- Creatorの作成済みサービスを読み込む（ピッカー用） ----
  useEffect(() => {
    try {
      const ideasRaw = localStorage.getItem(CREATOR_IDEAS_KEY);
      if (ideasRaw) {
        const ideas: SkillIdea[] = JSON.parse(ideasRaw);
        setCreatorServices(
          ideas
            .filter(i => i.generatedContent)
            .map(i => ({ id: i.id, title: i.title, content: i.generatedContent! }))
        );
      }
    } catch (e) {
      console.warn('Failed to load creator ideas', e);
    }
  }, []);

  // ---- 永続化: 保存 ----
  useEffect(() => {
    try {
      const s: PersistedState = {
        serviceBody, serviceUrl, priceHint, activeMenu,
        posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed to save support state', e);
    }
  }, [serviceBody, serviceUrl, priceHint, activeMenu, posts, patterns, patternsOriginal, selectedPatternId, showCode, slideDocReady]);

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

  const scrollToResults = useCallback(() => {
    if (resultRef.current && containerRef.current) {
      const container = containerRef.current;
      const targetTop = resultRef.current.offsetTop - container.offsetTop;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, []);

  // ---- Creator連携 ----
  const handlePickCreatorService = (id: string) => {
    const svc = creatorServices.find(s => s.id === id);
    if (!svc) return;
    setServiceBody(svc.content);
    const price = extractPriceHint(svc.content);
    if (price) setPriceHint(price);
    notify(`「${svc.title}」を読み込みました${price ? `（価格 ${Number(price).toLocaleString()}円 も自動入力）` : ''}`);
  };

  // ---- 実行 ----
  const handleRunPromoter = async () => {
    if (!hasInput) return;
    const url = serviceUrl.trim();
    if (url && !/^https?:\/\/\S+$/.test(url)) {
      notify('サービスURLは https:// から始まる形式で入力してください。', 'error');
      return;
    }
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

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
    // 価格は数値だけに正規化（「5,000円」→「5000」。プロンプト側で「円」が付くため）
    const priceDigits = priceHint.replace(/[^\d]/g, '');
    if (priceHint.trim() && !priceDigits) {
      notify('価格は数値で入力してください（例: 5000）。', 'error');
      return;
    }
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

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
      const el = document.getElementById('gas-code-section');
      if (el && containerRef.current) {
        const container = containerRef.current;
        container.scrollTo({ top: el.offsetTop - container.offsetTop, behavior: 'smooth' });
      }
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

  const handleClearAll = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    setServiceBody('');
    setServiceUrl('');
    setPriceHint('');
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
      description: 'リベシティの文化に合う「前向き・丁寧・押しつけない」つぶやきを20本生成',
      icon: <MegaphoneIcon />,
      runLabel: '実行',
      onRun: handleRunPromoter,
      extraInput: (
        <div className="flex-shrink-0 w-full md:w-auto">
          <input
            type="url"
            value={serviceUrl}
            onChange={(e) => setServiceUrl(e.target.value)}
            className="field w-full md:w-64 px-3 py-2 rounded-full bg-white text-sm"
            placeholder="サービスURL（任意）"
            aria-label="出品サービスURL（任意）"
            disabled={!hasInput}
          />
        </div>
      ),
    },
    {
      id: 'survey' as MenuId,
      title: 'アンケートを作る',
      description: '購入者の声を集めるGoogleフォームアンケートを自動作成',
      icon: <ClipboardListIcon />,
      runLabel: '実行',
      onRun: handleRunSurvey,
      extraInput: (
        <div className="flex-shrink-0 w-full md:w-auto">
          <input
            type="text"
            inputMode="numeric"
            value={priceHint}
            onChange={(e) => setPriceHint(e.target.value)}
            className="field w-full md:w-40 px-3 py-2 rounded-full bg-white text-sm"
            placeholder="価格・円（任意）"
            aria-label="サービス価格（円・任意）"
            disabled={!hasInput}
          />
        </div>
      ),
    },
    {
      id: 'slidedoc' as MenuId,
      title: 'サービス資料を作る',
      description: 'NotebookLM用のスライド作成プロンプトを表示（トンマナ7種から選択可）',
      icon: <PresentationIcon />,
      runLabel: '表示', // AIは呼ばずプロンプト一覧を表示するだけなので「実行」とは言わない
      onRun: handleRunSlideDoc,
      extraInput: null,
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
    <div ref={containerRef} className="h-full flex flex-col overflow-y-auto custom-scrollbar">
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

        {/* Shared Input */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
            <label htmlFor="support-body" className="font-semibold text-stone-700 text-sm">出品サービスページ本文</label>
            {creatorServices.length > 0 ? (
              <select
                value=""
                onChange={(e) => { if (e.target.value) handlePickCreatorService(e.target.value); }}
                className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5 outline-none cursor-pointer hover:bg-brand-100 transition-colors max-w-[280px]"
                aria-label="Creatorで作ったサービスから読み込む"
              >
                <option value="">Creatorで作ったサービスから読み込む…</option>
                {creatorServices.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-stone-400">Creatorで作った「サービス詳細」などを貼り付け</span>
            )}
          </div>
          <textarea
            id="support-body"
            value={serviceBody}
            onChange={(e) => setServiceBody(e.target.value)}
            className="field w-full p-5 min-h-[180px] text-base leading-relaxed"
            placeholder="ここにサービス説明文を貼り付けてください…"
          />
          {hasInput && (
            <p className="text-xs text-emerald-600 mt-2 font-medium animate-in fade-in">入力済み — 以下のメニューを実行できます</p>
          )}
        </div>

        {/* Menu List */}
        <div className="mb-8">
          <SectionLabel label="メニュー" />
          <div className="card overflow-hidden">
            {supportMenus.map((menu, index) => (
              <div
                key={menu.id}
                className={`transition-opacity duration-200 ${!hasInput ? 'opacity-50' : ''} ${index !== supportMenus.length - 1 ? 'border-b border-stone-100' : ''}`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 px-5 py-4">
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-stone-600">
                      <div className="scale-90">{menu.icon}</div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-stone-900">{menu.title}</h4>
                        {resultTabs.some(t => t.id === menu.id) && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">結果あり</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{menu.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {menu.extraInput}
                    <button
                      onClick={menu.onRun}
                      disabled={!hasInput || isLoading}
                      className="btn-dark shrink-0 px-5 py-2 text-xs"
                    >
                      {loadingMenu === menu.id ? '生成中…' : menu.runLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                          {PROMPT_PREVIEWS[id]}
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
          <SectionLabel label="学長マガジンチャット" />
          <ArticleList articles={MAGAZINE_ARTICLES} />
        </div>

        <div className="mb-8">
          <SectionLabel label="ノウハウ記事" />
          <ArticleList articles={KNOWHOW_ARTICLES} />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingOverlay
          message={loadingMenu === 'promoter'
            ? '困りごとに寄り添ってから、解決策をそっと添える形で。読んだ方が気持ちよく受け取れる文にしています。'
            : 'アンケート設問構成を3パターン設計しています…'}
          title={loadingMenu === 'promoter' ? '投稿のたたき台を20本用意しています' : 'アンケートを設計しています'}
          sourceWords={inputWords}
          onCancel={handleCancelRun}
        />
      )}
    </div>
  );
};

export default SupportHub;
