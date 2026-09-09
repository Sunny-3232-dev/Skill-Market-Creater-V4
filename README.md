# Skill Market Creator Pro

スキルマーケット出品者向けのAIツール一式。出品アイデアの提案、出品ページ本文の生成、サムネイル用画像生成プロンプト、宣伝つぶやき、購入者アンケート（Googleフォーム用GASコード）、サービス紹介スライド用プロンプト、紙に印刷して配るチラシ用プロンプトを生成します。

元は Google AI Studio アプリ: https://ai.studio/apps/520ed401-1c8a-4329-8963-d7cc9dbf9c3f

## 技術構成

- Vite + React 19 + TypeScript
- Tailwind CSS v4（`@tailwindcss/vite` プラグイン。CDNは不使用）
- `@google/genai`（Gemini API）

## ローカルで動かす

前提: Node.js 20+

1. 依存関係をインストール: `npm install`
2. プロジェクト直下に `.env` を作成し、Gemini APIキーを設定:
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. 起動: `npm run dev`

## セキュリティ上の注意（重要）

`vite.config.ts` の `define` により、**APIキーはクライアントのJSバンドルに埋め込まれます**。
この構成はローカル開発・Google AI Studio 内での利用専用です。

- このままの構成で**認証なしの公開URLにデプロイしないこと**（キーが第三者に露出します）
- 公開する場合は下記「Cloudflare で配信する」の構成を使う（Worker がキーを持ち、Access で人を絞る）
- `.env` は `.gitignore` 済み。コミットしないこと

## 画面の案内（初回チュートリアル・動くマニュアル）

PJ090（oVice看板）から移した2つの仕組み。

- **初回チュートリアル** `components/guide/Tour.tsx` — 画面の上に暗い幕をかけ、実物の場所に穴を開けて順に指す。
  画面ごと（入力／一覧／仕上げ／サポート＋各メニュー）に `data-tour` 属性で対象を指定する。
  **自動では始めない**。ヘッダの「画面の案内（1分）」を押したときだけ（ハンズオンで参加者が毎回閉じる手間を無くすため）。見えていない項目は飛ばす。
- **動くマニュアル** `components/guide/AnimatedGuide.tsx` — 1枚の SVG の中で手順を14秒で見せ、下の歩の一覧を同期して光らせる。
  場面は `PasteGuide`（貼り方）と `SupportGuide`（サポートの使い方）。キーフレームは `index.css` の `pg-*` / `sg-*`
  （全要素が同じ周期、% が時刻。`@layer` の外に書く）。`prefers-reduced-motion` では最終コマで止める。
- **うまくいかないとき** `components/Troubleshoot.tsx` — 仕上げ・サポートの末尾に置くアコーディオン。

## Cloudflare で配信する（検証メンバー向け・APIキーを埋め込まない構成）

`worker/index.ts` と `wrangler.jsonc` が Cloudflare Workers 用の構成。ブラウザは同一オリジンの
`/api/gemini/*` に投げ、Worker が Secrets の `GEMINI_API_KEY` を付けて Gemini API へ中継する。
`VITE_GEMINI_PROXY=1` でビルドするとバンドルにキーは含まれない（`npm run build:cf`）。

守り方は二重にしてある。

- 前段: Cloudflare Access（メール許可リスト）。カスタムドメインのみで、`preview_urls` / `workers_dev` は無効
- Worker 側: Access の JWT（`Cf-Access-Jwt-Assertion`）を検証する。`REQUIRE_ACCESS_JWT=1` のとき、
  JWT が無い／`ACCESS_TEAM_DOMAIN`・`ACCESS_AUD` が未設定なら、静的アセットも含めて 403 を返す（fail closed）
- 費用の歯止め: KV で「メール別」「全体」の1日あたり呼び出し回数に上限（`DAILY_LIMIT_*`）。KV は結果整合なので同時呼び出し分は数え漏れることがある（厳密な上限ではなく歯止め）
- 中継するモデルは `ALLOWED_MODELS` に列挙したものだけ。`?model=` の切替候補もここに足す

### 初回セットアップ

1. `wrangler login`（済みなら不要）
2. `cp .dev.vars.example .dev.vars` して `GEMINI_API_KEY` を記入（ローカルの `wrangler dev` 用）
3. 本番の Secret を登録: `npx wrangler secret put GEMINI_API_KEY`（対話入力）
4. Cloudflare Zero Trust → Access → Applications で Self-hosted アプリを作る
   - Application domain: `skillmarket.sunconnect.jp`（`wrangler.jsonc` の `routes` と同じ）
   - Policy: Allow / Emails に検証メンバーのアドレスを列挙
   - 作成後、Overview の **Application Audience (AUD) Tag** を控える
5. `wrangler.jsonc` の `vars` に `ACCESS_TEAM_DOMAIN`（例 `xxxx.cloudflareaccess.com`）と `ACCESS_AUD` を記入
6. `npm run deploy`

### 一時的にログイン無しで公開する（勉強会など）

錠は「Access（前段）」と「Worker の JWT 検証」の2つあるので、開けるときは両方、閉じるときも両方を触る。

1. `wrangler.jsonc` の `vars.OPEN_UNTIL` に期限（ISO 8601、例 `2026-09-30T23:59:59+09:00`）を入れて `npm run deploy`
   - 期限内は Worker が JWT を求めず、利用回数は接続元 IP ごとに数える（`DAILY_LIMIT_PER_USER` がそのまま効く）
   - 期限を過ぎると Worker 側は自動で Access 必須に戻る
2. Cloudflare Zero Trust → アクセス制御 → アプリケーション → Skill Market Creator → ポリシーを追加
   - 名前「一時公開」／アクション「バイパス」／含める「全員」
   - これで Access のログイン画面が出なくなる（Worker 側は 1 の期限で守られている）

閉じるときは、2 のポリシーを削除し、`OPEN_UNTIL` を `""` に戻して `npm run deploy`。
ポリシーを消し忘れても、期限を過ぎれば Worker が 403 を返すので中身は見えない。

### 日常

| コマンド | 内容 |
| --- | --- |
| `npm run dev:cf` | プロキシビルド → `wrangler dev`（http://localhost:8787。Access なし、`.dev.vars` のキーで中継） |
| `npm run deploy` | プロキシビルド → デプロイ |
| `npm run cf:types` | `wrangler.jsonc` を変えたら Env 型を再生成 |
| `npx wrangler tail` | 中継ログ（`gemini_proxy` にメール・モデル・所要時間が JSON で出る） |
| `npx wrangler kv key list --namespace-id <KVのid> --remote --prefix quota:` | 本番の利用回数カウンタ（`--remote` を付けないとローカル模擬ストアを見てしまう） |

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバ起動 |
| `npm run lint` | 型チェック（アプリ＋Worker） |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run preview` | ビルド成果物のプレビュー |

## ハンズオン資料（配布用ページ）

勉強会で画面共有する資料を `public/handson/` に置いている。ビルドすると同じパスで配信されるので、当日はURLを配るだけでよい。

| パス | 内容 |
| --- | --- |
| `/handson/publish.html` | スキルマーケットを出そう（はじめての出品まで・全18枚） |
| `/handson/polish.html` | スキルマーケットを磨こう（出したあとの3つの型・全18枚） |

どちらも単体のHTML1枚（外部依存なし）。←→キー・クリック・スワイプでめくる。
16:9のステージを画面にフィットさせるので、ウルトラワイドでも見切れない。
ツール内の同じ内容の読み物は `components/learn/deckSlides.ts`（STEP1/STEP2の各画面に埋め込み）。
