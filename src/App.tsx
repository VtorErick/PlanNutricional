import { Suspense, lazy, useMemo, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChefHat,
  Flame,
  Home,
  Lightbulb,
  Moon,
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

function getStoredProfileFromLocalStorage(): import('./context/DietContext').PerfilActivo {
  try {
    const raw = window.localStorage.getItem('perfilActivo');
    return raw === 'el' || raw === 'ella' || raw === 'ambos' ? raw : 'ambos';
  } catch {
    return 'ambos';
  }
}

function getTodayPlanDay() {
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const dayIndex = new Date().getDay();
  return days[dayIndex === 0 ? 6 : dayIndex - 1];
}

export default function App() {
  const [isPlanAdjustOpen, setIsPlanAdjustOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const lastProfileRef = useRef(getStoredProfileFromLocalStorage());
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
    geminiModel,
    geminiRecommendedModel,
    geminiFallbackModels,
    lastGeneratedData,
    lastQuestionnaireContexts,
    profileLabels,
    setProfileLabels,
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

  // 🔹 ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (React rules of hooks)
  useEffect(() => {
    lastProfileRef.current = activeProfile;
  }, [activeProfile]);

  useEffect(() => {
    if (!activeTab) {
      setActiveTab('inicio');
    }
  }, [activeTab, setActiveTab]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);



  useEffect(() => {
    const handlePlanAdjustState = (event: Event) => {
      setIsPlanAdjustOpen(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener('plan-adjust-open', handlePlanAdjustState);
    return () => window.removeEventListener('plan-adjust-open', handlePlanAdjustState);
  }, []);

  const desktopTabBackdrop = useMemo(() => {
    switch (activeTab) {
      case 'plan':
        return {
          imageSrc: '/images/hero.png',
          imagePosition: 'center 22%',
          overlay: 'from-sky-200/45 via-white/40 to-transparent',
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

  // 🔹 ORDEN DE TABS
  const tabItems = [
    { key: 'inicio' as const, label: 'Inicio', shortLabel: 'Inicio', icon: Home },
    { key: 'plan' as const, label: 'Mi Plan', shortLabel: 'Plan', icon: Calendar },
    { key: 'calorias' as const, label: 'Calorías', shortLabel: 'Kcal', icon: Flame },
    { key: 'compras' as const, label: 'Compras', shortLabel: 'Compras', icon: ShoppingCart },
    { key: 'resumen' as const, label: 'Resumen', shortLabel: 'Resumen', icon: Lightbulb },
  ];

  const tabIconColors: Record<(typeof tabItems)[number]['key'], string> = {
    inicio: 'text-slate-500 dark:text-slate-400',
    plan: 'text-blue-500 dark:text-sky-300',
    calorias: 'text-orange-500 dark:text-amber-300',
    compras: 'text-teal-500 dark:text-teal-300',
    resumen: 'text-violet-500 dark:text-violet-300',
  };

  // ── Mobile nav active tint by active profile (uniform shadow size to prevent jump) ──
  const navActiveTint = useMemo(() => {
    switch (activeProfile) {
      case 'el':
        return 'text-blue-600 dark:text-sky-300';
      case 'ella':
        return 'text-rose-600 dark:text-pink-300';
      case 'ambos':
        return 'text-violet-600 dark:text-violet-300';
    }
  }, [activeProfile]);
  const navActiveSurface = useMemo(() => {
    switch (activeProfile) {
      case 'el':
        return 'bg-blue-50 text-blue-700 shadow-[0_8px_18px_rgba(37,99,235,0.16)] dark:bg-blue-500/12 dark:text-sky-200 dark:shadow-none';
      case 'ella':
        return 'bg-rose-50 text-rose-700 shadow-[0_8px_18px_rgba(225,29,72,0.16)] dark:bg-rose-500/12 dark:text-pink-200 dark:shadow-none';
      case 'ambos':
        return 'bg-violet-50 text-violet-700 shadow-[0_8px_18px_rgba(124,58,237,0.18)] dark:bg-violet-500/12 dark:text-violet-200 dark:shadow-none';
    }
  }, [activeProfile]);

  const mobileNavigationBar = (
    <nav
      ref={mobileNavRef}
      className="fixed inset-x-0 bottom-0 z-50 w-full max-w-full overflow-x-clip border-t border-slate-200/60 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal móvil"
    >
      <div className="mx-auto w-full max-w-md px-3 py-2">
        <div className="grid grid-cols-5 gap-0.5 rounded-[24px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.13)]">
          {tabItems.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setActiveTab(tabItem.key)}
              data-testid={`mobile-tab-${tabItem.key}`}
              className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-0.5 rounded-[18px] transition-all duration-200 active:scale-95 ${
                activeTab === tabItem.key
                  ? navActiveSurface
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <tabItem.icon className={`h-[17px] w-[17px] ${activeTab === tabItem.key ? navActiveTint : ''}`} strokeWidth={activeTab === tabItem.key ? 2.5 : 1.8} />
              <span className="text-[9px] font-bold tracking-wide">{tabItem.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  // ── EARLY RETURNS (after all hooks) ──────────────────────────────────
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
                  setActiveDay(getTodayPlanDay());
                  setActiveTab('plan');
                }}
                loading={generationLoading}
                errorMessage={generationError}
                aiErrorLog={generationErrorLog}
                geminiModel={geminiModel}
                geminiRecommendedModel={geminiRecommendedModel}
                geminiFallbackModels={geminiFallbackModels}
                lastGeneratedData={lastGeneratedData}
                profileLabels={profileLabels}
                setProfileLabels={setProfileLabels}
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

  if (activeTab === 'inicio') {
    return (
      <div
        className="flex h-[100svh] w-full flex-col overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:min-h-[100dvh] sm:overflow-x-hidden"
        data-profile={activeProfile}
      >
        {!isPlanAdjustOpen && <Header />}
        <LandingView />
        {mobileNavigationBar}
      </div>
    );
  }

  return (
      <div
        className="min-h-[100svh] w-full overflow-x-hidden overscroll-x-none bg-gradient-to-br from-slate-50 via-white to-slate-50 transition-colors duration-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
        data-profile={activeProfile}
      >
      {!isPlanAdjustOpen && <Header />}

      {activeTab === 'plan' && !isPlanAdjustOpen ? <DailyProgress /> : null}

      <main className="relative z-0 mx-auto w-full max-w-5xl min-w-0 px-4 py-4 pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-6 sm:pb-8 space-y-4">
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
            className="grid grid-cols-5 gap-1.5 rounded-[26px] border border-white/70 bg-white/88 p-2 shadow-[0_18px_46px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/88"
          >
            {tabItems.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setActiveTab(tabItem.key)}
                className={`flex min-h-[64px] items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-extrabold transition-all duration-300 active:scale-[0.98] ${activeTab === tabItem.key
                  ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100/72 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                  }`}
              >
                <tabItem.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tabItem.key ? 'text-white dark:text-slate-950' : tabIconColors[tabItem.key]}`} />
                <span>{tabItem.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <Suspense fallback={<ViewFallback />}>
            {activeTab === 'plan' && <PlanView />}
            {activeTab === 'suplementos' && <SupplementsView />}
            {activeTab === 'calorias' && <CalorieMonitoringView />}
            {activeTab === 'resumen' && <SummaryView />}
            {activeTab === 'compras' && <ShoppingView />}
          </Suspense>
        </AnimatePresence>
      </main>

      {mobileNavigationBar}

      <footer className="hidden bg-white/40 mt-10 dark:bg-slate-950/60 sm:block">
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
