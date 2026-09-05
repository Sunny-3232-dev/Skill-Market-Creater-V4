import React from 'react';
import {
  CAMPAIGN,
  CAMPAIGN_TWEET_TAG,
  CAMPAIGN_TWEET_URL_LABEL,
  CAMPAIGN_TWEET_NOTE_LABEL,
  buildCampaignTweetUrl,
  campaignDaysLeft,
  isCampaignActive,
} from '../data/campaign';

interface CampaignTweetCardProps {
  /** 出品済みサービスのURL。新規出品直後などURLがまだ無い場面では省略する */
  serviceUrl?: string;
  /** publish=新規出品したとき / polish=出品を見直したとき */
  variant: 'publish' | 'polish';
  /** 外側のシェル。置き場所によって背景が変わるので呼び出し側から渡す */
  className?: string;
}

const CampaignTweetCard: React.FC<CampaignTweetCardProps> = ({ serviceUrl, variant, className }) => {
  // 期間が終わったら何も出さない。終わったキャンペーンへの応募を案内しないため
  if (!isCampaignActive()) return null;

  const hasUrl = !!serviceUrl?.trim();
  const daysLeft = campaignDaysLeft();
  const href = buildCampaignTweetUrl(serviceUrl);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
          {CAMPAIGN.shortName}
        </span>
        <span className="text-[11px] text-stone-400">
          {CAMPAIGN.endsAtLabel}まで{daysLeft > 0 && `（あと${daysLeft}日）`}
        </span>
        <a
          href={CAMPAIGN.announcementUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-stone-400 hover:text-brand-500 underline decoration-stone-200 underline-offset-2 transition-colors"
        >
          キャンペーン詳細<span aria-hidden>↗</span>
        </a>
      </div>

      <h5 className="font-semibold text-stone-900 text-sm mb-2">
        {variant === 'publish' ? '出品したら、つぶやいて応募' : '出品・見直しを、つぶやいて応募'}
      </h5>

      <p className="text-stone-500 text-[13px] leading-relaxed mb-3">
        「{CAMPAIGN.fullName}」にノミネートされる条件は、つぶやきに次の3行を付けることです。
        下のボタンから、3行が入った状態のつぶやき画面が開きます。
      </p>

      <div className="bg-stone-50 rounded-xl p-3 text-[12px] text-stone-600 leading-relaxed whitespace-pre-wrap break-all mb-3">
        {`${CAMPAIGN_TWEET_TAG}\n${CAMPAIGN_TWEET_URL_LABEL}${serviceUrl ?? ''}\n${CAMPAIGN_TWEET_NOTE_LABEL}`}
      </div>

      <ul className="text-[12px] text-stone-500 leading-relaxed space-y-1 mb-4">
        <li>
          {hasUrl
            ? '・URLは選択中のサービスのものを入れてあります。'
            : '・出品が完了したら、つぶやき画面の「URL：」に出品ページのURLを貼ってください。'}
        </li>
        <li>・「✍」の行は、ご自身の言葉で書いてください。</li>
        <li>・{CAMPAIGN.nextEvent}に備えて、いまのうちに出品と見直しを進めておきましょう。</li>
      </ul>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-dark px-5 py-2.5 text-xs"
      >
        つぶやきを作成する<span aria-hidden>↗</span>
      </a>
    </div>
  );
};

export default CampaignTweetCard;
