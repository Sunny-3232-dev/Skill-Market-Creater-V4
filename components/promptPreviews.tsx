import React from 'react';
import { ThumbnailPromptVersion } from '../types';
import { PREVIEW_DATA_URIS } from './previewImages';

/**
 * 画像生成プロンプト／スライド資料のトンマナ別プレビュー。
 * 7スタイルは gpt-image-2 で実際に生成したサンプルサムネイル。
 * ※ Google AI Studio では外部ファイル（public/）が配信されないため、
 *   画像は base64 データURI（previewImages.ts）としてソースに埋め込んで確実に表示する。
 * サンプル文言は全スタイル共通: 「スプシ自動化で時短！／面倒な集計をワンクリックに」
 * my_style は「参考画像→生成」の仕組みの図解なのでSVGで描画する。
 */

const GENERATED_PREVIEWS: Partial<Record<ThumbnailPromptVersion, string>> = {
  standard: PREVIEW_DATA_URIS.standard,
  simple: PREVIEW_DATA_URIS.simple,
  watercolor: PREVIEW_DATA_URIS.watercolor,
  pop: PREVIEW_DATA_URIS.pop,
  youtube: PREVIEW_DATA_URIS.youtube,
  puffy_3d: PREVIEW_DATA_URIS.puffy_3d,
};

const MyStylePreview = () => (
  <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
    <rect width="600" height="400" rx="12" fill="#faf5ff"/>
    <text x="150" y="82" fontSize="19" fontWeight="700" fill="#7c3aed" textAnchor="middle">お手持ちの参考画像</text>
    {/* 参考画像（ミニサムネ: 別サービスのトンマナ） */}
    <g>
      <rect x="52" y="100" width="196" height="132" rx="12" fill="#0f172a" stroke="#c4b5fd" strokeWidth="3" strokeDasharray="10 6"/>
      <rect x="68" y="128" width="132" height="18" rx="4" fill="#ffffff" opacity="0.95"/>
      <rect x="68" y="156" width="96" height="12" rx="4" fill="#ffffff" opacity="0.4"/>
      <rect x="68" y="196" width="52" height="6" fill="#fbbf24"/>
      <circle cx="216" cy="196" r="20" fill="#334155"/>
    </g>
    {/* 矢印 */}
    <path d="M268 166 L330 166" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round"/>
    <polygon points="324,152 352,166 324,180" fill="#7c3aed"/>
    <text x="300" y="140" fontSize="15" fontWeight="600" fill="#a78bfa" textAnchor="middle">同じ雰囲気で</text>
    {/* 生成結果: 同じレイアウト・配色で新サービス */}
    <text x="450" y="82" fontSize="19" fontWeight="700" fill="#7c3aed" textAnchor="middle">新しいサービス用に生成</text>
    <g>
      <rect x="352" y="100" width="196" height="132" rx="12" fill="#0f172a" stroke="#7c3aed" strokeWidth="3"/>
      <rect x="368" y="122" width="150" height="16" rx="4" fill="#ffffff" opacity="0.95"/>
      <text x="368" y="135" fontSize="12" fontWeight="800" fill="#0f172a">スプシ自動化で時短！</text>
      <rect x="368" y="150" width="110" height="10" rx="4" fill="#ffffff" opacity="0.4"/>
      <rect x="368" y="196" width="52" height="6" fill="#fbbf24"/>
      <circle cx="516" cy="196" r="20" fill="#334155"/>
      <rect x="500" y="182" width="14" height="18" rx="2" fill="#e2e8f0"/>
      <rect x="518" y="188" width="14" height="12" rx="2" fill="#e2e8f0"/>
    </g>
    <text x="300" y="300" fontSize="18" fill="#78716c" textAnchor="middle">レイアウト・配色・世界観はそのまま、</text>
    <text x="300" y="328" fontSize="18" fill="#78716c" textAnchor="middle">文章とアイコンだけ新しい内容に差し替え</text>
  </svg>
);

// AIおまかせ：本文の内容 → AIが解析 → 内容に合ったトンマナで自動デザイン、を表す図解
const AiAutoPreview = () => (
  <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
    <rect width="600" height="400" rx="12" fill="#faf5ff"/>
    <text x="300" y="52" fontSize="20" fontWeight="700" fill="#7c3aed" textAnchor="middle">内容に合わせてAIが自動デザイン</text>
    {/* 左：サービス本文 */}
    <g>
      <rect x="44" y="92" width="150" height="210" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="3"/>
      <rect x="64" y="116" width="92" height="12" rx="4" fill="#0f172a" opacity="0.8"/>
      <rect x="64" y="140" width="110" height="8" rx="4" fill="#94a3b8"/>
      <rect x="64" y="158" width="110" height="8" rx="4" fill="#94a3b8"/>
      <rect x="64" y="176" width="82" height="8" rx="4" fill="#94a3b8"/>
      <rect x="64" y="206" width="110" height="8" rx="4" fill="#cbd5e1"/>
      <rect x="64" y="224" width="96" height="8" rx="4" fill="#cbd5e1"/>
      <text x="119" y="286" fontSize="14" fontWeight="600" fill="#78716c" textAnchor="middle">サービス本文</text>
    </g>
    {/* 中：AI解析（きらめき） */}
    <g>
      <circle cx="300" cy="197" r="40" fill="#7c3aed"/>
      <path d="M300 176 l6 15 15 6 -15 6 -6 15 -6 -15 -15 -6 15 -6 z" fill="#ffffff"/>
      <circle cx="330" cy="170" r="6" fill="#c4b5fd"/>
      <circle cx="272" cy="224" r="4" fill="#c4b5fd"/>
      <text x="300" y="266" fontSize="14" fontWeight="700" fill="#7c3aed" textAnchor="middle">AIが解析</text>
    </g>
    <path d="M204 197 L250 197" stroke="#c4b5fd" strokeWidth="6" strokeLinecap="round"/>
    <path d="M350 197 L400 197" stroke="#c4b5fd" strokeWidth="6" strokeLinecap="round"/>
    <polygon points="394,187 418,197 394,207" fill="#7c3aed"/>
    {/* 右：自動デザインされたスライド＋パレット */}
    <g>
      <rect x="412" y="92" width="150" height="210" rx="12" fill="#0f172a" stroke="#7c3aed" strokeWidth="3"/>
      <rect x="432" y="116" width="110" height="16" rx="4" fill="#ffffff" opacity="0.95"/>
      <rect x="432" y="142" width="80" height="9" rx="4" fill="#fbbf24"/>
      <rect x="432" y="162" width="100" height="7" rx="4" fill="#ffffff" opacity="0.4"/>
      <rect x="432" y="176" width="100" height="7" rx="4" fill="#ffffff" opacity="0.4"/>
      {/* パレット */}
      <circle cx="440" cy="276" r="10" fill="#1e3a8a"/>
      <circle cx="466" cy="276" r="10" fill="#fbbf24"/>
      <circle cx="492" cy="276" r="10" fill="#ffffff"/>
    </g>
  </svg>
);

// 訴求バナー（ベネフィット型）：大見出し＋キャラクター＋3ベネフィットのバッジ構成を表す図
const BenefitBannerPreview = () => (
  <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
    {/* 背景：斜めのカラー帯 */}
    <rect width="600" height="400" fill="#eff6ff"/>
    <polygon points="0,0 600,0 600,120 0,180" fill="#1e3a8a"/>
    <polygon points="0,180 600,120 600,150 0,210" fill="#3b82f6" opacity="0.5"/>
    {/* 上部：メイン見出し（最重要語を塗り箱で強調） */}
    <rect x="40" y="30" width="86" height="40" rx="6" fill="#ef4444"/>
    <text x="83" y="59" fontSize="24" fontWeight="900" fill="#ffffff" textAnchor="middle">現役</text>
    <text x="140" y="60" fontSize="26" fontWeight="900" fill="#ffffff">プロが</text>
    <text x="44" y="112" fontSize="30" fontWeight="900" fill="#1e3a8a" stroke="#ffffff" strokeWidth="5" paintOrder="stroke">全力でサポート！</text>
    {/* 右：キャラクター（メガホン＋拳） */}
    <g>
      <circle cx="470" cy="215" r="26" fill="#fcd9b6"/>
      <rect x="446" y="238" width="48" height="52" rx="10" fill="#1e3a8a"/>
      <rect x="460" y="238" width="20" height="30" fill="#ffffff"/>
      {/* 上げた拳 */}
      <circle cx="516" cy="196" r="12" fill="#fcd9b6"/>
      <rect x="508" y="200" width="10" height="40" rx="5" fill="#1e3a8a"/>
      {/* メガホン */}
      <polygon points="410,205 440,195 440,235 410,225" fill="#fbbf24"/>
      <rect x="404" y="205" width="8" height="20" rx="2" fill="#f59e0b"/>
      <path d="M392 200 l-8 -6 M390 215 l-10 0 M392 230 l-8 6" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
    </g>
    {/* 下部：3つのベネフィットのバッジ */}
    <g>
      <circle cx="140" cy="330" r="46" fill="#fbbf24"/>
      <text x="140" y="326" fontSize="13" fontWeight="800" fill="#1f2937" textAnchor="middle">強みを</text>
      <text x="140" y="344" fontSize="13" fontWeight="800" fill="#1f2937" textAnchor="middle">活かす</text>
      <circle cx="300" cy="330" r="46" fill="#1e3a8a"/>
      <text x="300" y="326" fontSize="13" fontWeight="800" fill="#ffffff" textAnchor="middle">通過率</text>
      <text x="300" y="344" fontSize="13" fontWeight="800" fill="#ffffff" textAnchor="middle">アップ</text>
      <circle cx="460" cy="330" r="46" fill="#ffffff" stroke="#1e3a8a" strokeWidth="3"/>
      <text x="460" y="326" fontSize="13" fontWeight="800" fill="#1e3a8a" textAnchor="middle">模擬</text>
      <text x="460" y="344" fontSize="13" fontWeight="800" fill="#1e3a8a" textAnchor="middle">面接</text>
    </g>
  </svg>
);

export const PromptPreview: React.FC<{
  version: ThumbnailPromptVersion;
  className?: string;
  /** 画像左上に重ねるラベル。誤解防止のため「これはサンプル」と明示する */
  badge?: string;
}> = ({ version, className = '', badge = '仕上がりイメージ' }) => {
  if (version === 'benefit_banner') {
    return (
      <div className={`overflow-hidden aspect-[3/2] ${className}`} aria-hidden>
        <BenefitBannerPreview />
      </div>
    );
  }
  if (version === 'ai_auto') {
    return (
      <div className={`overflow-hidden aspect-[3/2] ${className}`} aria-hidden>
        <AiAutoPreview />
      </div>
    );
  }
  const src = GENERATED_PREVIEWS[version];
  if (src) {
    return (
      <div className={`relative overflow-hidden aspect-[3/2] bg-stone-100 ${className}`} aria-hidden>
        <img src={src} alt="" loading="lazy" className="block w-full h-full object-cover" />
        {badge && (
          <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold text-white bg-stone-900/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`overflow-hidden aspect-[3/2] ${className}`} aria-hidden>
      <MyStylePreview />
    </div>
  );
};
