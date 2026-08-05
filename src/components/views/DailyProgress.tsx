import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  UtensilsCrossed,
  Sun,
  Apple,
  Coffee,
  Moon,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import {
  estimateDailyCaloriesFromObjectives,
  sumSelectedMealCalories,
} from '../../utils/nutrition';
import { getProfileLabel } from '../../utils/profileLabels';

const mealTimeIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

export default function DailyProgress() {
  const {
    perfilActivo: activeProfile,
    progressExpanded,
    setProgressExpanded,
    diasDisponibles: availableDays,
    diaActivo: activeDay,
    setDiaActivo: setActiveDay,
    perfilesData: profilesData,
    profileLabels,
    selecciones: selections,
    isAmbos: isCombinedProfile,
    perfilBase: baseProfile,
    momentoCompletado: completedMoments,
    progresoDia: dailyProgressPercent,
    completadosCount,
    totalMomentosProgress: totalMomentCount,
    scrollToMomento: scrollToMoment,
    ac: accentColors,
    isDarkMode,
  } = useDiet();
  const labelEl = getProfileLabel(profileLabels, 'el');
  const labelElla = getProfileLabel(profileLabels, 'ella');
  const [showDayPicker, setShowDayPicker] = React.useState(false);
  const mobileDayScrollerRef = React.useRef<HTMLDivElement | null>(null);
  const desktopDayScrollerRef = React.useRef<HTMLDivElement | null>(null);
  const mobileDayButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const desktopDayButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const profileDayStats = React.useMemo(() => {
    const sumForProfile = (profileId: 'el' | 'ella') => {
      const dayPlan = profilesData[profileId]?.plan?.[activeDay] || {};
      const selectedMeals = Object.entries(dayPlan).flatMap(([mealTimeKey, meals]) =>
        (meals || []).filter(
          (meal) => selections[`${profileId}-${activeDay}-${mealTimeKey}-${meal.nombre}`]
        )
      );

      const kcal = sumSelectedMealCalories(selectedMeals);
      const target = profilesData[profileId]?.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(profilesData[profileId]);

      return { kcal, target };
    };

    return {
      el: sumForProfile('el'),
      ella: sumForProfile('ella'),
    };
  }, [activeDay, profilesData, selections]);
  const activeProfileKey = activeProfile === 'ella' ? 'ella' : 'el';
  const activeStats = profileDayStats[activeProfileKey];
  const isAmbos = isCombinedProfile || activeProfile === 'ambos';

  React.useEffect(() => {
    const centerActiveDay = (
      container: HTMLDivElement | null,
      activeButton: HTMLButtonElement | null
    ) => {
      if (!container || !activeButton) return;

      const nextScrollLeft =
        activeButton.offsetLeft - container.clientWidth / 2 + activeButton.clientWidth / 2;

      container.scrollTo({
        left: Math.max(0, nextScrollLeft),
        behavior: 'smooth',
      });
    };

    const frame = window.requestAnimationFrame(() => {
      centerActiveDay(mobileDayScrollerRef.current, mobileDayButtonRefs.current[activeDay]);
      centerActiveDay(desktopDayScrollerRef.current, desktopDayButtonRefs.current[activeDay]);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeDay, availableDays]);

  return (
    <motion.div
      key={`progress-${activeProfile}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={`sm:sticky sm:top-[64px] z-40 overflow-hidden backdrop-blur-xl ${
        isDarkMode
          ? 'bg-ink-950/92'
          : 'bg-cream-50/92'
      }`}
    >
      {/* Mobile compact strip */}
      <div className="relative z-10 mx-auto max-w-md px-3 pb-3 pt-3 sm:hidden">
        <div
          className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left shadow-soft ${
            isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'
          }`}
        >
          {/* Day pills */}
          <div className="flex-1 overflow-x-auto scrollbar-none snap-x" ref={mobileDayScrollerRef}>
            <div className="inline-flex items-center gap-1 min-w-max">
              {availableDays.map((day) => {
                const active = activeDay === day;
                return (
                  <button
                    key={day}
                    ref={(element) => { mobileDayButtonRefs.current[day] = element; }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveDay(day);
                    }}
                    aria-label={`Ver ${day}`}
                    aria-pressed={active}
                    className={`h-[34px] min-w-[42px] rounded-full px-2 text-xs font-extrabold transition-all active:scale-90 snap-start ${
                      active
                        ? `${accentColors.btnActive} shadow-sm`
                        : isDarkMode
                          ? 'bg-ink-800 text-ink-300'
                          : 'bg-cream-100 text-ink-400'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kcal + mini bar + percent */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="min-w-[110px]">
              <p className={`text-xs font-bold tabular-nums ${isDarkMode ? 'text-ink-200' : 'text-ink-600'}`}>
                {isAmbos
                  ? `${profileDayStats.el.kcal}/${profileDayStats.el.target} · ${profileDayStats.ella.kcal}/${profileDayStats.ella.target}`
                  : `${activeStats.kcal}/${activeStats.target} kcal`
                }
              </p>
              <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-ink-700' : 'bg-cream-200'}`}>
                <motion.div
                  className={`progress-shine h-full rounded-full bg-gradient-to-r ${accentColors.progressFill}`}
                  animate={{ width: `${dailyProgressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                />
              </div>
            </div>
            <span className={`text-sm font-black tabular-nums ${accentColors.text}`}>
              {dailyProgressPercent}%
            </span>
            <button
              type="button"
              onClick={() => setProgressExpanded((expanded) => !expanded)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${
                isDarkMode ? 'bg-ink-800 text-ink-300' : 'bg-cream-100 text-ink-500'
              }`}
              aria-label={progressExpanded ? 'Ocultar detalle del día' : 'Ver detalle del día'}
              aria-expanded={progressExpanded}
            >
              {progressExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 hidden max-w-5xl mx-auto px-3 sm:block sm:px-6 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            ref={desktopDayScrollerRef}
            className="flex-1 overflow-x-auto snap-x scrollbar-none"
          >
            <div className="inline-flex gap-1.5 items-center min-w-max">
              {availableDays.map((day) => {
                const active = activeDay === day;

                return (
                  <button
                    key={day}
                    ref={(element) => {
                      desktopDayButtonRefs.current[day] = element;
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveDay(day);
                    }}
                    className={`py-2 px-4 rounded-full font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${
                      active
                        ? `${accentColors.btnActive} shadow-sm scale-[1.02]`
                        : isDarkMode
                          ? 'bg-ink-900 text-ink-200 hover:bg-ink-800'
                          : 'bg-white text-ink-500 hover:bg-cream-100 border border-cream-200'
                    }`}
                  >
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
              isDarkMode ? 'bg-ink-900 text-ink-300' : 'bg-white text-ink-500 border border-cream-200'
            }`}
          >
            {isAmbos
              ? `${profileDayStats.el.kcal}/${profileDayStats.el.target} · ${profileDayStats.ella.kcal}/${profileDayStats.ella.target} kcal`
              : `${activeStats.kcal} kcal/${activeStats.target} kcal`}
          </div>
        </div>
      </div>

      <div
        className="relative z-10 hidden max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
        onClick={() => setProgressExpanded((expanded) => !expanded)}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {baseProfile.momentos.map((moment) => {
            const Icon = mealTimeIcons[moment.key] || UtensilsCrossed;
            const done = completedMoments[moment.key];

            return (
              <button
                key={moment.key}
                title={`Ir a ${moment.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  scrollToMoment(moment.key, progressExpanded);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  done
                    ? `bg-gradient-to-br ${accentColors.bgGradient} shadow-sm hover:opacity-85`
                    : `${accentColors.bgLight} hover:opacity-75`
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Icon
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${accentColors.momentoIconColorPending}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`h-2.5 rounded-full overflow-hidden ${
              isDarkMode ? 'bg-ink-800' : 'bg-cream-200'
            }`}
          >
            <motion.div
              className={`progress-shine h-full bg-gradient-to-r ${accentColors.progressFill} rounded-full`}
              animate={{ width: `${dailyProgressPercent}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span
            className={`text-xs sm:text-xs font-black ${
              dailyProgressPercent === 100
                ? isDarkMode
                  ? 'text-pine-300'
                  : 'text-pine-600'
                : accentColors.text
            } tabular-nums w-8 sm:w-9 text-right`}
          >
            {dailyProgressPercent}%
          </span>

          <button
            className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-ink-800' : 'hover:bg-cream-100'
            }`}
            onClick={(event) => {
              event.stopPropagation();
              setProgressExpanded((expanded) => !expanded);
            }}
            aria-label={progressExpanded ? 'Colapsar progreso' : 'Expandir progreso'}
          >
            {progressExpanded ? (
              <ChevronUp className={`w-4 h-4 ${accentColors.text}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${accentColors.text}`} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {progressExpanded && (
          <motion.div
            key="progress-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pb-4 pt-1">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className={`text-xs sm:text-xs font-medium ${isDarkMode ? 'text-ink-400' : 'text-ink-500'}`}>
                  {completadosCount} de {totalMomentCount} momentos completados
                </p>

                {dailyProgressPercent === 100 && (
                  <span className={`text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${isDarkMode ? 'text-pine-300' : 'text-pine-600'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Dia completo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {baseProfile.momentos.map((moment) => {
                  const Icon = mealTimeIcons[moment.key] || UtensilsCrossed;
                  const done = completedMoments[moment.key];

                  const shortLabel = moment.label
                    .replace('Colacion ', 'Col. ')
                    .replace('manana', 'AM')
                    .replace('tarde', 'PM');

                  return (
                    <motion.button
                      key={moment.key}
                      animate={{ scale: done ? 1.02 : 1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        scrollToMoment(moment.key, true);
                      }}
                      className={`relative rounded-2xl p-3 sm:p-3.5 flex flex-col items-center gap-1.5 shadow-soft transition-all duration-300 cursor-pointer text-left w-full ${
                        done
                          ? accentColors.cardDone
                          : `${accentColors.cardPending} hover:shadow-lift`
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                          done ? accentColors.iconDone : accentColors.iconPending
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Icon
                            className={`w-5 h-5 ${accentColors.momentoIconColorPending}`}
                          />
                        )}
                      </div>

                      <span
                        className={`text-xs sm:text-xs font-bold text-center leading-tight ${
                          done ? 'text-white' : isDarkMode ? 'text-ink-100' : 'text-ink-600'
                        }`}
                      >
                        {shortLabel}
                      </span>

                      <span
                        className={`text-xs sm:text-xs text-center leading-tight tabular-nums ${
                          done ? 'text-white/75' : 'text-ink-400'
                        }`}
                      >
                        {moment.hora}
                      </span>

                      {done && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-pine-400 rounded-full flex items-center justify-center shadow"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
