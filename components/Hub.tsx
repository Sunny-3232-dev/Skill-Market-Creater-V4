import React from 'react';
import { ToolType } from '../types';
import { PenIcon, ArrowRightIcon } from './icons';

interface HubProps {
  onSelectTool: (tool: ToolType) => void;
}

const CapabilityChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 text-[11px] font-medium text-stone-500">
    {label}
  </span>
);

const ToolCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  cta: string;
  featured?: boolean;
  capabilities?: string[];
}> = ({ title, description, icon, onClick, cta, featured, capabilities }) => (
  <button
    onClick={onClick}
    className={`group card-hoverable relative flex flex-col md:flex-row items-start md:items-center text-left w-full
      ${featured ? 'p-6 md:p-8 gap-5 md:gap-7' : 'p-5 md:p-6 gap-4 md:gap-6'}`}
  >
    <div
      className={`shrink-0 flex items-center justify-center rounded-2xl text-white
        ${featured ? 'w-14 h-14 md:w-16 md:h-16' : 'w-12 h-12'}`}
      style={featured
        ? { backgroundImage: 'var(--gradient-brand)' }
        : { backgroundColor: '#1c1917' /* stone-900 */ }}
    >
      {icon}
    </div>

    <div className="flex-grow min-w-0">
      <h3 className={`font-bold text-stone-900 tracking-tight leading-tight
        ${featured ? 'text-xl md:text-2xl mb-2' : 'text-lg mb-1.5'}`}>{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
      {capabilities && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {capabilities.map(cap => <CapabilityChip key={cap} label={cap} />)}
        </div>
      )}
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
      <div className="flex flex-col gap-8 w-full max-w-3xl my-auto">

        <div className="text-center pt-2 md:pt-6">
          <h2 className="text-2xl md:text-[2rem] font-bold text-stone-900 tracking-tight leading-snug">
            あなたの「好き・得意」を、<br className="md:hidden" />
            <span className="text-brand-gradient">売れるサービス</span>に。
          </h2>
          <p className="mt-3 text-stone-500 text-sm leading-relaxed">
            アイデア出しから出品文・サムネイル・集客まで、この一つで完結します。
          </p>
        </div>

        <ToolCard
          title="出品アイデアを作る"
          description="あなたの「好き・得意」を分析し、出品アイデアからサムネイルプロンプトまで一括で生成します。"
          icon={<PenIcon />}
          onClick={() => onSelectTool(ToolType.CREATOR)}
          cta="作成を始める"
          featured
          capabilities={["アイデア提案", "タイトル・本文執筆", "画像生成"]}
        />

        <ToolCard
          title="サポートメニュー"
          description="宣伝文の作成、アンケート作成、サービス資料作成。サービス詳細を一度入力すれば、複数のメニューを実行できます。"
          icon={<SupportToolsIcon />}
          onClick={() => onSelectTool(ToolType.SUPPORT)}
          cta="開く"
          capabilities={["宣伝文作成", "アンケート作成", "サービス資料作成"]}
        />

        <div className="px-1 pt-2">
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
