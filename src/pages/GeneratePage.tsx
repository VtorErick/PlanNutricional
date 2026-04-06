import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import NutritionQuestionnaire from '../components/NutritionQuestionnaire';
import { useGeminiGeneration } from '../features/ai-generator/hooks/useGeminiGeneration';
import { useQuestionnaireStore } from '../stores/questionnaireStore';
import { useAdminStore } from '../stores/adminStore';
import { usePlanStore } from '../stores/planStore';
import type { QuestionnairePayload, TargetProfile } from '../components/NutritionQuestionnaire';

export function GeneratePage() {
  const navigate = useNavigate();
  const { setPerfilActivo, setDiaActivo } = usePlanStore();
  const { geminiModel, setGeminiModel } = useAdminStore();
  
  const {
    targetProfile,
    setTargetProfile,
    stepIdx,
    setStepIdx,
    el,
    setEl,
    ella,
    setElla,
    portionMode,
    setPortionMode,
    manualPortions,
    setManualPortions,
    additionalNotes,
    setAdditionalNotes,
    lastGeneratedData,
    setLastGeneratedData,
    resetAll,
  } = useQuestionnaireStore();
  
  const {
    handleGenerate,
    handleViewPlan,
    generationLoading,
    generationError,
  } = useGeminiGeneration();

  const handleCancel = () => {
    resetAll();
    navigate('/');
  };

  const handleGenerateWrapper = async (payload: QuestionnairePayload) => {
    try {
      const result = await handleGenerate(payload);
      setLastGeneratedData(result);
    } catch (err) {
      // Error ya manejado en el hook
    }
  };

  const handleViewPlanWrapper = (profile: TargetProfile) => {
    if (profile === 'ambos') {
      handleViewPlan('el');
    } else {
      handleViewPlan(profile);
    }
    navigate('/plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white text-base">🪄</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">Generar plan con IA</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Completa el formulario para crear y aplicar un plan personalizado.</p>
          </div>
        </div>
        <button onClick={handleCancel}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <NutritionQuestionnaire
            onCancel={handleCancel}
            onGenerate={handleGenerateWrapper}
            onViewPlan={handleViewPlanWrapper}
            loading={generationLoading}
            errorMessage={generationError}
            geminiModel={geminiModel}
            setGeminiModel={setGeminiModel}
            lastGeneratedData={lastGeneratedData}
            targetProfile={targetProfile}
            setTargetProfile={setTargetProfile}
            stepIdx={stepIdx}
            setStepIdx={setStepIdx}
            el={el}
            setEl={setEl}
            ella={ella}
            setElla={setElla}
            portionMode={portionMode}
            setPortionMode={setPortionMode}
            manualPortions={manualPortions}
            setManualPortions={setManualPortions}
            additionalNotes={additionalNotes}
            setAdditionalNotes={setAdditionalNotes}
          />
        </section>
      </main>
    </div>
  );
}

