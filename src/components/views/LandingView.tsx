import { useEffect, useMemo, useRef, useState } from 'react';
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
    diaActivo: activeDay,
    perfilActivo,
    perfilesData: profilesData,
    selecciones: selections,
    profileLabels,
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
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
        const meals = profilesData[profileId]?.plan?.[activeDay]?.[moment.key] || [];
        const selectedMeal = meals.find((meal: MealItem) =>
          selections[`${profileId}-${activeDay}-${moment.key}-${meal.nombre}`]
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

      let preparationMessage = 'Aun no hay platillo elegido para este tiempo.';
      if (selectedCount === selectedMeals.length && selectedCount > 0) {
        preparationMessage = 'Ya elegiste platillo para este tiempo.';
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
      cards: moments
        .map((moment, index) => buildMomentCard(moment, index))
        .filter((card): card is NonNullable<typeof card> => Boolean(card)),
    };
  }, [activeDay, currentMinutes, perfilActivo, profileLabels, profilesData, selections]);

  const reelScrollRef = useRef<HTMLDivElement | null>(null);
  const currentCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = reelScrollRef.current;
    const currentCard = currentCardRef.current;
    if (!container || !currentCard) return;

    const nextScrollTop =
      currentCard.offsetTop - container.clientHeight / 2 + currentCard.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, nextScrollTop),
      behavior: 'smooth',
    });
  }, [homeReel.currentKey]);

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
        <p className={`rounded-2xl border px-3 py-3 text-sm font-bold ${isDarkMode ? 'border-slate-800 bg-slate-950/55 text-slate-300' : `${accent.borderLight} bg-white/55 text-slate-600`}`}>
          {card.preparationMessage}
        </p>
      ) : null}
      {card.missingLabels.length > 0 && !compact ? (
        <p className={`px-1 text-xs font-bold ${isDarkMode ? 'text-slate-500' : accent.text}`}>
          Falta elegir para {card.missingLabels.join(' y ')}.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={`flex min-h-0 flex-1 bg-gradient-to-br ${accent.bgGradientLight} text-slate-950 dark:text-slate-50`}>
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 pb-24 pt-4 max-[340px]:px-3 max-[340px]:pb-20 max-[340px]:pt-2 sm:px-6 sm:pb-10 sm:pt-6">
        <main className="flex min-h-0 flex-1 flex-col justify-center gap-4 py-3 max-[340px]:py-1.5 sm:py-12">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            data-testid="landing-profile-ambos-card"
            className={`relative overflow-hidden rounded-[30px] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] max-[340px]:rounded-[24px] max-[340px]:p-3 sm:p-6 ${
              isDarkMode
                ? `border-slate-800 bg-slate-950`
                : `${accent.borderLight} bg-white/88`
            }`}
          >
            <div className="relative z-10 mb-4 flex items-start justify-between gap-3 max-[340px]:mb-2.5 max-[340px]:gap-2.5">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl max-[340px]:h-10 max-[340px]:w-10 ${accent.bgLight} ${accent.text}`}>
                <UtensilsCrossed className="h-5 w-5 max-[340px]:h-4 max-[340px]:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-black uppercase tracking-[0.16em] max-[340px]:text-[10px] ${accent.text}`}>
                  {activeDay} - {profileLabel}
                </p>
                <h1 className={`mt-1 text-2xl font-black tracking-tight max-[340px]:text-xl sm:text-4xl ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>
                  Tu dia de comida
                </h1>
                <p className={`mt-2 max-w-xl text-sm font-medium leading-relaxed max-[380px]:hidden ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Una vista tranquila para saber donde vas y si necesitas ajustar el plan.
                </p>
              </div>
              <div className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-black max-[340px]:px-2.5 max-[340px]:py-1.5 ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : `${accent.borderLight} bg-white/55 ${accent.text}`}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatMinutesAsTime(currentMinutes)}
              </div>
            </div>

            <div
              ref={reelScrollRef}
              className={`relative z-10 h-[360px] overflow-y-auto overscroll-contain rounded-[26px] border px-1 py-14 [perspective:900px] snap-y snap-mandatory scrollbar-none max-[340px]:h-[360px] max-[340px]:py-14 [@media(max-height:680px)]:h-[295px] [@media(max-height:680px)]:py-12 sm:h-[450px] sm:py-16 ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900/45'
                  : `${accent.borderLight} bg-slate-100/46`
              }`}
              aria-label="Carrete de tiempos de comida"
            >
              <div className="space-y-3">
              {homeReel.cards.map((card) => {
                const isCurrent = card.moment.key === homeReel.currentKey;
                const isBeforeCurrent = card.offset < 0;
                return (
                  <motion.article
                    key={card.moment.key}
                    ref={(element) => {
                      if (isCurrent) currentCardRef.current = element;
                    }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{
                      opacity: isCurrent ? 1 : 0.62,
                      scale: isCurrent ? 1 : 0.92,
                      rotateX: isCurrent ? 0 : isBeforeCurrent ? 16 : -16,
                    }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className={`snap-center rounded-[26px] border transition-shadow max-[340px]:rounded-[22px] ${
                      isCurrent
                        ? isDarkMode
                          ? 'border-slate-700 bg-slate-900 p-4 shadow-[0_16px_34px_rgba(2,6,23,0.4)] max-[340px]:p-3 sm:p-5'
                          : `${accent.border} bg-white/74 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.10)] max-[340px]:p-3 sm:p-5`
                        : isDarkMode
                          ? 'border-slate-800 bg-slate-900/72 p-3 shadow-[0_10px_24px_rgba(2,6,23,0.24)]'
                          : `${accent.borderLight} bg-white/42 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]`
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transformOrigin: isCurrent ? 'center center' : isBeforeCurrent ? 'bottom center' : 'top center',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : accent.text}`}>
                          {isCurrent ? 'Para preparar' : card.offset < 0 ? 'Anterior' : 'Siguiente'}
                        </p>
                        <h2 className={`${isCurrent ? 'text-xl max-[340px]:text-lg sm:text-3xl' : 'text-lg'} mt-1 font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>
                          {card.moment.label}
                        </h2>
                        <p className={`${isCurrent ? 'text-xs sm:text-sm' : 'text-xs'} mt-1 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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

          </motion.section>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={openQuestionnaire}
              data-testid="landing-customize-ambos"
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black shadow-sm transition hover:brightness-105 active:scale-[0.98] max-[340px]:min-h-[38px] max-[340px]:px-3 ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-950/80 text-slate-100'
                  : `${accent.borderLight} bg-white/70 ${accent.text}`
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personalizar mi plan</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
