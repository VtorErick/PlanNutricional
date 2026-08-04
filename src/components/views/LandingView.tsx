import { useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import { motion } from 'framer-motion';
import {
  Apple,
  ArrowRight,
  Camera,
  Clock,
  Coffee,
  Moon,
  Sparkles,
  Sun,
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
const REEL_GAP_PX = 12;
const MOMENT_STYLES: Record<string, { icon: ElementType; surface: string; iconSurface: string; iconColor: string }> = {
  desayuno: {
    icon: Sun,
    surface: 'from-apricot-100/80 to-white dark:from-apricot-950/50 dark:to-ink-900',
    iconSurface: 'bg-apricot-100 dark:bg-apricot-950/70',
    iconColor: 'text-apricot-600 dark:text-apricot-300',
  },
  colacion_am: {
    icon: Apple,
    surface: 'from-coral-100/70 to-white dark:from-coral-950/50 dark:to-ink-900',
    iconSurface: 'bg-coral-100 dark:bg-coral-950/70',
    iconColor: 'text-coral-500 dark:text-coral-300',
  },
  comida: {
    icon: UtensilsCrossed,
    surface: 'from-pine-100/80 to-white dark:from-pine-950/50 dark:to-ink-900',
    iconSurface: 'bg-pine-100 dark:bg-pine-950/70',
    iconColor: 'text-pine-600 dark:text-pine-300',
  },
  colacion_pm: {
    icon: Coffee,
    surface: 'from-ocean-100/70 to-white dark:from-ocean-950/40 dark:to-ink-900',
    iconSurface: 'bg-ocean-100 dark:bg-ocean-950/70',
    iconColor: 'text-ocean-600 dark:text-ocean-300',
  },
  cena: {
    icon: Moon,
    surface: 'from-ink-100/90 to-white dark:from-ink-800 dark:to-ink-900',
    iconSurface: 'bg-ink-800 dark:bg-ink-700',
    iconColor: 'text-cream-100',
  },
};

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

  const [activeReelIndex, setActiveReelIndex] = useState(homeReel.initialIndex);
  const reelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextIndex = Math.max(0, Math.min(homeReel.initialIndex, homeReel.cards.length - 1));
    setActiveReelIndex(nextIndex);
    const frame = window.requestAnimationFrame(() => {
      const reel = reelRef.current;
      if (!reel) return;
      reel.scrollTo({ left: nextIndex * (reel.clientWidth + REEL_GAP_PX), behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [homeReel.cards.length, homeReel.initialIndex]);

  const goToReelIndex = (nextIndex: number) => {
    const reel = reelRef.current;
    const boundedIndex = Math.max(0, Math.min(nextIndex, homeReel.cards.length - 1));
    setActiveReelIndex(boundedIndex);
    reel?.scrollTo({
      left: boundedIndex * (reel.clientWidth + REEL_GAP_PX),
      behavior: 'smooth',
    });
  };

  const handleReelScroll = () => {
    const reel = reelRef.current;
    if (!reel || homeReel.cards.length === 0) return;
    const nextIndex = Math.max(
      0,
      Math.min(homeReel.cards.length - 1, Math.round(reel.scrollLeft / (reel.clientWidth + REEL_GAP_PX)))
    );
    setActiveReelIndex((current) => current === nextIndex ? current : nextIndex);
  };

  const activeCard = homeReel.cards[activeReelIndex] || homeReel.cards[0] || null;
  const activeMomentName = activeCard ? getMomentActionName(activeCard.moment.label) : 'comida';
  const plannedMealTarget = homeReel.cards.length * (perfilActivo === 'el' || perfilActivo === 'ella' ? 1 : 2);
  const plannedMealCount = homeReel.cards.reduce((total, card) => total + card.selectedCount, 0);
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
  const missingPlanLabel = missingPlanProfile ? getProfileLabel(profileLabels, missingPlanProfile) : '';
  const pendingMealCount = Math.max(0, totalMomentosProgress - completadosCount);

  const openMealMoment = (momentKey: string) => {
    setDiaActivo(currentDayOfWeek);
    setTab('plan');
    window.setTimeout(() => {
      scrollToMomento(momentKey, false);
    }, 120);
  };

  const handlePrimaryAction = () => {
    if (!hasPersonalizedPlan) {
      openQuestionnaire();
      return;
    }
    if (!activeCard) return;
    openMealMoment(activeCard.moment.key);
  };

  const handleRegisterAction = () => {
    if (!activeCard) return;
    openMealMoment(activeCard.moment.key);
  };

  const openQuestionnaire = (target: 'el' | 'ella' | 'ambos' = (perfilActivo === 'ella' ? 'ella' : 'el')) => {
    const shouldResume = questionnaireStepIdx > 0 && questionnaireTargetProfile === target;
    setQuestionnaireTargetProfile(target);
    if (!shouldResume) {
      setQuestionnaireStepIdx(0, target);
    }
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
    if (!shouldResume) {
      setQuestionnairePortionMode('auto');
      setQuestionnaireManualPortions({});
      setQuestionnaireAdditionalNotes('');
    }
    setIsQuestionnaireOpen(true);
  };

  const renderMealSummary = (card: (typeof homeReel.cards)[number]) => (
    <div className="mt-4 flex flex-1 flex-col justify-center space-y-2">
      {card.selectedMealGroups.slice(0, 2).map(({ labels, meal }) => {
        const groupLabel = labels.length > 1 ? 'Para ambos' : labels[0];

        return (
          <div
            key={`${card.moment.key}-${labels.join('-')}-${meal.nombre}`}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${isDarkMode ? 'bg-ink-800/70' : 'bg-white/80'}`}
          >
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${isDarkMode ? 'bg-ink-900' : 'bg-cream-50'}`}>
              {getMealEmoji(meal.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                {groupLabel}
              </p>
              <p className={`mt-0.5 truncate text-sm font-extrabold ${isDarkMode ? 'text-cream-100' : 'text-ink-800'}`}>
                {meal.nombre}
              </p>
            </div>
            <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-black tabular-nums ${accent.tagBg} ${accent.tagText}`}>
              {meal.caloriasKcal || 0} kcal
            </span>
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`home-food-halo absolute -right-24 -top-24 h-[20rem] w-[20rem] opacity-[0.1] sm:-right-8 sm:opacity-15 ${isDarkMode ? 'mix-blend-luminosity opacity-[0.08]' : ''}`} />
        <div className={`ambient-drift absolute -top-32 -right-24 h-80 w-80 rounded-full blur-3xl ${isDarkMode ? 'bg-pine-900/25' : 'bg-pine-100/50'}`} />
        <div className={`absolute -bottom-40 -left-28 h-96 w-96 rounded-full blur-3xl ${isDarkMode ? 'bg-ocean-900/10' : 'bg-ocean-100/35'}`} />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-ink-950/60 via-transparent to-ink-950/80' : 'from-cream-50/40 via-transparent to-cream-50/90'}`} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 pb-[96px] pt-4 max-[340px]:px-3 sm:px-6 sm:pb-10 sm:pt-8">
        <main className="flex min-h-0 flex-1 flex-col justify-start gap-4 py-1 sm:gap-5 sm:py-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="px-1"
          >
            <div>
              <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDarkMode ? 'text-pine-300' : accent.text}`}>
                {currentDayOfWeek} · {formatMinutesAsTime(currentMinutes)}
              </p>
              <h1 className="mt-1 font-display text-[30px] leading-none font-semibold tracking-tight text-ink-900 dark:text-cream-50 max-[340px]:text-[27px] sm:text-5xl">
                {getGreeting(currentMinutes)}
              </h1>
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.03 }}
            data-testid="landing-daily-focus"
            className={`rounded-[24px] border p-3.5 shadow-soft ${isDarkMode ? 'border-ink-700 bg-ink-900/90' : 'border-cream-200 bg-white/90'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.bgGradient} text-white`}>
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${accent.text}`}>
                  Tu día
                </p>
                <h2 className={`mt-0.5 font-display text-lg font-semibold leading-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                  {hasPersonalizedPlan ? `${pendingMealCount} comidas pendientes` : 'Crea tu plan en unos minutos'}
                </h2>
                <p className={`mt-1 text-[11px] font-medium leading-snug ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                  {hasPersonalizedPlan
                    ? `${completadosCount} de ${totalMomentosProgress} completadas. Tú decides cuándo marcar cada una.`
                    : 'Te preguntaremos solo lo esencial y guardaremos tu avance automáticamente.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrimaryAction}
              data-testid="landing-customize-ambos"
              className={`mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${accent.bgGradient} px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]`}
            >
              {hasPersonalizedPlan ? 'Elegir mi siguiente comida' : 'Crear mi plan con IA'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {questionnaireStepIdx > 0 ? (
              <p className={`mt-2 text-center text-[10px] font-bold ${isDarkMode ? 'text-pine-300' : 'text-pine-700'}`}>
                Tienes un cuestionario guardado en el paso {questionnaireStepIdx + 1}.
              </p>
            ) : null}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.05 }}
            data-testid="landing-profile-ambos-card"
            className="min-w-0"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className={`text-xs font-extrabold ${isDarkMode ? 'text-cream-200' : 'text-ink-700'}`}>
                Comidas de hoy
              </p>
              <p className={`text-right text-[10px] font-bold ${isDarkMode ? 'text-ink-500' : 'text-ink-400'}`}>
                <span className="block tabular-nums">{plannedMealCount} de {plannedMealTarget} elegidas</span>
              </p>
            </div>

            <div
              ref={reelRef}
              onScroll={handleReelScroll}
              className="scrollbar-none grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain pb-2"
              aria-label="Carrete de comidas de hoy"
            >
              {homeReel.cards.map((card, index) => {
                const momentStyle = MOMENT_STYLES[card.moment.key] || MOMENT_STYLES.comida;
                const MomentIcon = momentStyle.icon;
                const isNextMeal = index === homeReel.initialIndex;
                const isActiveCard = index === activeReelIndex;
                const showCardAction = !hasPersonalizedPlan || !isActiveCard;

                return (
                  <article
                    key={card.moment.key}
                    data-testid={`landing-meal-slide-${card.moment.key}`}
                    aria-label={`${card.moment.label}, ${card.moment.hora}`}
                    className={`flex min-h-[210px] snap-center flex-col rounded-[26px] border bg-gradient-to-br p-4 shadow-soft max-[340px]:min-h-[198px] max-[340px]:rounded-[23px] ${momentStyle.surface} ${
                      isDarkMode ? 'border-ink-700' : 'border-cream-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${momentStyle.iconSurface}`}>
                          <MomentIcon className={`h-5 w-5 ${momentStyle.iconColor}`} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                            {isNextMeal ? 'Siguiente comida' : 'Hoy'}
                          </p>
                          <h2 className={`mt-0.5 truncate font-display text-[24px] font-semibold tracking-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                            {card.moment.label}
                          </h2>
                        </div>
                      </div>
                      <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold tabular-nums ${
                        isDarkMode ? 'bg-ink-800 text-ink-200' : 'bg-white/80 text-ink-600'
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {card.moment.hora}
                      </span>
                    </div>

                    {card.selectedMealGroups.length > 0 ? (
                      renderMealSummary(card)
                    ) : (
                      <div className={`mt-4 flex flex-1 items-center gap-3 rounded-2xl px-3 py-3 ${
                        isDarkMode ? 'bg-ink-800/70 text-ink-300' : 'bg-white/75 text-ink-500'
                      }`}>
                        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${momentStyle.iconSurface}`}>
                          <UtensilsCrossed className={`h-4 w-4 ${momentStyle.iconColor}`} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-extrabold ${isDarkMode ? 'text-cream-100' : 'text-ink-700'}`}>
                            Sin elegir todavía
                          </p>
                          <p className="mt-0.5 truncate text-xs font-medium">Puedes elegirla cuando estés listo.</p>
                        </div>
                      </div>
                    )}

                    {showCardAction ? (
                      <button
                        type="button"
                        onClick={() => openMealMoment(card.moment.key)}
                        className={`mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl text-xs font-extrabold transition active:scale-[0.98] ${isDarkMode
                          ? 'bg-ink-800 text-cream-100 hover:bg-ink-700'
                          : 'bg-white/90 text-ink-700 shadow-sm hover:bg-white'}`}
                      >
                        {card.selectedMealGroups.length > 0 ? 'Ver opciones' : 'Elegir comida'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <p className={`mt-3 text-center text-[10px] font-bold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                        Usa el botón de arriba para elegirla
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-1 flex items-center justify-center px-1">
              <div className="flex flex-col items-center gap-1.5">
                <span className={`text-[10px] font-extrabold tabular-nums ${isDarkMode ? 'text-ink-400' : 'text-ink-500'}`}>
                  {activeReelIndex + 1} de {homeReel.cards.length}
                </span>
                <div className="flex items-center gap-1.5" aria-label="Posición en el carrete">
                  {homeReel.cards.map((card, index) => (
                    <button
                      key={card.moment.key}
                      type="button"
                      onClick={() => goToReelIndex(index)}
                      aria-label={`Ir a ${card.moment.label}`}
                      aria-pressed={index === activeReelIndex}
                      className={`h-1.5 rounded-full transition-all ${
                        index === activeReelIndex
                          ? `w-5 bg-gradient-to-r ${accent.bgGradient}`
                          : isDarkMode ? 'w-1.5 bg-ink-700' : 'w-1.5 bg-cream-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              {hasPersonalizedPlan ? (
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                  <button
                    type="button"
                    onClick={handleRegisterAction}
                    className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition active:scale-[0.97] ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}
                    aria-label={`Registrar ${activeMomentName}`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Registrar lo que comí
                  </button>
                  {missingPlanProfile ? (
                    <>
                      <span aria-hidden="true" className={isDarkMode ? 'text-ink-600' : 'text-ink-300'}>·</span>
                      <button
                        type="button"
                        onClick={() => openQuestionnaire(missingPlanProfile)}
                        data-testid="landing-create-missing-plan"
                        className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition active:scale-[0.97] ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Crear plan para {missingPlanLabel}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
