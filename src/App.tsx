import { Suspense, lazy, useMemo, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  ChefHat,
  Flame,
  Home,
  Lightbulb,
  MoreHorizontal,
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

function getStoredProfileFromLocalStorage(): import('./context/DietContext').PerfilActivo {
  try {
    const raw = window.localStorage.getItem('perfilActivo');
    return raw === 'el' || raw === 'ella' || raw === 'ambos' ? raw : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [showMobileMore, setShowMobileMore] = useState(false);
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
    if (activeProfile) {
      lastProfileRef.current = activeProfile;
    }
  }, [activeProfile]);

  useEffect(() => {
    if (!activeTab && activeProfile) {
      setActiveTab('plan');
    }
  }, [activeTab, activeProfile, setActiveTab]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setShowMobileMore(false);
  }, [activeTab]);

  // Close "Más" menu when clicking outside the mobile nav
  useEffect(() => {
    if (!showMobileMore) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node)) return;
      if (mobileNavRef.current?.contains(e.target)) return;
      setShowMobileMore(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showMobileMore]);

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

  // 🔹 ORDEN DE TABS: 'plan' es el primero (principal) por defecto
  const tabItems = [
    { key: 'plan' as const, label: 'Mi Plan', shortLabel: 'Plan', icon: Calendar },
    { key: 'equivalencias' as const, label: 'Equivalencias', shortLabel: 'Equiv.', icon: BookOpen },
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

  // ── Mobile nav active tint by active profile (uniform shadow size to prevent jump) ──
  const navActiveTint = useMemo(() => {
    switch (activeProfile) {
      case 'el':
        return 'bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.30)]';
      case 'ella':
        return 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_8px_20px_rgba(236,72,153,0.30)]';
      case 'ambos':
      default:
        return 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.30)]';
    }
  }, [activeProfile]);

  const planTabs = ['plan', 'compras', 'equivalencias'] as const;
  const summaryTabs = ['resumen', 'calorias', 'suplementos'] as const;
  const isSummaryMode = summaryTabs.some((tab) => tab === activeTab);
  const visibleTabKeys = isSummaryMode ? summaryTabs : planTabs;
  const visibleTabs = visibleTabKeys
    .map((tabKey) => tabItems.find((item) => item.key === tabKey))
    .filter((item): item is (typeof tabItems)[number] => Boolean(item));
  const modeAnchors = [
    {
      key: 'plan' as const,
      label: 'Plan diario',
      shortLabel: 'Plan',
      icon: Calendar,
      targetTab: 'plan' as const,
      helper: isSummaryMode ? 'Ver comidas' : 'Ir a resumen',
      tint: 'from-sky-500 to-blue-600',
    },
    {
      key: 'resumen' as const,
      label: 'Analisis',
      shortLabel: 'Resumen',
      icon: Lightbulb,
      targetTab: 'resumen' as const,
      helper: isSummaryMode ? 'Volver al plan' : 'Kcal y sups',
      tint: 'from-violet-500 to-fuchsia-600',
    },
  ];
  const activeModeKey = isSummaryMode ? 'resumen' : 'plan';
  const activeMode = modeAnchors.find((mode) => mode.key === activeModeKey) ?? modeAnchors[0];

  const handleModeAnchorClick = () => {
    setActiveTab(isSummaryMode ? 'plan' : 'resumen');
  };

  const getMobileTabLabel = (tabKey: (typeof tabItems)[number]['key']) => {
    if (tabKey === 'plan') return 'Mi plan';
    if (tabKey === 'equivalencias') return 'Equivalencias';
    if (tabKey === 'suplementos') return 'Suplementos';
    if (tabKey === 'calorias') return 'Calorías';
    return tabItems.find((item) => item.key === tabKey)?.shortLabel ?? '';
  };
  const moreTabKeys = ['resumen', 'equivalencias', 'suplementos'] as const;
  const moreTabs = moreTabKeys
    .map((tabKey) => tabItems.find((item) => item.key === tabKey))
    .filter((item): item is (typeof tabItems)[number] => Boolean(item));
  const moreTabActive = moreTabs.some((item) => item.key === activeTab);

  const mobileNavigationBar = (
    <nav
      ref={mobileNavRef}
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal móvil"
    >
      {showMobileMore ? (
        <div className="mx-auto max-w-md px-3 pt-2">
          <div className={`grid grid-cols-3 gap-2 rounded-[24px] border p-2 shadow-[0_14px_34px_rgba(15,23,42,0.14)] ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            {moreTabs.map((tabItem) => (
              <button
                key={tabItem.key}
                type="button"
                onClick={() => {
                  if (!activeProfile) {
                    setActiveProfile(lastProfileRef.current || 'ambos');
                    setActiveDay('Lunes');
                  }
                  setActiveTab(tabItem.key);
                  setShowMobileMore(false);
                }}
                data-testid={`mobile-tab-${tabItem.key}`}
                className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black transition active:scale-95 ${
                  activeTab === tabItem.key
                    ? navActiveTint
                    : isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <tabItem.icon className="h-4 w-4" />
                <span>{getMobileTabLabel(tabItem.key)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-md px-3 py-2">
        <div className="grid grid-cols-5 gap-0.5 rounded-[24px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.13)]">
          <button
            type="button"
            onClick={() => {
              setActiveProfile(null);
              setShowMobileMore(false);
            }}
            data-testid="mobile-tab-inicio"
            className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-0.5 rounded-[18px] transition-all duration-200 active:scale-95 ${
              !activeProfile
                ? navActiveTint
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Home className={`h-[17px] w-[17px] ${!activeProfile ? 'text-white' : ''}`} strokeWidth={!activeProfile ? 2.5 : 1.8} />
            <span className="text-[9px] font-bold tracking-wide">Inicio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!activeProfile) {
                setActiveProfile(lastProfileRef.current || 'ambos');
                setActiveDay('Lunes');
              }
              setActiveTab('plan');
              setShowMobileMore(false);
            }}
            data-testid="mobile-tab-plan"
            className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-0.5 rounded-[18px] transition-all duration-200 active:scale-95 ${
              activeProfile && activeTab === 'plan'
                ? navActiveTint
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Calendar className={`h-[17px] w-[17px] ${activeProfile && activeTab === 'plan' ? 'text-white dark:text-slate-950' : ''}`} strokeWidth={activeProfile && activeTab === 'plan' ? 2.5 : 1.8} />
            <span className="text-[9px] font-bold tracking-wide">Plan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!activeProfile) {
                setActiveProfile(lastProfileRef.current || 'ambos');
                setActiveDay('Lunes');
              }
              setActiveTab('calorias');
              setShowMobileMore(false);
            }}
            data-testid="mobile-tab-calorias"
            className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-0.5 rounded-[18px] transition-all duration-200 active:scale-95 ${
              activeProfile && activeTab === 'calorias'
                ? navActiveTint
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Flame className={`h-[17px] w-[17px] ${activeProfile && activeTab === 'calorias' ? 'text-white dark:text-slate-950' : ''}`} strokeWidth={activeProfile && activeTab === 'calorias' ? 2.5 : 1.8} />
            <span className="text-[9px] font-bold tracking-wide">Progreso</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!activeProfile) {
                setActiveProfile(lastProfileRef.current || 'ambos');
                setActiveDay('Lunes');
              }
              setActiveTab('compras');
              setShowMobileMore(false);
            }}
            data-testid="mobile-tab-compras"
            className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-0.5 rounded-[18px] transition-all duration-200 active:scale-95 ${
              activeProfile && activeTab === 'compras'
                ? navActiveTint
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <ShoppingCart className={`h-[17px] w-[17px] ${activeProfile && activeTab === 'compras' ? 'text-white dark:text-slate-950' : ''}`} strokeWidth={activeProfile && activeTab === 'compras' ? 2.5 : 1.8} />
            <span className="text-[9px] font-bold tracking-wide">Compras</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMobileMore((value) => !value)}
            data-testid="mobile-more-button"
            className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 px-0.5 rounded-[18px] transition-all duration-200 active:scale-95 ${
              activeProfile && (moreTabActive || showMobileMore)
                ? navActiveTint
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <MoreHorizontal className="h-[17px] w-[17px]" strokeWidth={activeProfile && (moreTabActive || showMobileMore) ? 2.5 : 1.8} />
            <span className="text-[9px] font-bold tracking-wide">Más</span>
          </button>
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
                  setActiveDay('Lunes');
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

  if (!activeProfile) {
    return (
      <>
        <LandingView />
        {mobileNavigationBar}
      </>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      data-profile={activeProfile}
    >
      {!isPlanAdjustOpen && <Header />}

      {activeTab === 'plan' && !isPlanAdjustOpen ? <DailyProgress /> : null}

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
            className="grid grid-cols-[184px_1fr] gap-2 rounded-[26px] border border-white/70 bg-white/88 p-2 shadow-[0_18px_46px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/88"
          >
            <button
              type="button"
              onClick={handleModeAnchorClick}
              className={`flex min-h-[64px] items-center gap-3 rounded-[20px] bg-gradient-to-br ${activeMode.tint} px-4 py-3 text-left text-white shadow-sm transition-all duration-300 active:scale-[0.98]`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/18">
                <activeMode.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold leading-tight">{activeMode.label}</span>
                <span className="block truncate text-[11px] font-bold text-white/78">{activeMode.helper}</span>
              </span>
            </button>

            <div className="grid grid-cols-3 gap-1.5">
              {visibleTabs.map((tabItem) => (
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
            </div>
          </motion.div>
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

      {mobileNavigationBar}

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
