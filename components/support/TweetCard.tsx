import React, { useMemo, useState } from 'react';

export interface TweetPost {
  text: string;
  used: boolean;
}

interface TweetCardProps {
  post: TweetPost;
  index: number;
  onChange: (index: number, next: TweetPost) => void;
}

// リベシティのつぶやきはURL行を除く本文が125字目安（プロンプト側の制約と同じ基準）
const BODY_LIMIT = 125;

const bodyLength = (text: string): number =>
  text
    .split('\n')
    .filter(line => !line.includes('http'))
    .join('')
    .length;

const TweetCard: React.FC<TweetCardProps> = ({ post, index, onChange }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(post.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetUrl = `https://libecity.com/tweet/all?create=${encodeURIComponent(post.text)}`;
  const len = useMemo(() => bodyLength(post.text), [post.text]);
  const over = len > BODY_LIMIT;
  const rows = Math.min(10, Math.max(4, post.text.split('\n').length + 1));

  return (
    <div className={`card p-5 md:p-6 w-full transition-opacity ${post.used ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap justify-between items-center gap-y-2 mb-4 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400">
            {String(index + 1).padStart(2, '0')}
          </span>
          {post.used && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">使用済み</span>
          )}
          <span className={`text-[11px] font-medium ${over ? 'text-brand-600 font-semibold' : 'text-stone-400'}`}>
            本文{len}字{over ? `（${BODY_LIMIT}字超・要調整）` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(index, { ...post, used: !post.used })}
            className="btn-quiet px-3 py-2 text-xs"
          >
            {post.used ? '未使用に戻す' : '使用済みにする'}
          </button>
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
            className="btn-secondary px-4 py-2 text-xs">
            つぶやく
          </a>
          <button onClick={handleCopy}
            className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
              copied ? 'bg-brand-50 text-brand-600' : 'bg-stone-900 text-white hover:bg-stone-700'
            }`}>
            {copied ? 'コピーしました' : 'コピー'}
          </button>
        </div>
      </div>
      <textarea
        value={post.text}
        rows={rows}
        onChange={(e) => onChange(index, { ...post, text: e.target.value })}
        aria-label={`つぶやき ${index + 1} 本文（編集可能）`}
        className="field w-full p-4 text-sm md:text-base text-stone-700 leading-relaxed resize-y bg-stone-50"
      />
      <p className="text-[11px] text-stone-400 mt-1.5">そのまま編集できます。編集内容は自動保存されます。</p>
    </div>
  );
};

export default TweetCard;
