import { motion } from 'framer-motion';
import {
  ChefHat,
  ClipboardList,
  ListChecks,
  Moon,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getCombinedProfileLabel } from '../../utils/profileLabels';

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
    diaActivo: activeDay,
    perfilesData: profilesData,
    selecciones: selections,
    profileLabels,
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
  const profileLabel = getCombinedProfileLabel(profileLabels);

  const todayStatus = (() => {
    const profiles = ['el', 'ella'] as const;
    const moments = profilesData.el?.momentos || [];
    let completed = 0;
    let total = 0;
    let nextMoment = null as (typeof moments)[number] | null;

    for (const moment of moments) {
      let momentDoneForEveryone = true;

      for (const profileId of profiles) {
        total += 1;
        const meals = profilesData[profileId]?.plan?.[activeDay]?.[moment.key] || [];
        const isDone = meals.some((meal: any) =>
          selections[`${profileId}-${activeDay}-${moment.key}-${meal.nombre}`]
        );

        if (isDone) {
          completed += 1;
        } else {
          momentDoneForEveryone = false;
        }
      }

      if (!momentDoneForEveryone && !nextMoment) {
        nextMoment = moment;
      }
    }

    return {
      completed,
      total,
      nextMoment,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  })();

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
    const nextProfile = elReady || ellaReady ? (elReady && ellaReady ? 'ambos' : elReady ? 'el' : 'ella') : 'ambos';
    setActiveProfile(nextProfile);
    setActiveDay(activeDay);
    setActiveTab('plan');
  };

  const openShopping = () => {
    setActiveProfile('ambos');
    setActiveDay(activeDay);
    setActiveTab('compras');
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
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-200">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                  {activeDay} - {profileLabel}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
                  Que toca hoy
                </h1>
                <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Usa el inicio para seguir tu dia: elige platillos, marca lo que ya comiste y revisa compras sin meterte a ajustes.
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Siguiente paso
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-50">
                    {todayStatus.nextMoment
                      ? `${todayStatus.nextMoment.label} - ${todayStatus.nextMoment.hora}`
                      : 'Plan del dia'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {todayStatus.percent >= 100
                      ? 'Dia completado. Puedes revisar compras o preparar manana.'
                      : 'Elige o marca el platillo pendiente para mantener tu avance.'}
                  </p>
                </div>
                <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  <span className="text-base font-black tabular-nums">{todayStatus.percent}%</span>
                  <span className="text-[10px] font-bold text-slate-400">hoy</span>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                  style={{ width: `${todayStatus.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-400">
                {todayStatus.completed} de {todayStatus.total} tiempos marcados
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={openPlan}
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <span>{hasPlan ? 'Ver mi plan' : 'Ver plan base'}</span>
              </button>
              <button
                type="button"
                onClick={openShopping}
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                <span>Compras</span>
              </button>
              <button
                type="button"
                onClick={openQuestionnaire}
                data-testid="landing-customize-ambos"
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] transition hover:brightness-105 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-blue-100" />
                <span>Personalizar mi plan</span>
              </button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
              <ListChecks className="h-3.5 w-3.5" />
              Personalizar vuelve a generar el plan con IA; lo demas es para usar tu plan actual.
            </p>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
