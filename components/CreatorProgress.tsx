import React from 'react';
import { Step } from '../types';

// Creator の3画面（入力 → 選ぶ → 仕上げ）の現在地。Hub の「STEP 1/2」と番号が衝突しないよう、数字は Creator 内だけで使う
const STAGES = [
  { label: '入力', hint: '好き・得意・経験' },
  { label: '選ぶ', hint: '20のアイデアから' },
  { label: '仕上げ', hint: '出品文と画像' },
];

const stageIndex = (step: Step): number => {
  if (step === Step.INPUT) return 0;
  if (step === Step.IDEAS) return 1;
  return 2; // GENERATING_DETAIL / DETAIL
};

const CreatorProgress: React.FC<{ step: Step }> = ({ step }) => {
  const current = stageIndex(step);
  return (
    <nav aria-label="作成の進み" className="px-6 md:px-10 lg:px-12 pt-6">
      <ol className="flex items-center gap-2">
        {STAGES.map((st, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo';
          return (
            <React.Fragment key={st.label}>
              <li className="flex items-center gap-2 min-w-0" aria-current={state === 'current' ? 'step' : undefined}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  state === 'current' ? 'bg-brand-500 text-white'
                  : state === 'done' ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-400'
                }`}>{i + 1}</span>
                <span className="min-w-0">
                  <span className={`block text-xs font-semibold leading-tight ${state === 'current' ? 'text-stone-900' : 'text-stone-400'}`}>{st.label}</span>
                  <span className="hidden md:block text-[10px] text-stone-400 leading-tight">{st.hint}</span>
                </span>
              </li>
              {i < STAGES.length - 1 && <li aria-hidden className={`h-px flex-grow ${i < current ? 'bg-stone-800' : 'bg-stone-200'}`}></li>}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default CreatorProgress;
