import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  Clock,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import type { MealItem, MealTime } from '../../types';
import { getCombinedProfileLabel, getProfileLabel } from '../../utils/profileLabels';

const MEAL_WINDOW_MINUTES = 75;
const PROFILE_IDS = ['el', 'ella'] as const;

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

function formatMinutesAsTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
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
  const planStatusLabel = hasPlan ? 'Plan personalizado activo' : 'Plan base listo';
  const profileLabel = getCombinedProfileLabel(profileLabels);
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const todayStatus = useMemo(() => {
    const moments = profilesData.el?.momentos || [];
    const targetMoment = getRelevantMoment(moments, currentMinutes);
    let completed = 0;
    let total = 0;

    for (const moment of moments) {
      for (const profileId of PROFILE_IDS) {
        total += 1;
        const meals = profilesData[profileId]?.plan?.[activeDay]?.[moment.key] || [];
        const isDone = meals.some((meal: any) =>
          selections[`${profileId}-${activeDay}-${moment.key}-${meal.nombre}`]
        );

        if (isDone) {
          completed += 1;
        }
      }
    }

    const selectedMeals = PROFILE_IDS.map((profileId) => {
      if (!targetMoment) return null;
      const meals = profilesData[profileId]?.plan?.[activeDay]?.[targetMoment.key] || [];
      const selectedMeal = meals.find((meal: MealItem) =>
        selections[`${profileId}-${activeDay}-${targetMoment.key}-${meal.nombre}`]
      );
      const label = getProfileLabel(profileLabels, profileId);

      return {
        profileId,
        label,
        meal: selectedMeal || null,
      };
    }).filter((item): item is {
      profileId: 'el' | 'ella';
      label: string;
      meal: MealItem | null;
    } => Boolean(item));

    const selectedCount = selectedMeals.filter((item) => item.meal).length;
    const missingLabels = selectedMeals
      .filter((item) => !item.meal)
      .map((item) => item.label);
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

    let preparationMessage = 'Aun no hay platillo elegido para este tiempo.';
    if (targetMoment && selectedCount === selectedMeals.length && selectedCount > 0) {
      preparationMessage = 'Ya elegiste platillo. Revisa el resumen para prepararlo.';
    } else if (targetMoment && selectedCount > 0) {
      preparationMessage = `Falta elegir para ${missingLabels.join(' y ')}.`;
    }

    return {
      completed,
      total,
      targetMoment,
      selectedMeals,
      selectedMealGroups,
      selectedCount,
      missingLabels,
      preparationMessage,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [activeDay, currentMinutes, profileLabels, profilesData, selections]);

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

        <main className="flex flex-1 flex-col justify-center gap-4 py-7 sm:py-12">
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
                  Tu dia de comida
                </h1>
                <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Una vista tranquila para saber donde vas y si necesitas ajustar el plan.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Para preparar
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-50">
                    {todayStatus.targetMoment
                      ? `${todayStatus.targetMoment.label} - ${todayStatus.targetMoment.hora}`
                      : 'Plan del dia'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {todayStatus.percent >= 100
                      ? 'Dia completado. Puedes revisar compras o preparar manana.'
                      : todayStatus.preparationMessage}
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

              <div className="mt-4 space-y-2">
                {todayStatus.selectedMealGroups.map(({ labels, meal }) => (
                  <div
                    key={`${labels.join('-')}-${meal.nombre}`}
                    className="rounded-2xl bg-white px-3 py-3 shadow-sm dark:bg-slate-900"
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                      {labels.join(' + ')}
                    </p>
                    <p className="mt-1 text-sm font-black leading-snug text-slate-900 dark:text-slate-50">
                      {meal.nombre}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                      {truncateText(meal.detalle || meal.porciones, 86)}
                    </p>
                  </div>
                ))}
                {todayStatus.missingLabels.length > 0 && (
                  <p className="px-1 text-xs font-bold text-slate-400">
                    Falta elegir para {todayStatus.missingLabels.join(' y ')}.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500">
              <span>{planStatusLabel}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                {formatMinutesAsTime(currentMinutes)}
              </span>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={openQuestionnaire}
                data-testid="landing-customize-ambos"
                className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] transition hover:brightness-105 active:scale-[0.98] sm:w-auto sm:min-w-[210px]"
              >
                <Sparkles className="h-4 w-4 text-blue-100" />
                <span>Personalizar mi plan</span>
              </button>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
