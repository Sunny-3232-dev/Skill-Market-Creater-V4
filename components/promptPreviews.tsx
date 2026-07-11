import React from 'react';
import { ThumbnailPromptVersion } from '../types';

/**
 * 画像生成プロンプト／スライド資料のトンマナ別プレビュー。
 * 7スタイルは gpt-image-2 で実際に生成したサンプルサムネイル（public/previews/）。
 * サンプル文言は全スタイル共通: 「スプシ自動化で時短！／面倒な集計をワンクリックに」
 * my_style は「参考画像→生成」の仕組みの図解なのでSVGで描画する。
 */

const GENERATED_PREVIEWS: Partial<Record<ThumbnailPromptVersion, string>> = {
  standard: '/previews/standard.jpg',
  simple: '/previews/simple.jpg',
  watercolor: '/previews/watercolor.jpg',
  pop: '/previews/pop.jpg',
  youtube: '/previews/youtube.jpg',
  puffy_3d: '/previews/puffy_3d.jpg',
  pivot: '/previews/pivot.jpg',
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

export const PromptPreview: React.FC<{ version: ThumbnailPromptVersion; className?: string }> = ({ version, className = '' }) => {
  const src = GENERATED_PREVIEWS[version];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className={`block aspect-[3/2] object-cover bg-stone-100 ${className}`}
      />
    );
  }
  return (
    <div className={`overflow-hidden aspect-[3/2] ${className}`} aria-hidden>
      <MyStylePreview />
    </div>
  );
};
