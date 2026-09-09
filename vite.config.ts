import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 既定は中継モード: ブラウザは同一オリジンの /api/gemini に投げ、キーは server.ts（AI Studio）か
  // worker/index.ts（Cloudflare）だけが持つ。バンドルにキーは絶対に埋め込まない。
  // VITE_GEMINI_PROXY=0 を明示したときだけ、.env のキーを埋め込む旧来の直接呼び出しになる（ローカル検証専用）
  const proxyMode = (process.env.VITE_GEMINI_PROXY ?? env.VITE_GEMINI_PROXY ?? '1') !== '0';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_GEMINI_PROXY': JSON.stringify(proxyMode ? '1' : '0'),
      // 注意: ここで定義したキーはクライアントバンドルに埋め込まれる（直接呼び出しモードのみ）
      'process.env.API_KEY': JSON.stringify(proxyMode ? '' : (env.API_KEY || '')),
      'process.env.GEMINI_API_KEY': JSON.stringify(proxyMode ? '' : (env.GEMINI_API_KEY || ''))
    },
    server: {
      port: process.env.PORT ? Number(process.env.PORT) : 3000,
      // AI Studio は DISABLE_HMR で HMR を止める（エージェント編集中のちらつき防止）。変更しないこと
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
