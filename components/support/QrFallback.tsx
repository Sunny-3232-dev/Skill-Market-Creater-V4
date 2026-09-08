import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface QrTarget { label: string; url: string }

// ChatGPT が作ったQRが読めなかったときの保険。ブラウザの中だけで本物のQRを作り、PNG で落とせる。
// URL はどこにも送らない。
const QrFallback: React.FC<{ targets: QrTarget[] }> = ({ targets }) => {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    Promise.all(targets.map(t => QRCode.toDataURL(t.url, { errorCorrectionLevel: 'M', margin: 4, width: 512 }).then(d => [t.url, d] as const)))
      .then(pairs => { if (alive) setImages(Object.fromEntries(pairs)); })
      .catch(() => { /* 生成できなければ何も出さない */ });
    return () => { alive = false; };
  }, [targets.map(t => t.url).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (targets.length === 0) {
    return <p className="text-xs text-stone-500">URLを登録したサービスを選ぶと、ここでQRコードを作れます。</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500 leading-relaxed">
        ChatGPT が入れたQRが読み取れなかったときは、ここで作ったQR画像を使ってください。このQRはこのブラウザの中で作っていて、どこにも送っていません。
        使い方は2つ。①チラシ画像とこのQR画像を ChatGPT にアップロードして「右下の白い枠にこのQR画像をそのまま重ねて。縮小以外の加工はしない」と頼む
        ②Canva などで自分で重ねる。QRの周りの白い余白は消さないでください（読み取りに必要です）。
      </p>
      <div className="flex flex-wrap gap-3">
        {targets.map(t => (
          <div key={t.url} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
            {images[t.url] ? (
              <img src={images[t.url]} alt={`${t.label} のQRコード`} width={96} height={96} className="w-24 h-24 rounded-md" />
            ) : (
              <div className="w-24 h-24 rounded-md bg-stone-100" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate max-w-[14rem]">{t.label}</p>
              <p className="text-[11px] text-stone-400 truncate max-w-[14rem]">{t.url}</p>
              {images[t.url] && (
                <a href={images[t.url]} download={`qr-${t.label.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}.png`} className="btn-secondary inline-flex mt-2 px-3 py-1.5 text-[11px]">
                  PNGをダウンロード
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QrFallback;
