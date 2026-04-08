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

  const totals = React.useMemo(() => {
    const sumForProfile = (profileId: 'el' | 'ella') => {
      const dayPlan = profilesData[profileId]?.plan?.[activeDay] || {};
      const selectedMeals = Object.entries(dayPlan).flatMap(([mealTimeKey, meals]) =>
        (meals || []).filter(
          (meal) => selections[`${profileId}-${activeDay}-${mealTimeKey}-${meal.nombre}`]
        )
      );

      return {
        kcal: sumSelectedMealCalories(selectedMeals),
      };
    };

    if (isCombinedProfile || activeProfile === 'ambos') {
      const el = sumForProfile('el');
      const ella = sumForProfile('ella');
      return {
        kcal: el.kcal + ella.kcal,
      };
    }

    const profileId = activeProfile === 'ella' ? 'ella' : 'el';
    return sumForProfile(profileId);
  }, [activeDay, activeProfile, isCombinedProfile, profilesData, selections]);

  const calorieTarget = React.useMemo(() => {
    const getProfileTarget = (profileId: 'el' | 'ella') => {
      const profile = profilesData[profileId];
      return profile?.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(profile);
    };

    if (isCombinedProfile || activeProfile === 'ambos') {
      return getProfileTarget('el') + getProfileTarget('ella');
    }

    return activeProfile === 'ella' ? getProfileTarget('ella') : getProfileTarget('el');
  }, [activeProfile, isCombinedProfile, profilesData]);

  return (
    <motion.div
      key={`progress-${activeProfile}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={`sticky top-[52px] sm:top-[56px] z-40 backdrop-blur-xl ${
        isDarkMode
          ? 'bg-slate-950/96 shadow-[0_10px_30px_rgba(2,6,23,0.42)]'
          : 'bg-white/96 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
      }`}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto snap-x scrollbar-none">
            <div className="inline-flex gap-2 items-center min-w-max">
              {availableDays.map((day) => {
                const active = activeDay === day;

                return (
                  <button
                    key={day}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveDay(day);
                    }}
                    className={`py-2 px-3.5 rounded-2xl font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${
                      active
                        ? `${accentColors.btnActive} shadow-sm scale-[1.02]`
                        : isDarkMode
                          ? 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                          : 'bg-slate-100/85 hover:bg-slate-200 text-slate-600'
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
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
              isDarkMode ? 'bg-slate-900/90 text-slate-400' : 'bg-slate-100/90 text-slate-500'
            }`}
          >
            {totals.kcal} kcal/{calorieTarget} kcal
          </div>
        </div>
      </div>

      <div
        className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
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
            className={`h-2.5 bg-gradient-to-r ${accentColors.progressBg} rounded-full overflow-hidden shadow-inner ${
              isDarkMode ? 'shadow-black/40' : 'shadow-slate-200/70'
            }`}
          >
            <motion.div
              className={`h-full bg-gradient-to-r ${accentColors.progressFill} rounded-full ${
                isDarkMode
                  ? 'shadow-[0_0_18px_rgba(255,255,255,0.12)]'
                  : 'shadow-[0_0_12px_rgba(15,23,42,0.25)]'
              }`}
              animate={{ width: `${dailyProgressPercent}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span
            className={`text-[11px] sm:text-xs font-black ${
              dailyProgressPercent === 100
                ? isDarkMode
                  ? 'text-emerald-300'
                  : 'text-emerald-600'
                : accentColors.text
            } tabular-nums w-8 sm:w-9 text-right`}
          >
            {dailyProgressPercent}%
          </span>

          <button
            className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
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
            <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-4 pt-1">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className={`text-[11px] sm:text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {completadosCount} de {totalMomentCount} momentos completados
                </p>

                {dailyProgressPercent === 100 && (
                  <span className={`text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>
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
                      className={`relative rounded-2xl p-3 sm:p-3.5 flex flex-col items-center gap-1.5 shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${
                        done
                          ? accentColors.cardDone
                          : `${accentColors.cardPending} hover:shadow-md`
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
                        className={`text-[10px] sm:text-[11px] font-bold text-center leading-tight ${
                          done ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-slate-700'
                        }`}
                      >
                        {shortLabel}
                      </span>

                      <span
                        className={`text-[9px] sm:text-[10px] text-center leading-tight ${
                          done ? 'text-white/75' : 'text-slate-400'
                        }`}
                      >
                        {moment.hora}
                      </span>

                      {done && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center shadow"
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
