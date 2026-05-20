
import React, { useState, useMemo } from 'react';
import { getThumbnailPrompt } from '../services/geminiService';
import { SkillIdea, ThumbnailPromptVersion } from '../types';

interface ServiceResultProps {
  idea: SkillIdea;
  content: string;
  thumbnailUrl?: string;
  onGenerateImage: () => void;
  isHighQuality: boolean;
  setIsHighQuality: (value: boolean) => void;
  onReset: (e?: React.MouseEvent) => void;
  onBack: () => void;
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

const CopySection: React.FC<{ title: string; content: string; icon: string }> = ({ title, content, icon }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  if (!content) return null;
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-soft hover:shadow-card-hover transition-all duration-300 ease-smooth group">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-stone-700 flex items-center gap-2 text-sm">
          <span className="text-lg">{icon}</span> {title}
        </h4>
        <button type="button" onClick={handleCopy} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ease-smooth ${copied ? 'bg-green-100 text-green-700 border-green-200' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}>
          {copied ? '✅ コピー済' : '📋 コピー'}
        </button>
      </div>
      <div className="bg-stone-50/50 rounded-xl p-4 text-stone-600 text-sm whitespace-pre-wrap border border-stone-100/50 leading-relaxed">{content}</div>
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

const ServiceResult: React.FC<ServiceResultProps> = ({
  idea, content, thumbnailUrl, onGenerateImage, isHighQuality, setIsHighQuality, onReset, onBack
}) => {
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isDetailCopied, setIsDetailCopied] = useState(false);
  // my_style / youtube / pivot 追加
  const [expandedPrompt, setExpandedPrompt] = useState<ThumbnailPromptVersion | null>(null);
  const [copiedVersion, setCopiedVersion] = useState<ThumbnailPromptVersion | null>(null);
  const [showTip, setShowTip] = useState(false);

  // Price mode state
  const [priceMode, setPriceMode] = useState<PriceMode>('standard');
  const [limitCount, setLimitCount] = useState<LimitCount | null>(null);
  const [limitPeriod, setLimitPeriod] = useState<LimitPeriodId | null>(null);

  const parsed = useMemo(() => parseServiceContent(content), [content]);
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
    if (!parsed.hasMonitorPrice) return content;
    const priceIdx = content.indexOf(PRICE_HEADER);
    if (priceIdx === -1) return content;
    const endMarkers = ['🔚', '⚠️', '🎯', '📝'];
    let endIdx = content.length;
    for (const marker of endMarkers) {
      const idx = content.indexOf(marker, priceIdx + PRICE_HEADER.length);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }
    return content.substring(0, priceIdx) + currentPriceBlock + '\n\n' + content.substring(endIdx);
  }, [content, parsed.hasMonitorPrice, currentPriceBlock]);

  const promptCtx = useMemo(() => ({ ...idea, generatedContent: content }), [idea, content]);
  const standardPrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'standard'), [promptCtx]);
  const simplePrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'simple'), [promptCtx]);
  const watercolorPrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'watercolor'), [promptCtx]);
  const popPrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'pop'), [promptCtx]);
  // my_style追加
  const referenceBasedPrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'my_style'), [promptCtx]);
  // youtube / pivot 追加
  const youtubePrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'youtube'), [promptCtx]);
  const pivotPrompt = useMemo(() => getThumbnailPrompt(promptCtx, true, 'pivot'), [promptCtx]);

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

  // my_style / youtube / pivot 追加
  const handleCopyPrompt = (version: ThumbnailPromptVersion) => {
    const promptMap: Record<ThumbnailPromptVersion, string> = {
      standard: standardPrompt,
      simple: simplePrompt,
      watercolor: watercolorPrompt,
      pop: popPrompt,
      my_style: referenceBasedPrompt,
      youtube: youtubePrompt,
      pivot: pivotPrompt,
    };
    navigator.clipboard.writeText(promptMap[version]).then(() => {
      setCopiedVersion(version);
      setTimeout(() => setCopiedVersion(null), 2000);
    });
  };

  const handleDownloadImage = () => {
    if (!thumbnailUrl) return;
    
    // サービスタイトルをファイル名に使用（OSで禁止されている文字をサニタイズ）
    const safeTitle = (parsed.title || idea.title || 'service')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim();
    
    const link = document.createElement('a');
    link.href = thumbnailUrl;
    link.download = `${safeTitle}-thumbnail.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <span className="text-rose-500 font-bold tracking-wider text-xs uppercase mb-1 block">Step 3</span>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">出品用テキストが完成しました</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="bg-white text-stone-600 border border-stone-200 py-2.5 px-5 rounded-full font-bold text-xs hover:bg-stone-50">一覧へ戻る</button>
          <button onClick={handleCopyAll} className={`py-2.5 px-6 rounded-full font-bold text-xs transition-all ${isAllCopied ? 'bg-green-500 text-white' : 'bg-stone-800 text-white hover:bg-stone-700'}`}>
            {isAllCopied ? '✅ コピー完了' : '📄 全文コピー'}
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {/* Next Steps Guide */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-orange-900 font-black text-2xl mb-8 flex items-center gap-3">
              <span className="bg-white p-2.5 rounded-2xl shadow-sm text-2xl">✨</span> 
              次のステップ！出品まであと少し！
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Step 1: Integrated Action */}
              <div className="bg-white/60 p-6 rounded-3xl border border-white flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-4 shadow-lg shadow-orange-200">1</div>
                <h5 className="font-bold text-orange-900 mb-2">情報を登録</h5>
                <p className="text-orange-800/70 text-[13px] leading-relaxed mb-4">
                  各項目の「コピー」ボタンで内容を保存し、出品画面の入力欄に貼り付けます。
                </p>
                <div className="w-full mb-4">
                  <button
                    onClick={() => setShowTip(!showTip)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <span>💡</span> 貼り付け方のコツ <span className={`transition-transform duration-200 ${showTip ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {showTip && (
                    <div className="mt-2 bg-white/80 rounded-xl p-3 text-left text-[11px] text-orange-800/80 leading-relaxed space-y-1.5 border border-orange-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p><span className="font-bold text-orange-600">1.</span> 下のリンクを<span className="font-bold">右クリック</span>→「分割ビューで開く」</p>
                      <p><span className="font-bold text-orange-600">2.</span> 左に出品画面、右にこの画面を並べて表示</p>
                      <p><span className="font-bold text-orange-600">3.</span> 各項目の「コピー」→ 出品画面に貼り付け</p>
                    </div>
                  )}
                </div>
                <div className="mt-auto">
                  <a
                    href="https://skill.libecity.com/services/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-2 bg-white border border-rose-200 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all shadow-sm hover:shadow active:scale-95"
                  >
                    スキルマーケット出品画面へ
                  </a>
                </div>
              </div>

              {/* Step 2: Thumbnail */}
              <div className="bg-white/60 p-6 rounded-3xl border border-white flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-4 shadow-lg shadow-orange-200">2</div>
                <h5 className="font-bold text-orange-900 mb-2">画像準備</h5>
                <div className="text-orange-800/70 text-[13px] leading-relaxed space-y-1">
                  <p className="flex items-center gap-1 justify-center"><span>🎨</span> <span>プロンプトをコピーしてGeminiで生成</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-8">
            {/* Thumbnail Section */}
            <div className="w-full space-y-4">
              {/* サムネイル生成UI（現在無効化中・将来復活の可能性あり）
              {thumbnailUrl ? (
                <div className="relative group rounded-[2rem] overflow-hidden shadow-lg border border-stone-100 bg-stone-50 max-w-3xl mx-auto">
                  <img src={thumbnailUrl} className="w-full object-cover aspect-[3/2]" alt="Thumbnail" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="flex gap-3">
                      <button onClick={handleDownloadImage} className="bg-rose-500 text-white hover:bg-rose-600 font-bold py-3.5 px-8 rounded-full text-sm transition-all transform hover:scale-105 shadow-xl flex items-center gap-2">
                        <span>📥</span> 保存する
                      </button>
                      <button onClick={onGenerateImage} className="bg-white text-stone-800 hover:bg-rose-50 font-bold py-3.5 px-8 rounded-full text-sm transition-all transform hover:scale-105 shadow-xl">
                        🔄 作り直す
                      </button>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white text-xs w-full max-w-xs">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={isHighQuality} onChange={e => setIsHighQuality(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-stone-600 rounded-full peer peer-checked:bg-rose-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                        </div>
                        <span className="font-bold">{isHighQuality ? 'High Quality (Gemini 3 Pro)' : 'Standard (Gemini 2.5 Flash)'}</span>
                      </label>
                      <p className="text-[10px] opacity-70 mt-1 leading-tight">
                        {isHighQuality
                          ? '※高品質モデルはご自身のAPIキー（有料プロジェクト）の設定が必要です。画像内にタイトルやコピーが含まれます。'
                          : '※標準モデルは高速に生成されます。画像内に文字は含まれません。'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div onClick={onGenerateImage} className="w-full max-w-3xl aspect-[3/2] rounded-[2rem] bg-stone-100 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-200 hover:border-rose-300 transition-all group">
                    <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">🖼️</span>
                    <span className="font-bold text-stone-700 text-xl group-hover:text-rose-500">サムネイル画像を作成</span>
                    <span className="text-sm text-stone-400 mt-2">サービスに合った画像を自動で生成します</span>
                  </div>
                  <div className="w-full max-lg flex flex-col items-center space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <label className="inline-flex items-center cursor-pointer px-8 py-3 bg-white rounded-full border border-stone-200 shadow-sm hover:shadow transition-all group mb-2">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" checked={isHighQuality} onChange={(e) => setIsHighQuality(e.target.checked)} />
                          <div className="w-14 h-7 bg-stone-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-purple-500 transition-all"></div>
                          <div className="absolute top-[2px] left-[2px] w-6 h-6 bg-white rounded-full transition-all peer-checked:translate-x-7 shadow-sm"></div>
                        </div>
                        <span className="ml-4 font-bold text-stone-600 group-hover:text-stone-800 text-sm">{isHighQuality ? 'High Quality (Gemini 3 Pro)' : 'Standard (Gemini 2.5 Flash)'}</span>
                      </label>
                      <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
                        {isHighQuality
                          ? '高品質モデルはご自身のAPIキー設定が必要です。高解像度かつ正確な文字配置が可能です。'
                          : '標準モデルは高速に生成されます。画像内に文字は含まれません。'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              */}
            </div>

            {/* Content Cards */}
            <div className="space-y-6">
              <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-soft hover:shadow-card-hover transition-shadow duration-300 ease-smooth">
                <h4 className="font-bold text-stone-700 flex items-center gap-2 text-sm mb-4"><span className="text-lg">📂</span> カテゴリ・サブカテゴリ</h4>
                <div className="bg-stone-50/50 rounded-xl p-5 text-stone-600 text-sm border border-stone-100 flex items-center gap-3">
                  <span className="font-bold text-stone-800">{parsed.category || '未設定'}</span>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-500">{parsed.subCategory || '未設定'}</span>
                </div>
              </div>
              <CopySection title="タイトル" content={parsed.title} icon="🏷️" />
              <CopySection title="キャッチコピー" content={parsed.catchphrase} icon="🎣" />

              {/* サービス詳細 - 価格モードUIを埋め込んだカスタムカード */}
              <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-soft hover:shadow-card-hover transition-all duration-300 ease-smooth group">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-stone-700 flex items-center gap-2 text-sm">
                    <span className="text-lg">📝</span> サービス詳細
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyDetail}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                      isDetailCopied ? 'bg-green-100 text-green-700 border-green-200' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {isDetailCopied ? '✅ コピー済' : '📋 コピー'}
                  </button>
                </div>
                <div className="bg-stone-50/50 rounded-xl p-4 text-stone-600 text-sm border border-stone-100/50 leading-relaxed">
                  {parsed.hasMonitorPrice ? (
                    <>
                      {parsed.priceBefore && (
                        <div className="whitespace-pre-wrap">{parsed.priceBefore}</div>
                      )}

                      {/* 価格モードカード */}
                      <div className="my-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-base">💰</span>
                          <h5 className="font-bold text-stone-700 text-sm">価格モード</h5>
                          <span className="text-[10px] text-stone-400 hidden sm:inline">選ぶと下の「価格の目安」に反映されます</span>
                        </div>

                        {/* 標準 / モニター トグル */}
                        <div className="flex gap-2 mb-4">
                          <button
                            type="button"
                            onClick={() => setPriceMode('standard')}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                              priceMode === 'standard'
                                ? 'bg-stone-800 text-white shadow-md'
                                : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            標準価格
                          </button>
                          <button
                            type="button"
                            onClick={() => setPriceMode('monitor')}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                              priceMode === 'monitor'
                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md'
                                : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            モニター価格
                          </button>
                        </div>

                        {/* モニター ON のときの追加オプション(同じボタンを再度押すと解除) */}
                        {priceMode === 'monitor' && (
                          <div className="space-y-4 pt-4 border-t border-amber-200/60 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* 先着人数 */}
                            <div>
                              <p className="text-xs font-bold text-stone-600 mb-2">先着人数 <span className="text-stone-400 font-normal">(任意・もう一度押すと解除)</span></p>
                              <div className="flex gap-2">
                                {[1, 3, 5].map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setLimitCount(limitCount === n ? null : (n as LimitCount))}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                      limitCount === n
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                                    }`}
                                  >
                                    {n}名
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 期間 */}
                            <div>
                              <p className="text-xs font-bold text-stone-600 mb-2">期間 <span className="text-stone-400 font-normal">(任意・もう一度押すと解除)</span></p>
                              <div className="flex gap-2">
                                {monthEndOptions.map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setLimitPeriod(limitPeriod === opt.id ? null : opt.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                      limitPeriod === opt.id
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                                    }`}
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

              <CopySection title="キャンセル時の注意事項" content={parsed.policy} icon="⚠️" />
              <CopySection title="スキル" content={parsed.skills} icon="🎯" />
              <CopySection title="依頼テンプレート" content={parsed.template} icon="📋" />

              {/* Prompt Area */}
              <div className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden p-6 space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 bg-white p-2 rounded-xl border border-stone-100 shadow-soft flex items-center justify-center w-10 h-10">
                      <span className="text-xl">🎨</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-stone-700">画像生成プロンプト</h5>
                      <p className="text-[10px] text-emerald-600 font-bold leading-tight">ChatGPT がおすすめ（Geminiでも OK）</p>
                      <p className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5">※Geminiの場合は「🍌画像を作成」と思考モードにする</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href="https://chatgpt.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
                    >
                      <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full">おすすめ</span>
                      <span>ChatGPTを起動</span>
                    </a>
                    <a
                      href="https://gemini.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-2 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-50 transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
                    >
                      Geminiを起動
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Standard Prompt Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">標準版プロンプト</h6>
                      <p className="text-xs text-stone-500 mt-0.5">プロフェッショナルで洗練されたデザイン。信頼感と上質な印象。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#0f172a" width="600" height="400" rx="12"/>
                      <rect x="50" y="130" width="440" height="56" rx="4" fill="#fff" opacity="0.95"/>
                      <rect x="50" y="210" width="320" height="40" rx="4" fill="#fff" opacity="0.4"/>
                      <rect x="50" y="300" width="90" height="6" fill="#fbbf24"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('standard')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'standard'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'standard' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'standard' ? null : 'standard')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'standard' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'standard' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {standardPrompt}
                    </pre>
                  )}
                </div>

                {/* Simple Prompt Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">シンプル版プロンプト</h6>
                      <p className="text-xs text-stone-500 mt-0.5">詳細なレイアウト指示。丸みのあるビジネスデザイン。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#fdfaf6" width="600" height="400" rx="12"/>
                      <rect fill="none" stroke="#d6d3d1" strokeWidth="2" x="14" y="14" width="572" height="372" rx="8"/>
                      <ellipse cx="300" cy="165" rx="190" ry="45" fill="#ede9fe"/>
                      <circle cx="115" cy="295" r="50" fill="#fef3c7"/>
                      <ellipse cx="420" cy="270" rx="115" ry="20" fill="#dbeafe"/>
                      <ellipse cx="420" cy="325" rx="115" ry="20" fill="#dbeafe"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('simple')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'simple'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'simple' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'simple' ? null : 'simple')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'simple' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'simple' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {simplePrompt}
                    </pre>
                  )}
                </div>

                {/* Watercolor Prompt Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">水彩画版プロンプト</h6>
                      <p className="text-xs text-stone-500 mt-0.5">手書き風の柔らかなタッチ。親しみやすく温かい印象。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#fefbf6" width="600" height="400" rx="12"/>
                      <circle cx="220" cy="200" r="120" fill="#fbcfe8" opacity="0.65"/>
                      <circle cx="340" cy="220" r="110" fill="#c4b5fd" opacity="0.6"/>
                      <circle cx="430" cy="180" r="95" fill="#bae6fd" opacity="0.6"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('watercolor')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'watercolor'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'watercolor' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'watercolor' ? null : 'watercolor')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'watercolor' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'watercolor' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {watercolorPrompt}
                    </pre>
                  )}
                </div>

                {/* Pop & Friendly Prompt Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">ポップ＆フレンドリー版プロンプト</h6>
                      <p className="text-xs text-stone-500 mt-0.5">鮮やかな多色使いとポップアート感。楽しくフレンドリーな印象。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#fb923c" width="600" height="400" rx="12"/>
                      <rect x="50" y="80" width="240" height="48" rx="24" fill="#fff"/>
                      <rect x="50" y="150" width="180" height="32" rx="16" fill="#fff" opacity="0.85"/>
                      <circle cx="450" cy="210" r="95" fill="#a78bfa"/>
                      <polygon points="450,135 461,162 490,162 467,179 477,206 450,189 423,206 433,179 410,162 439,162" fill="#facc15"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('pop')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'pop'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'pop' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'pop' ? null : 'pop')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'pop' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'pop' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {popPrompt}
                    </pre>
                  )}
                </div>

                {/* YouTube Prompt Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">YouTube風プロンプト</h6>
                      <p className="text-xs text-stone-500 mt-0.5">人気YouTuberのサムネイル風。派手・インパクト重視で思わずクリックしたくなる印象。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#dc2626" width="600" height="400" rx="12"/>
                      <circle cx="460" cy="220" r="130" fill="#fbbf24"/>
                      <rect x="40" y="90" width="290" height="60" rx="4" fill="#fff"/>
                      <rect x="40" y="170" width="230" height="60" rx="4" fill="#fbbf24"/>
                      <polygon points="90,310 101,335 128,335 106,351 115,377 90,361 65,377 74,351 52,335 79,335" fill="#fbbf24" stroke="#0f172a" strokeWidth="3"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('youtube')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'youtube'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'youtube' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'youtube' ? null : 'youtube')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'youtube' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'youtube' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {youtubePrompt}
                    </pre>
                  )}
                </div>

                {/* PIVOT Prompt Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">PIVOT風プロンプト</h6>
                      <p className="text-xs text-stone-500 mt-0.5">ビジネスインタビュー番組のトンマナ。落ち着いた深緑ベースで知的・上質な印象。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#14532d" width="600" height="400" rx="12"/>
                      <rect x="40" y="40" width="90" height="24" rx="3" fill="#fafaf9"/>
                      <rect x="40" y="110" width="360" height="50" rx="3" fill="#fafaf9"/>
                      <rect x="40" y="180" width="260" height="50" rx="3" fill="#fafaf9" opacity="0.75"/>
                      <circle cx="470" cy="220" r="90" fill="#fafaf9" opacity="0.95"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('pivot')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'pivot'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'pivot' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'pivot' ? null : 'pivot')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'pivot' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'pivot' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {pivotPrompt}
                    </pre>
                  )}
                </div>

                {/* MyStyle Prompt Card - full width at the bottom */}
                <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-bold text-stone-700">マイスタイル</h6>
                      <p className="text-xs text-stone-500 mt-0.5">参考にしたいサムネイル画像を ChatGPT や Gemini に一緒に添付することで、そのデザインを踏襲した新しいサムネイルを生成できます。アイコンや文章は新しいサービス内容に自動で差し替えられます。</p>
                      <p className="text-[10px] text-purple-600 font-medium leading-tight mt-1.5">※コピー後、ChatGPT または Gemini を開いて参考画像と一緒に貼り付けてください。</p>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-[120px] shrink-0 rounded-md block border border-stone-100">
                      <rect fill="#faf5ff" width="600" height="400" rx="12"/>
                      <rect x="50" y="100" width="210" height="200" rx="14" fill="#fff" stroke="#c4b5fd" strokeWidth="2.5" strokeDasharray="10 5"/>
                      <rect x="340" y="100" width="210" height="200" rx="14" fill="#a78bfa" opacity="0.2" stroke="#7c3aed" strokeWidth="2.5"/>
                      <path d="M280,200 L330,200" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round"/>
                      <polygon points="323,190 345,200 323,210" fill="#7c3aed"/>
                    </svg>
                    <button
                      onClick={() => handleCopyPrompt('my_style')}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all shrink-0 ${
                        copiedVersion === 'my_style'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                      }`}
                    >
                      {copiedVersion === 'my_style' ? '✅ コピー済' : '📋 コピー'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === 'my_style' ? null : 'my_style')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${expandedPrompt === 'my_style' ? 'rotate-180' : ''}`}>▾</span>
                    プロンプトを表示
                  </button>
                  {expandedPrompt === 'my_style' && (
                    <pre className="text-xs font-mono text-stone-500 bg-stone-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-stone-100 overflow-y-auto max-h-[200px] custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {referenceBasedPrompt}
                    </pre>
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceResult;
