import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';
import EquivalenciasCard from './EquivalenciasCard';
import { useDiet } from '../context/DietContext';
import { equivalencesDB } from '../data/equivalencesDB';
import type { Equivalencia } from '../data';

interface EquivalenciasSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function EquivalenciasSheet({ open, onClose }: EquivalenciasSheetProps) {
  const { ac, isDarkMode } = useDiet();
  const [selectedEq, setSelectedEq] = React.useState<Equivalencia | null>(null);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex h-full items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`flex h-[92dvh] w-full flex-col overflow-hidden rounded-none border sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-[32px] ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
                : 'bg-white border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${ac.bgLight}`}>
                  <BookOpen className={`w-4 h-4 ${ac.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${ac.text}`}>
                    Guía rápida
                  </p>
                  <h3 className={`text-lg font-black tracking-tight leading-tight sm:text-xl ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    Equivalencias
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    Toca una categoría para ver todas las opciones de intercambio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-200 bg-slate-950 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                  }`}
                  aria-label="Cerrar guía de equivalencias"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
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
            </div>
          </motion.div>
        </div>

        {selectedEq ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar detalle de equivalencia"
              onClick={() => setSelectedEq(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-[2px]"
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`Detalle de ${selectedEq.titulo}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className={`fixed inset-x-0 bottom-0 z-[90] mx-auto max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border ${
                isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
              }`}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 dark:border-slate-800 border-slate-200`}>
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
      </motion.div>
    </AnimatePresence>
  );
}
