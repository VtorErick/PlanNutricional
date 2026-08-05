import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Repeat } from 'lucide-react';
import EquivalenciasCard from '../EquivalenciasCard';
import { useDiet } from '../../context/DietContext';
import { equivalencesDB } from '../../data/equivalencesDB';
import type { Equivalencia } from '../../data';

export default function EquivalenciasView() {
  const { ac, isDarkMode } = useDiet();
  const [selectedEq, setSelectedEq] = React.useState<Equivalencia | null>(null);

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
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/72 to-white/88 dark:from-ink-900/84 dark:via-ink-900/72 dark:to-ink-900/86" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shadow-sm ${isDarkMode ? 'bg-ink-800/80' : 'bg-white/90'}`}>
            <Repeat className={`h-5 w-5 sm:h-6 sm:w-6 ${ac.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-lg sm:text-xl font-extrabold ${ac.textDark}`}>
              Diccionario de Intercambios
            </h2>
            <p className={`mt-0.5 text-xs font-semibold ${isDarkMode ? 'text-ink-400' : 'text-ink-500'}`}>
              Encuentra reemplazos sencillos y revisa su detalle sin perder tu lugar.
            </p>
          </div>
        </div>
      </div>

      {!selectedEq ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {equivalencesDB.map((eq, idx) => {
          const Icon = eq.icon;

          return (
            <motion.button
              key={idx}
              type="button"
              onClick={() => setSelectedEq(eq)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`aspect-square rounded-2xl p-3 text-left transition-all active:scale-[0.98] sm:aspect-[1.18] sm:p-4 ${
                isDarkMode
                  ? 'bg-ink-900/92 border border-ink-700 hover:border-ink-600'
                  : 'bg-white border border-cream-100 hover:border-cream-200 shadow-[0_6px_18px_rgba(15,23,42,0.06)]'
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ac.bgGradient}`}>
                  {typeof Icon === 'string' ? (
                    <span className="text-lg">{Icon}</span>
                  ) : (() => {
                    const LucideIcon = Icon as React.ComponentType<{ className?: string }>;
                    return <LucideIcon className="h-5 w-5 text-white" />;
                  })()}
                </div>

                <ul className="mt-4 hidden space-y-1.5 sm:block">
                  {eq.items.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className={`line-clamp-1 text-xs font-semibold leading-relaxed ${
                        isDarkMode ? 'text-ink-400' : 'text-ink-400'
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <div>
                  <h3 className={`line-clamp-2 text-sm font-black leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-800'}`}>
                    {eq.titulo}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-ink-400">
                    {eq.items.length} opciones
                  </p>
                  <p className={`mt-2 text-xs font-bold ${ac.text}`}>
                    Toca para ver detalle
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div> : null}

      <AnimatePresence>
        {selectedEq ? (
          <motion.section
            key={selectedEq.titulo}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="surface-card p-4"
          >
            <button
              type="button"
              onClick={() => setSelectedEq(null)}
              className={`mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ${isDarkMode ? 'bg-ink-800 text-cream-200' : 'bg-cream-100 text-ink-600'}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al diccionario
            </button>
            <EquivalenciasCard
              equivalencia={selectedEq}
              accentClasses={ac}
              isDarkMode={isDarkMode}
            />
          </motion.section>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
