/**
 * Google AI Studio（server-side Gemini API 方式）で配信するための Node サーバー。
 *
 * AI Studio は 2026-05-14 以降、Gemini のキーをブラウザに渡さず、Secrets に入れたキーを
 * この Node ランタイムの環境変数（GEMINI_API_KEY）として注入する方式が標準になった。
 * 役割は Cloudflare 版の worker/index.ts と同じ2つ。
 *  1. dist/ の静的アセットを配信する（SPA）
 *  2. /api/gemini/* を Gemini API へ中継し、環境変数のキーを付ける
 * フロントは VITE_GEMINI_PROXY=1（既定）でビルドされているので、同一オリジンの /api/gemini に投げてくる。
 *
 * 認証はかけていない（AI Studio の共有リンクを開ける人が使える＝作者課金。以前の特例と同じ体験）。
 * 費用の歯止めとして、1日あたりの呼び出し回数にプロセス内の上限を置く。
 */
import express from 'express';
import path from 'node:path';
import { Readable } from 'node:stream';

// ローカル開発では .env（gitignore 済み）からキーを読む。AI Studio では環境変数で注入されるので不要
if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // .env が無ければそのまま。キー未設定のエラーは中継時に返す
  }
}

const GEMINI_ORIGIN = 'https://generativelanguage.googleapis.com';
const PROXY_PREFIX = '/api/gemini';
// SDK は {baseUrl}/v1beta/models/{model}:generateContent を叩く。中継はこの形だけ通す
const PROXY_PATH_RE = /^\/v1(?:beta|alpha)?\/models\/([^/:]+):(generateContent|streamGenerateContent)$/;
// wrangler.jsonc の ALLOWED_MODELS と揃える。?model= で切り替えて検証する候補もここに並べる
const DEFAULT_ALLOWED_MODELS = 'gemini-3.5-flash,gemini-3.6-flash,gemini-3.7-flash,gemini-3.8-flash,gemini-3.1-pro-preview';
const allowedModels = (process.env.ALLOWED_MODELS ?? DEFAULT_ALLOWED_MODELS).split(',').map(s => s.trim()).filter(Boolean);
const dailyLimitGlobal = Number(process.env.DAILY_LIMIT_GLOBAL ?? 1000);

/** JST の日付キー（上限は日本時間の1日で区切る） */
const jstDateKey = (): string => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
// プロセス内カウンタ。再起動で消えるが、暴走時の歯止めとしては十分
let quota = { day: jstDateKey(), count: 0 };
const takeQuota = (): boolean => {
  const day = jstDateKey();
  if (quota.day !== day) quota = { day, count: 0 };
  if (quota.count >= dailyLimitGlobal) return false;
  quota.count += 1;
  return true;
};

const apiKey = (): string => process.env.GEMINI_API_KEY || process.env.API_KEY || '';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  app.disable('x-powered-by');

  // Gemini 中継。本文はそのまま Buffer で受けて流す（SDK の JSON をパースし直さない）
  app.use(PROXY_PREFIX, express.raw({ type: () => true, limit: '20mb' }), async (req, res) => {
    res.setHeader('cache-control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST のみ受け付けます' });

    const m = PROXY_PATH_RE.exec(req.path);
    if (!m) return res.status(404).json({ error: '中継対象外のパスです' });
    const model = m[1];
    if (!allowedModels.includes(model)) return res.status(403).json({ error: `モデル ${model} は許可されていません` });

    const key = apiKey();
    if (!key) {
      return res.status(500).json({ error: 'サーバーに GEMINI_API_KEY が設定されていません。AI Studio の Settings → Secrets を確認してください。' });
    }
    if (!takeQuota()) return res.status(429).json({ error: '本日の全体利用上限に達しました。明日またお試しください。' });

    // 認証系・接続系のヘッダは落とし、本物のキーだけを付ける
    const headers = new Headers();
    const contentType = req.headers['content-type'];
    if (typeof contentType === 'string') headers.set('content-type', contentType);
    const apiClient = req.headers['x-goog-api-client'];
    if (typeof apiClient === 'string') headers.set('x-goog-api-client', apiClient);
    headers.set('x-goog-api-key', key);
    headers.set('user-agent', 'aistudio-build');

    const started = Date.now();
    try {
      // DOM 側の BodyInit 型と Node の Buffer 型が噛み合わないので型だけ合わせる（実体はそのまま渡せる）
      const body = Buffer.isBuffer(req.body) ? (req.body as unknown as BodyInit) : undefined;
      const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      const upstream = await fetch(`${GEMINI_ORIGIN}${req.path}${search}`, { method: 'POST', headers, body });
      console.log(JSON.stringify({ event: 'gemini_proxy', model, method: m[2], status: upstream.status, ms: Date.now() - started }));

      res.status(upstream.status);
      const upstreamType = upstream.headers.get('content-type');
      if (upstreamType) res.setHeader('content-type', upstreamType);
      if (!upstream.body) return res.end();
      Readable.fromWeb(upstream.body as never).pipe(res);
    } catch (err) {
      console.log(JSON.stringify({ event: 'proxy_error', model, message: err instanceof Error ? err.message : String(err) }));
      res.status(502).json({ error: '中継に失敗しました。しばらくしてから再度お試しください。' });
    }
  });

  if (isProduction) {
    // npm run build で作った dist/ を配信。SPA なので未知のパスは index.html
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: 'index.html' }));
    app.use((req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(404).end();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // 開発時は Vite をミドルウェアとして同居させる（AI Studio のプレビューもこの経路）
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(JSON.stringify({
      event: 'listening', port: PORT, mode: isProduction ? 'production' : 'development',
      hasKey: Boolean(apiKey()), allowedModels, dailyLimitGlobal,
    }));
  });
}

startServer();
