import { motion } from 'framer-motion';
import type { Equivalencia } from '../data';

interface EquivalenciasCardProps {
  equivalencia: Equivalencia;
  delay?: number;
  accentClasses: Record<string, string>;
}

export default function EquivalenciasCard({ equivalencia, delay = 0, accentClasses }: EquivalenciasCardProps) {
  const Icon = equivalencia.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay }}
      className={`group bg-white rounded-[28px] sm:rounded-3xl p-6 border-[1.5px] border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden relative z-0`}
    >
      {/* Watermark Icon */}
      <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none transform -rotate-12 z-[-1]">
        <Icon className="w-48 h-48 text-slate-900" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`relative inline-flex p-3 rounded-2xl bg-gradient-to-br ${accentClasses.bgGradient} shadow-sm`}>
          <Icon className={`w-6 h-6 text-white`} />
        </div>
        <h3 className={`font-bold text-lg text-slate-800 tracking-tight leading-tight group-hover:${accentClasses.text} transition-colors`}>
          {equivalencia.titulo}
        </h3>
      </div>

      {/* Items */}
      <div className="relative space-y-2.5 z-10">
        {equivalencia.items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + (idx * 0.03) }}
            className={`flex items-start gap-3 p-3.5 rounded-[18px] bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors`}
          >
            <div className={`w-2 h-2 rounded-full ${accentClasses.dot} mt-1.5 flex-shrink-0 shadow-sm`} />
            <p className="text-sm font-medium text-slate-600 leading-snug">{item}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
