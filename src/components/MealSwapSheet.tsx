import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock3, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { MealItem } from '../types';
import { sanitizeMealPortionsText } from '../utils/mealPortions';
import { getMealEmoji } from '../utils/mealEmoji';

interface MealSwapSheetProps {
  open: boolean;
  title: string;
  profileId: string;
  meals: MealItem[];
  dia: string;
  momentoKey: string;
  momentoLabel: string;
  momentoHora: string;
  selecciones: Record<string, boolean>;
  onToggle: (perfil: string, dia: string, momento: string, nombre: string) => void;
  onClose: () => void;
  porciones: { key: string; label: string; icon: string; cantidad: number }[];
  accentClasses: Record<string, string>;
  isDarkMode: boolean;
}

export default function MealSwapSheet({
  open,
  title,
  profileId,
  meals,
  dia,
  momentoKey,
  momentoLabel,
  momentoHora,
  selecciones,
  onToggle,
  onClose,
  accentClasses,
  isDarkMode,
}: MealSwapSheetProps) {
  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-ink-950/50 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex h-full items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`flex h-[min(92dvh,790px)] w-full flex-col overflow-hidden rounded-t-[30px] border sm:h-auto sm:max-h-[84vh] sm:max-w-lg sm:rounded-[30px] ${
              isDarkMode
                ? 'bg-ink-900 border-ink-700 shadow-lift'
                : 'bg-white border-cream-200 shadow-lift'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-5 ${
              isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'
            }`}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream-300 dark:bg-ink-600 sm:hidden" />
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-2xl border ${accentClasses.bgLight} ${accentClasses.border}`}>
                  <Clock3 className={`h-3.5 w-3.5 ${accentClasses.text}`} />
                  <span className={`mt-0.5 text-[9px] font-extrabold tabular-nums ${accentClasses.text}`}>
                    {momentoHora}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${accentClasses.text}`}>
                    {momentoLabel}
                  </p>
                  <h3 className={`font-display text-xl font-semibold tracking-tight leading-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                    {title}
                  </h3>
                  <p className={`mt-1 text-[11px] font-medium leading-snug ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                    Elige una opción. Puedes cambiarla cuando quieras.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
                    isDarkMode
                      ? 'border-ink-700 text-ink-200 bg-ink-900 hover:bg-ink-800'
                      : 'border-cream-200 text-ink-500 bg-white hover:bg-cream-100'
                  }`}
                  aria-label="Cerrar selector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-4">
              <div className="grid gap-2">
                {meals.map((comida, idx) => {
                  const esSeleccionada = selecciones[`${profileId}-${dia}-${momentoKey}-${comida.nombre}`];

                  return (
                    <motion.button
                      key={`${comida.nombre}-${idx}`}
                      type="button"
                      data-testid={`meal-swap-option-${profileId}-${dia}-${momentoKey}-${idx}`}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: idx * 0.03 }}
                      onClick={() => {
                        onToggle(profileId, dia, momentoKey, comida.nombre);
                        onClose();
                      }}
                      className={`relative w-full cursor-pointer overflow-hidden rounded-[20px] text-left transition-all duration-300 group ${
                        esSeleccionada
                          ? `${accentClasses.bgLight} border-2 ${accentClasses.borderAccent} shadow-soft`
                          : isDarkMode
                            ? 'bg-ink-800/60 border border-ink-700 hover:border-ink-600'
                            : 'bg-white border border-cream-200 shadow-soft hover:shadow-lift'
                      }`}
                    >
                      <div className="relative flex items-start gap-3 p-3.5">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${isDarkMode ? 'bg-ink-900' : 'bg-cream-50'}`}>
                          {getMealEmoji(comida.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`pr-7 font-display text-[15px] font-semibold leading-snug ${isDarkMode ? 'text-cream-100' : 'text-ink-800'}`}>
                            {comida.nombre}
                          </h4>
                          <p className={`mt-1 line-clamp-2 text-[11px] font-medium leading-[1.45] ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                            {comida.detalle}
                          </p>
                          <p className={`mt-2 line-clamp-1 text-[10px] font-bold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                            {comida.caloriasKcal || 0} kcal
                            {typeof comida.proteinaG === 'number' ? ` · ${comida.proteinaG}g proteína` : ''}
                            {' · '}{sanitizeMealPortionsText(comida.porciones)}
                          </p>
                        </div>
                        <div className={`absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                          esSeleccionada
                            ? `${accentClasses.bg} ${accentClasses.borderAccent}`
                            : isDarkMode ? 'border-ink-600 bg-ink-800' : 'border-cream-300 bg-white'
                        }`}>
                          {esSeleccionada ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
