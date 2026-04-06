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
                : 'bg-white border border-slate-100/90 shadow-sm hover:border-slate-200 hover:shadow-md'
            }`}
          >
            {esSeleccionada && (
              <div className="absolute inset-x-0 top-0 h-1 bg-white/30 pointer-events-none" />
            )}

            <div className="relative p-4 sm:p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-black text-slate-800 text-[15px] sm:text-base tracking-tight leading-snug break-words">
                      {comida.nombre}
                    </h4>

                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        esSeleccionada
                          ? `${accentClasses.bg} ${accentClasses.borderAccent} scale-105`
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

                  <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 font-medium leading-relaxed break-words">
                    {comida.detalle}
                  </p>
                </div>
              </div>

              {/* Porciones */}
              <div className="pt-0.5">
                {porciones.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {porciones.map((item) => (
                      <span
                        key={`${comida.nombre}-${item.key}-${item.cantidad}`}
                        title={`${item.label} ${item.cantidad}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${accentClasses.tagBg} ${accentClasses.tagText} text-[11px] font-bold`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[12px] shadow-sm shadow-slate-200/50">
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
                        ? `bg-white/80 ${accentClasses.border}`
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-[12px] ${accentClasses.bgLight} flex items-center justify-center flex-shrink-0`}
                    >
                      <Utensils className={`w-4 h-4 ${accentClasses.text}`} />
                    </div>
                    <span className="text-slate-700 font-medium tracking-tight leading-relaxed break-words">
                      {comida.porciones}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {comida.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
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