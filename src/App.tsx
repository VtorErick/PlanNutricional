import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChefHat,
  Flame,
  Home,
  Moon,
  ShoppingCart,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react';

import { useDiet } from './context/DietContext';

import LandingView from './components/views/LandingView';
import Header from './components/views/Header';
const AdminLayout = lazy(() => import('./components/views/AdminLayout'));
const PlanView = lazy(() => import('./components/views/PlanView'));
const ShoppingView = lazy(() => import('./components/views/ShoppingView'));
const SummaryView = lazy(() => import('./components/views/SummaryView'));
const CalorieMonitoringView = lazy(() => import('./components/views/CalorieMonitoringView'));
const NutritionQuestionnaire = lazy(() => import('./components/NutritionQuestionnaire'));
const SupplementsView = lazy(() => import('./components/views/SupplementsView'));

function ViewFallback() {
  return (
    <div className="surface-raised border border-[var(--ui-border)] p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-1/3 rounded-full bg-cream-200 dark:bg-ink-700" />
        <div className="h-4 w-2/3 rounded-full bg-cream-100 dark:bg-ink-800" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-cream-100 dark:bg-ink-800/70" />
          ))}
        </div>
      </div>
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
  const [isAppOverlayOpen, setIsAppOverlayOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const contentScrollRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    contentScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);



  useEffect(() => {
    const handlePlanAdjustState = (event: Event) => {
      setIsPlanAdjustOpen(Boolean((event as CustomEvent<boolean>).detail));
    };

    const handleAppOverlayState = (event: Event) => {
      setIsAppOverlayOpen(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener('plan-adjust-open', handlePlanAdjustState);
    window.addEventListener('app-overlay-open', handleAppOverlayState);
    return () => {
      window.removeEventListener('plan-adjust-open', handlePlanAdjustState);
      window.removeEventListener('app-overlay-open', handleAppOverlayState);
    };
  }, []);

  const isChromeHidden = isPlanAdjustOpen || isAppOverlayOpen;

  // La navegación mantiene visibles las cinco tareas principales.
  const tabItems = [
    { key: 'inicio' as const, label: 'Hoy', shortLabel: 'Hoy', icon: Home },
    { key: 'plan' as const, label: 'Mi Plan', shortLabel: 'Plan', icon: Calendar },
    { key: 'calorias' as const, label: 'Progreso', shortLabel: 'Progreso', icon: Flame },
    { key: 'compras' as const, label: 'Compras', shortLabel: 'Compras', icon: ShoppingCart },
    { key: 'resumen' as const, label: 'Perfil', shortLabel: 'Perfil', icon: UserRound },
  ];

  const mobileNavigationBar = (
    <nav
      ref={mobileNavRef}
      className="relative z-50 w-full max-w-full shrink-0 overflow-x-clip sm:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
      aria-label="Navegación principal móvil"
    >
      <div className="relative mx-auto w-full max-w-md px-4">
        <div className="surface-raised grid grid-cols-5 gap-0.5 border border-[var(--ui-border)] p-1 backdrop-blur-2xl">
          {tabItems.map((tabItem) => {
            const isActive = activeTab === tabItem.key;
            return (
              <motion.button
                key={tabItem.key}
                type="button"
                onClick={() => {
                  setActiveTab(tabItem.key);
                }}
                data-testid={`mobile-tab-${tabItem.key}`}
                whileTap={{ scale: 0.9 }}
                className={`relative isolate flex min-h-[52px] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-cream-100'
                }`}
                aria-label={tabItem.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 -z-10 rounded-2xl bg-ink-900 dark:bg-cream-100"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <tabItem.icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.5 : 1.9} />
                <span className={`text-xs leading-none ${isActive ? 'font-extrabold dark:text-ink-900' : 'font-semibold'}`}>
                  {tabItem.shortLabel}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );

  const desktopNavigationBar = (
    <nav
      className="hidden sm:block xl:sticky xl:top-[76px] xl:col-start-1"
      aria-label="Navegación principal"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="surface-card grid grid-cols-5 gap-1 p-1.5 xl:grid-cols-1 xl:p-2"
      >
        {tabItems.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setActiveTab(tabItem.key)}
            className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors active:scale-[0.98] xl:justify-start ${activeTab === tabItem.key
              ? 'bg-ink-900 text-cream-50 dark:bg-cream-100 dark:text-ink-900'
              : 'text-ink-600 hover:bg-cream-100 hover:text-ink-900 dark:text-ink-200 dark:hover:bg-ink-800 dark:hover:text-cream-100'
              }`}
          >
            <tabItem.icon className="h-4 w-4 flex-shrink-0" />
            <span>{tabItem.label}</span>
          </button>
        ))}
      </motion.div>
    </nav>
  );

  // ── EARLY RETURNS (after all hooks) ──────────────────────────────────
  if (isQuestionnaireOpen) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-ink-950">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-cream-200 bg-cream-50/90 px-4 py-3 backdrop-blur-xl dark:border-ink-700 dark:bg-ink-950/90 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-pine-700 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-tight text-ink-900 dark:text-cream-100">
                Generar mi plan
              </h1>
              <p className="text-xs text-ink-400 dark:text-ink-400">
                {questionnaireStepIndex > 0
                  ? `Guardado · paso ${questionnaireStepIndex + 1}`
                  : 'Sólo lo esencial · puedes continuar después'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-white text-ink-500 transition-colors hover:bg-cream-100 dark:border-ink-700 dark:bg-ink-900 dark:text-cream-200 dark:hover:bg-ink-800"
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setIsQuestionnaireOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cream-100 text-ink-500 transition-colors hover:bg-cream-200 dark:bg-ink-800 dark:text-cream-200 dark:hover:bg-ink-700"
              aria-label="Cerrar cuestionario"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 py-3 pb-24 sm:px-6 sm:py-6">
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
        className="flex h-[100svh] w-full flex-col overflow-hidden bg-cream-50 text-ink-900 dark:bg-ink-950 dark:text-cream-100 sm:min-h-[100dvh] sm:overflow-x-hidden"
        data-profile={activeProfile}
      >
        {!isChromeHidden && <Header />}
        <main className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden sm:grid sm:grid-rows-[auto_minmax(0,1fr)] sm:gap-5 sm:px-6 sm:py-4 xl:grid-cols-[210px_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)] xl:items-start">
          {desktopNavigationBar}
          <section className="flex min-h-0 min-w-0 xl:col-start-2">
            <LandingView />
          </section>
        </main>
        {!isChromeHidden && mobileNavigationBar}
      </div>
    );
  }

  return (
      <div
        className="flex h-[100svh] w-full flex-col overflow-hidden overscroll-x-none bg-cream-50 transition-colors duration-200 dark:bg-ink-950 sm:block sm:min-h-[100svh] sm:h-auto sm:overflow-x-hidden"
        data-profile={activeProfile}
      >
      {!isChromeHidden && <Header />}

      <main ref={contentScrollRef} className="relative z-0 mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-x-none px-4 py-4 pb-4 sm:grid sm:min-h-0 sm:flex-none sm:grid-cols-1 sm:gap-5 sm:overflow-visible sm:px-6 sm:pb-8 xl:grid-cols-[210px_minmax(0,1fr)] xl:items-start">
        {desktopNavigationBar}

        <section className="min-w-0 xl:col-start-2">
          <AnimatePresence mode="wait">
            <Suspense fallback={<ViewFallback />}>
              {activeTab === 'plan' && <PlanView />}
              {activeTab === 'suplementos' && <SupplementsView />}
              {activeTab === 'calorias' && <CalorieMonitoringView />}
              {activeTab === 'resumen' && <SummaryView />}
              {activeTab === 'compras' && <ShoppingView />}
            </Suspense>
          </AnimatePresence>
        </section>
      </main>

      {!isChromeHidden && mobileNavigationBar}

      <footer className="hidden bg-transparent mt-10 sm:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-ink-400 text-xs sm:text-sm dark:text-ink-400">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-3.5 h-3.5" />
          Plan de alimentación personalizado · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
