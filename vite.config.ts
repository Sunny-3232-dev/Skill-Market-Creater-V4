import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // VITE_GEMINI_PROXY=1 のビルドは Cloudflare Worker 経由で Gemini を呼ぶ。
  // このときキーは絶対に埋め込まない（Worker の Secrets だけが持つ）。
  const proxyMode = (process.env.VITE_GEMINI_PROXY ?? env.VITE_GEMINI_PROXY) === '1';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // 注意: ここで定義したキーはクライアントバンドルに埋め込まれる。
      // 直接呼び出しはローカル開発・Google AI Studio 専用。公開デプロイは必ずプロキシモードでビルドし、
      // Cloudflare Access 等の認証で保護された環境に置くこと。
      'process.env.API_KEY': JSON.stringify(proxyMode ? '' : (env.API_KEY || '')),
      'process.env.GEMINI_API_KEY': JSON.stringify(proxyMode ? '' : (env.GEMINI_API_KEY || ''))
    }
  };
});
