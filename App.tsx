import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToolType } from './types';
import Hub from './components/Hub';
import CreatorTool from './components/CreatorTool';
import SupportHub from './components/SupportHub';

const getEnvApiKey = (): string => {
  try {
    return process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  } catch {
    return "";
  }
};

interface ToastState {
  message: string;
  tone: 'error' | 'info';
}

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.TOP);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ツール切り替え時にスクロール位置をトップにリセット
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTool]);

  const notify = useCallback((message: string, tone: ToastState['tone'] = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // Google AI Studio 環境ではセッションキーが自動で使われる。
  // ローカル開発では .env の API_KEY / GEMINI_API_KEY を参照する。
  const ensureKeySet = useCallback(async (): Promise<boolean> => {
    const aistudio = (window as any).aistudio;
    if (aistudio || getEnvApiKey()) return true;
    notify("APIキーが設定されていません。.env に GEMINI_API_KEY を設定してください。", 'error');
    return false;
  }, [notify]);

  const handleApiError = useCallback((error: any) => {
    console.error(error);
    const msg = error?.message || "";
    if (msg.includes("Requested entity was not found")) {
      notify("APIのセッションが無効になった可能性があります。ページを再読み込みしてください。", 'error');
    } else {
      notify("エラーが発生しました。しばらくしてから再度お試しください。", 'error');
    }
  }, [notify]);

  const renderTool = () => {
    switch (currentTool) {
      case ToolType.CREATOR:
        return <CreatorTool ensureKeySet={ensureKeySet} onHandleApiError={handleApiError} notify={notify} />;
      case ToolType.SUPPORT:
        return <SupportHub ensureKeySet={ensureKeySet} onHandleApiError={handleApiError} notify={notify} />;
      case ToolType.TOP:
      default:
        return <Hub onSelectTool={setCurrentTool} />;
    }
  };

  const toolName = currentTool === ToolType.CREATOR ? 'Creator'
    : currentTool === ToolType.SUPPORT ? 'サポートメニュー'
    : '';

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 font-sans">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div
          className="text-center md:text-left cursor-pointer"
          onClick={() => setCurrentTool(ToolType.TOP)}
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">
            Skill Market
            <span className="ml-2 text-brand-gradient">Creator Pro</span>
          </h1>
          {currentTool === ToolType.TOP ? (
            <p className="mt-1 text-stone-500 text-xs md:text-sm">
              出品から集客まで。あなたのスキルマーケット活動をトータルサポート。
            </p>
          ) : (
            <p className="mt-1 text-stone-500 text-xs md:text-sm">{toolName}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentTool !== ToolType.TOP && (
            <button
              onClick={() => setCurrentTool(ToolType.TOP)}
              className="btn-secondary px-4 py-2 text-xs"
            >
              ← Top
            </button>
          )}
          <a
            href="https://library.libecity.com/articles/01KD26FQVJ9VJNH99JBJ9F3TGS"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-4 py-2 text-xs"
          >
            使い方
          </a>
        </div>
      </header>

      <main className="bg-white rounded-3xl border border-stone-200/70 shadow-card overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col">
        <div className="flex-grow w-full flex flex-col">
          {renderTool()}
        </div>
      </main>

      <footer className="mt-10 md:mt-14 pb-8">
        <p className="text-center text-stone-400 text-xs">Powered by Gemini</p>
      </footer>

      {toast && (
        <div className="fixed bottom-6 inset-x-0 z-[200] flex justify-center px-4 pointer-events-none">
          <div
            role="status"
            className={`pointer-events-auto max-w-md w-auto px-5 py-3 rounded-2xl shadow-card-hover text-sm font-medium text-white animate-in fade-in slide-in-from-bottom-4 duration-300 ${
              toast.tone === 'error' ? 'bg-stone-900' : 'bg-stone-800'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
