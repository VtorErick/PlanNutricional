import { motion } from 'framer-motion';
import { PencilLine, RotateCcw, Utensils } from 'lucide-react';
import type { MealItem } from '../types';
import { isMealEdited } from '../utils/mealEditing';

interface MealSelectorProps {
  perfil: string;
  comidas: MealItem[];
  dia: string;
  momento: string;
  selecciones: Record<string, boolean>;
  onToggle: (perfil: string, dia: string, momento: string, nombre: string) => void;
  onEditMeal?: (meal: MealItem, occurrenceId: string) => void;
  onRestoreMeal?: (meal: MealItem, occurrenceId: string) => void;
  accentClasses: Record<string, string>;
  porciones?: { key: string; label: string; icon: string; cantidad: number }[];
  isDarkMode?: boolean;
}

export default function MealSelector({
  perfil,
  comidas,
  dia,
  momento,
  selecciones,
  onToggle,
  onEditMeal,
  onRestoreMeal,
  accentClasses,
  porciones = [],
  isDarkMode = false,
}: MealSelectorProps) {
  return (
    <div className="grid gap-3">
      {comidas.map((comida, idx) => {
        const esSeleccionada = selecciones[`${perfil}-${dia}-${momento}-${comida.nombre}`];
        const edited = isMealEdited(comida);

        return (
          <motion.div
            key={`${comida.nombre}-${idx}`}
            role="button"
            tabIndex={0}
            data-testid={`meal-option-${perfil}-${dia}-${momento}-${idx}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: idx * 0.04 }}
            onClick={() => onToggle(perfil, dia, momento, comida.nombre)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggle(perfil, dia, momento, comida.nombre);
              }
            }}
            className={`relative overflow-hidden rounded-[22px] sm:rounded-[26px] transition-all duration-300 text-left w-full group cursor-pointer ${
              esSeleccionada
                ? `${accentClasses.bgLight} border-2 ${accentClasses.borderAccent} shadow-[0_8px_28px_rgb(0,0,0,0.05)]`
                : isDarkMode
                  ? 'bg-slate-950/92 border border-slate-800 shadow-[0_12px_28px_rgba(2,6,23,0.35)] hover:border-slate-700 hover:shadow-[0_16px_34px_rgba(2,6,23,0.45)]'
                  : 'bg-white border border-slate-100/90 shadow-sm hover:border-slate-200 hover:shadow-md'
            }`}
          >
            {esSeleccionada ? (
              <div className={`absolute inset-x-0 top-0 h-1 pointer-events-none ${isDarkMode ? 'bg-white/10' : 'bg-white/30'}`} />
            ) : null}

            <div className="relative p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className={`font-black text-[15px] sm:text-base tracking-tight leading-snug break-words ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          {comida.nombre}
                        </h4>
                      </div>

                     <div className="flex items-center gap-2 flex-shrink-0">
                      {edited && onRestoreMeal ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRestoreMeal(comida, `${dia}::${momento}::${idx}`);
                          }}
                          data-testid={`meal-restore-${perfil}-${dia}-${momento}-${idx}`}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                            isDarkMode
                              ? `${accentClasses.border} bg-slate-950 text-slate-100 hover:bg-slate-900`
                              : `${accentClasses.border} bg-white text-slate-700 hover:bg-slate-50`
                          }`}
                          aria-label={`Restaurar ${comida.nombre}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      {onEditMeal ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditMeal(comida, `${dia}::${momento}::${idx}`);
                          }}
                          data-testid={`meal-edit-${perfil}-${dia}-${momento}-${idx}`}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                            isDarkMode
                              ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                          aria-label={`Editar ${comida.nombre}`}
                        >
                          <PencilLine className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          esSeleccionada
                            ? `${accentClasses.bg} ${accentClasses.borderAccent} scale-105`
                            : isDarkMode
                              ? 'border-slate-700 group-hover:border-slate-500 bg-slate-900'
                              : 'border-slate-200 group-hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        {esSeleccionada ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </motion.div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <p className={`text-xs sm:text-[13px] mt-1.5 font-medium leading-relaxed break-words ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    {comida.detalle}
                  </p>
                  <p className={`text-[11px] sm:text-xs mt-2 font-bold ${accentClasses.text}`}>
                    {comida.caloriasKcal || 0} kcal
                    {typeof comida.proteinaG === 'number' ? ` · ${comida.proteinaG}g proteina` : ''}
                    {typeof comida.grasasG === 'number' ? ` · ${comida.grasasG}g grasas` : ''}
                  </p>
                </div>
              </div>

              <div className="pt-0.5">
                {porciones.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {porciones.map((item) => (
                      <span
                        key={`${comida.nombre}-${item.key}-${item.cantidad}`}
                        title={`${item.label} ${item.cantidad}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${accentClasses.tagBg} ${accentClasses.tagText} text-[10px] font-bold`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm ${isDarkMode ? 'bg-slate-900 text-slate-100 shadow-black/30' : 'bg-white/70 shadow-slate-200/50'}`}>
                          {item.icon}
                        </span>
                        <span>x{item.cantidad}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-2 text-[11px] rounded-[14px] px-2.5 py-2 border shadow-sm ${
                      esSeleccionada
                        ? isDarkMode
                          ? `bg-slate-900/80 ${accentClasses.border}`
                          : `bg-white/80 ${accentClasses.border}`
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-[10px] ${accentClasses.bgLight} flex items-center justify-center flex-shrink-0`}>
                      <Utensils className={`w-3.5 h-3.5 ${accentClasses.text}`} />
                    </div>
                    <span className={`font-medium tracking-tight leading-relaxed break-words ${isDarkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                      {comida.porciones}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
