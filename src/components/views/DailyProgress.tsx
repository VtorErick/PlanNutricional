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
  sumSelectedMealFat,
  sumSelectedMealProtein,
} from '../../utils/nutrition';

const momentoIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

export default function DailyProgress() {
  const {
    perfilActivo,
    progressExpanded,
    setProgressExpanded,
    diasDisponibles,
    diaActivo,
    setDiaActivo,
    perfilesData,
    selecciones,
    isAmbos,
    perfilBase: perfil,
    momentoCompletado,
    progresoDia,
    completadosCount,
    totalMomentosProgress: totalMomentos,
    scrollToMomento,
    ac,
  } = useDiet();

  const totals = React.useMemo(() => {
    const sumForProfile = (perfilId: 'el' | 'ella') => {
      const planDia = perfilesData[perfilId]?.plan?.[diaActivo] || {};
      const selectedMeals = Object.entries(planDia).flatMap(([momentoKey, meals]) =>
        (meals || []).filter((meal) => selecciones[`${perfilId}-${diaActivo}-${momentoKey}-${meal.nombre}`])
      );
      return {
        kcal: sumSelectedMealCalories(selectedMeals),
        protein: sumSelectedMealProtein(selectedMeals),
        fat: sumSelectedMealFat(selectedMeals),
      };
    };

    if (isAmbos || perfilActivo === 'ambos') {
      const el = sumForProfile('el');
      const ella = sumForProfile('ella');
      return {
        kcal: el.kcal + ella.kcal,
        protein: el.protein + ella.protein,
        fat: el.fat + ella.fat,
      };
    }

    const perfilId = perfilActivo === 'ella' ? 'ella' : 'el';
    return sumForProfile(perfilId);
  }, [diaActivo, perfilesData, selecciones, isAmbos, perfilActivo]);

  const metaCalorica = React.useMemo(() => {
    const getProfileTarget = (perfilId: 'el' | 'ella') => {
      const profile = perfilesData[perfilId];
      return profile?.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(profile);
    };

    if (isAmbos || perfilActivo === 'ambos') {
      return getProfileTarget('el') + getProfileTarget('ella');
    }

    return perfilActivo === 'ella' ? getProfileTarget('ella') : getProfileTarget('el');
  }, [perfilesData, isAmbos, perfilActivo]);

  const energyRatio = metaCalorica > 0 ? totals.kcal / metaCalorica : 0;
  const energyStatus: 'low' | 'near' | 'high' = energyRatio < 0.85 ? 'low' : energyRatio <= 1.1 ? 'near' : 'high';

  const statusPalette = (isAmbos || perfilActivo === 'ambos')
    ? {
        low: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        near: 'bg-emerald-100 border-emerald-300 text-emerald-800',
        high: 'bg-teal-100 border-teal-300 text-teal-800',
      }
    : perfilActivo === 'ella'
      ? {
          low: 'bg-rose-50 border-rose-200 text-rose-700',
          near: 'bg-rose-100 border-rose-300 text-rose-800',
          high: 'bg-pink-100 border-pink-300 text-pink-800',
        }
      : {
          low: 'bg-blue-50 border-blue-200 text-blue-700',
          near: 'bg-blue-100 border-blue-300 text-blue-800',
          high: 'bg-indigo-100 border-indigo-300 text-indigo-800',
        };

  return (
    <motion.div
      key={`progress-${perfilActivo}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={`sticky top-[52px] sm:top-[56px] z-40 bg-white/96 backdrop-blur-xl border-b ${ac.border} shadow-[0_10px_30px_rgba(15,23,42,0.08)]`}
    >
      {/* Selector de día */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-2 border-b border-slate-100/70">
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto snap-x scrollbar-none">
            <div className="inline-flex gap-2 items-center min-w-max">
              {diasDisponibles.map((dia) => {
                const active = diaActivo === dia;
                return (
                  <button
                    key={dia}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDiaActivo(dia);
                    }}
                    className={`py-2 px-3.5 rounded-2xl font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 border ${
                      active
                        ? `${ac.btnActive} shadow-sm scale-[1.02] border-transparent`
                        : 'bg-slate-100/85 hover:bg-slate-200 text-slate-600 border-slate-200/70'
                    }`}
                  >
                    <span className="sm:hidden">{dia.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{dia}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`flex-shrink-0 rounded-2xl border px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold leading-tight ${statusPalette[energyStatus]}`}>
            <div className="whitespace-nowrap">
              <span>{totals.kcal} kcal</span>
              <span className="mx-1 text-slate-300">·</span>
              <span>{totals.protein}g P</span>
              <span className="mx-1 text-slate-300">·</span>
              <span>{totals.fat}g G</span>
            </div>
            <div className="mt-0.5 font-semibold whitespace-nowrap opacity-85">Meta: {metaCalorica} kcal</div>
          </div>
        </div>
      </div>

      {/* Barra compacta siempre visible */}
      <div
        className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
        onClick={() => setProgressExpanded((e) => !e)}
      >

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {perfil.momentos.map((momento) => {
            const Icon = momentoIcons[momento.key] || UtensilsCrossed;
            const done = momentoCompletado[momento.key];

            return (
              <button
                key={momento.key}
                title={`Ir a ${momento.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToMomento(momento.key, progressExpanded);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  done
                    ? `bg-gradient-to-br ${ac.bgGradient} shadow-sm hover:opacity-85`
                    : `${ac.bgLight} border ${ac.border} hover:opacity-75`
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${ac.momentoIconColorPending}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`h-2.5 bg-gradient-to-r ${ac.progressBg} rounded-full overflow-hidden shadow-inner shadow-slate-200/70`}
          >
            <motion.div
              className={`h-full bg-gradient-to-r ${ac.progressFill} rounded-full shadow-[0_0_12px_rgba(15,23,42,0.25)]`}
              animate={{ width: `${progresoDia}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span
            className={`text-[11px] sm:text-xs font-black ${
              progresoDia === 100 ? 'text-emerald-600' : ac.text
            } tabular-nums w-8 sm:w-9 text-right`}
          >
            {progresoDia}%
          </span>

          <button
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setProgressExpanded((x) => !x);
            }}
            aria-label={progressExpanded ? 'Colapsar progreso' : 'Expandir progreso'}
          >
            {progressExpanded ? (
              <ChevronUp className={`w-4 h-4 ${ac.text}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${ac.text}`} />
            )}
          </button>
        </div>
      </div>

      {/* Panel expandido */}
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
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {completadosCount} de {totalMomentos} momentos completados
                </p>

                {progresoDia === 100 && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ¡Día completo!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {perfil.momentos.map((momento) => {
                  const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                  const done = momentoCompletado[momento.key];

                  const shortLabel = momento.label
                    .replace('Colación ', 'Col. ')
                    .replace('mañana', 'AM')
                    .replace('tarde', 'PM');

                  return (
                    <motion.button
                      key={momento.key}
                      animate={{ scale: done ? 1.02 : 1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToMomento(momento.key, true);
                      }}
                      className={`relative rounded-2xl p-3 sm:p-3.5 flex flex-col items-center gap-1.5 border shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${
                        done ? ac.cardDone : `${ac.cardPending} hover:shadow-md`
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                          done ? ac.iconDone : ac.iconPending
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className={`w-5 h-5 ${ac.momentoIconColorPending}`} />
                        )}
                      </div>

                      <span
                        className={`text-[10px] sm:text-[11px] font-bold text-center leading-tight ${
                          done ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {shortLabel}
                      </span>

                      <span
                        className={`text-[9px] sm:text-[10px] text-center leading-tight ${
                          done ? 'text-white/75' : 'text-slate-400'
                        }`}
                      >
                        {momento.hora}
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
