import { Suspense, lazy, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  ChefHat,
  Flame,
  Lightbulb,
  Moon,
  Pill,
  ShoppingCart,
  Sun,
  X,
} from 'lucide-react';

import { useDiet } from './context/DietContext';

import LandingView from './components/views/LandingView';
import Header from './components/views/Header';
import DailyProgress from './components/views/DailyProgress';
const AdminLayout = lazy(() => import('./components/views/AdminLayout'));
const PlanView = lazy(() => import('./components/views/PlanView'));
const ShoppingView = lazy(() => import('./components/views/ShoppingView'));
const SummaryView = lazy(() => import('./components/views/SummaryView'));
const EquivalenciasView = lazy(() => import('./components/views/EquivalenciasView'));
const CalorieMonitoringView = lazy(() => import('./components/views/CalorieMonitoringView'));
const NutritionQuestionnaire = lazy(() => import('./components/NutritionQuestionnaire'));
const SupplementsView = lazy(() => import('./components/views/SupplementsView'));

function ViewFallback() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      Cargando vista...
    </div>
  );
}

export default function App() {
  const {
    perfilActivo: activeProfile,
    tab: activeTab,
    setTab: setActiveTab,
    showAdmin: isAdminOpen,
    showQuestionnaire: isQuestionnaireOpen,
    setShowQuestionnaire: setIsQuestionnaireOpen,
    setPerfilActivo: setActiveProfile,
    setDiaActivo: setActiveDay,
    perfilBase: baseProfile,
    handleGenerateWithAi,
    generationLoading,
    generationError,
    generationErrorLog,
    geminiApiKey,
    setGeminiApiKey,
    lastGeneratedData,
    questionnaireTargetProfile,
    setQuestionnaireTargetProfile,
    questionnaireStepIdx: questionnaireStepIndex,
    setQuestionnaireStepIdx: setQuestionnaireStepIndex,
    questionnaireEl: questionnaireElData,
    setQuestionnaireEl: setQuestionnaireElData,
    questionnaireElla: questionnaireEllaData,
    setQuestionnaireElla: setQuestionnaireEllaData,
    questionnairePortionMode,
    setQuestionnairePortionMode,
    questionnaireManualPortions,
    setQuestionnaireManualPortions,
    questionnaireAdditionalNotes,
    setQuestionnaireAdditionalNotes,
    isDarkMode,
    setIsDarkMode,
  } = useDiet();

  if (isQuestionnaireOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm dark:bg-slate-950/95 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white text-base">🪄</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight dark:text-slate-50">
                Generar plan con IA
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block dark:text-slate-500">
                Completa el formulario para crear y aplicar un plan personalizado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDarkMode ? 'Claro' : 'Oscuro'}
            </button>

            <button
              onClick={() => setIsQuestionnaireOpen(false)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Suspense fallback={<ViewFallback />}>
              <NutritionQuestionnaire
                onCancel={() => setIsQuestionnaireOpen(false)}
                onGenerate={handleGenerateWithAi}
                onViewPlan={(profile) => {
                  setIsQuestionnaireOpen(false);
                  setActiveProfile(profile);
                  setActiveDay('Lunes');
                  setActiveTab('plan');
                }}
                loading={generationLoading}
                errorMessage={generationError}
                aiErrorLog={generationErrorLog}
                geminiApiKey={geminiApiKey}
                setGeminiApiKey={setGeminiApiKey}
                lastGeneratedData={lastGeneratedData}
                targetProfile={questionnaireTargetProfile}
                setTargetProfile={setQuestionnaireTargetProfile}
                stepIdx={questionnaireStepIndex}
                setStepIdx={setQuestionnaireStepIndex}
                el={questionnaireElData}
                setEl={setQuestionnaireElData}
                ella={questionnaireEllaData}
                setElla={setQuestionnaireEllaData}
                portionMode={questionnairePortionMode}
                setPortionMode={setQuestionnairePortionMode}
                manualPortions={questionnaireManualPortions}
                setManualPortions={setQuestionnaireManualPortions}
                additionalNotes={questionnaireAdditionalNotes}
                setAdditionalNotes={setQuestionnaireAdditionalNotes}
              />
            </Suspense>
          </section>
        </main>
      </div>
    );
  }

  if (isAdminOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <AdminLayout />
      </Suspense>
    );
  }

  if (!activeProfile) {
    return <LandingView />;
  }

  const profile = baseProfile;

  const staticColors = useMemo(() => {
    switch (activeProfile) {
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
  }, [activeProfile]);

  const tabItems = [
    { key: 'plan' as const, label: 'Mi Plan', shortLabel: 'Plan', icon: Calendar },
    { key: 'equivalencias' as const, label: 'Equivalencias', shortLabel: 'Extras', icon: BookOpen },
    { key: 'suplementos' as const, label: 'Suplementos', shortLabel: 'Sups', icon: Pill },
    { key: 'calorias' as const, label: 'Calorías', shortLabel: 'Kcal', icon: Flame },
    { key: 'compras' as const, label: 'Compras', shortLabel: 'Compras', icon: ShoppingCart },
    { key: 'resumen' as const, label: 'Resumen', shortLabel: 'Resumen', icon: Lightbulb },
  ];

  const tabIconColors: Record<(typeof tabItems)[number]['key'], string> = {
    plan: 'text-blue-500 dark:text-sky-300',
    equivalencias: 'text-emerald-500 dark:text-emerald-300',
    suplementos: 'text-fuchsia-500 dark:text-pink-300',
    calorias: 'text-orange-500 dark:text-amber-300',
    compras: 'text-teal-500 dark:text-teal-300',
    resumen: 'text-violet-500 dark:text-violet-300',
  };

  const desktopTabBackdrop = useMemo(() => {
    switch (activeTab) {
      case 'plan':
        return {
          imageSrc: '/images/hero.png',
          imagePosition: 'center 22%',
          overlay: 'from-sky-200/45 via-white/40 to-transparent',
        };
      case 'equivalencias':
        return {
          imageSrc: '/images/hero.png',
          imagePosition: 'center 18%',
          overlay: 'from-emerald-200/40 via-white/35 to-transparent',
        };
      case 'suplementos':
        return {
          imageSrc: '/images/meal-prep.png',
          imagePosition: 'center 24%',
          overlay: 'from-fuchsia-200/35 via-white/35 to-transparent',
        };
      case 'compras':
        return {
          imageSrc: '/images/meal-prep.png',
          imagePosition: 'center 26%',
          overlay: 'from-emerald-200/40 via-white/35 to-transparent',
        };
      case 'resumen':
        return {
          imageSrc: '/images/hero.png',
          imagePosition: 'center 18%',
          overlay: 'from-violet-200/38 via-white/34 to-transparent',
        };
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      data-profile={activeProfile}
    >
      <Header />

      <AnimatePresence>{activeTab === 'plan' && <DailyProgress />}</AnimatePresence>

      <main className="relative z-0 max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28 sm:pb-8 space-y-4">
        {desktopTabBackdrop ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-4 -z-10 hidden h-[360px] overflow-hidden rounded-[36px] sm:block"
          >
            <div
              className="absolute inset-0 scale-105 bg-cover bg-no-repeat opacity-95"
              style={{
                backgroundImage: `url('${desktopTabBackdrop.imageSrc}')`,
                backgroundPosition: desktopTabBackdrop.imagePosition,
              }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${desktopTabBackdrop.overlay}`} />
            <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-white/50 to-white/92 dark:from-slate-950/20 dark:via-slate-950/45 dark:to-slate-950/88" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
          </div>
        ) : null}

        <div className="hidden sm:block sticky top-[72px] z-40">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex gap-1 rounded-2xl bg-white/88 p-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-slate-900/88"
          >
            {tabItems.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setActiveTab(tabItem.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[14px] font-bold text-sm transition-all duration-300 active:scale-95 ${
                  activeTab === tabItem.key
                    ? `bg-white shadow-sm ${staticColors.text} dark:bg-slate-900`
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <tabItem.icon className={`w-4 h-4 flex-shrink-0 ${tabIconColors[tabItem.key]}`} />
                <span>{tabItem.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-2 bg-white/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(15,23,42,0.08)] dark:bg-slate-950/95"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-around items-center max-w-md mx-auto pt-1.5 pb-1.5">
            {tabItems.map((tabItem) => {
              const active = activeTab === tabItem.key;

              return (
                <button
                  key={tabItem.key}
                  onClick={() => setActiveTab(tabItem.key)}
                  data-testid={`mobile-tab-${tabItem.key}`}
                  className={`relative flex flex-col items-center justify-center gap-1 w-[58px] py-1 transition-all duration-200 active:scale-95 ${
                    active
                      ? staticColors.text
                      : 'text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${
                      active
                        ? `bg-gradient-to-br ${staticColors.bgGradientLight} shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:from-slate-800 dark:to-slate-700`
                        : 'bg-transparent'
                    }`}
                  >
                    <tabItem.icon
                      className={`w-[18px] h-[18px] ${tabIconColors[tabItem.key]} ${active ? 'fill-current opacity-20 absolute' : ''}`}
                    />
                    <tabItem.icon
                      className={`w-[18px] h-[18px] relative z-10 ${tabIconColors[tabItem.key]}`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                  <span
                    className={`text-[10px] tracking-wide ${
                      active
                        ? `font-extrabold ${staticColors.textDark} dark:text-slate-100`
                        : 'font-medium dark:text-slate-400'
                    }`}
                  >
                    {tabItem.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <Suspense fallback={<ViewFallback />}>
            {activeTab === 'plan' && <PlanView />}
            {activeTab === 'equivalencias' && <EquivalenciasView />}
            {activeTab === 'suplementos' && <SupplementsView />}
            {activeTab === 'calorias' && <CalorieMonitoringView />}
            {activeTab === 'resumen' && <SummaryView />}
            {activeTab === 'compras' && <ShoppingView />}
          </Suspense>
        </AnimatePresence>
      </main>

      <footer className="bg-white/40 mt-10 dark:bg-slate-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-slate-500 text-xs sm:text-sm dark:text-slate-400">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-3.5 h-3.5" />
            Plan de alimentación personalizado - 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
