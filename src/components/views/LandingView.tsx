import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  Clock,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import type { MealItem, MealTime } from '../../types';
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

  const homeReel = useMemo(() => {
    const moments = profilesData.el?.momentos || [];
    const targetMoment = getRelevantMoment(moments, currentMinutes);
    const activeProfileIds: Array<'el' | 'ella'> =
      perfilActivo === 'el' ? ['el'] :
      perfilActivo === 'ella' ? ['ella'] :
      [...PROFILE_IDS];

    const targetIndex = targetMoment
      ? moments.findIndex((moment) => moment.key === targetMoment.key)
      : -1;

    const buildMomentCard = (moment: MealTime) => {
      if (!moment) return null;

      const selectedMeals = activeProfileIds.map((profileId) => {
        const meals = profilesData[profileId]?.plan?.[currentDayOfWeek]?.[moment.key] || [];
        const selectedMeal = meals.find((meal: MealItem) =>
          selections[`${profileId}-${currentDayOfWeek}-${moment.key}-${meal.nombre}`]
        );
        const label = getProfileLabel(profileLabels, profileId);

        return {
          profileId,
          label,
          meal: selectedMeal || null,
        };
      });

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

      return {
        moment,
        selectedMealGroups,
        selectedCount,
        missingLabels,
      };
    };

    return {
      initialIndex: targetIndex >= 0 ? targetIndex : 0,
      cards: moments
        .map((moment) => buildMomentCard(moment))
        .filter((card): card is NonNullable<typeof card> => Boolean(card)),
    };
  }, [currentDayOfWeek, currentMinutes, perfilActivo, profileLabels, profilesData, selections]);

  const activeCard = homeReel.cards[homeReel.initialIndex] || homeReel.cards[0] || null;
  const activeMomentName = activeCard ? getMomentActionName(activeCard.moment.label) : 'comida';
  const hasPersonalizedPlan =
    perfilActivo === 'el'
      ? dataVersions.el === 'custom'
      : perfilActivo === 'ella'
        ? dataVersions.ella === 'custom'
        : dataVersions.el === 'custom' && dataVersions.ella === 'custom';
  const primaryActionLabel = !hasPersonalizedPlan
    ? 'Crear mi plan con IA'
    : activeCard?.selectedCount
      ? `Ver ${activeMomentName}`
      : `Elegir ${activeMomentName}`;

  const handlePrimaryAction = () => {
    if (!hasPersonalizedPlan) {
      openQuestionnaire();
      return;
    }
    if (!activeCard) return;
    setDiaActivo(currentDayOfWeek);
    setTab('plan');
    window.setTimeout(() => {
      scrollToMomento(activeCard.moment.key, false);
    }, 120);
  };

  const handleRegisterAction = () => {
    if (!activeCard) return;
    setDiaActivo(currentDayOfWeek);
    setTab('plan');
    window.setTimeout(() => {
      scrollToMomento(activeCard.moment.key, false);
    }, 120);
  };

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

  const renderMealSummary = (card: (typeof homeReel.cards)[number]) => (
    <div className="mt-4 space-y-3">
      {card.selectedMealGroups.slice(0, 2).map(({ labels, meal }) => {
        const groupLabel = labels.length > 1 ? 'Para ambos' : labels[0];

        return (
          <div
            key={`${card.moment.key}-${labels.join('-')}-${meal.nombre}`}
            className={`rounded-2xl px-3.5 py-3 ${isDarkMode ? 'bg-ink-800/60' : 'bg-cream-100/80'}`}
          >
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDarkMode ? 'text-pine-300' : accent.text}`}>
              {groupLabel}
            </p>
            <p className={`mt-1 text-[15px] font-bold leading-snug ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
              {meal.nombre}
            </p>
            <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
              {meal.detalle || meal.porciones}
            </p>
          </div>
        );
      })}
      {card.missingLabels.length > 0 && card.selectedMealGroups.length > 0 ? (
        <p className={`px-1 text-xs font-bold ${isDarkMode ? 'text-ink-400' : accent.text}`}>
          Falta elegir para {card.missingLabels.join(' y ')}.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden overscroll-none bg-cream-50 text-ink-900 dark:bg-ink-950 dark:text-cream-100">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`home-food-halo absolute -right-24 -top-20 h-[22rem] w-[22rem] opacity-[0.14] sm:-right-8 sm:opacity-20 ${isDarkMode ? 'mix-blend-luminosity opacity-[0.1]' : ''}`} />
        <div className={`ambient-drift absolute -top-32 -right-24 h-96 w-96 rounded-full blur-3xl ${isDarkMode ? 'bg-pine-900/30' : 'bg-pine-100/70'}`} />
        <div className={`absolute -bottom-40 -left-28 h-[28rem] w-[28rem] rounded-full blur-3xl ${isDarkMode ? 'bg-ocean-900/15' : 'bg-ocean-100/50'}`} />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-ink-950/60 via-transparent to-ink-950/80' : 'from-cream-50/40 via-transparent to-cream-50/90'}`} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 pb-[96px] pt-4 max-[340px]:px-3 sm:px-6 sm:pb-10 sm:pt-8">
        <main className="flex min-h-0 flex-1 flex-col justify-center gap-3 py-2 sm:gap-5 sm:py-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="px-1"
          >
            <p className={`text-[11px] font-extrabold uppercase tracking-[0.2em] ${isDarkMode ? 'text-pine-300' : accent.text}`}>
              {currentDayOfWeek} · {formatMinutesAsTime(currentMinutes)}
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-[1.05] font-semibold tracking-tight text-ink-900 dark:text-cream-50 max-[340px]:text-[28px] sm:text-5xl">
              {getGreeting(currentMinutes)}
            </h1>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.05 }}
            data-testid="landing-profile-ambos-card"
            className={`relative overflow-hidden rounded-[28px] border p-4 shadow-lift max-[340px]:rounded-[24px] max-[340px]:p-3.5 sm:p-6 ${
              isDarkMode
                ? 'border-ink-700 bg-ink-900/95'
                : 'border-cream-200 bg-white/95'
            }`}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.bgGradient}`} />

            <div className="relative z-10">
              {activeCard ? (
                <motion.article
                  key={activeCard.moment.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                        Tu siguiente momento
                      </p>
                      <h2 className="mt-1 font-display text-[32px] font-semibold tracking-tight text-ink-900 max-[340px]:text-[29px] dark:text-cream-50 sm:text-5xl">
                        {activeCard.moment.label}
                      </h2>
                    </div>
                    <div className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-extrabold tabular-nums ${
                      isDarkMode
                        ? 'border-ink-700 bg-ink-800 text-cream-200'
                        : 'border-cream-200 bg-cream-100 text-ink-700'
                    }`}>
                      <Clock className={`h-3.5 w-3.5 ${isDarkMode ? 'text-pine-300' : accent.text}`} />
                      {activeCard.moment.hora}
                    </div>
                  </div>

                  {activeCard.selectedMealGroups.length > 0 ? (
                    renderMealSummary(activeCard)
                  ) : (
                    <div className={`mt-4 flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
                      isDarkMode
                        ? 'bg-ink-800/60 text-ink-300'
                        : 'bg-cream-100/80 text-ink-500'
                    }`}>
                      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${accent.bgLight} ${accent.text}`}>
                        <UtensilsCrossed className="h-4 w-4" />
                      </span>
                      <div>
                        <p className={`text-sm font-extrabold ${isDarkMode ? 'text-cream-100' : 'text-ink-700'}`}>
                          Aún sin comida
                        </p>
                        <p className="mt-0.5 text-xs font-medium">Elige una opción o registra lo que comiste.</p>
                      </div>
                    </div>
                  )}
                </motion.article>
              ) : null}
            </div>

            <div className="relative z-10 mt-4 flex gap-2">
              <button
                type="button"
                onClick={handlePrimaryAction}
                data-testid="landing-customize-ambos"
                className={`group inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[18px] bg-gradient-to-r ${accent.bgGradient} px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-10px_rgba(234,65,9,0.45)] transition hover:brightness-105 active:scale-[0.98] max-[340px]:min-h-[46px]`}
              >
                {!hasPersonalizedPlan ? <Sparkles className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
                <span>{primaryActionLabel}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              {hasPersonalizedPlan ? (
                <button
                  type="button"
                  onClick={handleRegisterAction}
                  className={`inline-flex min-h-[52px] min-w-[88px] flex-col items-center justify-center gap-0.5 rounded-[18px] border px-3 text-[11px] font-extrabold transition active:scale-[0.97] ${
                    isDarkMode
                      ? 'border-ink-700 bg-ink-800 text-cream-200'
                      : `border-cream-200 bg-cream-50 ${accent.text}`
                  }`}
                  aria-label={`Registrar ${activeMomentName}`}
                >
                  <Camera className="h-4 w-4" />
                  Registrar
                </button>
              ) : null}
            </div>
            {hasPersonalizedPlan ? (
              <button
                type="button"
                onClick={openQuestionnaire}
                data-testid="landing-ai-adjust"
                className={`relative z-10 mx-auto mt-3 flex min-h-[34px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-opacity hover:opacity-70 active:scale-[0.98] ${
                  isDarkMode ? 'text-ink-300' : 'text-ink-500'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ajustar plan con IA</span>
              </button>
            ) : null}
          </motion.section>
        </main>
      </div>
    </div>
  );
}
