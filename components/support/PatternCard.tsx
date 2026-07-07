import React from 'react';
import { SurveyPattern } from '../../types';

interface PatternCardProps {
  pattern: SurveyPattern;
  isSelected: boolean;
  onSelect: () => void;
  headerRef: (el: HTMLDivElement | null) => void;
}

const PatternCard: React.FC<PatternCardProps> = ({ pattern, isSelected, onSelect, headerRef }) => {
  return (
    <div onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative h-full flex flex-col ${
        isSelected ? 'bg-white border-brand-400 ring-2 ring-brand-100 shadow-card' : 'bg-white border-stone-200/80 hover:border-brand-200'
      }`}>
      <div ref={headerRef} data-role="card-header">
        <div className="flex justify-between items-start mb-3">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
            isSelected ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500'
          }`}>{pattern.id}</span>
          {isSelected && <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full animate-in zoom-in">選択中</span>}
        </div>
        <h3 className="font-bold text-stone-900 text-base mb-1">{pattern.name}</h3>
        <p className="text-xs text-stone-500 leading-relaxed mb-4">{pattern.description}</p>
      </div>
      <div className="space-y-3 pt-3 border-t border-stone-100">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex justify-between items-center">
          <span>設問</span>
          <span className="bg-stone-100 px-2 py-0.5 rounded-full text-stone-500">{pattern.questions.length}問</span>
        </p>
        <ul className="text-xs text-stone-600 space-y-2">
          {pattern.questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${q.required ? 'bg-brand-400' : 'bg-stone-300'}`}></span>
              <span className="leading-relaxed">{q.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PatternCard;
