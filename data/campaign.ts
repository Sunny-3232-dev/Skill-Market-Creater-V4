/**
 * リベシティの期間限定キャンペーン設定。
 * 期間が終わったら関連UIを丸ごと隠すので、来期また開催されたら
 * このファイルの日付と名称を書き換えるだけでよい。
 */
export const CAMPAIGN = {
  /** 告知上の正式名称 */
  fullName: 'リベシティ関連サービス出品者応援キャンペーン',
  /** 画面表示用の短縮名（正式名称は長いのでUIではこちらを使う） */
  shortName: '出品者応援キャンペーン',
  /** 応募期限（JST） */
  endsAt: '2026-09-30T23:59:59+09:00',
  /** 期限の表示用ラベル */
  endsAtLabel: '9月30日',
  /** キャンペーン後に控えるイベント。出品を急ぐ理由として添える */
  nextEvent: '10月の稼げ家祭り・挑戦期間',
  /** 告知チャットへのリンク。リベシティにログインしている人だけが開ける */
  announcementUrl: 'https://libecity.com/room_list?room_id=Liberal-City&comment_id=1L58tRFiyHah6MIYeg8c',
} as const;

/** つぶやきに必須の3行。ノミネート条件なので一字一句この通りに送る */
export const CAMPAIGN_TWEET_TAG = '#関連サービス出品';
export const CAMPAIGN_TWEET_URL_LABEL = '📝 URL：';
export const CAMPAIGN_TWEET_NOTE_LABEL = '✍ どこを意識して出品・見直したか：';

/** つぶやき作成画面を本文入りで開くリンクを組み立てる */
export const buildCampaignTweetUrl = (serviceUrl?: string): string => {
  const body = [
    CAMPAIGN_TWEET_TAG,
    `${CAMPAIGN_TWEET_URL_LABEL}${serviceUrl ?? ''}`,
    CAMPAIGN_TWEET_NOTE_LABEL,
  ].join('\n');
  return `https://libecity.com/tweet/all?create=${encodeURIComponent(body)}`;
};

export const isCampaignActive = (now: Date = new Date()): boolean =>
  now.getTime() <= new Date(CAMPAIGN.endsAt).getTime();

/** 締切当日を含む残り日数。期限を過ぎていれば0 */
export const campaignDaysLeft = (now: Date = new Date()): number => {
  const diff = new Date(CAMPAIGN.endsAt).getTime() - now.getTime();
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
};
