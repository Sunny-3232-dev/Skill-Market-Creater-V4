import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // 注意: ここで定義したキーはクライアントバンドルに埋め込まれる。
      // 開発用途専用。公開デプロイ時はキーを埋め込まず、サーバ側プロキシか
      // Cloudflare Access 等の認証で保護された環境でのみ使用すること。
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    }
  };
});
