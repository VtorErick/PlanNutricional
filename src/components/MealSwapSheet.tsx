import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock3, Utensils, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { MealItem } from '../types';
import { sanitizeMealPortionsText } from '../utils/mealPortions';

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

  const selectedCount = meals.filter(
    (meal) => selecciones[`${profileId}-${dia}-${momentoKey}-${meal.nombre}`]
  ).length;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-[2px]"
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
            className={`flex h-[min(92dvh,790px)] w-full flex-col overflow-hidden rounded-t-[26px] border sm:h-auto sm:max-h-[84vh] sm:max-w-lg sm:rounded-[26px] ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
                : 'bg-white border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-3 sm:px-5 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-2xl border ${accentClasses.bgLight} ${accentClasses.border}`}>
                  <Clock3 className={`h-3.5 w-3.5 ${accentClasses.text}`} />
                  <span className={`mt-0.5 text-[9px] font-black tabular-nums ${accentClasses.text}`}>
                    {momentoHora}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${accentClasses.text}`}>
                    {momentoLabel}
                  </p>
                  <h3 className={`text-lg font-black tracking-tight leading-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    {title}
                  </h3>
                  <p className={`mt-1 text-[11px] font-bold leading-snug ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {meals.length} opciones
                    {selectedCount > 0 ? ` · ${selectedCount} elegido${selectedCount > 1 ? 's' : ''}` : ''}
                    {' · '}Toca una opcion para cambiarla
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border transition ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-200 bg-slate-950 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
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
                      className={`relative w-full cursor-pointer overflow-hidden rounded-[18px] text-left transition-all duration-300 group ${
                        esSeleccionada
                          ? `${accentClasses.bgLight} border ${accentClasses.borderAccent} shadow-[0_8px_18px_rgb(0,0,0,0.04)]`
                          : isDarkMode
                            ? 'bg-slate-950/92 border border-slate-800 shadow-[0_8px_18px_rgba(2,6,23,0.24)] hover:border-slate-700'
                            : 'bg-white border border-slate-100/90 shadow-sm hover:border-slate-200'
                      }`}
                    >
                      <div className="relative p-3">
                        <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-1.5">
                          <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            esSeleccionada
                              ? `${accentClasses.bg} ${accentClasses.borderAccent}`
                              : isDarkMode
                                ? 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
                                : 'border-slate-200 bg-slate-50 group-hover:border-slate-300'
                          }`}>
                            {esSeleccionada ? (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                              </motion.span>
                            ) : null}
                          </div>

                          <h4 className={`min-w-0 font-black text-[14px] leading-snug break-words ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {comida.nombre}
                          </h4>

                          <span className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${accentClasses.tagBg} ${accentClasses.tagText}`}>
                            {comida.caloriasKcal || 0} kcal
                          </span>

                          <div className="col-start-2 col-end-4 min-w-0">
                            <p className={`text-[11px] font-medium leading-[1.45] break-words ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                              {comida.detalle}
                            </p>

                            <p className={`mt-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {typeof comida.proteinaG === 'number' ? `${comida.proteinaG}g proteina` : 'Proteina n/d'}
                              {typeof comida.carbohidratosG === 'number' ? ` · ${comida.carbohidratosG}g carbohidratos` : ''}
                              {typeof comida.grasasG === 'number' ? ` · ${comida.grasasG}g grasas` : ''}
                            </p>

                            <p className={`mt-1 flex items-start gap-1.5 text-[10px] font-semibold leading-[1.35] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              <Utensils className={`mt-0.5 h-3 w-3 flex-shrink-0 ${accentClasses.text}`} />
                              <span className="min-w-0 break-words">{sanitizeMealPortionsText(comida.porciones)}</span>
                            </p>
                          </div>
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
