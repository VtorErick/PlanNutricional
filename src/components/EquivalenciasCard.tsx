import { motion } from 'framer-motion';
import type { Equivalencia } from '../data';

interface EquivalenciasCardProps {
  equivalencia: Equivalencia;
  delay?: number;
  accentClasses: Record<string, string>;
}

export default function EquivalenciasCard({
  equivalencia,
  delay = 0,
  accentClasses,
}: EquivalenciasCardProps) {
  const Icon = equivalencia.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay }}
      className="group bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_10px_34px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden relative z-0"
    >
      {/* Watermark */}
      <div className="absolute -bottom-7 -right-7 opacity-[0.035] pointer-events-none -rotate-12 z-[-1]">
        <Icon className="w-36 h-36 sm:w-44 sm:h-44 text-slate-900" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`relative inline-flex p-3 rounded-2xl bg-gradient-to-br ${accentClasses.bgGradient} shadow-sm flex-shrink-0`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-black text-base sm:text-lg text-slate-800 tracking-tight leading-tight">
            {equivalencia.titulo}
          </h3>
          <p className={`text-[11px] sm:text-xs mt-1 font-semibold ${accentClasses.text}`}>
            Cada elemento = 1 porción
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="relative z-10 space-y-2">
        {equivalencia.items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + idx * 0.03 }}
            className="flex items-start gap-3 p-3 rounded-[18px] bg-slate-50 border border-slate-100 transition-colors"
          >
            <div
              className={`w-2 h-2 rounded-full ${accentClasses.dot} mt-1.5 flex-shrink-0 shadow-sm`}
            />
            <p className="text-sm font-medium text-slate-600 leading-snug break-words">
              {item}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}