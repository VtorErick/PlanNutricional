import React from 'react';
import { motion } from 'framer-motion';
import { Repeat } from 'lucide-react';
import EquivalenciasCard from '../EquivalenciasCard';
import { useDiet } from '../../context/DietContext';
import { equivalencesDB } from '../../data/equivalencesDB';

export default function EquivalenciasView() {
  const { ac, isDarkMode } = useDiet();

  return (
    <motion.div
      key="equivalencias"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 sm:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${ac.bgGradientLight}`}>
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url('/images/hero.png')",
              backgroundPosition: 'left 14% top 18%',
              backgroundSize: '155%',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/72 to-white/88 dark:from-slate-950/84 dark:via-slate-950/72 dark:to-slate-950/86" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shadow-sm ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/90'}`}>
            <Repeat className={`h-5 w-5 sm:h-6 sm:w-6 ${ac.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-lg sm:text-xl font-extrabold ${ac.textDark}`}>
              Diccionario de Intercambios
            </h2>
            <p className={`mt-0.5 text-[11px] sm:text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Todas las opciones contienen las mismas calorías y macronutrientes por porción.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equivalencesDB.map((eq, idx) => (
          <EquivalenciasCard
            key={idx}
            equivalencia={eq}
            delay={idx * 0.05}
            accentClasses={ac}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </motion.div>
  );
}
