import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserInput, SkillIdea, Step } from '../types';
import { generateIdeas, generateServicePage, extractProfileKeywords } from '../services/geminiService';
import { extractWords } from '../utils/textProcessing';
import InputForm from './InputForm';
import IdeaList from './IdeaList';
import ServiceResult from './ServiceResult';
import LoadingOverlay from './LoadingOverlay';

const STORAGE_KEY_IDEAS = "skill_market_ideas";
const STORAGE_KEY_INPUT = "skill_market_raw_input";
const STORAGE_KEY_KEYWORDS = "skill_market_profile_keywords";

interface CreatorToolProps {
  ensureKeySet: () => Promise<boolean>;
  onHandleApiError: (error: any) => void;
  notify: (message: string, tone?: 'error' | 'info') => void;
}

const CreatorTool: React.FC<CreatorToolProps> = ({ ensureKeySet, onHandleApiError, notify }) => {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [ideas, setIdeas] = useState<SkillIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<SkillIdea | null>(null);
  const [serviceText, setServiceText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [loadingTitle, setLoadingTitle] = useState<string>("考えています…");

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [rawInputText, setRawInputText] = useState<string>("");
  // 自己紹介から抽出した特徴キーワード（再生成バーの絞り込みチップ）
  const [profileKeywords, setProfileKeywords] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // ステップ変更時にスクロール位置を最上部にリセット
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [step]);

  useEffect(() => {
    const savedIdeas = localStorage.getItem(STORAGE_KEY_IDEAS);
    const savedInput = localStorage.getItem(STORAGE_KEY_INPUT);
    const savedKeywords = localStorage.getItem(STORAGE_KEY_KEYWORDS);
    if (savedInput) setRawInputText(savedInput);
    if (savedKeywords) {
      try {
        const parsed = JSON.parse(savedKeywords);
        if (Array.isArray(parsed)) setProfileKeywords(parsed);
      } catch { /* noop */ }
    }

    if (savedIdeas) {
      try {
        const parsed = JSON.parse(savedIdeas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIdeas(parsed);
          setStep(Step.IDEAS);
        }
      } catch (e) {
        console.error("Failed to parse saved ideas", e);
      }
    }
  }, []);

  const saveIdeasToStorage = (data: SkillIdea[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Storage quota exceeded. Attempting to save without image data.");
        try {
          const reducedData = data.map(item => ({ ...item, thumbnailUrl: undefined }));
          localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(reducedData));
          setIdeas(reducedData);
          notify("保存容量の上限に達したため、画像データを除いて保存しました。");
        } catch (innerE) {
          console.error("Critical storage failure. Clearing ideas from storage.", innerE);
          localStorage.removeItem(STORAGE_KEY_IDEAS);
        }
      } else {
        console.error("Failed to save to localStorage", e);
      }
    }
  };

  const inputWords = useMemo(() => extractWords(rawInputText), [rawInputText]);

  // 自己紹介から特徴キーワードを抽出して保存（失敗しても本流は止めない）
  const refreshKeywords = (text: string) => {
    extractProfileKeywords(text)
      .then(kws => {
        setProfileKeywords(kws);
        try { localStorage.setItem(STORAGE_KEY_KEYWORDS, JSON.stringify(kws)); } catch { /* noop */ }
      })
      .catch(() => { /* キーワードは補助機能なので失敗は無視 */ });
  };

  // 既存ユーザー（アイデアはあるがキーワード未取得）に一度だけ補完する
  const keywordsBootstrapped = useRef(false);
  useEffect(() => {
    if (keywordsBootstrapped.current) return;
    if (step === Step.IDEAS && rawInputText && profileKeywords.length === 0) {
      keywordsBootstrapped.current = true;
      refreshKeywords(rawInputText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, rawInputText, profileKeywords.length]);

  // ピン留めしたアイデアは常に先頭に残し、新規生成分を後ろに足す（タイトル重複は除外）
  const mergeWithPinned = (existing: SkillIdea[], generated: SkillIdea[]): SkillIdea[] => {
    const pinned = existing.filter(i => i.pinned);
    const pinnedTitles = new Set(pinned.map(i => i.title));
    const fresh = generated.filter(g => !pinnedTitles.has(g.title));
    return [...pinned, ...fresh];
  };

  const handleStartIdeaGeneration = async (input: UserInput) => {
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setRawInputText(input.rawText);
    try {
      localStorage.setItem(STORAGE_KEY_INPUT, input.rawText);
    } catch (e) {
      console.warn("Failed to save raw input to storage", e);
    }

    setIsLoading(true);
    setLoadingTitle("アイデアを考えています");
    setLoadingMessage("あなたの情報を分析し、最適なアイデアを練り上げています…");
    try {
      // プロフィールを変更して作り直す場合でも、ピン留めしたアイデアは残す
      const pinned = ideas.filter(i => i.pinned);
      const result = await generateIdeas(input, { pinnedIdeas: pinned.map(p => ({ title: p.title })) });
      const merged = mergeWithPinned(ideas, result);
      setIdeas(merged);
      saveIdeasToStorage(merged);
      setStep(Step.IDEAS);
      refreshKeywords(input.rawText); // プロフィールが変わったのでキーワードも更新
    } catch (error: any) {
      onHandleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 でAIに追加指示を出して、ピン留め以外のアイデアを作り直す
  const handleRegenerate = async (instruction: string) => {
    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setIsLoading(true);
    setLoadingTitle("アイデアを作り直しています");
    setLoadingMessage(instruction.trim()
      ? "リクエストを反映して、新しい切り口を考えています…"
      : "別の角度から、新しいアイデアを考えています…");
    try {
      const pinned = ideas.filter(i => i.pinned);
      const result = await generateIdeas(
        { rawText: rawInputText },
        { instruction, pinnedIdeas: pinned.map(p => ({ title: p.title })) }
      );
      const merged = mergeWithPinned(ideas, result);
      setIdeas(merged);
      saveIdeasToStorage(merged);
    } catch (error: any) {
      onHandleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // プロフィール（好き・得意・経験）を編集し直す。ピン留め等のデータは保持したまま入力画面へ戻る
  const handleEditProfile = () => {
    setStep(Step.INPUT);
    window.scrollTo(0, 0);
  };

  const handleSelectIdea = async (idea: SkillIdea) => {
    if (idea.generatedContent) {
      setSelectedIdea(idea);
      setServiceText(idea.generatedContent);
      setStep(Step.DETAIL);
      window.scrollTo(0, 0);
      return;
    }

    const keyReady = await ensureKeySet();
    if (!keyReady) return;

    setSelectedIdea(idea);
    setStep(Step.GENERATING_DETAIL);
    setIsLoading(true);
    setLoadingTitle(`「${idea.title}」`);
    setLoadingMessage("このアイデアの出品ページを構成しています…");

    try {
      const pageText = await generateServicePage(idea);
      const updatedIdeas = ideas.map(i =>
        i.id === idea.id ? { ...i, generatedContent: pageText } : i
      );
      setIdeas(updatedIdeas);
      saveIdeasToStorage(updatedIdeas);
      setServiceText(pageText);
      setStep(Step.DETAIL);
      window.scrollTo(0, 0);
    } catch (error: any) {
      setStep(Step.IDEAS);
      onHandleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    const updatedIdeas = ideas.map(i => i.id === ideaId ? { ...i, pinned: !i.pinned } : i);
    setIdeas(updatedIdeas);
    saveIdeasToStorage(updatedIdeas);
  };

  // Step 3のAI編集チャットで確定した内容を、選択中のアイデアに保存する
  const handleSaveServiceContent = (newContent: string) => {
    if (!selectedIdea) return;
    const updatedIdeas = ideas.map(i =>
      i.id === selectedIdea.id ? { ...i, generatedContent: newContent } : i
    );
    setIdeas(updatedIdeas);
    saveIdeasToStorage(updatedIdeas);
    setServiceText(newContent);
    setSelectedIdea(prev => (prev ? { ...prev, generatedContent: newContent } : prev));
  };

  const forceReset = () => {
    localStorage.removeItem(STORAGE_KEY_IDEAS);
    localStorage.removeItem(STORAGE_KEY_INPUT);
    localStorage.removeItem(STORAGE_KEY_KEYWORDS);

    setIdeas([]);
    setRawInputText("");
    setProfileKeywords([]);
    keywordsBootstrapped.current = false;
    setStep(Step.INPUT);
    setServiceText("");
    setSelectedIdea(null);
    setShowResetConfirm(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <div ref={containerRef} className="relative h-full flex flex-col overflow-y-auto custom-scrollbar">
          {step === Step.INPUT && (
            <>
               <div className="px-6 md:px-10 lg:px-12 pt-6">
                 <button onClick={() => setShowResetConfirm(true)} className="text-xs text-stone-400 hover:text-brand-500 underline decoration-stone-200 underline-offset-2 transition-colors">
                    履歴を消去してリセット
                 </button>
               </div>
               <InputForm onSubmit={handleStartIdeaGeneration} initialText={rawInputText} hasIdeas={ideas.length > 0} onBackToIdeas={() => setStep(Step.IDEAS)} />
            </>
          )}
          {step === Step.IDEAS && (
            <IdeaList
              ideas={ideas}
              keywords={profileKeywords}
              onSelect={handleSelectIdea}
              onTogglePin={handleTogglePin}
              onRegenerate={handleRegenerate}
              onEditProfile={handleEditProfile}
              onBack={forceReset}
            />
          )}
          {step === Step.DETAIL && selectedIdea && (
            <ServiceResult
              idea={selectedIdea}
              content={serviceText}
              onBack={() => setStep(Step.IDEAS)}
              onSaveContent={handleSaveServiceContent}
              ensureKeySet={ensureKeySet}
              onHandleApiError={onHandleApiError}
            />
          )}
      </div>

      {showResetConfirm && createPortal(
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[9999] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 md:p-10 max-w-sm w-full shadow-card-hover border border-stone-200/60 flex flex-col items-center text-center my-auto animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-lg font-bold text-stone-900 mb-3 tracking-tight">最初からやり直しますか？</h3>
            <p className="text-stone-500 text-sm mb-8 leading-relaxed">
              Creatorツールの全てのデータ（履歴・画像）を消去して初期状態に戻します。この操作は取り消せません。
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={forceReset}
                className="btn-dark w-full py-3.5 px-6 text-sm"
              >
                データを消去する
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-quiet w-full py-3.5 px-6 text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isLoading && <LoadingOverlay message={loadingMessage} title={loadingTitle} sourceWords={inputWords} />}
    </>
  );
};

export default CreatorTool;
