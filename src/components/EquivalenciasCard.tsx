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
      className={`group rounded-[20px] p-3 transition-all duration-300 overflow-hidden relative z-0 border ${
        isDarkMode
          ? 'border-ink-700 bg-ink-900/92'
          : 'border-cream-100 bg-white'
      }`}
    >
      {/* Watermark */}
      <div className="absolute -bottom-5 -right-5 opacity-[0.025] pointer-events-none -rotate-12 z-[-1]">
        {typeof Icon === 'string' ? (
          <span className={`text-[92px] leading-none block ${isDarkMode ? 'text-white' : 'text-ink-800'}`}>{Icon}</span>
        ) : (
          <Icon className={`w-28 h-28 ${isDarkMode ? 'text-white' : 'text-ink-800'}`} />
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClasses.bgGradient} shadow-sm flex-shrink-0`}
        >
          {typeof Icon === 'string' ? (
            <span className="flex h-5 w-5 items-center justify-center text-lg">{Icon}</span>
          ) : (
            <Icon className="h-5 w-5 text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`font-black text-sm tracking-tight leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-700'}`}>
                {equivalencia.titulo}
              </h3>
              <p className={`mt-1 text-[11px] font-semibold ${accentClasses.text}`}>
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
      <div className="relative z-10 space-y-1.5">
        {equivalencia.items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + idx * 0.03 }}
            className={`flex items-start gap-2.5 rounded-[14px] px-2.5 py-2 transition-colors ${
              isDarkMode
                ? 'bg-ink-800'
                : 'bg-cream-50/80'
            }`}
          >
            <span className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${accentClasses.tagBg} ${accentClasses.tagText}`}>
              {idx + 1}
            </span>
            <p className={`text-[13px] font-medium leading-snug break-words ${isDarkMode ? 'text-cream-200' : 'text-ink-500'}`}>
              {item}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
