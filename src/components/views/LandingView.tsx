import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Moon,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';

const landingFeatures: { title: string; text: string; Icon: ElementType }[] = [
  { title: 'Plan diario', text: 'Tus tiempos y platillos del dia.', Icon: CalendarDays },
  { title: 'Progreso', text: 'Marca lo que ya comiste.', Icon: Sparkles },
  { title: 'Compras', text: 'Ingredientes listos para surtir.', Icon: ShoppingCart },
];

const createDefaultQuestionnairePerson = (
  weight: string,
  height: string,
  age = '',
  targetWeightKg = ''
) => ({
  age,
  currentWeightKg: weight,
  heightCm: height,
  targetWeightKg,
  objectives: [],
  objectiveTimeline: '12 sem',
  diagnostics: '',
  allergies: '',
  medications: '',
  intolerances: '',
  digestiveSymptoms: '',
  favoriteFoods: '',
  dislikedFoods: '',
  favoriteCuisineStyles: '',
  cookingTime: '',
  activityLevel: 'Moderado',
  wakeTime: '',
  sleepTime: '',
  trainingFrequency: '',
  bodyMeasurements: {
    waistCm: '',
    hipCm: '',
    neckCm: '',
    chestCm: '',
    armCm: '',
    thighCm: '',
  },
  assessmentReportPdf: null,
});

export default function LandingView() {
  const {
    setPerfilActivo: setActiveProfile,
    setDiaActivo: setActiveDay,
    setTab: setActiveTab,
    dataVersions,
    setShowAdmin: setIsAdminOpen,
    setShowQuestionnaire: setIsQuestionnaireOpen,
    setQuestionnaireTargetProfile,
    setQuestionnaireStepIdx,
    setQuestionnaireEl,
    setQuestionnaireElla,
    setQuestionnairePortionMode,
    setQuestionnaireManualPortions,
    setQuestionnaireAdditionalNotes,
    isDarkMode,
    setIsDarkMode,
  } = useDiet();

  const elReady = dataVersions.el === 'custom';
  const ellaReady = dataVersions.ella === 'custom';
  const hasPlan = elReady || ellaReady;

  const openQuestionnaire = () => {
    setQuestionnaireTargetProfile('ambos');
    setQuestionnaireStepIdx(0, 'ambos');
    setQuestionnaireEl((prev: any) =>
      prev && (prev.currentWeightKg || prev.age)
        ? prev
        : createDefaultQuestionnairePerson('80', '170', '30', '70')
    );
    setQuestionnaireElla((prev: any) =>
      prev && (prev.currentWeightKg || prev.age)
        ? prev
        : createDefaultQuestionnairePerson('65', '162', '28', '57')
    );
    setQuestionnairePortionMode('auto');
    setQuestionnaireManualPortions({});
    setQuestionnaireAdditionalNotes('');
    setIsQuestionnaireOpen(true);
  };

  const openPlan = () => {
    const nextProfile = elReady && ellaReady ? 'ambos' : elReady ? 'el' : ellaReady ? 'ella' : 'ambos';
    if (!hasPlan) {
      openQuestionnaire();
      return;
    }

    setActiveProfile(nextProfile);
    setActiveDay('Lunes');
    setActiveTab('plan');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight">Plan Nutricional</p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                Tu plan diario
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              data-testid="landing-admin-button"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Configuracion"
              title="Configuracion"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center gap-5 py-8 sm:py-12">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            data-testid="landing-profile-ambos-card"
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-200">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                  Lleva tu plan sin complicarte
                </h1>
                <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Revisa comidas, progreso y compras desde una sola app. Ajusta el plan solo cuando lo necesites.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={openPlan}
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] transition hover:brightness-105 active:scale-[0.98]"
              >
                <span>{hasPlan ? 'Ver mi plan' : 'Crear mi plan'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openQuestionnaire}
                data-testid="landing-customize-ambos"
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span>Personalizar mi plan</span>
              </button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 360, damping: 34 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            {landingFeatures.map(({ title, text, Icon }) => (
              <div
                key={String(title)}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <Icon className="mb-3 h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-black">{title}</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </motion.section>
        </main>
      </div>
    </div>
  );
}
