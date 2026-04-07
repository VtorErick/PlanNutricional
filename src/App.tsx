import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ChefHat, Calendar, BookOpen, ShoppingCart, Lightbulb, Flame, X, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useDiet } from './context/DietContext';

import AdminLayout from './components/views/AdminLayout';
import LandingView from './components/views/LandingView';
import Header from './components/views/Header';
import DailyProgress from './components/views/DailyProgress';
import PlanView from './components/views/PlanView';
import ShoppingView from './components/views/ShoppingView';
import SummaryView from './components/views/SummaryView';
import EquivalenciasView from './components/views/EquivalenciasView';
import CalorieMonitoringView from './components/views/CalorieMonitoringView';
import NutritionQuestionnaire from './components/NutritionQuestionnaire';

export default function App() {
  const {
    perfilActivo,
    tab, setTab,
    showAdmin,
    showQuestionnaire, setShowQuestionnaire,
    setPerfilActivo, setDiaActivo,
    perfilBase,
    ac,
    handleGenerateWithAi,
    generationLoading, generationError,
    geminiModel, setGeminiModel,
    lastGeneratedData,
    questionnaireTargetProfile, setQuestionnaireTargetProfile,
    questionnaireStepIdx, setQuestionnaireStepIdx,
    questionnaireEl, setQuestionnaireEl,
    questionnaireElla, setQuestionnaireElla,
    questionnairePortionMode, setQuestionnairePortionMode,
    questionnaireManualPortions, setQuestionnaireManualPortions,
    questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes,
  } = useDiet();

  // ─── AI Generator View ────────────────────────────────────────────
  if (showQuestionnaire) {
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
          <button onClick={() => setShowQuestionnaire(false)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NutritionQuestionnaire
              onCancel={() => setShowQuestionnaire(false)}
              onGenerate={handleGenerateWithAi}
              onViewPlan={(profile) => {
                setShowQuestionnaire(false);
                setPerfilActivo(profile);
                setDiaActivo('Lunes');
                setTab('plan');
              }}
              loading={generationLoading}
              errorMessage={generationError}
              geminiModel={geminiModel}
              setGeminiModel={setGeminiModel}
              lastGeneratedData={lastGeneratedData}
              targetProfile={questionnaireTargetProfile}
              setTargetProfile={setQuestionnaireTargetProfile}
              stepIdx={questionnaireStepIdx}
              setStepIdx={setQuestionnaireStepIdx}
              el={questionnaireEl}
              setEl={setQuestionnaireEl}
              ella={questionnaireElla}
              setElla={setQuestionnaireElla}
              portionMode={questionnairePortionMode}
              setPortionMode={setQuestionnairePortionMode}
              manualPortions={questionnaireManualPortions}
              setManualPortions={setQuestionnaireManualPortions}
              additionalNotes={questionnaireAdditionalNotes}
              setAdditionalNotes={setQuestionnaireAdditionalNotes}
            />
          </section>
        </main>
      </div>
    );
  }

  // ─── Admin View ───────────────────────────────────────────────────
  if (showAdmin) {
    return <AdminLayout />;
  }

  // ─── Landing / Profile selector ───────────────────────────────────
  if (!perfilActivo) {
    return <LandingView />;
  }

  // ─── Main app ─────────────────────────────────────────────────────
  const perfil = perfilBase;

  // Static accent colors based on active profile (removes dynamic template literals for Tailwind)
  const staticColors = useMemo(() => {
    switch (perfilActivo) {
      case 'el':
        return {
          text: 'text-blue-600',
          textDark: 'text-blue-800',
          bgGradientLight: 'from-blue-50 to-cyan-50',
          borderLight: 'border-blue-100',
        };
      case 'ella':
        return {
          text: 'text-rose-600',
          textDark: 'text-rose-800',
          bgGradientLight: 'from-rose-50 to-pink-50',
          borderLight: 'border-rose-100',
        };
      case 'ambos':
        return {
          text: 'text-indigo-600',
          textDark: 'text-indigo-800',
          bgGradientLight: 'from-indigo-50 to-purple-50',
          borderLight: 'border-indigo-100',
        };
      default:
        return {
          text: 'text-slate-600',
          textDark: 'text-slate-800',
          bgGradientLight: 'from-slate-50 to-slate-100',
          borderLight: 'border-slate-100',
        };
    }
  }, [perfilActivo]);

  const tabItems = [
    { key: 'plan' as const, label: 'Mi Plan', shortLabel: 'Plan', icon: Calendar },
    { key: 'equivalencias' as const, label: 'Equivalencias', shortLabel: 'Extras', icon: BookOpen },
    { key: 'calorias' as const, label: 'Calorías', shortLabel: 'Kcal', icon: Flame },
    { key: 'compras' as const, label: 'Compras', shortLabel: 'Compras', icon: ShoppingCart },
    { key: 'resumen' as const, label: 'Resumen', shortLabel: 'Resumen', icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" data-profile={perfilActivo}>

      {/* ── Main sticky header ─────────────────────────────────── */}
      <Header />

      {/* ── Daily Progress (only in tab=plan) ── */}
      <AnimatePresence>
        {tab === 'plan' && <DailyProgress />}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28 sm:pb-8 space-y-4">

        {/* Health note */}
        {tab === 'resumen' && perfil.notaSalud && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">{perfil.notaSalud}</p>
          </motion.div>
        )}

        {/* ── Desktop Tab Nav */}
        <div className="hidden sm:block">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl">
            {tabItems.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[14px] font-bold text-sm transition-all duration-300 active:scale-95 ${tab === t.key ? `bg-white shadow-sm ${staticColors.text}` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <t.icon className="w-4 h-4 flex-shrink-0" />
                <span>{t.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        {/* ── Mobile Bottom Tab Nav */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-2 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_30px_rgba(0,0,0,0.04)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex justify-around items-center max-w-md mx-auto pt-1.5 pb-1.5">
            {tabItems.map((t) => {
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`relative flex flex-col items-center justify-center gap-1 w-[64px] py-1 transition-all duration-200 active:scale-95 ${active ? staticColors.text : 'text-slate-400 hover:text-slate-500'}`}>
                  <div className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${active ? `bg-gradient-to-br ${staticColors.bgGradientLight} shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border ${staticColors.borderLight}` : 'bg-transparent'}`}>
                    <t.icon className={`w-[18px] h-[18px] ${active ? `fill-current opacity-20 absolute` : ''}`} />
                    <t.icon className="w-[18px] h-[18px] relative z-10" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] tracking-wide ${active ? `font-extrabold ${staticColors.textDark}` : 'font-medium'}`}>{t.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'plan' && <PlanView />}
          {tab === 'equivalencias' && <EquivalenciasView />}
          {tab === 'calorias' && <CalorieMonitoringView />}
          {tab === 'resumen' && <SummaryView />}
          {tab === 'compras' && <ShoppingView />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white/50 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-slate-500 text-xs sm:text-sm">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-3.5 h-3.5" />
            Plan de alimentación personalizado — 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
