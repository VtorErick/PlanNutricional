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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative"
    >
      {/* Icon */}
      <div className={`relative mb-3 inline-flex p-2.5 rounded-xl bg-gradient-to-br ${accentClasses.bgGradientLight}`}>
        <Icon className={`w-5 h-5 ${accentClasses.text}`} />
      </div>

      {/* Title */}
      <h3 className={`relative font-bold text-base text-slate-900 mb-3 group-hover:${accentClasses.text} transition-colors`}>
        {equivalencia.titulo}
      </h3>

      {/* Items */}
      <div className="relative space-y-2">
        {equivalencia.items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + (idx * 0.03) }}
            className={`flex gap-2.5 p-2.5 rounded-lg ${accentClasses.bgLight} transition-colors`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${accentClasses.dot} mt-1.5 flex-shrink-0`} />
            <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
