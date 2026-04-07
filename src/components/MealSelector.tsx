import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';
import type { MealItem } from '../data';

interface MealSelectorProps {
  perfil: string;
  comidas: MealItem[];
  dia: string;
  momento: string;
  selecciones: Record<string, boolean>;
  onToggle: (perfil: string, dia: string, momento: string, nombre: string) => void;
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
  accentClasses,
  porciones = [],
  isDarkMode = false,
}: MealSelectorProps) {
  return (
    <div className="grid gap-3">
      {comidas.map((comida, idx) => {
        const esSeleccionada = selecciones[`${perfil}-${dia}-${momento}-${comida.nombre}`];

        return (
          <motion.button
            key={comida.nombre}
            type="button"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: idx * 0.04 }}
            onClick={() => onToggle(perfil, dia, momento, comida.nombre)}
            className={`relative overflow-hidden rounded-[22px] sm:rounded-[26px] transition-all duration-300 text-left w-full group ${
              esSeleccionada
                ? `${accentClasses.bgLight} border-2 ${accentClasses.borderAccent} shadow-[0_8px_28px_rgb(0,0,0,0.05)]`
                : isDarkMode
                  ? 'bg-slate-950/92 border border-slate-800 shadow-[0_12px_28px_rgba(2,6,23,0.35)] hover:border-slate-700 hover:shadow-[0_16px_34px_rgba(2,6,23,0.45)]'
                  : 'bg-white border border-slate-100/90 shadow-sm hover:border-slate-200 hover:shadow-md'
            }`}
          >
            {esSeleccionada && (
              <div className={`absolute inset-x-0 top-0 h-1 pointer-events-none ${isDarkMode ? 'bg-white/10' : 'bg-white/30'}`} />
            )}

            <div className="relative p-4 sm:p-5 space-y-3">
              {/* Card header */}
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className={`font-black text-[15px] sm:text-base tracking-tight leading-snug break-words ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {comida.nombre}
                    </h4>

                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        esSeleccionada
                          ? `${accentClasses.bg} ${accentClasses.borderAccent} scale-105`
                          : isDarkMode
                            ? 'border-slate-700 group-hover:border-slate-500 bg-slate-900'
                            : 'border-slate-200 group-hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      {esSeleccionada && (
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
                      )}
                    </div>
                  </div>

                  <p className={`text-xs sm:text-[13px] mt-1.5 font-medium leading-relaxed break-words ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    {comida.detalle}
                  </p>
                  <p className={`text-[11px] sm:text-xs mt-2 font-bold ${accentClasses.text}`}>
                    {comida.caloriasKcal || 0} kcal
                    {typeof comida.proteinaG === 'number' ? ` · ${comida.proteinaG}g proteína` : ''}
                  </p>
                </div>
              </div>

              {/* Portion badges */}
              <div className="pt-0.5">
                {porciones.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {porciones.map((item) => (
                      <span
                        key={`${comida.nombre}-${item.key}-${item.cantidad}`}
                        title={`${item.label} ${item.cantidad}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${accentClasses.tagBg} ${accentClasses.tagText} text-[11px] font-bold`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] shadow-sm ${isDarkMode ? 'bg-slate-900 text-slate-100 shadow-black/30' : 'bg-white/70 shadow-slate-200/50'}`}>
                          {item.icon}
                        </span>
                        <span>x{item.cantidad}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-3 text-xs rounded-[16px] p-3 border shadow-sm ${
                      esSeleccionada
                        ? isDarkMode
                          ? `bg-slate-900/80 ${accentClasses.border}`
                          : `bg-white/80 ${accentClasses.border}`
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-[12px] ${accentClasses.bgLight} flex items-center justify-center flex-shrink-0`}
                    >
                      <Utensils className={`w-4 h-4 ${accentClasses.text}`} />
                    </div>
                    <span className={`font-medium tracking-tight leading-relaxed break-words ${isDarkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                      {comida.porciones}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {comida.tags.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 pt-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  {comida.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full ${accentClasses.tagBg} ${accentClasses.tagText} text-[9px] uppercase tracking-widest font-extrabold`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
