# Skill Market Creator Pro

スキルマーケット出品者向けのAIツール一式。出品アイデアの提案、出品ページ本文の生成、サムネイル用画像生成プロンプト、宣伝つぶやき、購入者アンケート（Googleフォーム用GASコード）、サービス紹介スライド用プロンプトを生成します。

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
- 公開する場合は、サーバ側プロキシ（Cloudflare Workers 等）でキーを秘匿するか、
  Cloudflare Access 等の認証で保護された環境に限定すること
- `.env` は `.gitignore` 済み。コミットしないこと

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバ起動 |
| `npm run lint` | 型チェック（`tsc --noEmit`） |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run preview` | ビルド成果物のプレビュー |
