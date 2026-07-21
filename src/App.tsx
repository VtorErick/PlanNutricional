import { Suspense, lazy, useMemo, useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChefHat,
  Flame,
  Home,
  Lightbulb,
  Moon,
  ShoppingCart,
  Sparkles,
  Sun,
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
    <div className="rounded-[28px] border border-cream-200 bg-white p-6 shadow-soft dark:border-ink-700 dark:bg-ink-900">
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

  const desktopTabBackdrop = useMemo(() => {
    switch (activeTab) {
      case 'plan':
        return {
          imageSrc: '/images/hero.png',
          imagePosition: 'center 22%',
          overlay: 'from-pine-200/40 via-cream-50/40 to-transparent',
        };
      case 'compras':
        return {
          imageSrc: '/images/meal-prep.png',
          imagePosition: 'center 26%',
          overlay: 'from-apricot-200/35 via-cream-50/35 to-transparent',
        };
      case 'resumen':
        return {
          imageSrc: '/images/hero.png',
          imagePosition: 'center 18%',
          overlay: 'from-pine-200/35 via-cream-50/35 to-transparent',
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

  // ── Mobile nav active tint by active profile ──
  const navActiveSurface = useMemo(() => {
    switch (activeProfile) {
      case 'el':
        return 'bg-ocean-600 text-white shadow-[0_8px_20px_-6px_rgba(47,107,255,0.45)]';
      case 'ella':
        return 'bg-coral-500 text-white shadow-[0_8px_20px_-6px_rgba(249,47,124,0.45)]';
      case 'ambos':
        return 'bg-pine-600 text-white shadow-[0_8px_20px_-6px_rgba(234,65,9,0.45)]';
      default:
        return 'bg-ink-900 text-white shadow-[0_8px_20px_-6px_rgba(23,23,27,0.5)]';
    }
  }, [activeProfile]);

  const mobileNavigationBar = (
    <nav
      ref={mobileNavRef}
      className="fixed inset-x-0 bottom-0 z-50 w-full max-w-full overflow-x-clip sm:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
      aria-label="Navegación principal móvil"
    >
      <div className="mx-auto w-full max-w-md px-4">
        <div className="grid grid-cols-5 gap-1 rounded-[26px] border border-white/80 bg-white/88 p-1.5 shadow-[0_18px_50px_-22px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-ink-700/80 dark:bg-ink-900/90">
          {tabItems.map((tabItem) => {
            const isActive = activeTab === tabItem.key;
            return (
              <motion.button
                key={tabItem.key}
                type="button"
                onClick={() => setActiveTab(tabItem.key)}
                data-testid={`mobile-tab-${tabItem.key}`}
                whileTap={{ scale: 0.9 }}
                className={`relative isolate flex min-h-[54px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[20px] transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-ink-400 hover:text-ink-600 dark:text-ink-400 dark:hover:text-ink-200'
                }`}
                aria-label={tabItem.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className={`absolute inset-0 -z-10 rounded-[20px] ${navActiveSurface}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <tabItem.icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.5 : 1.9} />
                <span className={`text-[10px] leading-none ${isActive ? 'font-black' : 'font-semibold'}`}>
                  {tabItem.shortLabel}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
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
                Generar plan con IA
              </h1>
              <p className="hidden text-[11px] text-ink-400 dark:text-ink-400 sm:block">
                Completa el formulario para crear y aplicar un plan personalizado.
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

        <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6">
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
        <LandingView />
        {!isChromeHidden && mobileNavigationBar}
      </div>
    );
  }

  return (
      <div
        className="min-h-[100svh] w-full overflow-x-hidden overscroll-x-none bg-cream-50 transition-colors duration-200 dark:bg-ink-950"
        data-profile={activeProfile}
      >
      {!isChromeHidden && <Header />}

      <main className="relative z-0 mx-auto w-full max-w-5xl min-w-0 px-4 py-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:px-6 sm:pb-8 space-y-4">
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
            <div className="absolute inset-0 bg-gradient-to-b from-cream-50/15 via-cream-50/55 to-cream-50/95 dark:from-ink-950/25 dark:via-ink-950/50 dark:to-ink-950/90" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
          </div>
        ) : null}

        <div className="hidden sm:block sticky top-[76px] z-40">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="grid grid-cols-5 gap-1.5 rounded-full border border-cream-200/90 bg-white/85 p-1.5 shadow-lift backdrop-blur-xl dark:border-ink-700/80 dark:bg-ink-900/85"
          >
            {tabItems.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setActiveTab(tabItem.key)}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300 active:scale-[0.98] ${activeTab === tabItem.key
                  ? 'bg-ink-900 text-cream-50 shadow-sm dark:bg-cream-100 dark:text-ink-900'
                  : 'text-ink-500 hover:bg-cream-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-cream-100'
                  }`}
              >
                <tabItem.icon className="h-4 w-4 flex-shrink-0" />
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

      {!isChromeHidden && mobileNavigationBar}

      <footer className="hidden bg-transparent mt-10 sm:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-ink-400 text-xs sm:text-sm dark:text-ink-400">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-3.5 h-3.5" />
            Plan de alimentación personalizado - 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
