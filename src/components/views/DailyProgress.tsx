import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, TrendingDown, ChevronUp, ChevronDown, UtensilsCrossed, Sun, Apple, Coffee, Moon } from 'lucide-react';

const momentoIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

import { useDiet } from '../../context/DietContext';

export default function DailyProgress() {
  const { 
    perfilActivo, progressExpanded, setProgressExpanded, 
    diasDisponibles, diaActivo, setDiaActivo, 
    perfilBase: perfil,
    momentoCompletado, progresoDia, completadosCount, totalMomentosProgress: totalMomentos,
    scrollToMomento,
    ac 
  } = useDiet();

  return (
    <motion.div
      key={`progress-${perfilActivo}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className={`sticky top-[52px] sm:top-[56px] z-40 bg-white/97 backdrop-blur-xl border-b ${ac.border} shadow-md`}
    >
      {/* ── Day selector (Unified) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100/60">
        <div className="flex gap-1.5 overflow-x-auto snap-x scrollbar-none items-center">
          {diasDisponibles.map((dia) => (
            <button key={dia} onClick={(e) => { e.stopPropagation(); setDiaActivo(dia); }}
              className={`py-1.5 px-3 rounded-xl font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${diaActivo === dia ? `${ac.btnActive} shadow-sm` : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600'}`}>
              <span className="sm:hidden">{dia.slice(0, 3)}</span>
              <span className="hidden sm:inline">{dia}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Always visible compact bar ── */}
      <div
        className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setProgressExpanded((e) => !e)}
      >
        {/* Active day icon */}
        <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${ac.bgGradient} flex-shrink-0 shadow-sm`}>
          <TrendingDown className="w-3 h-3 text-white" />
        </div>

        {/* Moment indicators — clickable to navigate to that section */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {perfil.momentos.map((momento) => {
            const Icon = momentoIcons[momento.key] || UtensilsCrossed;
            const done = momentoCompletado[momento.key];
            return (
              <button
                key={momento.key}
                title={`Ir a ${momento.label}`}
                onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key, progressExpanded); }}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  done
                    ? `bg-gradient-to-br ${ac.bgGradient} shadow-sm hover:opacity-80`
                    : `${ac.bgLight} border ${ac.border} hover:opacity-70`
                }`}
              >
                {done
                  ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  : <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${ac.momentoIconColorPending}`} />
                }
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className={`flex-1 h-2 bg-gradient-to-r ${ac.progressBg} rounded-full overflow-hidden shadow-inner shadow-slate-200/70`}>
          <motion.div
            className={`h-full bg-gradient-to-r ${ac.progressFill} rounded-full shadow-[0_0_12px_rgba(15,23,42,0.25)]`}
            animate={{ width: `${progresoDia}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>

        {/* Percentage */}
        <span className={`text-[11px] sm:text-xs font-bold ${progresoDia === 100 ? 'text-emerald-600' : ac.text} flex-shrink-0 tabular-nums w-7 sm:w-8 text-right`}>
          {progresoDia}%
        </span>

        {/* Toggle expand */}
        <button
          className={`flex-shrink-0 p-1 rounded-full hover:${ac.bgLight} transition-colors`}
          onClick={(e) => { e.stopPropagation(); setProgressExpanded((x) => !x); }}
          aria-label={progressExpanded ? 'Colapsar progreso' : 'Expandir progreso'}
        >
          {progressExpanded
            ? <ChevronUp className={`w-4 h-4 ${ac.text}`} />
            : <ChevronDown className={`w-4 h-4 ${ac.text}`} />
          }
        </button>
      </div>

      {/* ── Expanded panel with moment cards ── */}
      <AnimatePresence>
        {progressExpanded && (
          <motion.div
            key="progress-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className={`max-w-5xl mx-auto px-4 sm:px-6 pb-4 pt-1`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-slate-500">
                  {completadosCount} de {totalMomentos} momentos completados
                </p>
                {progresoDia === 100 && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ¡Día completo! 🎉
                  </span>
                )}
              </div>

              {/* Moment cards — clickable to navigate to section */}
              <div className="grid grid-cols-5 gap-2">
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
                      animate={{ scale: done ? 1.03 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key, true); }}
                      className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${
                        done ? ac.cardDone : `${ac.cardPending} hover:shadow-md`
                      }`}
                    >
                      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${done ? ac.iconDone : ac.iconPending}`}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          : <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${ac.momentoIconColorPending}`} />
                        }
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-tight ${done ? 'text-white' : 'text-slate-700'}`}>
                        {shortLabel}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] text-center leading-tight ${done ? 'text-white/70' : 'text-slate-400'}`}>
                        {momento.hora}
                      </span>
                      {done && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center shadow"
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
