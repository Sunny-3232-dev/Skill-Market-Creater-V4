import React, { useEffect, useMemo, useState } from 'react';
import { getThumbnailPrompt, reviseServiceContent } from '../services/geminiService';
import { SkillIdea, ThumbnailPromptVersion } from '../types';
import { PromptPreview } from './promptPreviews';
import ServiceChatEditor, { ChatMessage } from './ServiceChatEditor';
import { decorateHeadings } from '../utils/skillMarketMarkup';
import CampaignTweetCard from './CampaignTweetCard';
import { isCampaignActive } from '../data/campaign';
import { jumpToSection } from '../utils/jumpToSection';
import Troubleshoot from './Troubleshoot';
import ListingPreview from './ListingPreview';
import PasteFlowGuide from './guide/PasteFlowGuide';
import Tour, { useTour } from './guide/Tour';

const RESULT_TOUR = [
  { sel: '[data-tour="usage-strip"]', title: 'この画面は4段で進みます', text: '内容を確認して直す → スキルマーケットに貼る → 画像を用意 → つぶやく。押すとその段へ飛びます。' },
  { sel: '[data-tour="detail-card"]', title: 'まず、AIが作った出品文を確認します', text: 'サービス詳細は、貼ったあとの見え方で表示しています。気になるところは「編集」で手直しできます。' },
  { sel: '[data-tour="price-mode"]', title: '価格は標準とモニターを切り替えられます', text: 'モニター価格にするときは、先着人数や期限を付けてください。理由のある値引きに見えます。' },
  { sel: '[data-tour="chat-editor"]', title: 'まとめて直すなら、画面下のAI編集に頼めます', text: '「もっと短く」「価格を上げて」のように書きます。保存するまで元の文は残るので、試して戻せます。貼る前に済ませてください。' },
  { sel: '[data-tour="paste-section"]', title: 'つぎに、スキルマーケットに貼ります', text: 'この一覧の順に「コピー」→ 出品画面の同じ名前の欄に貼ります。このツールと出品画面を左右に並べると楽です（ボタンの吹き出しを見てください）。' },
  { sel: '[data-tour="prompt-recommended"]', title: 'さいごに、サムネイル画像を用意します', text: '迷ったらこれ。コピーして ChatGPT に貼ると、あなたのサービス内容で画像ができます。' },
  { sel: '[data-tour="campaign"]', title: '出品したら、つぶやいて応募', text: '9月30日までのキャンペーンです。出品してURLができたら、つぶやきのURL欄に貼ってください。' },
];

// この画面の4段。押すとその段へ飛び、枠を一瞬光らせる
const USAGE_STEPS = [
  { id: 'result-review', title: '内容を確認して、直す', hint: 'カードの編集・画面下のAI編集' },
  { id: 'result-paste', title: 'スキルマーケットに貼る', hint: '順に「コピー」→ 出品画面の同じ欄へ' },
  { id: 'result-image', title: 'サムネイル画像を用意', hint: 'プロンプトを ChatGPT へ' },
  { id: 'result-tweet', title: '出品したら、つぶやく', hint: 'キャンペーンに応募' },
];



interface ServiceResultProps {
  idea: SkillIdea;
  content: string;
  onBack: () => void;
  onSaveContent: (newContent: string) => void;
  ensureKeySet: () => Promise<boolean>;
  onHandleApiError: (error: any) => void;
}

const PRICE_HEADER = '💰価格の目安';
const STANDARD_LABEL = '■ 標準価格';
const MONITOR_LABEL = '■ モニター価格';

const splitDetailByPrice = (detail: string) => {
  const priceIdx = detail.indexOf(PRICE_HEADER);
  if (priceIdx === -1) {
    return { before: detail, priceRaw: '', after: '' };
  }
  const afterIdx = detail.indexOf('🔚', priceIdx + PRICE_HEADER.length);
  const endPos = afterIdx === -1 ? detail.length : afterIdx;
  return {
    before: detail.substring(0, priceIdx).trimEnd(),
    priceRaw: detail.substring(priceIdx, endPos).trim(),
    after: afterIdx === -1 ? '' : detail.substring(afterIdx).trimStart(),
  };
};

const parsePriceBlock = (priceRaw: string) => {
  if (!priceRaw) {
    return { hasMonitor: false, standard: '', monitor: '' };
  }
  const body = priceRaw.replace(PRICE_HEADER, '').trim();
  const stdIdx = body.indexOf(STANDARD_LABEL);
  const monIdx = body.indexOf(MONITOR_LABEL);

  if (stdIdx === -1 && monIdx === -1) {
    return { hasMonitor: false, standard: body, monitor: '' };
  }

  let standard = '';
  if (stdIdx !== -1) {
    const end = (monIdx !== -1 && monIdx > stdIdx) ? monIdx : body.length;
    standard = body.substring(stdIdx + STANDARD_LABEL.length, end).trim();
  }
  let monitor = '';
  if (monIdx !== -1) {
    const end = (stdIdx !== -1 && stdIdx > monIdx) ? stdIdx : body.length;
    monitor = body.substring(monIdx + MONITOR_LABEL.length, end).trim();
  }

  return { hasMonitor: !!monitor, standard, monitor };
};

const parseServiceContent = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n');

  const getValue = (key: string) => {
    const regex = new RegExp(`^${key}[:：]\\s*(.*)$`, 'm');
    const match = normalized.match(regex);
    return match ? match[1].trim() : '';
  };

  const category = getValue('カテゴリ');
  const subCategory = getValue('サブカテゴリ');
  const title = getValue('タイトル');
  const catchphrase = getValue('キャッチコピー');

  const policyMarker = '⚠️キャンセル時の注意事項';
  const skillsMarker = '🎯出品者スキル';
  const templateMarker = '📝依頼テンプレート';

  const detailHeaderMatch = normalized.match(/^サービス詳細[（(].*[）)].*$/m);
  const detailStart = detailHeaderMatch
    ? detailHeaderMatch.index! + detailHeaderMatch[0].length
    : (normalized.indexOf('キャッチコピー') !== -1
        ? normalized.indexOf('\n', normalized.indexOf('キャッチコピー'))
        : 0);

  const policyIdx = normalized.indexOf(policyMarker);
  const skillsIdx = normalized.indexOf(skillsMarker);
  const templateIdx = normalized.indexOf(templateMarker);

  const detailEnd = [policyIdx, skillsIdx, templateIdx]
    .filter(i => i !== -1)
    .sort((a, b) => a - b)[0] || normalized.length;

  const detail = normalized.substring(detailStart, detailEnd).trim();

  let policy = '';
  if (policyIdx !== -1) {
    const end = [skillsIdx, templateIdx].filter(i => i !== -1 && i > policyIdx).sort((a, b) => a - b)[0] || normalized.length;
    policy = normalized.substring(policyIdx + policyMarker.length, end).trim();
  }

  let skills = '';
  if (skillsIdx !== -1) {
    const end = (templateIdx !== -1 && templateIdx > skillsIdx) ? templateIdx : normalized.length;
    skills = normalized.substring(skillsIdx + skillsMarker.length, end).trim();
  }

  let template = '';
  if (templateIdx !== -1) {
    template = normalized.substring(templateIdx + templateMarker.length).trim();
  }

  const priceSplit = splitDetailByPrice(detail);
  const priceParts = parsePriceBlock(priceSplit.priceRaw);

  return {
    title, catchphrase, category, subCategory,
    detail, policy, skills, template,
    priceBefore: priceSplit.before,
    priceAfter: priceSplit.after,
    priceRaw: priceSplit.priceRaw,
    priceStandard: priceParts.standard,
    priceMonitor: priceParts.monitor,
    hasMonitorPrice: priceParts.hasMonitor,
  };
};

// 手動編集されたセクションから出品ページ本文を組み立て直す（parseServiceContentと往復可能な形式）
interface ContentParts {
  category: string; subCategory: string; title: string; catchphrase: string;
  detail: string; policy: string; skills: string; template: string;
}
const reconstructContent = (parts: ContentParts): string => {
  const headerLines = [
    parts.category ? `カテゴリ：${parts.category}` : '',
    parts.subCategory ? `サブカテゴリ：${parts.subCategory}` : '',
    parts.title ? `タイトル：${parts.title}` : '',
    parts.catchphrase ? `キャッチコピー：${parts.catchphrase}` : '',
  ].filter(Boolean).join('\n');

  let out = headerLines;
  out += `\nサービス詳細（以下の構成と順序）\n${parts.detail}`;
  if (parts.policy) out += `\n\n⚠️キャンセル時の注意事項\n${parts.policy}`;
  if (parts.skills) out += `\n\n🎯出品者スキル\n${parts.skills}`;
  if (parts.template) out += `\n\n📝依頼テンプレート\n${parts.template}`;
  return out.trim();
};

// 仕上げ画面の3つの段（貼る → 画像 → つぶやく）の見出し。
// 数字は上の進捗バー（入力→選ぶ→仕上げ）と衝突するので、順序は言葉で示す
const SectionHead: React.FC<{ eyebrow: string; title: string; description: string; action?: React.ReactNode }> = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-5">
    <div className="min-w-0">
      <span className="eyebrow mb-1 block">{eyebrow}</span>
      <h3 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h3>
      <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-2xl">{description}</p>
    </div>
    {action && <div className="shrink-0 pt-1">{action}</div>}
  </div>
);

const CopyButton: React.FC<{ copied: boolean; onClick: () => void; dark?: boolean }> = ({ copied, onClick, dark }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${
      copied
        ? 'bg-brand-50 text-brand-600'
        : dark
          ? 'bg-stone-900 text-white hover:bg-stone-700'
          : 'bg-white text-stone-600 border border-stone-200 hover:border-brand-200 hover:text-brand-600'
    }`}
  >
    {copied ? 'コピーしました' : 'コピー'}
  </button>
);

const EditButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-colors bg-white text-stone-600 border border-stone-200 hover:border-brand-200 hover:text-brand-600"
  >
    編集
  </button>
);

// コピーに加えて、その場での手動編集（textarea）に対応したセクションカード
const CopySection: React.FC<{
  title: string;
  content: string;
  onSave?: (newContent: string) => void;
  minRows?: number;
}> = ({ title, content, onSave, minRows = 3 }) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const startEdit = () => { setValue(content); setEditing(true); };
  const applyEdit = () => {
    if (!value.trim()) return;
    onSave?.(value.trim());
    setEditing(false);
  };

  if (!content) return null;
  const rows = Math.min(16, Math.max(minRows, value.split('\n').length + 1));

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
          {copied && <span className="text-[11px] text-brand-600 animate-in fade-in duration-200">→ 出品画面の「{title}」欄に貼り付け</span>}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="btn-quiet px-4 py-1.5 text-xs">キャンセル</button>
              <button
                type="button"
                onClick={applyEdit}
                disabled={!value.trim()}
                className="btn-dark px-4 py-1.5 text-xs"
              >
                完了
              </button>
            </>
          ) : (
            <>
              {onSave && <EditButton onClick={startEdit} />}
              <CopyButton copied={copied} onClick={handleCopy} />
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`${title}を編集`}
          className="field w-full p-4 text-sm leading-relaxed resize-y"
          autoFocus
        />
      ) : (
        <div className="bg-stone-50 rounded-xl p-4 text-stone-600 text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
      )}
    </div>
  );
};

type PriceMode = 'standard' | 'monitor';
type LimitCount = 1 | 3 | 5;
type LimitPeriodId = 'thisMonth' | 'nextMonth';

const getMonthEndOptions = () => {
  const today = new Date();
  const thisMonth = today.getMonth() + 1;
  const nextMonth = (today.getMonth() + 1) % 12 + 1;
  return [
    { id: 'thisMonth' as LimitPeriodId, label: `${thisMonth}月末まで` },
    { id: 'nextMonth' as LimitPeriodId, label: `${nextMonth}月末まで` },
  ];
};

// 画像生成プロンプトのスタイル定義(カードUIはこの配列から一括生成。プレビューはpromptPreviewsで共用)
const PROMPT_STYLES: Array<{
  id: ThumbnailPromptVersion;
  label: string;
  description: string;
  note?: string;
  fullWidth?: boolean;
  recommended?: boolean; // 迷ったときの第一候補として先頭に置き、バッジを付ける
}> = [
  {
    id: 'benefit_banner',
    label: '訴求バナー（ベネフィット型）',
    description: '「現役◯◯が全力サポート！」のような、大見出し＋提供者キャラクター＋3つのベネフィットで構成する販促バナー風。サービスの内容・ターゲットに合わせて見出し・キャラ・配色を自動で調整し、インパクトと信頼感を両立します。',
    fullWidth: true,
    recommended: true,
  },
  {
    id: 'standard',
    label: '標準',
    description: 'プロフェッショナルで洗練されたデザイン。信頼感と上質な印象。',
  },
  {
    id: 'simple',
    label: 'シンプル',
    description: '詳細なレイアウト指示。丸みのあるやさしいビジネスデザイン。',
  },
  {
    id: 'watercolor',
    label: '水彩画',
    description: '手書き風の柔らかなタッチ。親しみやすく温かい印象。',
  },
  {
    id: 'pop',
    label: 'ポップ＆フレンドリー',
    description: '鮮やかな多色使いとポップアート感。楽しくフレンドリーな印象。',
  },
  {
    id: 'youtube',
    label: 'YouTube風',
    description: '人気YouTuberのサムネイル風。インパクト重視で思わずクリックしたくなる印象。',
  },
  {
    id: 'puffy_3d',
    label: 'ぷっくり3D',
    description: '粘土のようにぷっくり膨らんだ3D調。パステルカラーでやわらかく、思わず目を引く可愛い印象。',
  },
  {
    id: 'my_style',
    label: 'マイスタイル',
    description: '参考にしたいサムネイル画像を ChatGPT に一緒に添付すると、そのデザインを踏襲した新しいサムネイルを生成できます。アイコンや文章は新しいサービス内容に自動で差し替えられます。',
    note: 'コピー後、ChatGPT を開いて参考画像と一緒に貼り付けてください。',
    fullWidth: true,
  },
];

const PromptCard: React.FC<{
  style: typeof PROMPT_STYLES[number];
  prompt: string;
  copied: boolean;
  expanded: boolean;
  onCopy: () => void;
  onToggle: () => void;
}> = ({ style, prompt, copied, expanded, onCopy, onToggle }) => (
  <div className={`card p-4 space-y-3 ${style.fullWidth ? 'md:col-span-2' : ''}`}>
    {style.fullWidth ? (
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <PromptPreview version={style.id} className="w-full sm:w-[240px] shrink-0 rounded-xl border border-stone-100" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h6 className="text-sm font-semibold text-stone-900">{style.label}</h6>
              {style.recommended && (
                <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">迷ったらこれ</span>
              )}
            </div>
            <CopyButton copied={copied} onClick={onCopy} dark />
          </div>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">{style.description}</p>
          {style.note && (
            <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">※{style.note}</p>
          )}
        </div>
      </div>
    ) : (
      <>
        <PromptPreview version={style.id} className="w-full rounded-xl border border-stone-100" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h6 className="text-sm font-semibold text-stone-900">{style.label}</h6>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{style.description}</p>
          </div>
          <CopyButton copied={copied} onClick={onCopy} dark />
        </div>
      </>
    )}
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 hover:text-brand-500 transition-colors"
    >
      <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
      プロンプトを表示
    </button>
    {expanded && (
      <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
        {prompt}
      </pre>
    )}
  </div>
);

const ServiceResult: React.FC<ServiceResultProps> = ({ idea, content, onBack, onSaveContent, ensureKeySet, onHandleApiError }) => {
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isDetailCopied, setIsDetailCopied] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<ThumbnailPromptVersion | null>(null);
  const [copiedVersion, setCopiedVersion] = useState<ThumbnailPromptVersion | null>(null);
  const [showTip, setShowTip] = useState(false);
  const tour = useTour();
  // 「貼る」段の一覧で、どの項目をコピー済みか（貼り付け済みの目安）
  const [pastedLabels, setPastedLabels] = useState<Set<string>>(() => new Set());
  const markPasted = (label: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setPastedLabels(prev => new Set(prev).add(label));
    });
  };
  // 画像プロンプトは「迷ったらこれ」だけ開いておき、残りは求められたときに出す
  const [showAllStyles, setShowAllStyles] = useState(false);
  const recommendedStyle = PROMPT_STYLES.find(st => st.recommended) ?? PROMPT_STYLES[0];
  const otherStyles = PROMPT_STYLES.filter(st => st.id !== recommendedStyle.id);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // AI編集チャットが書き換える下書き本文。保存するまでは idea.generatedContent に反映されない
  const [draftContent, setDraftContent] = useState(content);
  const [savedContent, setSavedContent] = useState(content);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // サービス詳細の手動編集state
  const [editingDetail, setEditingDetail] = useState(false);
  const [detailDraft, setDetailDraft] = useState('');

  // 選択中のアイデアが変わったら下書き・チャット履歴をリセット
  useEffect(() => {
    setDraftContent(content);
    setSavedContent(content);
    setChatMessages([]);
    setChatError(null);
    setShowBackConfirm(false);
    setEditingDetail(false);
    setPastedLabels(new Set());
  }, [idea.id]);

  const isDirty = draftContent !== savedContent;

  // Price mode state
  const [priceMode, setPriceMode] = useState<PriceMode>('standard');
  const [limitCount, setLimitCount] = useState<LimitCount | null>(null);
  const [limitPeriod, setLimitPeriod] = useState<LimitPeriodId | null>(null);

  const parsed = useMemo(() => parseServiceContent(draftContent), [draftContent]);
  const monthEndOptions = useMemo(() => getMonthEndOptions(), []);

  // 選択を反映した💰価格の目安ブロックの本文を構築
  const currentPriceBlock = useMemo(() => {
    if (!parsed.hasMonitorPrice) {
      // 旧データ: AI原文をそのまま表示
      return parsed.priceRaw;
    }
    if (priceMode === 'standard') {
      return `${PRICE_HEADER}\n${parsed.priceStandard}`;
    }
    // モニターモードでは標準価格も必ず併記し、サービスの本来の価値を買い手に伝える
    const conditions: string[] = [];
    if (limitCount !== null) conditions.push(`先着${limitCount}名様限定`);
    if (limitPeriod !== null) {
      const opt = monthEndOptions.find(o => o.id === limitPeriod);
      if (opt) conditions.push(opt.label);
    }
    const monitorSuffix = conditions.length > 0 ? `（${conditions.join('・')}）` : '';
    return `${PRICE_HEADER}\n${STANDARD_LABEL}\n${parsed.priceStandard}\n\n${MONITOR_LABEL}${monitorSuffix}\n${parsed.priceMonitor}`;
  }, [parsed, priceMode, limitCount, limitPeriod, monthEndOptions]);

  // サービス詳細カードのコピー用テキスト(選択反映版)
  const rebuiltDetail = useMemo(() => {
    if (!parsed.hasMonitorPrice) return parsed.detail;
    const parts = [parsed.priceBefore, currentPriceBlock, parsed.priceAfter].filter(Boolean);
    return parts.join('\n\n').trim();
  }, [parsed, currentPriceBlock]);

  // 全文コピー用テキスト(選択反映版)
  const rebuiltContent = useMemo(() => {
    if (!parsed.hasMonitorPrice) return draftContent;
    const priceIdx = draftContent.indexOf(PRICE_HEADER);
    if (priceIdx === -1) return draftContent;
    const endMarkers = ['🔚', '⚠️', '🎯', '📝'];
    let endIdx = draftContent.length;
    for (const marker of endMarkers) {
      const idx = draftContent.indexOf(marker, priceIdx + PRICE_HEADER.length);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }
    return draftContent.substring(0, priceIdx) + currentPriceBlock + '\n\n' + draftContent.substring(endIdx);
  }, [draftContent, parsed.hasMonitorPrice, currentPriceBlock]);

  const promptCtx = useMemo(() => ({ ...idea, generatedContent: draftContent }), [idea, draftContent]);
  const prompts = useMemo(() => {
    const map = {} as Record<ThumbnailPromptVersion, string>;
    for (const s of PROMPT_STYLES) {
      map[s.id] = getThumbnailPrompt(promptCtx, true, s.id);
    }
    return map;
  }, [promptCtx]);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(decorateHeadings(rebuiltContent)).then(() => {
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2000);
    });
  };

  const handleCopyDetail = () => {
    navigator.clipboard.writeText(decorateHeadings(rebuiltDetail)).then(() => {
      setIsDetailCopied(true);
      setTimeout(() => setIsDetailCopied(false), 2000);
    });
  };

  const handleCopyPrompt = (version: ThumbnailPromptVersion) => {
    navigator.clipboard.writeText(prompts[version]).then(() => {
      setCopiedVersion(version);
      setTimeout(() => setCopiedVersion(null), 2000);
    });
  };

  // 各カードの手動編集を本文（draft）へ反映する
  const applySectionEdit = (patch: Partial<ContentParts>) => {
    setDraftContent(reconstructContent({
      category: parsed.category,
      subCategory: parsed.subCategory,
      title: parsed.title,
      catchphrase: parsed.catchphrase,
      detail: parsed.detail,
      policy: parsed.policy,
      skills: parsed.skills,
      template: parsed.template,
      ...patch,
    }));
  };

  const handleSaveDraft = () => {
    onSaveContent(draftContent);
    setSavedContent(draftContent);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleDiscardDraft = () => {
    setDraftContent(savedContent);
    setChatError(null);
  };

  const handleSendChatInstruction = async () => {
    const instruction = chatInput.trim();
    if (!instruction || isChatLoading) return;

    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setChatMessages(prev => [...prev, { role: 'user', text: instruction }]);
    setChatInput('');
    setIsChatLoading(true);
    setChatError(null);
    try {
      const revision = await reviseServiceContent(draftContent, instruction);
      setDraftContent(revision.content);
      setChatMessages(prev => [...prev, { role: 'assistant', text: revision.summary }]);
    } catch (error) {
      setChatError('編集に失敗しました。もう一度お試しください。');
      onHandleApiError(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleBackClick = () => {
    if (isDirty) {
      setShowBackConfirm(true);
    } else {
      onBack();
    }
  };

  const toggleButtonClass = (active: boolean) =>
    `flex-1 py-2.5 px-3 ${active ? 'chip-active' : 'chip'}`;

  const chipButtonClass = (active: boolean) =>
    `px-4 py-1.5 ${active ? 'chip-active' : 'chip'}`;

  return (
    <div className="p-6 md:p-10 lg:p-12 pb-32 h-full flex flex-col">
      <Tour steps={RESULT_TOUR} open={tour.open} onClose={tour.close} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">出品用テキストが完成しました</h2>
            {isDirty && (
              <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">未保存の変更</span>
            )}
          </div>
        </div>
        {showBackConfirm ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-xs text-stone-500">保存せず戻りますか？</span>
            <button onClick={onBack} className="btn-dark py-2 px-4 text-xs">はい</button>
            <button onClick={() => setShowBackConfirm(false)} className="btn-quiet py-2 px-4 text-xs">いいえ</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleBackClick} className="btn-secondary py-2.5 px-5 text-xs">一覧へ戻る</button>
            <button onClick={handleCopyAll} className={`py-2.5 px-6 rounded-full font-semibold text-xs transition-colors ${isAllCopied ? 'bg-brand-50 text-brand-600' : 'bg-stone-900 text-white hover:bg-stone-700'}`}>
              {isAllCopied ? 'コピーしました' : '全文コピー'}
            </button>
          </div>
        )}
      </div>

      {/* この画面の使い方: 4段。押すとその段へ飛んで、枠を光らせる（貼るのは最後） */}
      <ol data-tour="usage-strip" aria-label="この画面の使い方" className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 list-none m-0 p-0">
        {USAGE_STEPS.filter(st => st.id !== 'result-tweet' || isCampaignActive()).map((st, i) => (
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

      <div className="space-y-10">
        {/* まず: 内容を確認して直す。貼るのは直し終わってから */}
        <section id="result-review" className="scroll-mt-24 rounded-2xl">
          <SectionHead
            eyebrow="まず"
            title="内容を確認して、直す"
            description="AIが作った出品文です。各カードの「編集」で手直しできます。まとめて直すなら、画面下の AI 編集に「もっと短く」「価格を上げて」のように頼んでください。スキルマーケットに貼るのは、直し終わってからです。"
          />
          <div className="space-y-5">
          <div className="card p-5">
            <h4 className="font-semibold text-stone-900 text-sm mb-3">カテゴリ・サブカテゴリ</h4>
            <div className="bg-stone-50 rounded-xl p-4 text-sm flex items-center gap-3">
              <span className="font-semibold text-stone-800">{parsed.category || '未設定'}</span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-500">{parsed.subCategory || '未設定'}</span>
            </div>
          </div>
          <CopySection title="タイトル" content={parsed.title} minRows={2} onSave={(v) => applySectionEdit({ title: v })} />
          <CopySection title="キャッチコピー" content={parsed.catchphrase} minRows={2} onSave={(v) => applySectionEdit({ catchphrase: v })} />

          {/* サービス詳細 - 価格モードUIを埋め込んだカスタムカード */}
          <div className="card p-5" data-tour="detail-card">
            <div className="flex justify-between items-center mb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h4 className="font-semibold text-stone-900 text-sm">サービス詳細</h4>
                {isDetailCopied && <span className="text-[11px] text-brand-600 animate-in fade-in duration-200">→ 出品画面の「サービス詳細」欄に貼り付け</span>}
              </div>
              <div className="flex items-center gap-2">
                {editingDetail ? (
                  <>
                    <button type="button" onClick={() => setEditingDetail(false)} className="btn-quiet px-4 py-1.5 text-xs">キャンセル</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!detailDraft.trim()) return;
                        applySectionEdit({ detail: detailDraft.trim() });
                        setEditingDetail(false);
                      }}
                      disabled={!detailDraft.trim()}
                      className="btn-dark px-4 py-1.5 text-xs"
                    >
                      完了
                    </button>
                  </>
                ) : (
                  <>
                    <EditButton onClick={() => { setDetailDraft(parsed.detail); setEditingDetail(true); }} />
                    <CopyButton copied={isDetailCopied} onClick={handleCopyDetail} />
                  </>
                )}
              </div>
            </div>
            {!editingDetail && (
              <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
                コピーすると見出しが <code className="text-stone-500">&lt;strong&gt;</code> で囲まれ、スキルマーケットに貼ったとき太字になります。
              </p>
            )}
            {editingDetail ? (
              <>
                <textarea
                  value={detailDraft}
                  rows={Math.min(28, Math.max(10, detailDraft.split('\n').length + 2))}
                  onChange={(e) => setDetailDraft(e.target.value)}
                  aria-label="サービス詳細を編集"
                  className="field w-full p-4 text-sm leading-relaxed resize-y"
                  autoFocus
                />
                <p className="text-[11px] text-stone-400 mt-1.5">「■ 標準価格」「■ モニター価格」の見出しを残しておくと、価格モードの切り替えが引き続き使えます。</p>
              </>
            ) : (
            <div className="bg-stone-50 rounded-xl p-4 text-stone-600 text-sm leading-relaxed">
              <p className="text-[10px] font-semibold text-stone-400 mb-3 tracking-wide">スキルマーケットに貼ったときの見え方（見出しは太字になります）</p>
              {parsed.hasMonitorPrice ? (
                <>
                  {parsed.priceBefore && <ListingPreview text={parsed.priceBefore} />}

                  {/* 価格モードカード */}
                  <div className="my-5 bg-white border border-stone-200 rounded-2xl p-5" data-tour="price-mode">
                    <div className="flex items-baseline gap-2 mb-4">
                      <h5 className="font-semibold text-stone-900 text-sm">価格モード</h5>
                      <span className="text-[11px] text-stone-400 hidden sm:inline">選ぶと下の「価格の目安」に反映されます</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
                      安すぎる価格は、自信がなさそうに見えることがあります。下げるなら「先着」「期限」の理由をつけてください。
                      価格の考え方は「参考資料」の学長の記事にまとまっています。
                    </p>

                    <div className="flex gap-2 mb-1">
                      <button type="button" onClick={() => setPriceMode('standard')} className={toggleButtonClass(priceMode === 'standard')}>
                        標準価格
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPriceMode('monitor');
                          // 理由のない値引きは自信がなさそうに見える。条件が無ければ「先着3名」を初期値にする
                          if (limitCount === null && limitPeriod === null) setLimitCount(3);
                        }}
                        className={toggleButtonClass(priceMode === 'monitor')}
                      >
                        モニター価格
                      </button>
                    </div>

                    {priceMode === 'monitor' && (
                      <div className="space-y-4 pt-4 mt-3 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <p className="text-xs font-semibold text-stone-600 mb-2">先着人数 <span className="text-stone-400 font-normal">(先着か期限のどちらか1つは必ず付けます)</span></p>
                          <div className="flex gap-2">
                            {[1, 3, 5].map(n => (
                              <button
                                key={n}
                                type="button"
                                // 最後の1つの条件は外せない（値引きの理由を必ず残す）
                                onClick={() => setLimitCount(limitCount === n ? (limitPeriod !== null ? null : limitCount) : (n as LimitCount))}
                                className={chipButtonClass(limitCount === n)}
                              >
                                {n}名
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-stone-600 mb-2">期間 <span className="text-stone-400 font-normal">(もう一度押すと解除)</span></p>
                          <div className="flex gap-2">
                            {monthEndOptions.map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setLimitPeriod(limitPeriod === opt.id ? (limitCount !== null ? null : limitPeriod) : opt.id)}
                                className={chipButtonClass(limitPeriod === opt.id)}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 価格の目安ブロック(選択反映) */}
                  <ListingPreview text={currentPriceBlock} />

                  {parsed.priceAfter && <ListingPreview text={parsed.priceAfter} className="mt-3" />}
                </>
              ) : (
                <ListingPreview text={parsed.detail} />
              )}
            </div>
            )}
          </div>

          <CopySection title="キャンセル時の注意事項" content={parsed.policy} onSave={(v) => applySectionEdit({ policy: v })} />
          <CopySection title="スキル" content={parsed.skills} onSave={(v) => applySectionEdit({ skills: v })} />
          <CopySection title="依頼テンプレート" content={parsed.template} onSave={(v) => applySectionEdit({ template: v })} />
          </div>
        </section>

        {/* つぎに: スキルマーケットに貼る。直し終わった本文を、貼る順に並べる */}
        <section id="result-paste" className="scroll-mt-24 rounded-2xl" data-tour="paste-section">
          <SectionHead
            eyebrow="つぎに"
            title="スキルマーケットに貼る"
            description="下の順に「コピー」して、出品画面の同じ名前の欄に貼ります。サービス詳細の見出しは太字（<strong>）付きでコピーされます。"
            action={
              <div className="relative">
                <a
                  href="https://skill.libecity.com/services/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-5 py-2.5 text-xs"
                  data-tour="open-market"
                >
                  スキルマーケット出品画面へ
                </a>
                {/* 一番つまずく操作を、ボタンのすぐ下の吹き出しで */}
                <div className="relative mt-3 max-w-[18rem] rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] leading-relaxed text-stone-700" role="note">
                  <span aria-hidden className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-brand-50 border-l border-t border-brand-200"></span>
                  <span className="font-semibold text-stone-900">ここを右クリック</span>
                  （トラックパッドは2本指でタップ）→ 上から3つ目
                  <span className="font-semibold text-stone-900">「分割ビューで開く」</span>
                  で、このツールと出品画面を左右に並べて作業できます。
                </div>
              </div>
            }
          />
          <div className="card divide-y divide-stone-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-[11px] font-bold flex items-center justify-center">0</span>
              <span className="text-stone-500">カテゴリを選ぶ：</span>
              <span className="font-semibold text-stone-800">{parsed.category || '未設定'}</span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-600">{parsed.subCategory || '未設定'}</span>
              <span className="ml-auto text-[11px] text-stone-400 shrink-0">出品画面で選ぶ</span>
            </div>
            {[
              { label: 'タイトル', text: parsed.title },
              { label: 'キャッチコピー', text: parsed.catchphrase },
              { label: 'サービス詳細', text: decorateHeadings(rebuiltDetail) },
              { label: 'キャンセル時の注意事項', text: parsed.policy },
              { label: 'スキル', text: parsed.skills },
              { label: '依頼テンプレート', text: parsed.template },
            ].filter(row => row.text.trim()).map((row, i) => {
              const done = pastedLabels.has(row.label);
              return (
                <div key={row.label} className={`px-4 py-3 flex items-center gap-3 ${done ? 'bg-emerald-50/40' : ''}`}>
                  <span className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${done ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white'}`}>{done ? '✓' : i + 1}</span>
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-semibold text-stone-800 leading-snug">{row.label}</p>
                    <p className="text-[11px] text-stone-400 truncate">{row.text.replace(/\s+/g, ' ').slice(0, 60)}</p>
                  </div>
                  <span className={`text-[11px] shrink-0 ${done ? 'text-emerald-700' : 'text-stone-400'}`}>{done ? 'コピー済み' : `→ 出品画面の「${row.label}」欄へ`}</span>
                  <button type="button" onClick={() => markPasted(row.label, row.text)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${done ? 'bg-white border border-emerald-200 text-emerald-700' : 'bg-stone-900 text-white hover:bg-stone-700'}`}>
                    {done ? 'もう一度コピー' : 'コピー'}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowTip(!showTip)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 hover:text-stone-600 transition-colors"
            >
              左右に並べて作業するやり方（分割ビュー） <span className={`transition-transform duration-200 ${showTip ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {showTip && (
              <div className="mt-2 bg-stone-50 rounded-xl p-3 text-left text-[12px] text-stone-500 leading-relaxed space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <p>1. 上の「スキルマーケット出品画面へ」を<span className="font-semibold text-stone-700">右クリック</span>（MacBook のトラックパッドは<span className="font-semibold text-stone-700">2本指でタップ</span>）</p>
                <p>2. 出たメニューの<span className="font-semibold text-stone-700">上から3つ目「分割ビューで開く」</span>を押す → 左にこの画面、右に出品画面が並びます</p>
                <p>3. 上の一覧の順に「コピー」→ 出品画面の同じ名前の欄に貼り付け。サービス詳細は <code>&lt;strong&gt;</code> が見えたままで正解</p>
              </div>
            )}
          </div>
          {/* 動く絵は求められたときだけ（画面の主役は本文なので、既定では閉じる） */}
          <details className="mt-4 group" data-tour="paste-guides">
            <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-500 transition-colors [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">▾</span>
              貼り方を動きで見る（画面の2分割 → 項目ごとの貼り付け → 公開）
            </summary>
            <div className="mt-3">
              <PasteFlowGuide />
            </div>
          </details>
        </section>

        {/* さいごに: サムネイル画像 */}
        <section id="result-image" className="scroll-mt-24 rounded-2xl">
          <SectionHead
            eyebrow="さいごに"
            title="サムネイル画像を用意する"
            description="下のプロンプトをコピーして ChatGPT に貼ると、あなたのサービス内容で画像ができます。画像生成は ChatGPT（GPT Image）を使います。カードの画像は仕上がりのサンプルです。"
            action={
              <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="btn-dark px-5 py-2 text-xs">ChatGPT を開く</a>
            }
          />
          <div className="space-y-4">
            <div data-tour="prompt-recommended">
            <PromptCard
              style={recommendedStyle}
              prompt={prompts[recommendedStyle.id]}
              copied={copiedVersion === recommendedStyle.id}
              expanded={expandedPrompt === recommendedStyle.id}
              onCopy={() => handleCopyPrompt(recommendedStyle.id)}
              onToggle={() => setExpandedPrompt(expandedPrompt === recommendedStyle.id ? null : recommendedStyle.id)}
            />
            </div>
            <button
              type="button"
              onClick={() => setShowAllStyles(v => !v)}
              aria-expanded={showAllStyles}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-500 transition-colors"
            >
              <span className={`transition-transform duration-200 ${showAllStyles ? 'rotate-180' : ''}`}>▾</span>
              他のスタイルを見る（{otherStyles.length}種）
            </button>
            {showAllStyles && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                {otherStyles.map(style => (
                  <PromptCard
                    key={style.id}
                    style={style}
                    prompt={prompts[style.id]}
                    copied={copiedVersion === style.id}
                    expanded={expandedPrompt === style.id}
                    onCopy={() => handleCopyPrompt(style.id)}
                    onToggle={() => setExpandedPrompt(expandedPrompt === style.id ? null : style.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 出品したら: つぶやいて応募（期間外は描画されない） */}
        <div id="result-tweet" className="scroll-mt-24 rounded-2xl">
          <CampaignTweetCard variant="publish" className="card p-5" />
        </div>

        <Troubleshoot items={[
          {
            q: '貼っても見出しが太字にならない',
            a: <>太字になるのは「サービス詳細」の欄だけです。タイトルや注意事項の欄では効きません。メモ帳などを経由して貼ると <code>&lt;strong&gt;</code> が消えることがあるので、このページの「コピー」から直接貼ってください。</>,
          },
          {
            q: '価格モード（標準／モニター）の切り替えが出ない',
            a: <>本文に「■ 標準価格」「■ モニター価格」の両方の見出しが残っているときだけ出ます。手で編集して消えた場合は見出しを戻すか、下のAI編集に「価格の目安に標準価格とモニター価格の2つを入れて」と頼んでください。</>,
          },
          {
            q: '書かれている実績や経験が自分と違う',
            a: <>実績は自己紹介にある事実だけを根拠にしています。違うところがあれば、一覧に戻って「プロフィールを修正」で自己紹介を直してから作り直すか、各セクションの「編集」で直接書き換えてください。</>,
          },
          {
            q: '生成が終わらない・エラーになる',
            a: <>出品文の生成は15〜40秒かかります。「エラーが発生しました」と出たときは、もう一度お試しください。続く場合はページを再読み込みしてください。作ったアイデアや本文はこのブラウザに保存されているので消えません。</>,
          },
          {
            q: '「APIキーが設定されていません」と出る',
            a: <>自分のパソコンで動かしている場合は <code>.env</code> に <code>GEMINI_API_KEY</code> を書いて再起動します。配布されたURLで使っている場合は出ない表示なので、URLが正しいか確認してください。</>,
          },
        ]} />
      </div>

      {/* 画面下部に常駐するAI編集バー（fixed配置） */}
      <ServiceChatEditor
        messages={chatMessages}
        input={chatInput}
        onInputChange={setChatInput}
        onSend={handleSendChatInstruction}
        isLoading={isChatLoading}
        error={chatError}
        isDirty={isDirty}
        justSaved={justSaved}
        onSave={handleSaveDraft}
        onDiscard={handleDiscardDraft}
      />
    </div>
  );
};

export default ServiceResult;
