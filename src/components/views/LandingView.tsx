import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent, type WheelEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import type { MealItem, MealTime } from '../../types';
import {
  getCombinedProfileLabel,
  getProfileLabel,
} from '../../utils/profileLabels';
import { getAccentColors } from '../../utils/theme';

const MEAL_WINDOW_MINUTES = 75;
const PROFILE_IDS = ['el', 'ella'] as const;
const AVAILABLE_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;
const CYLINDER_RADIUS = 135;
const CYLINDER_ANGLE = 58;

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

function getLoopOffset(index: number, activeIndex: number, total: number) {
  if (total <= 0) return 0;
  const raw = index - activeIndex;
  const half = total / 2;
  if (raw > half) return raw - total;
  if (raw < -half) return raw + total;
  return raw;
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
  const profileLabel =
    perfilActivo === 'ambos' || !perfilActivo
      ? getCombinedProfileLabel(profileLabels)
      : getProfileLabel(profileLabels, perfilActivo);
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

    const buildMomentCard = (moment: MealTime, index: number) => {
      if (!moment) return null;
      const offset = targetIndex >= 0 ? index - targetIndex : 0;

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

      const actionName = getMomentActionName(moment.label);
      let preparationMessage = `No has elegido tu ${actionName}.`;
      if (selectedCount === selectedMeals.length && selectedCount > 0) {
        preparationMessage = 'Sugerencia actual.';
      } else if (selectedCount > 0) {
        preparationMessage = `Falta elegir para ${missingLabels.join(' y ')}.`;
      }

      return {
        offset,
        moment,
        selectedMealGroups,
        selectedCount,
        missingLabels,
        preparationMessage,
      };
    };

    return {
      currentKey: targetMoment?.key || null,
      initialIndex: targetIndex >= 0 ? targetIndex : 0,
      cards: moments
        .map((moment, index) => buildMomentCard(moment, index))
        .filter((card): card is NonNullable<typeof card> => Boolean(card)),
    };
  }, [currentDayOfWeek, currentMinutes, perfilActivo, profileLabels, profilesData, selections]);

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const touchStartYRef = useRef<number | null>(null);
  const wheelLockRef = useRef(false);

  useEffect(() => {
    setActiveReelIndex(homeReel.initialIndex);
  }, [homeReel.initialIndex]);

  const moveReel = (direction: 1 | -1) => {
    const total = homeReel.cards.length;
    if (total <= 1) return;
    setActiveReelIndex((current) => (current + direction + total) % total);
  };

  const handleReelWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 12 || wheelLockRef.current) return;
    event.preventDefault();
    wheelLockRef.current = true;
    moveReel(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 260);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY ?? startY;
    if (startY === null || currentY === null) return;
    if (Math.abs(startY - currentY) > 8) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY === null) return;
    const endY = event.changedTouches[0]?.clientY ?? startY;
    const delta = startY - endY;
    if (Math.abs(delta) < 28) return;
    moveReel(delta > 0 ? 1 : -1);
  };

  const handleReelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveReel(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveReel(-1);
    }
  };

  const activeCard = homeReel.cards[activeReelIndex] || homeReel.cards[0] || null;
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

  const renderMealSummary = (card: (typeof homeReel.cards)[number], compact = false) => (
    <div className={compact ? 'mt-2 space-y-1.5' : 'mt-4 space-y-2 max-[340px]:mt-3'}>
      {card.selectedMealGroups.slice(0, compact ? 1 : 2).map(({ labels, meal }) => (
        <div
          key={`${card.moment.key}-${labels.join('-')}-${meal.nombre}`}
          className={`rounded-2xl border px-3 py-2.5 ${isDarkMode ? 'border-slate-800 bg-slate-950/55' : `${accent.borderLight} bg-white/55`} ${compact ? 'py-2' : ''}`}
        >
          <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-500' : accent.text}`}>
            {labels.join(' + ')}
          </p>
          <p className={`mt-1 text-sm font-black leading-snug ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>
            {meal.nombre}
          </p>
          {!compact ? (
            <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {truncateText(meal.detalle || meal.porciones, 78)}
            </p>
          ) : null}
        </div>
      ))}
      {card.selectedMealGroups.length === 0 ? (
        compact ? (
          <p className={`px-1 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Sin platillo elegido.
          </p>
        ) : null
      ) : null}
      {card.missingLabels.length > 0 && !compact && card.selectedMealGroups.length > 0 ? (
        <p className={`px-1 text-xs font-bold ${isDarkMode ? 'text-slate-500' : accent.text}`}>
          Falta elegir para {card.missingLabels.join(' y ')}.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={`relative flex min-h-0 flex-1 overflow-hidden overscroll-none bg-gradient-to-br ${accent.bgGradientLight} text-slate-950 dark:text-slate-50`}>
      <img
        src="/images/home-food-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100 saturate-[0.96] dark:opacity-34"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/22 via-white/0 to-white/24 dark:from-slate-950/74 dark:via-slate-950/38 dark:to-slate-950/78" />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.bgGradientLight} opacity-[0.06] dark:opacity-12`} />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 pb-[88px] pt-3 max-[340px]:px-3 max-[340px]:pb-[78px] max-[340px]:pt-2 sm:px-6 sm:pb-10 sm:pt-6">
        <main className="flex min-h-0 flex-1 flex-col justify-center gap-3 py-2 max-[340px]:py-1 sm:gap-4 sm:py-12">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            data-testid="landing-profile-ambos-card"
            className={`relative rounded-[30px] border p-3.5 shadow-[0_16px_42px_rgba(15,23,42,0.10)] max-[340px]:rounded-[24px] max-[340px]:p-3 sm:p-6 ${
              isDarkMode
                ? `border-slate-800 bg-slate-950/90`
                : `${accent.borderLight} bg-white/88`
            }`}
          >
            <div className="relative z-10 mb-2.5 flex items-start justify-between gap-3 max-[340px]:mb-1.5 max-[340px]:gap-2.5">
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] max-[340px]:text-[10px] ${accent.text}`}>
                  Hoy · {currentDayOfWeek}
                </p>
                <p className={`mt-0.5 truncate text-xs font-black uppercase tracking-[0.14em] max-[340px]:text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {profileLabel}
                </p>
              </div>
              <div className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-black max-[340px]:px-2.5 max-[340px]:py-1.5 ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : `${accent.borderLight} bg-white ${accent.text}`}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatMinutesAsTime(currentMinutes)}
              </div>
            </div>

            <div
              className="relative z-10 h-[clamp(255px,43svh,340px)] touch-none overflow-hidden overscroll-contain [perspective:1000px] max-[340px]:h-[clamp(235px,41svh,315px)] [@media(max-height:680px)]:h-[260px] [@media(max-height:610px)]:h-[225px] sm:h-[450px]"
              style={{ touchAction: 'none' }}
              aria-label="Carrete de tiempos de comida"
              role="listbox"
              tabIndex={0}
              onWheel={handleReelWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onKeyDown={handleReelKeyDown}
            >
              <div className="absolute inset-0 [transform-style:preserve-3d]">
              {homeReel.cards.map((card, index) => {
                const total = homeReel.cards.length;
                const relativeOffset = getLoopOffset(index, activeReelIndex, total);
                const isCurrent = relativeOffset === 0;
                const theta = relativeOffset * CYLINDER_ANGLE;
                const rotateX = -theta;
                const y = Math.sin((theta * Math.PI) / 180) * CYLINDER_RADIUS;
                const z = (Math.cos((theta * Math.PI) / 180) - 1) * CYLINDER_RADIUS;
                const depth = Math.abs(relativeOffset);
                const isVisible = depth <= 2;
                const opacity = !isVisible ? 0 : isCurrent ? 1 : depth === 1 ? 0.72 : 0;
                const scale = isCurrent ? 1 : depth === 1 ? 0.9 : 0.82;
                return (
                  <motion.article
                    key={card.moment.key}
                    role="option"
                    aria-selected={isCurrent}
                    initial={false}
                    animate={{
                      opacity,
                      scale,
                      filter: isCurrent ? 'blur(0px) saturate(1)' : 'blur(0.35px) saturate(0.82)',
                      transform: `translate3d(-50%, calc(-50% + ${y}px), ${z}px) rotateX(${rotateX}deg) scale(${scale})`,
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                    className={`absolute left-1/2 top-1/2 w-[calc(100%-0.35rem)] rounded-[26px] border transition-shadow max-[340px]:rounded-[22px] ${
                      isCurrent
                        ? isDarkMode
                          ? 'border-slate-700 bg-slate-900 p-4 shadow-[0_16px_34px_rgba(2,6,23,0.4)] max-[340px]:p-3 sm:p-5'
                          : `${accent.border} bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.12)] max-[340px]:p-3 sm:p-5`
                        : isDarkMode
                          ? 'pointer-events-none border-slate-800 bg-slate-900/60 p-3 shadow-[0_10px_24px_rgba(2,6,23,0.18)]'
                          : `pointer-events-none ${accent.borderLight} bg-white/64 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]`
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      zIndex: isCurrent ? 30 : 20 - depth,
                      pointerEvents: isCurrent ? 'auto' : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-slate-500' : accent.text}`}>
                          {isCurrent ? 'Tiempo actual' : relativeOffset < 0 ? 'Anterior' : 'Siguiente'}
                        </p>
                        <h2 className={`${isCurrent ? 'text-2xl max-[340px]:text-[22px] sm:text-4xl' : 'text-lg'} mt-1 font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>
                          {card.moment.label}
                        </h2>
                        <p className={`${isCurrent ? 'text-sm' : 'text-xs'} mt-1.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {card.preparationMessage}
                        </p>
                      </div>
                      <div className={`flex flex-shrink-0 items-center gap-1 rounded-2xl border px-2.5 py-1.5 text-xs font-black ${isDarkMode ? 'border-slate-800 bg-slate-950/70 text-slate-300' : `${accent.borderLight} bg-white/62 ${accent.text}`}`}>
                        {card.moment.hora}
                      </div>
                    </div>

                    {isCurrent ? renderMealSummary(card) : renderMealSummary(card, true)}
                  </motion.article>
                );
              })}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrimaryAction}
              data-testid="landing-customize-ambos"
              className={`relative z-10 mt-2 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${accent.bgGradient} px-4 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(15,23,42,0.16)] transition hover:brightness-105 active:scale-[0.98] max-[340px]:min-h-[42px] max-[340px]:py-2.5`}
            >
              {!hasPersonalizedPlan ? <Sparkles className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
              <span>{primaryActionLabel}</span>
            </button>
            {hasPersonalizedPlan ? (
              <button
                type="button"
                onClick={openQuestionnaire}
                data-testid="landing-ai-adjust"
                className={`relative z-10 mx-auto mt-3 flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition-opacity hover:opacity-75 active:scale-[0.98] ${
                  isDarkMode ? 'text-violet-200' : 'text-[#7C5CFF]'
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
