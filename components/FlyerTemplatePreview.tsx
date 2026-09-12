import React from 'react';
import { FlyerContent, FlyerTemplateId } from '../types';
import { FLYER_TEMPLATES, FLYER_PAPER, flyerAngleForTemplate } from '../services/geminiService';

/**
 * 紙面の型のプレビュー。B5（182×257）を mm 単位の viewBox にして、段Aが決めた主色・差し色と実際の見出し文で
 * ワイヤーフレームを描く。静止画のサンプルではなく「自分のチラシがこの型だとどう組まれるか」を見せるためのもの。
 * 小さい文字（カード本文・添え書き）は読めない大きさになるので、文字ではなく棒で表す。
 */

const W = FLYER_PAPER.widthMm;   // 182
const H = FLYER_PAPER.heightMm;  // 257
const M = FLYER_PAPER.marginMm;  // 12
const CW = W - M * 2;            // 158
const CH = H - M * 2;            // 233
const INK = '#1f2937';
const SUB = '#57534e';

// 見出しを n 文字以内の行に折る。行数は必要最小限にし、各行の長さをそろえる（最後の行が1文字だけ、を避ける）。
// 「52名」「12年」のような半角英数字のかたまりは途中で切らない
const wrap = (text: string, n: number, maxLines: number): string[] => {
  const units = text.match(/[0-9A-Za-z,.]+|./g) ?? [];
  const total = units.reduce((a, u) => a + u.length, 0);
  const lineCount = Math.min(maxLines, Math.max(1, Math.ceil(total / n)));
  const target = Math.ceil(total / lineCount);
  const lines: string[] = [];
  let cur = '';
  for (const u of units) {
    if (cur.length > 0 && cur.length + u.length > target && lines.length < lineCount - 1) {
      lines.push(cur);
      cur = '';
    }
    cur += u;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
};

// 1行を強調語で区切り、強調語だけ差し色の tspan にする
const emphasize = (line: string, words: string[], accent: string, base: string): React.ReactNode[] => {
  const targets = words.filter(w => w && line.includes(w));
  if (targets.length === 0) return [<tspan key="0" fill={base}>{line}</tspan>];
  const re = new RegExp(`(${targets.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return line.split(re).filter(Boolean).map((part, i) => (
    <tspan key={i} fill={targets.includes(part) ? accent : base}>{part}</tspan>
  ));
};

// 主役ビジュアルの代わり。提供者本人なら人物のシルエット、それ以外は絵の枠
const Visual: React.FC<{ x: number; y: number; w: number; h: number; person: boolean; color: string; rounded?: number }> = ({ x, y, w, h, person, color, rounded = 4 }) => {
  if (!person) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={rounded} fill={color} fillOpacity={0.16} />
        <circle cx={x + w * 0.7} cy={y + h * 0.3} r={Math.min(w, h) * 0.08} fill={color} fillOpacity={0.5} />
        <path d={`M${x + w * 0.1} ${y + h * 0.85} L${x + w * 0.38} ${y + h * 0.5} L${x + w * 0.55} ${y + h * 0.7} L${x + w * 0.68} ${y + h * 0.58} L${x + w * 0.9} ${y + h * 0.85} Z`} fill={color} fillOpacity={0.35} />
      </g>
    );
  }
  const cx = x + w / 2;
  const headR = Math.min(w, h) * 0.22;
  const headY = y + h * 0.38;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rounded} fill={color} fillOpacity={0.12} />
      <path d={`M${x + w * 0.08} ${y + h} C${x + w * 0.12} ${headY + headR * 1.4}, ${x + w * 0.88} ${headY + headR * 1.4}, ${x + w * 0.92} ${y + h} Z`} fill={color} fillOpacity={0.55} />
      <circle cx={cx} cy={headY} r={headR} fill="#fde7d6" stroke={color} strokeOpacity={0.6} strokeWidth={0.8} />
      <path d={`M${cx - headR} ${headY - headR * 0.1} A${headR} ${headR} 0 0 1 ${cx + headR} ${headY - headR * 0.1} L${cx + headR * 0.9} ${headY - headR * 0.55} Q${cx} ${headY - headR * 1.25} ${cx - headR * 0.9} ${headY - headR * 0.55} Z`} fill={color} fillOpacity={0.7} />
    </g>
  );
};

// 3カード。full なら題＋本文の棒、そうでなければ題だけ
const Cards: React.FC<{ y: number; h: number; titles: string[]; color: string; full: boolean }> = ({ y, h, titles, color, full }) => {
  const gap = 5;
  const cw = (CW - gap * 2) / 3;
  return (
    <g>
      {titles.slice(0, 3).map((t, i) => {
        const x = M + i * (cw + gap);
        const iconR = Math.min(cw * 0.16, h * 0.22);
        return (
          <g key={i}>
            <rect x={x} y={y} width={cw} height={h} rx={3} fill="#fff" stroke={color} strokeOpacity={0.5} strokeWidth={0.7} />
            <circle cx={x + cw / 2} cy={y + iconR + 3} r={iconR} fill={color} fillOpacity={0.18} />
            <text x={x + cw / 2} y={y + iconR * 2 + 10} fontSize={4.6} fontWeight={700} fill={INK} textAnchor="middle">{t.slice(0, 9)}</text>
            {full && (
              <>
                <rect x={x + 5} y={y + iconR * 2 + 14} width={cw - 10} height={2.2} rx={1.1} fill={SUB} fillOpacity={0.45} />
                <rect x={x + 5} y={y + iconR * 2 + 18.5} width={(cw - 10) * 0.7} height={2.2} rx={1.1} fill={SUB} fillOpacity={0.45} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};

// チェック付きの行
const CheckRows: React.FC<{ y: number; rowH: number; items: string[]; color: string; accent: string; fontSize?: number }> = ({ y, rowH, items, color, accent, fontSize = 5 }) => (
  <g>
    {items.slice(0, 3).map((t, i) => {
      const ry = y + i * (rowH + 2);
      return (
        <g key={i}>
          <rect x={M} y={ry} width={CW} height={rowH} rx={2} fill={color} fillOpacity={0.08} />
          <circle cx={M + rowH / 2 + 1} cy={ry + rowH / 2} r={rowH * 0.32} fill={accent} />
          <path d={`M${M + rowH / 2 - 1.2} ${ry + rowH / 2} l1.4 1.4 l2.6 -2.8`} stroke="#fff" strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <text x={M + rowH + 4} y={ry + rowH / 2 + fontSize * 0.36} fontSize={fontSize} fontWeight={700} fill={INK}>{t}</text>
        </g>
      );
    })}
  </g>
);

// 偽のQR（読めない模様。本物はChatGPTのコード実行で重ねる）
const FakeQr: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const cells = 21;
  const c = s / cells;
  const finder = (fx: number, fy: number) => (
    <g>
      <rect x={x + fx * c} y={y + fy * c} width={c * 7} height={c * 7} fill="#111" />
      <rect x={x + (fx + 1) * c} y={y + (fy + 1) * c} width={c * 5} height={c * 5} fill="#fff" />
      <rect x={x + (fx + 2) * c} y={y + (fy + 2) * c} width={c * 3} height={c * 3} fill="#111" />
    </g>
  );
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    const inFinder = (i < 8 && j < 8) || (i < 8 && j >= cells - 8) || (i >= cells - 8 && j < 8);
    if (!inFinder && ((i * 7 + j * 13 + i * j) % 5 < 2)) dots.push(<rect key={`${i}-${j}`} x={x + j * c} y={y + i * c} width={c} height={c} fill="#111" />);
  }
  return <g>{finder(0, 0)}{finder(cells - 7, 0)}{finder(0, cells - 7)}{dots}</g>;
};

export const FlyerTemplatePreview: React.FC<{ content: FlyerContent; template: FlyerTemplateId; className?: string }> = ({ content, template, className = '' }) => {
  const { design, copy } = content;
  const dom = design.dominantColor.hex;
  const acc = design.accentColor.hex;
  const person = design.heroVisual === 'provider_portrait';
  const angle = flyerAngleForTemplate(content, template);
  const tpl = FLYER_TEMPLATES[template];
  const b = tpl.bands;
  const mm = (pct: number) => CH * pct / 100;
  const titles = copy.cards.map(c => c.title);
  const price = copy.cta.price;
  const bigN = copy.bigNumber;

  // 帯の位置（上から）。ラベル → 5mm → 見出し帯 → 7mm → 本文帯 → 残り（つなぎの1行）→ 締めの帯
  const labelH = mm(b.label);
  const heroH = mm(b.hero);
  const bodyH = mm(b.body);
  const ctaH = mm(b.cta);
  const yLabel = M;
  const yHero = b.label > 0 ? yLabel + labelH + 5 : M;
  const yBody = yHero + heroH + 7;
  const yCta = H - M - ctaH;
  const yBridge = (yBody + bodyH + yCta) / 2;

  const pill = (x: number, y: number, white = false) => {
    const w = Math.min(CW * 0.7, copy.audienceLabel.length * 4.4 + 8);
    return (
      <g>
        <rect x={x} y={y} width={w} height={9} rx={4.5} fill={white ? '#fff' : 'none'} stroke={dom} strokeWidth={0.7} />
        <text x={x + w / 2} y={y + 6.3} fontSize={4.2} fontWeight={700} fill={dom} textAnchor="middle">{copy.audienceLabel}</text>
      </g>
    );
  };

  const headline = (x: number, y: number, size: number, perLine: number, maxLines: number, base = INK) =>
    wrap(angle.headline, perLine, maxLines).map((line, i) => (
      <text key={i} x={x} y={y + i * size * 1.15} fontSize={size} fontWeight={800} textAnchor="start">
        {emphasize(line, angle.emphasis, acc, base)}
      </text>
    ));

  const cta = (priceSize: number) => (
    <g>
      <rect x={M} y={yCta} width={CW} height={ctaH} fill={dom} />
      <text x={M + 6} y={yCta + 11} fontSize={5.5} fontWeight={700} fill="#fff">{copy.cta.firstStep}</text>
      {price && <text x={M + 6} y={yCta + 11 + priceSize * 1.05} fontSize={priceSize} fontWeight={900} fill="#fff">{price}</text>}
      {copy.cta.note && <text x={M + 6} y={yCta + ctaH - 5} fontSize={3.4} fill="#fff" fillOpacity={0.9}>{copy.cta.note}</text>}
      {(() => {
        const s = Math.min(FLYER_PAPER.qrMm, ctaH - 10);
        const qx = M + CW - s - 5;
        const qy = yCta + (ctaH - s - 5) / 2;
        return (
          <g>
            <rect x={qx - 1.5} y={qy - 1.5} width={s + 3} height={s + 3} fill="#fff" />
            <FakeQr x={qx} y={qy} s={s} />
            <text x={qx + s / 2} y={qy + s + 4.2} fontSize={3.2} fill="#fff" textAnchor="middle">詳しくはこちら</text>
          </g>
        );
      })()}
    </g>
  );

  const bridge = copy.reassurance && (
    <text x={W / 2} y={yBridge + 1.5} fontSize={4} fill={SUB} textAnchor="middle">{copy.reassurance}</text>
  );

  // 丸バッジ。上段の文字は円の幅（直径の85%）に収まるよう、文字数に応じて小さくする
  const badge = (cx: number, cy: number, r: number, top: string, bottom: string, fill: string) => {
    const topText = top.slice(0, 10);
    const topSize = Math.min(r * 0.26, (r * 1.7) / Math.max(1, topText.length));
    const bottomSize = Math.min(r * 0.42, (r * 1.7) / Math.max(1, bottom.length) * 1.6);
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} />
        <text x={cx} y={cy - r * 0.12} fontSize={topSize} fontWeight={700} fill="#fff" textAnchor="middle">{topText}</text>
        <text x={cx} y={cy + r * 0.42} fontSize={bottomSize} fontWeight={900} fill="#fff" textAnchor="middle">{bottom}</text>
      </g>
    );
  };

  let body: React.ReactNode = null;
  switch (template) {
    case 'classic': {
      const vw = CW * 0.4;
      const vx = M + CW - vw;
      const badgeText = bigN ? [bigN.label, bigN.value] : (price ? [copy.cta.firstStep, price] : null);
      body = (
        <g>
          {pill(M, yLabel)}
          <Visual x={vx} y={yHero} w={vw} h={heroH} person={person} color={dom} />
          {headline(M, yHero + 14, 11.5, 7, 3)}
          <text x={M} y={yHero + heroH - 6} fontSize={5} fill={SUB}>{angle.subCopy.slice(0, 18)}</text>
          {badgeText && design.devices.includes('badge') && badge(vx + 2, yHero + heroH - 12, 13, badgeText[0], badgeText[1], acc)}
          <text x={M} y={yBody + 5} fontSize={4.8} fontWeight={700} fill={INK}>このサービスでできること</text>
          <Cards y={yBody + 9} h={bodyH - 9} titles={titles} color={dom} full />
          {bridge}
          {cta(12)}
        </g>
      );
      break;
    }
    case 'checklist': {
      const vw = CW * 0.35;
      const vx = M + CW - vw;
      const rowH = 10;
      const y2 = yBody + 8 + 3 * (rowH + 2) + 8;
      body = (
        <g>
          {pill(M, yLabel)}
          <Visual x={vx} y={yHero} w={vw} h={heroH} person={person} color={dom} />
          {headline(M, yHero + 14, 11, 7, 3)}
          <text x={M} y={yHero + heroH - 5} fontSize={5} fill={SUB}>{angle.subCopy.slice(0, 18)}</text>
          <text x={M} y={yBody + 5} fontSize={4.8} fontWeight={700} fill={INK}>こんなことで困っていませんか</text>
          <CheckRows y={yBody + 8} rowH={rowH} items={copy.problems} color={dom} accent={acc} />
          <path d={`M${W / 2 - 5} ${y2 - 7} L${W / 2 + 5} ${y2 - 7} L${W / 2} ${y2 - 2} Z`} fill={acc} />
          <text x={M} y={y2 + 4} fontSize={4.8} fontWeight={700} fill={INK}>それ、解決できます</text>
          <Cards y={y2 + 7} h={Math.max(18, yBody + bodyH - (y2 + 7))} titles={titles} color={dom} full={false} />
          {bridge}
          {cta(12)}
        </g>
      );
      break;
    }
    case 'number': {
      const vw = CW * 0.3;
      const vx = M + CW - vw;
      const lines = wrap(angle.headline, 7, 3);
      const numY = yHero + 11 + lines.length * 9.5 * 1.15 + 13;
      body = (
        <g>
          {pill(M, yLabel)}
          <Visual x={vx} y={yHero} w={vw} h={heroH * 0.62} person={person} color={dom} />
          {headline(M, yHero + 11, 9.5, 7, 3)}
          <text x={M} y={numY} fontSize={19} fontWeight={900} fill={dom}>{bigN?.value ?? ''}</text>
          <text x={M + (bigN?.value.length ?? 0) * 13 + 3} y={numY} fontSize={4} fill={SUB}>{bigN?.label ?? ''}</text>
          <text x={M} y={yHero + heroH - 4} fontSize={4.8} fill={SUB}>{angle.subCopy.slice(0, 20)}</text>
          <text x={M} y={yBody + 5} fontSize={4.8} fontWeight={700} fill={INK}>なぜ任せられるのか</text>
          <CheckRows y={yBody + 8} rowH={8.5} items={copy.trustLines.length ? copy.trustLines : titles} color={dom} accent={acc} fontSize={4.4} />
          <Cards y={yBody + 8 + 3 * 10.5 + 4} h={Math.max(16, yBody + bodyH - (yBody + 8 + 3 * 10.5 + 4))} titles={titles} color={dom} full={false} />
          {bridge}
          {cta(12)}
        </g>
      );
      break;
    }
    case 'visual': {
      const badgeText = price ? [copy.cta.firstStep, price] : (bigN ? [bigN.label, bigN.value] : null);
      const lines = wrap(angle.headline, 8, 3);
      const textTop = yHero + heroH - 10 - lines.length * 11.5;
      body = (
        <g>
          <Visual x={M} y={yHero} w={CW} h={heroH} person={person} color={dom} rounded={3} />
          <rect x={M} y={textTop - 6} width={CW} height={heroH - (textTop - 6 - yHero)} rx={3} fill="#000" fillOpacity={0.28} />
          {pill(M + 4, yHero + 4, true)}
          {headline(M + 5, textTop + 8, 11.5, 8, 3, '#fff')}
          <text x={M + 5} y={yHero + heroH - 4} fontSize={4.8} fill="#fff">{angle.subCopy.slice(0, 20)}</text>
          {badgeText && design.devices.includes('badge') && badge(M + CW - 16, yHero + heroH - 22, 13, badgeText[0], badgeText[1], acc)}
          <text x={M} y={yBody + 5} fontSize={4.8} fontWeight={700} fill={INK}>このサービスでできること</text>
          <Cards y={yBody + 9} h={bodyH - 9} titles={titles} color={dom} full />
          {bridge}
          {cta(12)}
        </g>
      );
      break;
    }
    case 'offer': {
      const r = W * 0.12;
      const bx = M + CW - r - 4;
      const by = yHero + r + 4;
      body = (
        <g>
          {pill(M, yLabel)}
          <Visual x={M + CW * 0.66} y={yHero + heroH * 0.35} w={CW * 0.34} h={heroH * 0.65} person={person} color={dom} />
          {headline(M, yHero + 14, 10.5, 6, 3)}
          <text x={M} y={yHero + heroH - 4} fontSize={4.8} fill={SUB}>{angle.subCopy.slice(0, 16)}</text>
          {badge(bx, by, r, copy.cta.firstStep, price, acc)}
          <text x={M} y={yBody + 5} fontSize={4.8} fontWeight={700} fill={INK}>このサービスでできること</text>
          <Cards y={yBody + 8} h={Math.max(18, bodyH - 20)} titles={titles} color={dom} full={false} />
          {copy.reassurance && <text x={W / 2} y={yBody + bodyH - 2} fontSize={4.6} fontWeight={700} fill={SUB} textAnchor="middle">{copy.reassurance}</text>}
          {cta(16)}
        </g>
      );
      break;
    }
  }

  return (
    <div className={`overflow-hidden bg-stone-100 ${className}`} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="block w-full h-auto">
        <rect width={W} height={H} fill="#fff" />
        {body}
      </svg>
    </div>
  );
};
