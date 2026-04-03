import { motion } from 'framer-motion';
import { Utensils, Tag, CheckCircle2 } from 'lucide-react';
import type { MealItem } from '../data';

interface MealSelectorProps {
  perfil: string;
  comidas: MealItem[];
  dia: string;
  momento: string;
  selecciones: Record<string, boolean>;
  onToggle: (perfil: string, dia: string, momento: string, nombre: string) => void;
  accentClasses: Record<string, string>;
}

export default function MealSelector({
  perfil,
  comidas,
  dia,
  momento,
  selecciones,
  onToggle,
  accentClasses,
}: MealSelectorProps) {
  return (
    <div className="grid gap-3">
      {comidas.map((comida, idx) => {
        const esSeleccionada = selecciones[`${perfil}-${dia}-${momento}-${comida.nombre}`];
        return (
          <motion.div
            key={comida.nombre}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => onToggle(perfil, dia, momento, comida.nombre)}
            className={`relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer group ${
              esSeleccionada
                ? `${accentClasses.bgLight} border-2 ${accentClasses.borderAccent} shadow-md`
                : 'bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="relative p-4 space-y-2.5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                    {comida.nombre}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{comida.detalle}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    esSeleccionada
                      ? `${accentClasses.bg} ${accentClasses.borderAccent}`
                      : 'border-slate-300 group-hover:border-slate-400'
                  }`}
                >
                  {esSeleccionada && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Porciones */}
              <div className="flex items-center gap-2 text-xs bg-white rounded-lg p-2 border border-slate-100">
                <Utensils className={`w-3.5 h-3.5 ${accentClasses.text} flex-shrink-0`} />
                <span className="text-slate-600 font-medium">{comida.porciones}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {comida.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${accentClasses.tagBg} ${accentClasses.tagText} text-xs font-medium`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Ingredients */}
              {comida.super.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="flex flex-wrap gap-1">
                    {comida.super.map((ing) => (
                      <span
                        key={ing}
                        className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
