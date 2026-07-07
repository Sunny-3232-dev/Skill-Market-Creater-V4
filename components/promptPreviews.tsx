import React from 'react';
import { ThumbnailPromptVersion } from '../types';

/**
 * 画像生成プロンプト／スライド資料のトンマナ別ミニプレビュー。
 * ServiceResult と SupportHub で共用する。
 */
export const PROMPT_PREVIEWS: Record<ThumbnailPromptVersion, React.ReactNode> = {
  standard: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#0f172a" width="600" height="400" rx="12"/>
      <rect x="50" y="130" width="440" height="56" rx="4" fill="#fff" opacity="0.95"/>
      <rect x="50" y="210" width="320" height="40" rx="4" fill="#fff" opacity="0.4"/>
      <rect x="50" y="300" width="90" height="6" fill="#fbbf24"/>
    </svg>
  ),
  simple: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#fdfaf6" width="600" height="400" rx="12"/>
      <rect fill="none" stroke="#d6d3d1" strokeWidth="2" x="14" y="14" width="572" height="372" rx="8"/>
      <ellipse cx="300" cy="165" rx="190" ry="45" fill="#ede9fe"/>
      <circle cx="115" cy="295" r="50" fill="#fef3c7"/>
      <ellipse cx="420" cy="270" rx="115" ry="20" fill="#dbeafe"/>
      <ellipse cx="420" cy="325" rx="115" ry="20" fill="#dbeafe"/>
    </svg>
  ),
  watercolor: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#fefbf6" width="600" height="400" rx="12"/>
      <circle cx="220" cy="200" r="120" fill="#fbcfe8" opacity="0.65"/>
      <circle cx="340" cy="220" r="110" fill="#c4b5fd" opacity="0.6"/>
      <circle cx="430" cy="180" r="95" fill="#bae6fd" opacity="0.6"/>
    </svg>
  ),
  pop: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#fb923c" width="600" height="400" rx="12"/>
      <rect x="50" y="80" width="240" height="48" rx="24" fill="#fff"/>
      <rect x="50" y="150" width="180" height="32" rx="16" fill="#fff" opacity="0.85"/>
      <circle cx="450" cy="210" r="95" fill="#a78bfa"/>
      <polygon points="450,135 461,162 490,162 467,179 477,206 450,189 423,206 433,179 410,162 439,162" fill="#facc15"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#dc2626" width="600" height="400" rx="12"/>
      <circle cx="460" cy="220" r="130" fill="#fbbf24"/>
      <rect x="40" y="90" width="290" height="60" rx="4" fill="#fff"/>
      <rect x="40" y="170" width="230" height="60" rx="4" fill="#fbbf24"/>
      <polygon points="90,310 101,335 128,335 106,351 115,377 90,361 65,377 74,351 52,335 79,335" fill="#fbbf24" stroke="#0f172a" strokeWidth="3"/>
    </svg>
  ),
  pivot: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#14532d" width="600" height="400" rx="12"/>
      <rect x="40" y="40" width="90" height="24" rx="3" fill="#fafaf9"/>
      <rect x="40" y="110" width="360" height="50" rx="3" fill="#fafaf9"/>
      <rect x="40" y="180" width="260" height="50" rx="3" fill="#fafaf9" opacity="0.75"/>
      <circle cx="470" cy="220" r="90" fill="#fafaf9" opacity="0.95"/>
    </svg>
  ),
  puffy_3d: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#f5f3ff" width="600" height="400" rx="12"/>
      <rect x="40" y="90" width="260" height="54" rx="27" fill="#c4b5fd"/>
      <rect x="40" y="168" width="180" height="36" rx="18" fill="#ddd6fe"/>
      <circle cx="450" cy="215" r="100" fill="#f9a8d4"/>
      <ellipse cx="415" cy="178" rx="32" ry="18" fill="#fce7f3" opacity="0.9"/>
      <ellipse cx="450" cy="330" rx="90" ry="14" fill="#e9d5ff" opacity="0.7"/>
      <circle cx="350" cy="300" r="26" fill="#a7f3d0"/>
      <circle cx="535" cy="115" r="18" fill="#fde68a"/>
    </svg>
  ),
  my_style: (
    <svg viewBox="0 0 600 400" className="w-[104px] shrink-0 rounded-lg block border border-stone-100">
      <rect fill="#faf5ff" width="600" height="400" rx="12"/>
      <rect x="50" y="100" width="210" height="200" rx="14" fill="#fff" stroke="#c4b5fd" strokeWidth="2.5" strokeDasharray="10 5"/>
      <rect x="340" y="100" width="210" height="200" rx="14" fill="#a78bfa" opacity="0.2" stroke="#7c3aed" strokeWidth="2.5"/>
      <path d="M280,200 L330,200" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round"/>
      <polygon points="323,190 345,200 323,210" fill="#7c3aed"/>
    </svg>
  ),
};
