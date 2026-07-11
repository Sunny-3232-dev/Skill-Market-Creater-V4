import React from 'react';
import { ToolType } from '../types';
import { PenIcon, ArrowRightIcon } from './icons';

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

interface HubProps {
  onSelectTool: (tool: ToolType) => void;
}

const CapabilityChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-stone-200 text-[11px] font-semibold text-stone-600">
    {label}
  </span>
);

const ToolCard: React.FC<{
  step?: string;        // STEP番号（省略時は手順外＝参考レイヤー）
  stepLabel: string;    // STEPなしのときは「いつでも参考に」等のタグ文言
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  cta: string;
  featured?: boolean;
  brandIcon?: boolean;  // アイコンタイルをブランド淡色にする（参考カード用）
  capabilities: string[];
}> = ({ step, stepLabel, title, description, icon, onClick, cta, featured, brandIcon, capabilities }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col md:flex-row items-start md:items-center text-left w-full rounded-2xl border transition-all duration-300 ease-smooth
      ${featured
        ? 'p-6 md:p-8 gap-5 md:gap-7 border-brand-200 shadow-brand hover:shadow-card-hover hover:-translate-y-0.5'
        : 'p-5 md:p-6 gap-4 md:gap-6 bg-white border-stone-200 shadow-soft hover:border-brand-200 hover:shadow-card-hover'}`}
    style={featured ? { backgroundImage: 'var(--gradient-brand-soft)' } : undefined}
  >
    {/* アイコンタイル: 主役はグラデ、参考はブランド淡色、補助はニュートラル */}
    <div
      className={`shrink-0 flex items-center justify-center rounded-2xl
        ${featured ? 'w-14 h-14 md:w-16 md:h-16 text-white' : brandIcon ? 'w-12 h-12 bg-brand-50 text-brand-500' : 'w-12 h-12 bg-stone-100 text-stone-600'}`}
      style={featured ? { backgroundImage: 'var(--gradient-brand)' } : undefined}
    >
      {icon}
    </div>

    <div className="flex-grow min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        {step ? (
          // STEPで前工程/後工程の関係を明示
          <>
            <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
              featured ? 'bg-brand-500 text-white' : 'bg-stone-200 text-stone-600'
            }`}>
              STEP {step}
            </span>
            <span className={`text-[11px] font-semibold ${featured ? 'text-brand-600' : 'text-stone-400'}`}>
              {stepLabel}
            </span>
          </>
        ) : (
          // 手順の外＝いつでも参照できる前提レイヤー
          <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            {stepLabel}
          </span>
        )}
      </div>

      <h3 className={`font-bold text-stone-900 tracking-tight leading-tight
        ${featured ? 'text-xl md:text-2xl mb-2' : 'text-lg mb-1.5'}`}>{title}</h3>
      <p className="text-stone-600 text-sm leading-relaxed">{description}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {capabilities.map(cap => <CapabilityChip key={cap} label={cap} />)}
      </div>
    </div>

    <div className={`shrink-0 mt-4 md:mt-0 ${featured ? 'btn-primary px-6 py-3 text-xs' : 'btn-secondary px-5 py-2.5 text-xs'}`}>
      <span>{cta}</span>
      <span className="transition-transform duration-300 ease-smooth group-hover:translate-x-0.5"><ArrowRightIcon /></span>
    </div>
  </button>
);

const SupportToolsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const Hub: React.FC<HubProps> = ({ onSelectTool }) => {
  return (
    <div className="p-5 md:p-10 h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-7 w-full max-w-3xl my-auto">

        <div className="text-center pt-2 md:pt-4">
          <h2 className="text-2xl md:text-[2rem] font-bold text-stone-900 tracking-tight leading-snug">
            あなたの「好き・得意」を、<br className="md:hidden" />
            <span className="text-brand-gradient">売れるサービス</span>に。
          </h2>
          <p className="mt-3 text-stone-500 text-sm leading-relaxed">
            アイデア出しから出品文・サムネイル・集客まで、この一つで完結します。
          </p>
        </div>

        {/* 2ツールを STEP でつなぎ、主役（作る）→補助（広める）の流れを見せる */}
        <div className="flex flex-col gap-3">
          <ToolCard
            step="1"
            stepLabel="まずはここから"
            title="出品アイデアを作る"
            description="あなたの「好き・得意」を分析し、出品アイデアからサービス本文・サムネイルまで一括で生成します。"
            icon={<PenIcon />}
            onClick={() => onSelectTool(ToolType.CREATOR)}
            cta="作成を始める"
            featured
            capabilities={["アイデア提案", "タイトル・本文執筆", "画像プロンプト"]}
          />

          <div className="flex items-center gap-3 px-2">
            <div className="h-px bg-stone-200 flex-grow"></div>
            <span className="text-[11px] text-stone-400 font-medium">出品できたら、次はこちら</span>
            <div className="h-px bg-stone-200 flex-grow"></div>
          </div>

          <ToolCard
            step="2"
            stepLabel="出品したあとに"
            title="広める・改善する"
            description="宣伝文づくり・購入者アンケート・サービス資料づくり。出品したサービスの集客と改善をまとめてサポートします。"
            icon={<SupportToolsIcon />}
            onClick={() => onSelectTool(ToolType.SUPPORT)}
            cta="開く"
            capabilities={["宣伝文づくり", "アンケート", "サービス資料"]}
          />
        </div>

        {/* 手順の外側に置く「前提・読み物」レイヤー（第3の入口・STEP番号なし） */}
        <ToolCard
          stepLabel="いつでも参考に"
          title="売れる人の考え方を学ぶ"
          description="価格の決め方・宣伝のコツ・改善のヒントを、リベ大の学長や先輩出品者の記事で無料で読めます。迷ったときの下敷きに。"
          icon={<BookIcon />}
          onClick={() => onSelectTool(ToolType.LEARN)}
          cta="ヒントを見る"
          brandIcon
          capabilities={["価格の決め方", "宣伝のコツ", "改善のヒント"]}
        />

        <div className="px-1">
          <p className="text-[11px] text-stone-400 leading-relaxed">
            本サービスが生成するコンテンツ（アイデア・文章・画像等）はAIによる自動生成であり、正確性や有用性を保証するものではありません。
            実際に出品する際は、必ずご自身で内容を確認・修正し、各プラットフォームの規約を遵守してください。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hub;
