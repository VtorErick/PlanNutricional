import { motion } from 'framer-motion';
import type { Equivalencia } from '../data';

interface EquivalenciasCardProps {
  equivalencia: Equivalencia;
  delay?: number;
  accentClasses: Record<string, string>;
  isDarkMode?: boolean;
}

export default function EquivalenciasCard({
  equivalencia,
  delay = 0,
  accentClasses,
  isDarkMode = false,
}: EquivalenciasCardProps) {
  const Icon = equivalencia.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay }}
      className={`group rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 transition-all duration-300 overflow-hidden relative z-0 ${
        isDarkMode
          ? 'bg-slate-950/92 shadow-[0_12px_30px_rgba(2,6,23,0.36)] hover:shadow-[0_16px_36px_rgba(2,6,23,0.46)]'
          : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_10px_34px_rgb(0,0,0,0.08)]'
      }`}
    >
      {/* Watermark */}
      <div className="absolute -bottom-7 -right-7 opacity-[0.035] pointer-events-none -rotate-12 z-[-1]">
        <Icon className={`w-36 h-36 sm:w-44 sm:h-44 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`relative inline-flex p-3 rounded-2xl bg-gradient-to-br ${accentClasses.bgGradient} shadow-sm flex-shrink-0`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`font-black text-base sm:text-lg tracking-tight leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {equivalencia.titulo}
              </h3>
              <p className={`text-[11px] sm:text-xs mt-1 font-semibold ${accentClasses.text}`}>
                Cada elemento = 1 porcion
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${accentClasses.tagBg} ${accentClasses.tagText}`}>
              {equivalencia.items.length} opciones
            </span>
          </div>
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
            className={`flex items-start gap-3 p-3 rounded-[18px] transition-colors ${
              isDarkMode
                ? 'bg-slate-900'
                : 'bg-slate-50/80'
            }`}
          >
            <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${accentClasses.tagBg} ${accentClasses.tagText}`}>
              {idx + 1}
            </span>
            <p className={`text-sm font-medium leading-snug break-words ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
              {item}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
