import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import type { MealItem, MealTime } from '../../types';
import { getMealEmoji } from '../../utils/mealEmoji';
import { getProfileLabel } from '../../utils/profileLabels';
import { getAccentColors } from '../../utils/theme';

const MEAL_WINDOW_MINUTES = 75;
const PROFILE_IDS = ['el', 'ella'] as const;
const AVAILABLE_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;

function parseTimeToMinutes(value: string) {
  const [rawHour, rawMinute] = value.split(':').map((part) => Number.parseInt(part, 10));
  const hour = Number.isFinite(rawHour) ? rawHour : 0;
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0;
  return hour * 60 + minute;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentDayOfWeek(): typeof AVAILABLE_DAYS[number] {
  const dayIndex = (new Date().getDay() + 6) % 7;
  return AVAILABLE_DAYS[dayIndex];
}

function formatMinutesAsTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getGreeting(currentMinutes: number) {
  if (currentMinutes < 12 * 60) return 'Buenos días';
  if (currentMinutes < 19 * 60) return 'Buenas tardes';
  return 'Buenas noches';
}

function getRelevantMoment(moments: MealTime[], currentMinutes: number) {
  if (moments.length === 0) return null;

  const withMinutes = moments.map((moment) => ({
    moment,
    minutes: parseTimeToMinutes(moment.hora),
  }));
  const previous = [...withMinutes].reverse().find((item) => item.minutes <= currentMinutes);
  const next = withMinutes.find((item) => item.minutes > currentMinutes);

  if (previous && currentMinutes - previous.minutes <= MEAL_WINDOW_MINUTES) {
    return previous.moment;
  }

  return next?.moment || previous?.moment || moments[0];
}

function getMomentActionName(label: string) {
  return label.replace(/\s+(AM|PM)$/i, '').trim().toLowerCase();
}

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
    perfilActivo,
    perfilesData: profilesData,
    selecciones: selections,
    profileLabels,
    dataVersions,
    setTab,
    setDiaActivo,
    scrollToMomento,
    setShowQuestionnaire: setIsQuestionnaireOpen,
    setQuestionnaireTargetProfile,
    setQuestionnaireStepIdx,
    setQuestionnaireEl,
    setQuestionnaireElla,
    setQuestionnairePortionMode,
    setQuestionnaireManualPortions,
    setQuestionnaireAdditionalNotes,
    questionnaireStepIdx,
    questionnaireTargetProfile,
    completadosCount,
    totalMomentosProgress,
    isDarkMode,
  } = useDiet();

  const accent = getAccentColors(perfilActivo || 'ambos', isDarkMode);
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState(getCurrentDayOfWeek);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
      setCurrentDayOfWeek(getCurrentDayOfWeek());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const homeCards = useMemo(() => {
    const moments = profilesData.el?.momentos || [];
    const relevantMoment = getRelevantMoment(moments, currentMinutes);
    const activeProfileIds: Array<'el' | 'ella'> =
      perfilActivo === 'el' ? ['el'] : perfilActivo === 'ella' ? ['ella'] : [...PROFILE_IDS];

    return moments.map((moment) => {
      const selectedMeals = activeProfileIds.map((profileId) => {
        const meals = profilesData[profileId]?.plan?.[currentDayOfWeek]?.[moment.key] || [];
        const selectedMeal = meals.find((meal: MealItem) =>
          selections[`${profileId}-${currentDayOfWeek}-${moment.key}-${meal.nombre}`]
        );

        return {
          profileId,
          label: getProfileLabel(profileLabels, profileId),
          meal: selectedMeal || null,
        };
      });

      const selectedMealGroups = Array.from(
        selectedMeals
          .filter((item): item is typeof item & { meal: MealItem } => Boolean(item.meal))
          .reduce((groups, item) => {
            const key = `${item.meal.nombre}-${item.meal.detalle}`;
            const current = groups.get(key) || { labels: [] as string[], meal: item.meal };
            current.labels.push(item.label);
            groups.set(key, current);
            return groups;
          }, new Map<string, { labels: string[]; meal: MealItem }>())
          .values()
      );

      return {
        moment,
        selectedMeals,
        selectedMealGroups,
        selectedCount: selectedMeals.filter((item) => item.meal).length,
        isRelevant: relevantMoment?.key === moment.key,
      };
    });
  }, [currentDayOfWeek, currentMinutes, perfilActivo, profileLabels, profilesData, selections]);

  const activeCard = homeCards.find((card) => card.isRelevant) || homeCards[0] || null;
  const targetProfiles = perfilActivo === 'el' || perfilActivo === 'ella' ? 1 : 2;
  const plannedMealTarget = homeCards.length * targetProfiles;
  const plannedMealCount = homeCards.reduce((total, card) => total + card.selectedCount, 0);
  const dayPlanningProgress = plannedMealTarget > 0
    ? Math.round((plannedMealCount / plannedMealTarget) * 100)
    : 0;
  const completionProgress = totalMomentosProgress > 0
    ? Math.round((completadosCount / totalMomentosProgress) * 100)
    : 0;
  const hasPersonalizedPlan =
    perfilActivo === 'el'
      ? dataVersions.el === 'custom'
      : perfilActivo === 'ella'
        ? dataVersions.ella === 'custom'
        : dataVersions.el === 'custom' || dataVersions.ella === 'custom';
  const missingPlanProfile =
    perfilActivo === 'ambos' && dataVersions.el === 'custom' && dataVersions.ella !== 'custom'
      ? 'ella'
      : perfilActivo === 'ambos' && dataVersions.ella === 'custom' && dataVersions.el !== 'custom'
        ? 'el'
        : null;
  const activeMomentName = activeCard ? getMomentActionName(activeCard.moment.label) : 'comida';
  const activeMealReady = Boolean(activeCard && activeCard.selectedCount === targetProfiles);

  const openMealMoment = (momentKey: string) => {
    setDiaActivo(currentDayOfWeek);
    setTab('plan');
    window.setTimeout(() => scrollToMomento(momentKey, false), 120);
  };

  const openQuestionnaire = (
    target: 'el' | 'ella' | 'ambos' = perfilActivo === 'ambos' ? 'ambos' : (perfilActivo ?? 'el')
  ) => {
    const shouldResume = questionnaireStepIdx > 0 && questionnaireTargetProfile === target;
    setQuestionnaireTargetProfile(target);
    if (!shouldResume) setQuestionnaireStepIdx(0, target);

    setQuestionnaireEl((previous: any) =>
      previous && (previous.currentWeightKg || previous.age)
        ? previous
        : createDefaultQuestionnairePerson('80', '170', '30', '70')
    );
    setQuestionnaireElla((previous: any) =>
      previous && (previous.currentWeightKg || previous.age)
        ? previous
        : createDefaultQuestionnairePerson('65', '162', '28', '57')
    );

    if (!shouldResume) {
      setQuestionnairePortionMode('auto');
      setQuestionnaireManualPortions({});
      setQuestionnaireAdditionalNotes('');
    }
    setIsQuestionnaireOpen(true);
  };

  return (
    <div className="relative flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-cream-50 text-ink-900 dark:bg-ink-950 dark:text-cream-100">
      <div aria-hidden="true" className="home-food-halo pointer-events-none absolute -right-28 -top-36 h-[28rem] w-[28rem] opacity-[0.055] dark:mix-blend-luminosity dark:opacity-[0.035]" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pb-[108px] pt-5 sm:px-6 sm:pb-10 sm:pt-10">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-pine-700 dark:text-pine-300">
            {currentDayOfWeek} · {formatMinutesAsTime(currentMinutes)}
          </p>
          <h1 className="mt-1 font-display text-[34px] font-semibold leading-none tracking-tight text-ink-900 dark:text-cream-50 sm:text-5xl">
            {getGreeting(currentMinutes)}
          </h1>
        </motion.header>

        {!hasPersonalizedPlan ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="landing-daily-focus"
            className="max-w-3xl rounded-[24px] border border-cream-200 bg-white p-5 shadow-soft dark:border-ink-700 dark:bg-ink-900 sm:p-7"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-pine-600 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-pine-700 dark:text-pine-300">Tu punto de partida</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-cream-50 sm:text-3xl">
                  Crea un plan que se adapte a ti
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 dark:text-ink-200">
                  Cuéntanos lo esencial. Guardaremos tu avance y podrás ajustar cualquier respuesta después.
                </p>
              </div>
            </div>

            <div className="my-5 grid gap-2 border-y border-cream-200 py-4 text-sm text-ink-600 dark:border-ink-700 dark:text-ink-200 sm:grid-cols-3">
              {['Tus objetivos', 'Tus horarios', 'Tus preferencias'].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pine-600 dark:text-pine-300" />
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openQuestionnaire()}
              data-testid="landing-customize-ambos"
              className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-pine-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-pine-700 active:scale-[0.99] sm:w-auto"
            >
              {questionnaireStepIdx > 0 ? `Continuar desde el paso ${questionnaireStepIdx + 1}` : 'Crear mi plan con IA'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-start">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid="landing-profile-ambos-card"
              className="overflow-hidden rounded-[26px] border border-cream-200 bg-white shadow-soft dark:border-ink-700 dark:bg-ink-900"
            >
              <div className="flex items-start justify-between gap-4 border-b border-cream-200 p-5 dark:border-ink-700 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] ${accent.tagBg} ${accent.text}`}>
                    <UtensilsCrossed className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-300">Siguiente comida</p>
                    <h2 className="mt-0.5 truncate font-display text-2xl font-semibold text-ink-900 dark:text-cream-50">
                      {activeCard?.moment.label || 'Comida'}
                    </h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 text-sm font-bold tabular-nums text-ink-700 dark:bg-ink-800 dark:text-cream-100">
                  <Clock className="h-4 w-4" />
                  {activeCard?.moment.hora || '--:--'}
                </span>
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                {activeCard?.selectedMealGroups.length ? activeCard.selectedMealGroups.map(({ labels, meal }) => (
                  <div key={`${labels.join('-')}-${meal.nombre}`} className="flex items-center gap-3 border-b border-cream-200 pb-3 last:border-0 last:pb-0 dark:border-ink-700">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-100 text-xl dark:bg-ink-800">
                      {getMealEmoji(meal.nombre)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink-500 dark:text-ink-300">
                        {labels.length > 1 ? 'Para ambos' : labels[0]}
                      </p>
                      <p className="truncate text-sm font-bold text-ink-900 dark:text-cream-100">{meal.nombre}</p>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-ink-500 dark:text-ink-300">{meal.caloriasKcal || 0} kcal</span>
                  </div>
                )) : (
                  <div className="py-2">
                    <p className="font-display text-lg font-semibold text-ink-800 dark:text-cream-100">Aún no has elegido</p>
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Elige una opción del plan cuando estés listo.</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => activeCard && openMealMoment(activeCard.moment.key)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[16px] bg-ink-900 px-4 text-sm font-extrabold text-white transition hover:bg-ink-800 active:scale-[0.99] dark:bg-cream-100 dark:text-ink-900"
                >
                  {activeMealReady ? `Ver ${activeMomentName}` : `Elegir ${activeMomentName}`}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => activeCard && openMealMoment(activeCard.moment.key)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-cream-200 text-xs font-bold text-ink-600 dark:border-ink-700 dark:text-ink-200"
                  >
                    <Camera className="h-4 w-4" />
                    Registrar comida
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('plan')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-cream-200 text-xs font-bold text-ink-600 dark:border-ink-700 dark:text-ink-200"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Ver todo el plan
                  </button>
                </div>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="rounded-[24px] border border-cream-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-300">Tu día</p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink-900 dark:text-cream-50">
                    {completadosCount} de {totalMomentosProgress} completadas
                  </p>
                </div>
                <span className={`text-2xl font-semibold tabular-nums ${accent.text}`}>{completionProgress}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-ink-700">
                <motion.div className="h-full rounded-full bg-pine-600" animate={{ width: `${completionProgress}%` }} />
              </div>
              <p className="mt-3 text-sm text-ink-500 dark:text-ink-300">
                {plannedMealCount} de {plannedMealTarget} comidas elegidas · {dayPlanningProgress}% del día planeado.
              </p>

              {missingPlanProfile ? (
                <button
                  type="button"
                  onClick={() => openQuestionnaire(missingPlanProfile)}
                  data-testid="landing-create-missing-plan"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-pine-200 bg-pine-50 text-sm font-bold text-pine-800 dark:border-pine-900 dark:bg-pine-950/50 dark:text-pine-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Crear plan para {getProfileLabel(profileLabels, missingPlanProfile)}
                </button>
              ) : null}
            </motion.aside>
          </div>
        )}
      </main>
    </div>
  );
}
