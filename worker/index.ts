/**
 * Skill Market Creator Pro を Cloudflare Workers で配信するための Worker。
 *
 * 役割は2つ。
 *  1. dist/ の静的アセットを配信する（SPA）
 *  2. /api/gemini/* を Gemini API へ中継し、Secrets の GEMINI_API_KEY を付ける。
 *     ブラウザ側のバンドルにはキーが含まれない（vite.config.ts の VITE_GEMINI_PROXY=1 ビルド）
 *
 * アクセス制御は Cloudflare Access（メール許可リスト）を前段に置く。加えて Worker 側でも
 * Access が付ける JWT（Cf-Access-Jwt-Assertion）を検証する。Access の設定漏れや解除で
 * そのまま社外公開になる事故を防ぐため、REQUIRE_ACCESS_JWT=1 のときは JWT が無ければ
 * 静的アセットも含めて 403 を返す（fail closed）。ローカルの wrangler dev では .dev.vars で 0 にする。
 *
 * 費用の歯止めとして、KV で「メール別」「全体」の1日あたり呼び出し回数に上限を設ける。
 */

const GEMINI_ORIGIN = 'https://generativelanguage.googleapis.com';
const PROXY_PREFIX = '/api/gemini';
// SDK は {baseUrl}/v1beta/models/{model}:generateContent を叩く。中継はこの形だけ通す
const PROXY_PATH_RE = /^\/v1(?:beta|alpha)?\/models\/([^/:]+):(generateContent|streamGenerateContent)$/;

interface AccessClaims {
  email?: string;
  aud?: string | string[];
  exp?: number;
  iss?: string;
}

type AccessJwk = JsonWebKey & { kid?: string };

// Access の公開鍵（JWKS）はアイソレート内でキャッシュする。
// リクエスト固有の状態ではないのでモジュール変数で持ってよい。
let jwksCache: { teamDomain: string; fetchedAt: number; keys: AccessJwk[] } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const forbiddenHtml = (message: string): Response =>
  new Response(
    `<!doctype html><meta charset="utf-8"><title>403</title><body style="font-family:sans-serif;padding:2rem;color:#333"><h1>アクセスできません</h1><p>${message}</p></body>`,
    { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

const b64urlToBytes = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const getJwks = async (teamDomain: string): Promise<AccessJwk[]> => {
  const now = Date.now();
  if (jwksCache && jwksCache.teamDomain === teamDomain && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const data = (await res.json()) as { keys?: AccessJwk[] };
  const keys = data.keys ?? [];
  jwksCache = { teamDomain, fetchedAt: now, keys };
  return keys;
};

/** Access の JWT を検証し、正当ならクレームを返す。何か1つでも合わなければ null */
const verifyAccessJwt = async (token: string, teamDomain: string, aud: string): Promise<AccessClaims | null> => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h))) as { kid?: string; alg?: string };
    if (header.alg !== 'RS256' || !header.kid) return null;
    const jwk = (await getJwks(teamDomain)).find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))) as AccessClaims;
    const nowSec = Math.floor(Date.now() / 1000);
    if (!claims.exp || claims.exp < nowSec) return null;
    if (claims.iss !== `https://${teamDomain}`) return null;
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(aud)) return null;
    return claims;
  } catch {
    return null;
  }
};

/** 認証の結果。ok=false のときは返すべき Response を持つ */
type AuthResult = { ok: true; email: string } | { ok: false; response: Response };

/**
 * 期限付きの「一時公開モード」。勉強会などで一時的にログイン無しにするための逃げ道。
 * OPEN_UNTIL（ISO 8601、例 2026-09-30T23:59:59+09:00）より前なら JWT を求めない。
 * 期限を過ぎると自動で Access 必須に戻る。空・不正な値なら常に閉じる（fail closed）。
 * なお Access 側にもバイパスのポリシーが必要（README 参照）。ここは Worker 側の錠だけ。
 */
const isOpenPeriod = (env: Env): boolean => {
  const until = (env.OPEN_UNTIL ?? '').trim();
  if (!until) return false;
  const t = Date.parse(until);
  return Number.isFinite(t) && Date.now() < t;
};

const authenticate = async (request: Request, env: Env): Promise<AuthResult> => {
  if (env.REQUIRE_ACCESS_JWT !== '1') {
    // ローカル開発（wrangler dev）専用。本番の vars では必ず "1"
    return { ok: true, email: 'local-dev' };
  }
  if (isOpenPeriod(env)) {
    // 一時公開中は接続元 IP を利用者の識別子にして、回数上限だけ効かせる
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    return { ok: true, email: `ip:${ip}` };
  }
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    // Access が未設定のまま公開されないよう、設定が揃うまでは全部閉じる
    return { ok: false, response: forbiddenHtml('Cloudflare Access の設定（ACCESS_TEAM_DOMAIN / ACCESS_AUD）が未完了です。') };
  }
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return { ok: false, response: forbiddenHtml('Cloudflare Access 経由でアクセスしてください。') };
  const claims = await verifyAccessJwt(token, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
  if (!claims?.email) return { ok: false, response: forbiddenHtml('認証情報を確認できませんでした。ページを再読み込みしてください。') };
  return { ok: true, email: claims.email };
};

/** JST の日付キー（上限は日本時間の1日で区切る） */
const jstDateKey = (): string => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

type QuotaResult = { ok: true } | { ok: false; scope: 'user' | 'global' };

const takeQuota = async (env: Env, email: string): Promise<QuotaResult> => {
  const day = jstDateKey();
  const userKey = `quota:${day}:${email}`;
  const globalKey = `quota:${day}:_global`;
  const [u, g] = await Promise.all([env.KV.get(userKey), env.KV.get(globalKey)]);
  const userCount = Number(u ?? 0);
  const globalCount = Number(g ?? 0);
  if (userCount >= Number(env.DAILY_LIMIT_PER_USER)) return { ok: false, scope: 'user' };
  if (globalCount >= Number(env.DAILY_LIMIT_GLOBAL)) return { ok: false, scope: 'global' };
  // KV は結果整合なので厳密な上限にはならないが、費用の歯止めとしては十分
  await Promise.all([
    env.KV.put(userKey, String(userCount + 1), { expirationTtl: 2 * 86400 }),
    env.KV.put(globalKey, String(globalCount + 1), { expirationTtl: 2 * 86400 }),
  ]);
  return { ok: true };
};

const proxyGemini = async (request: Request, env: Env, email: string, subPath: string, search: string): Promise<Response> => {
  if (request.method !== 'POST') return json(405, { error: 'POST のみ受け付けます' });

  const m = PROXY_PATH_RE.exec(subPath);
  if (!m) return json(404, { error: '中継対象外のパスです' });
  const model = m[1];
  const allowed = env.ALLOWED_MODELS.split(',').map(s => s.trim()).filter(Boolean);
  if (!allowed.includes(model)) return json(403, { error: `モデル ${model} は許可されていません` });

  const quota = await takeQuota(env, email);
  if (!quota.ok) {
    return json(429, {
      error: quota.scope === 'user'
        ? '本日の利用上限に達しました。明日またお試しください。'
        : '本日の全体利用上限に達しました。明日またお試しください。',
    });
  }

  // 認証系・接続系のヘッダは落とし、本物のキーだけを付ける
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const apiClient = request.headers.get('x-goog-api-client');
  if (apiClient) headers.set('x-goog-api-client', apiClient);
  headers.set('x-goog-api-key', env.GEMINI_API_KEY);

  const started = Date.now();
  // 本文は読み切らずにそのまま流す（サイズが読めないため）
  const upstream = await fetch(`${GEMINI_ORIGIN}${subPath}${search}`, { method: 'POST', headers, body: request.body });

  console.log(JSON.stringify({
    event: 'gemini_proxy', email, model, method: m[2], status: upstream.status, ms: Date.now() - started,
    open: isOpenPeriod(env),
  }));

  const outHeaders = new Headers({ 'cache-control': 'no-store' });
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) outHeaders.set('content-type', upstreamType);
  return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    try {
      const auth = await authenticate(request, env);
      if (!auth.ok) return auth.response;

      if (url.pathname.startsWith(PROXY_PREFIX)) {
        return await proxyGemini(request, env, auth.email, url.pathname.slice(PROXY_PREFIX.length), url.search);
      }
      // 認証を通った人にだけ静的アセット（SPA）を返す
      return await env.ASSETS.fetch(request);
    } catch (err) {
      console.log(JSON.stringify({ event: 'worker_error', path: url.pathname, message: err instanceof Error ? err.message : String(err) }));
      return json(502, { error: '中継に失敗しました。しばらくしてから再度お試しください。' });
    }
  },
} satisfies ExportedHandler<Env>;
