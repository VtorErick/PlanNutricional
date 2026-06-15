import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Repeat, X } from 'lucide-react';
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
              Vista Bento: explora en grid y toca para ver el detalle completo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
                  ? 'bg-slate-950/92 border border-slate-800 hover:border-slate-700'
                  : 'bg-white border border-slate-100 hover:border-slate-200 shadow-[0_6px_18px_rgba(15,23,42,0.06)]'
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
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <div>
                  <h3 className={`line-clamp-2 text-sm font-black leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {eq.titulo}
                  </h3>
                  <p className={`mt-1 text-[11px] sm:text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {eq.items.length} opciones
                  </p>
                  <p className={`mt-2 text-[11px] font-bold ${ac.text}`}>
                    Toca para ver detalle
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEq ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar detalle de equivalencia"
              onClick={() => setSelectedEq(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px]"
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`Detalle de ${selectedEq.titulo}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border ${
                isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
              }`}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 dark:border-slate-800 border-slate-200">
                <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Detalle</p>
                <button
                  type="button"
                  onClick={() => setSelectedEq(null)}
                  className={`rounded-xl p-2 ${isDarkMode ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-4">
                <EquivalenciasCard
                  equivalencia={selectedEq}
                  accentClasses={ac}
                  isDarkMode={isDarkMode}
                />
              </div>
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
