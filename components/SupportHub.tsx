import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { generatePromotion, generateSurveyPatterns, getSlideDocPrompt } from '../services/geminiService';
import { extractWords } from '../utils/textProcessing';
import { SurveyPattern, ThumbnailPromptVersion } from '../types';
import { MegaphoneIcon, ClipboardListIcon, PresentationIcon } from './icons';
import LoadingOverlay from './LoadingOverlay';

interface SupportHubProps {
  ensureKeySet: () => Promise<boolean>;
  onHandleApiError: (error: any) => void;
}

// --- Menu type definitions ---
type MenuId = 'promoter' | 'survey' | 'slidedoc';

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

// --- Curated article links ---
interface ArticleLink {
  title: string;
  description: string;
  author: string;
  category: string;
  url: string;
}

const MAGAZINE_ARTICLES: ArticleLink[] = [
  {
    title: '▼稼ぎ方実践講座「価格の決め方」',
    description: 'ビジネスをやるときに悩むことランキング上位、いくらで売るか。',
    author: '学長マガジンチャット',
    category: '価格',
    url: 'https://libecity.com/room_list?room_id=President-Tweet&comment_id=nxfgYlqV2Eb3Lh2YOhPS',
  },
  {
    title: '嫌われない宣伝方法の話〜上手に宣伝し〜や〜〜',
    description: '商品やサービスは作っただけじゃ売れへん！リベッターを活用した宣伝方法',
    author: '学長マガジンチャット',
    category: '宣伝',
    url: 'https://libecity.com/room_list?room_id=President-Tweet&comment_id=ifrXKHuX4QbUTwkPSG7Y',
  },
];

const KNOWHOW_ARTICLES: ArticleLink[] = [
  {
    title: '【無料で使える！】スキルマーケットOnline構造診断ツール',
    description: '既に出している商品を「今後も出し続けるか、中身を見直すか」を判定してくれる診断ツール',
    author: 'おれんじ🍊スプシで稼ぐチャット管理人',
    category: '改善',
    url: 'https://library.libecity.com/articles/01KE4E7JX9ZR77663JV9JDW77T',
  },
  {
    title: '【売上120%UP】スキルマーケットで自分のサービスを改善する３つのポイント',
    description: 'サービスを出してみたけど中々売れない…そんなときに見直すべき３つのポイントと判断基準',
    author: 'みずの＠寄り添うWebデザイナー',
    category: '改善',
    url: 'https://library.libecity.com/articles/01HHE5SC4C5KE81R4AT2CZB25F',
  },
  {
    title: "リベシティプロフィールを『あなたらしい』文章にするコツと例文をご紹介",
    description: 'プロフィールに何を書けばいいか迷う方へ、項目ごとの書き方をご紹介',
    author: 'ベリー号🚢採用支援×HPライター',
    category: 'プロフィール',
    url: 'https://library.libecity.com/articles/01HKR0A1C9G6NMTDXKC18QVRD2',
  },
  {
    title: '信頼を貯めるリベプロフィールの書き方＊考え方を解説＊',
    description: '認知されているのに依頼が来ない…信頼につながるプロフィールの考え方',
    author: 'ベリー号🚢採用支援×HPライター',
    category: 'プロフィール',
    url: 'https://library.libecity.com/articles/01K1Z2F6Z0QPR83FPG558EP2PT',
  },
  {
    title: '【デザイン苦手でも大丈夫！】"見られるサムネイル"の作り方',
    description: 'Canva初心者さん向けに、出品用サムネイルの作り方を7ステップで解説',
    author: 'まい＠戦略企画×クリエイター',
    category: 'デザイン',
    url: 'https://library.libecity.com/articles/01JY8232SXV4X9QHDSG3DW15H2',
  },
  {
    title: '知ってもらわないとモノは売れない【人見知りさん必見！】oviceで認知活動',
    description: '話しかけるのが苦手ならoviceで話しかけてもらえばいい！を実践した認知活動の記録',
    author: 'パー子＠おしゃべりなお絵描き屋さん',
    category: '宣伝',
    url: 'https://library.libecity.com/articles/01JB6VCAG87W05WFBGMN27EP1V',
  },
];

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2.5 mb-4 px-1">
    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">{label}</span>
    <span className="w-1 h-1 rounded-full bg-brand-300"></span>
    <div className="h-px bg-stone-200 flex-grow"></div>
  </div>
);

const ArticleList: React.FC<{ articles: ArticleLink[] }> = ({ articles }) => (
  <div className="card overflow-hidden">
    {articles.map((article, index) => (
      <a
        key={index}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-stone-50 ${
          index !== articles.length - 1 ? 'border-b border-stone-100' : ''
        }`}
      >
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors leading-snug">{article.title}</h4>
            <span className="shrink-0 text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{article.category}</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 truncate">{article.description}</p>
          <p className="text-[11px] text-stone-400 mt-1">by {article.author}</p>
        </div>
        <span className="shrink-0 mt-1 text-stone-300 group-hover:text-brand-400 transition-colors text-xs" aria-hidden>↗</span>
      </a>
    ))}
  </div>
);

const TweetCard: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const [copied, setCopied] = useState(false);
  const formattedText = useMemo(() => {
    return text.replace(/。(?!\n)/g, '。\n').trim();
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetUrl = `https://libecity.com/tweet/all?create=${encodeURIComponent(formattedText)}`;

  return (
    <div className="card p-5 md:p-6 w-full">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100">
        <span className="text-xs font-semibold text-stone-400">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-2">
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
            className="btn-secondary px-4 py-2 text-xs">
            つぶやく
          </a>
          <button onClick={handleCopy}
            className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
              copied ? 'bg-brand-50 text-brand-600' : 'bg-stone-900 text-white hover:bg-stone-700'
            }`}>
            {copied ? 'コピーしました' : 'コピー'}
          </button>
        </div>
      </div>
      <div className="w-full bg-stone-50 rounded-xl p-4 text-sm md:text-base text-stone-700 leading-relaxed whitespace-pre-wrap select-text">
        {formattedText}
      </div>
    </div>
  );
};

const escapeString = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "");
};

const generateGasCode = (pattern: SurveyPattern): string => {
  const qCode = pattern.questions.map(q => {
    const cleanTitle = escapeString(q.title);
    const cleanHelp = q.helpText ? escapeString(q.helpText) : '';
    const helpLine = cleanHelp ? `.setHelpText('${cleanHelp}')` : '';
    const reqLine = q.required ? `.setRequired(true)` : `.setRequired(false)`;
    switch (q.type) {
      case 'TEXT':
        return `  form.addTextItem()\n    .setTitle('${cleanTitle}')\n    ${helpLine}\n    ${reqLine};`;
      case 'PARAGRAPH':
        return `  form.addParagraphTextItem()\n    .setTitle('${cleanTitle}')\n    ${helpLine}\n    ${reqLine};`;
      case 'RADIO': {
        const opts = q.options?.map(o => `'${escapeString(o)}'`).join(', ') || '';
        return `  form.addMultipleChoiceItem()\n    .setTitle('${cleanTitle}')\n    .setChoiceValues([${opts}])\n    ${helpLine}\n    ${reqLine};`;
      }
      case 'CHECKBOX': {
        const opts = q.options?.map(o => `'${escapeString(o)}'`).join(', ') || '';
        return `  form.addCheckboxItem()\n    .setTitle('${cleanTitle}')\n    .setChoiceValues([${opts}])\n    ${helpLine}\n    ${reqLine};`;
      }
    }
  }).join('\n\n');

  return `function createSurveyForm() {
  // 1. フォームを作成
  var form = FormApp.create('${escapeString(pattern.formTitle)}');
  form.setDescription('${escapeString(pattern.formDescription)}');

  // 2. 質問を追加
${qCode}

  // 3. URLをログに出力
  Logger.log('--------------------------------------------------');
  Logger.log('編集用URL (管理者用): ' + form.getEditUrl());
  Logger.log('回答用URL (公開用): ' + form.getPublishedUrl());
  Logger.log('--------------------------------------------------');
}`;
};

const CodeViewer: React.FC<{ pattern: SurveyPattern }> = ({ pattern }) => {
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => generateGasCode(pattern), [pattern]);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div id="gas-code-section" className="mt-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-stone-900 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Google Apps Script (GAS)</h3>
            <p className="text-stone-400 text-xs mt-1">以下のコードをコピーして実行すると、Googleフォームが自動生成されます。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleCopy}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors ${copied ? 'bg-brand-400/20 text-brand-200' : 'bg-white text-stone-900 hover:bg-stone-200'}`}>
              {copied ? 'コピーしました' : 'コードをコピー'}
            </button>
            <a href="https://script.new" target="_blank" rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-semibold transition-colors">
              GAS Editor を開く
            </a>
          </div>
        </div>
        <pre className="bg-black/40 p-5 rounded-xl text-xs md:text-sm font-mono overflow-x-auto text-stone-200 custom-scrollbar max-h-[400px]">
          {code}
        </pre>
        <div className="mt-6 border-t border-white/10 pt-6">
          <h4 className="font-semibold text-sm text-white mb-3">使い方</h4>
          <ol className="text-sm text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>右上の「GAS Editor を開く」ボタンを押してエディタを開く</li>
            <li>エディタにある既存のコードを消して、コピーしたコードを貼り付け</li>
            <li>上のバーにある「保存」を押し、関数「createSurveyForm」を選択して「実行」</li>
            <li>権限の確認画面が出たら「権限を確認」→「続行」で許可する</li>
            <li>実行完了後、下の「実行ログ」にアンケートのURLが表示されます</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const PatternCard: React.FC<{ pattern: SurveyPattern; isSelected: boolean; onSelect: () => void; headerRef: (el: HTMLDivElement | null) => void }> = ({ pattern, isSelected, onSelect, headerRef }) => {
  return (
    <div onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative h-full flex flex-col ${
        isSelected ? 'bg-white border-brand-400 ring-2 ring-brand-100 shadow-card' : 'bg-white border-stone-200/80 hover:border-brand-200'
      }`}>
      <div ref={headerRef} data-role="card-header">
        <div className="flex justify-between items-start mb-3">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
            isSelected ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500'
          }`}>{pattern.id}</span>
          {isSelected && <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full animate-in zoom-in">選択中</span>}
        </div>
        <h3 className="font-bold text-stone-900 text-base mb-1">{pattern.name}</h3>
        <p className="text-xs text-stone-500 leading-relaxed mb-4">{pattern.description}</p>
      </div>
      <div className="space-y-3 pt-3 border-t border-stone-100">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex justify-between items-center">
          <span>設問</span>
          <span className="bg-stone-100 px-2 py-0.5 rounded-full text-stone-500">{pattern.questions.length}問</span>
        </p>
        <ul className="text-xs text-stone-600 space-y-2">
          {pattern.questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${q.required ? 'bg-brand-400' : 'bg-stone-300'}`}></span>
              <span className="leading-relaxed">{q.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// --- Main Component ---
const SupportHub: React.FC<SupportHubProps> = ({ ensureKeySet, onHandleApiError }) => {
  // Shared input
  const [serviceBody, setServiceBody] = useState('');

  // Tool-specific inputs
  const [serviceUrl, setServiceUrl] = useState('');
  const [priceHint, setPriceHint] = useState('');

  // Active menu & results
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);

  // Promoter results
  const [posts, setPosts] = useState<string[]>([]);

  // Survey results
  const [patterns, setPatterns] = useState<SurveyPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<SurveyPattern | null>(null);
  const [showCode, setShowCode] = useState(false);

  // Slide Doc copy feedback
  const [copiedSlideDocVersion, setCopiedSlideDocVersion] = useState<ThumbnailPromptVersion | null>(null);

  // Survey PatternCard ヘッダー高さ同期
  const surveyHeaderRefs = useRef<(HTMLDivElement | null)[]>([]);
  const syncSurveyHeaders = useCallback(() => {
    const refs = surveyHeaderRefs.current.filter(Boolean) as HTMLDivElement[];
    if (refs.length < 2) return;
    refs.forEach(r => { r.style.minHeight = ''; });
    const heights = refs.map(r => r.offsetHeight);
    const max = Math.max(...heights);
    refs.forEach(r => { r.style.minHeight = `${max}px`; });
  }, []);
  useLayoutEffect(() => {
    if (patterns.length > 0) syncSurveyHeaders();
  });
  const setSurveyHeaderRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    surveyHeaderRefs.current[index] = el;
  }, []);

  // Loading
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState<MenuId | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputWords = useMemo(() => extractWords(serviceBody), [serviceBody]);
  const hasInput = serviceBody.trim().length > 0;

  // Scroll to results when they appear (container内のみスクロール)
  useEffect(() => {
    const hasAny = posts.length > 0 || patterns.length > 0 || activeMenu === 'slidedoc';
    if (hasAny && resultRef.current && containerRef.current) {
      const container = containerRef.current;
      const target = resultRef.current;
      const targetTop = target.offsetTop - container.offsetTop;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, [posts, patterns, activeMenu]);

  const handleRunPromoter = async () => {
    if (!hasInput) return;

    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setIsLoading(true);
    setLoadingMenu('promoter');
    try {
      const data = await generatePromotion(serviceBody, serviceUrl);
      setPosts(data);
      setPatterns([]);
      setSelectedPattern(null);
      setShowCode(false);
      setActiveMenu('promoter');
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setIsLoading(false);
      setLoadingMenu(null);
    }
  };

  const handleRunSurvey = async () => {
    if (!hasInput) return;

    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setIsLoading(true);
    setLoadingMenu('survey');
    try {
      const data = await generateSurveyPatterns(serviceBody, priceHint);
      setPatterns(data);
      // デフォルトでパターンB（標準回答プラン）を選択し、コードも表示
      const defaultPattern = data.find(p => p.id === 'B') || data[1] || data[0];
      setSelectedPattern(defaultPattern);
      setShowCode(true);
      setPosts([]);
      setActiveMenu('survey');
    } catch (error) {
      onHandleApiError(error);
    } finally {
      setIsLoading(false);
      setLoadingMenu(null);
    }
  };

  const handleRunSlideDoc = () => {
    if (!hasInput) return;
    setPosts([]);
    setPatterns([]);
    setSelectedPattern(null);
    setShowCode(false);
    setCopiedSlideDocVersion(null);
    setActiveMenu('slidedoc');
  };

  const handleCopySlideDocPrompt = (version: ThumbnailPromptVersion) => {
    const prompt = getSlideDocPrompt(serviceBody, version);
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedSlideDocVersion(version);
      setTimeout(() => setCopiedSlideDocVersion(null), 2000);
    });
  };

  const handleGenerateCode = () => {
    if (selectedPattern) {
      setShowCode(true);
      setTimeout(() => {
        const el = document.getElementById('gas-code-section');
        if (el && containerRef.current) {
          const container = containerRef.current;
          const targetTop = el.offsetTop - container.offsetTop;
          container.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Menu definitions (data-driven for future extensibility)
  const supportMenus = [
    {
      id: 'promoter' as MenuId,
      title: '宣伝文を作る',
      description: 'リベシティの文化に合う「前向き・丁寧・押しつけない」つぶやきを20本生成',
      icon: <MegaphoneIcon />,
      onRun: handleRunPromoter,
      extraInput: (
        <div className="flex-shrink-0 w-full md:w-auto">
          <input
            type="text"
            value={serviceUrl}
            onChange={(e) => setServiceUrl(e.target.value)}
            className="field w-full md:w-64 px-3 py-2 rounded-full bg-white text-sm"
            placeholder="サービスURL（任意）"
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
      onRun: handleRunSurvey,
      extraInput: (
        <div className="flex-shrink-0 w-full md:w-auto">
          <input
            type="text"
            value={priceHint}
            onChange={(e) => setPriceHint(e.target.value)}
            className="field w-full md:w-40 px-3 py-2 rounded-full bg-white text-sm"
            placeholder="価格（任意）"
            disabled={!hasInput}
          />
        </div>
      ),
    },
    {
      id: 'slidedoc' as MenuId,
      title: 'サービス資料を作る',
      description: 'NotebookLM用のスライド作成プロンプトを生成（トンマナ7種から選択可）',
      icon: <PresentationIcon />,
      onRun: handleRunSlideDoc,
      extraInput: null,
    },
  ];

  const hasResults = posts.length > 0 || patterns.length > 0 || activeMenu === 'slidedoc';

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="mb-8">
          <span className="eyebrow mb-1 block">Support</span>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">サポートメニュー</h2>
          <p className="text-stone-500 text-sm mt-2">サービス詳細を入力すると、各メニューが実行できます。</p>
        </div>

        {/* Shared Input */}
        <div className="mb-8">
          <label className="font-semibold text-stone-700 text-sm mb-2 flex justify-between items-end">
            <span>出品サービスページ本文</span>
            <span className="text-xs text-stone-400 font-normal">Creatorで作った「サービス詳細」などを貼り付け</span>
          </label>
          <textarea
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
                        {activeMenu === menu.id && hasResults && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">実行済み</span>
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
                      {loadingMenu === menu.id ? '生成中…' : '実行'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Area */}
        {hasResults && (
          <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionLabel label="結果" />

            {/* Promoter Results */}
            {activeMenu === 'promoter' && posts.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-stone-900">生成されたつぶやき ({posts.length}本)</h3>
                  <p className="text-xs text-stone-500 mt-1">気に入ったものをコピー、または直接つぶやいてください。</p>
                </div>
                <div className="space-y-5 pb-12">
                  {posts.map((post, idx) => (
                    <TweetCard key={idx} text={post} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* Slide Doc Results */}
            {activeMenu === 'slidedoc' && (
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
                      <div
                        key={id}
                        className={`card p-5 ${isMyStyle ? 'md:col-span-2' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-stone-900">{label}</h4>
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
                        <p className="text-xs text-stone-500 leading-relaxed">{description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Usage guide */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 mb-12">
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
            {activeMenu === 'survey' && patterns.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-stone-900">アンケート構成案 (3パターン)</h3>
                  <p className="text-xs text-stone-500 mt-1">目的に合うパターンを選んで、Googleフォーム作成コードを発行してください。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
                  {patterns.map((pattern, index) => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedPattern?.id === pattern.id}
                      onSelect={() => setSelectedPattern(pattern)}
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
                {showCode && selectedPattern && <CodeViewer pattern={selectedPattern} />}
                <div className="pb-12"></div>
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
        />
      )}
    </div>
  );
};

export default SupportHub;
