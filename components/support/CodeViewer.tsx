import React, { useMemo, useState } from 'react';
import { SurveyPattern } from '../../types';
import { generateGasCode } from './gasCode';

const CodeViewer: React.FC<{ pattern: SurveyPattern }> = ({ pattern }) => {
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => generateGasCode(pattern), [pattern]);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div id="gas-code-section" className="mt-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-stone-900 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Google Apps Script (GAS)</h3>
            <p className="text-stone-400 text-xs mt-1">以下のコードをコピーして実行すると、Googleフォームが自動生成されます。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleCopy}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors ${copied ? 'bg-brand-400/20 text-brand-200' : 'bg-white text-stone-900 hover:bg-stone-200'}`}>
              {copied ? 'コピーしました' : 'コードをコピー'}
            </button>
            <a href="https://script.new" target="_blank" rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-semibold transition-colors">
              GAS Editor を開く
            </a>
          </div>
        </div>
        <pre className="bg-black/40 p-5 rounded-xl text-xs md:text-sm font-mono overflow-x-auto text-stone-200 custom-scrollbar max-h-[400px]">
          {code}
        </pre>
        <div className="mt-6 border-t border-white/10 pt-6">
          <h4 className="font-semibold text-sm text-white mb-3">使い方</h4>
          <ol className="text-sm text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>右上の「GAS Editor を開く」ボタンを押してエディタを開く</li>
            <li>エディタにある既存のコードを消して、コピーしたコードを貼り付け</li>
            <li>上のバーにある「保存」を押し、関数「createSurveyForm」を選択して「実行」</li>
            <li>権限の確認画面が出たら「権限を確認」→「続行」で許可する</li>
            <li>実行完了後、下の「実行ログ」にアンケートのURLが表示されます</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
