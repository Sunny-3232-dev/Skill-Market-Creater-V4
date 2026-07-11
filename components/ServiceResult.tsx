import React, { useEffect, useMemo, useState } from 'react';
import { getThumbnailPrompt, reviseServiceContent } from '../services/geminiService';
import { SkillIdea, ThumbnailPromptVersion } from '../types';
import { PROMPT_PREVIEWS } from './promptPreviews';
import ServiceChatEditor, { ChatMessage } from './ServiceChatEditor';

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

const CopySection: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  if (!content) return null;
  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
        <CopyButton copied={copied} onClick={handleCopy} />
      </div>
      <div className="bg-stone-50 rounded-xl p-4 text-stone-600 text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
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
}> = [
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
    description: '参考にしたいサムネイル画像を ChatGPT や Gemini に一緒に添付すると、そのデザインを踏襲した新しいサムネイルを生成できます。アイコンや文章は新しいサービス内容に自動で差し替えられます。',
    note: 'コピー後、ChatGPT または Gemini を開いて参考画像と一緒に貼り付けてください。',
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
  <div className={`card p-5 space-y-3 ${style.fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <h6 className="text-sm font-semibold text-stone-900">{style.label}</h6>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{style.description}</p>
        {style.note && (
          <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">※{style.note}</p>
        )}
      </div>
      {PROMPT_PREVIEWS[style.id]}
      <CopyButton copied={copied} onClick={onCopy} dark />
    </div>
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
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // AI編集チャットが書き換える下書き本文。保存するまでは idea.generatedContent に反映されない
  const [draftContent, setDraftContent] = useState(content);
  const [savedContent, setSavedContent] = useState(content);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // 選択中のアイデアが変わったら下書き・チャット履歴をリセット
  useEffect(() => {
    setDraftContent(content);
    setSavedContent(content);
    setChatMessages([]);
    setChatError(null);
    setShowBackConfirm(false);
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
    navigator.clipboard.writeText(rebuiltContent).then(() => {
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2000);
    });
  };

  const handleCopyDetail = () => {
    navigator.clipboard.writeText(rebuiltDetail).then(() => {
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
    <div className="p-6 md:p-10 lg:p-12 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <span className="eyebrow mb-1 block">Step 3</span>
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

      <div className="space-y-10">
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

        {/* Next Steps Guide */}
        <div className="border border-brand-100 rounded-2xl p-6 md:p-8" style={{ backgroundImage: 'var(--gradient-brand-soft)' }}>
          <h4 className="text-stone-900 font-bold text-base mb-6">次のステップ — 出品まであと少し</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-5 rounded-2xl border border-white flex flex-col">
              <div className="w-7 h-7 text-white rounded-full flex items-center justify-center font-bold text-xs mb-3" style={{ backgroundImage: 'var(--gradient-brand)' }}>1</div>
              <h5 className="font-semibold text-stone-900 text-sm mb-2">情報を登録</h5>
              <p className="text-stone-500 text-[13px] leading-relaxed mb-3">
                各項目の「コピー」ボタンで内容を保存し、出品画面の入力欄に貼り付けます。
              </p>
              <div className="mb-4">
                <button
                  onClick={() => setShowTip(!showTip)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 hover:text-stone-600 transition-colors"
                >
                  貼り付け方のコツ <span className={`transition-transform duration-200 ${showTip ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {showTip && (
                  <div className="mt-2 bg-white rounded-xl p-3 text-left text-[12px] text-stone-500 leading-relaxed space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p>1. 下のリンクを<span className="font-semibold text-stone-700">右クリック</span>→「分割ビューで開く」</p>
                    <p>2. 左に出品画面、右にこの画面を並べて表示</p>
                    <p>3. 各項目の「コピー」→ 出品画面に貼り付け</p>
                  </div>
                )}
              </div>
              <div className="mt-auto">
                <a
                  href="https://skill.libecity.com/services/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-5 py-2.5 text-xs"
                >
                  スキルマーケット出品画面へ
                </a>
              </div>
            </div>

            <div className="bg-white/80 p-5 rounded-2xl border border-white flex flex-col">
              <div className="w-7 h-7 text-white rounded-full flex items-center justify-center font-bold text-xs mb-3" style={{ backgroundImage: 'var(--gradient-brand)' }}>2</div>
              <h5 className="font-semibold text-stone-900 text-sm mb-2">画像準備</h5>
              <p className="text-stone-500 text-[13px] leading-relaxed">
                下の「画像生成プロンプト」をコピーして、ChatGPT や Gemini でサムネイルを生成します。
              </p>
            </div>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-5">
          <div className="card p-5">
            <h4 className="font-semibold text-stone-900 text-sm mb-3">カテゴリ・サブカテゴリ</h4>
            <div className="bg-stone-50 rounded-xl p-4 text-sm flex items-center gap-3">
              <span className="font-semibold text-stone-800">{parsed.category || '未設定'}</span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-500">{parsed.subCategory || '未設定'}</span>
            </div>
          </div>
          <CopySection title="タイトル" content={parsed.title} />
          <CopySection title="キャッチコピー" content={parsed.catchphrase} />

          {/* サービス詳細 - 価格モードUIを埋め込んだカスタムカード */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-stone-900 text-sm">サービス詳細</h4>
              <CopyButton copied={isDetailCopied} onClick={handleCopyDetail} />
            </div>
            <div className="bg-stone-50 rounded-xl p-4 text-stone-600 text-sm leading-relaxed">
              {parsed.hasMonitorPrice ? (
                <>
                  {parsed.priceBefore && (
                    <div className="whitespace-pre-wrap">{parsed.priceBefore}</div>
                  )}

                  {/* 価格モードカード */}
                  <div className="my-5 bg-white border border-stone-200 rounded-2xl p-5">
                    <div className="flex items-baseline gap-2 mb-4">
                      <h5 className="font-semibold text-stone-900 text-sm">価格モード</h5>
                      <span className="text-[11px] text-stone-400 hidden sm:inline">選ぶと下の「価格の目安」に反映されます</span>
                    </div>

                    <div className="flex gap-2 mb-1">
                      <button type="button" onClick={() => setPriceMode('standard')} className={toggleButtonClass(priceMode === 'standard')}>
                        標準価格
                      </button>
                      <button type="button" onClick={() => setPriceMode('monitor')} className={toggleButtonClass(priceMode === 'monitor')}>
                        モニター価格
                      </button>
                    </div>

                    {priceMode === 'monitor' && (
                      <div className="space-y-4 pt-4 mt-3 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <p className="text-xs font-semibold text-stone-600 mb-2">先着人数 <span className="text-stone-400 font-normal">(任意・もう一度押すと解除)</span></p>
                          <div className="flex gap-2">
                            {[1, 3, 5].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setLimitCount(limitCount === n ? null : (n as LimitCount))}
                                className={chipButtonClass(limitCount === n)}
                              >
                                {n}名
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-stone-600 mb-2">期間 <span className="text-stone-400 font-normal">(任意・もう一度押すと解除)</span></p>
                          <div className="flex gap-2">
                            {monthEndOptions.map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setLimitPeriod(limitPeriod === opt.id ? null : opt.id)}
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
                  <div className="whitespace-pre-wrap">{currentPriceBlock}</div>

                  {parsed.priceAfter && (
                    <div className="whitespace-pre-wrap mt-3">{parsed.priceAfter}</div>
                  )}
                </>
              ) : (
                <div className="whitespace-pre-wrap">{parsed.detail}</div>
              )}
            </div>
          </div>

          <CopySection title="キャンセル時の注意事項" content={parsed.policy} />
          <CopySection title="スキル" content={parsed.skills} />
          <CopySection title="依頼テンプレート" content={parsed.template} />

          {/* Prompt Area */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-base font-bold text-stone-900">画像生成プロンプト</h5>
                <p className="text-xs text-stone-500 mt-1">ChatGPT がおすすめ（Gemini でも OK）。Gemini の場合は「画像を作成」と思考モードにしてください。</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dark px-5 py-2 text-xs"
                >
                  ChatGPT を開く
                </a>
                <a
                  href="https://gemini.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-5 py-2 text-xs"
                >
                  Gemini を開く
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {PROMPT_STYLES.map(style => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceResult;
