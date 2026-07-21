import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronRight, X } from 'lucide-react';
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
        className="fixed inset-0 z-[80] bg-ink-950/50 backdrop-blur-[3px]"
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
            className={`flex h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-t-[30px] border sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-[30px] ${
              isDarkMode
                ? 'bg-ink-900 border-ink-700 shadow-lift'
                : 'bg-white border-cream-200 shadow-lift'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'
            }`}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream-300 dark:bg-ink-600 sm:hidden" />
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${ac.bgLight}`}>
                  <BookOpen className={`w-4.5 h-4.5 ${ac.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${ac.text}`}>
                    Guía rápida
                  </p>
                  <h3 className={`font-display text-xl font-semibold tracking-tight leading-tight sm:text-2xl ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                    Equivalencias
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                    Toca una categoría para ver todas las opciones de intercambio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-90 ${
                    isDarkMode
                      ? 'border-ink-700 text-ink-200 bg-ink-900 hover:bg-ink-800'
                      : 'border-cream-200 text-ink-500 bg-white hover:bg-cream-100'
                  }`}
                  aria-label="Cerrar guía de equivalencias"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-5">
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
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
                      className={`grid min-h-[72px] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
                        isDarkMode
                          ? 'bg-ink-800/60 border border-ink-700 hover:border-ink-600'
                          : 'bg-white border border-cream-200 hover:border-cream-300 shadow-soft hover:shadow-lift'
                      }`}
                    >
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${ac.bgGradient}`}>
                        {typeof Icon === 'string' ? (
                          <span className="text-lg">{Icon}</span>
                        ) : (() => {
                          const LucideIcon = Icon as React.ComponentType<{ className?: string }>;
                          return <LucideIcon className="h-5 w-5 text-white" />;
                        })()}
                      </div>

                      <div className="min-w-0">
                        <h3 className={`line-clamp-2 font-display text-[15px] font-semibold leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-800'}`}>
                          {eq.titulo}
                        </h3>
                        <p className={`mt-1 text-[11px] font-medium ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                          {eq.items.length} opciones
                        </p>
                      </div>

                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${ac.text}`} />
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
              className="fixed inset-0 z-[80] bg-ink-950/55 backdrop-blur-[3px]"
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`Detalle de ${selectedEq.titulo}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className={`fixed inset-x-0 bottom-0 z-[90] mx-auto max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-[30px] border ${
                isDarkMode ? 'border-ink-700 bg-ink-950' : 'border-cream-200 bg-white'
              }`}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl bg-white/90 dark:bg-ink-950/90 dark:border-ink-700 border-cream-200`}>
                <p className={`font-display text-base font-semibold ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>Detalle</p>
                <button
                  type="button"
                  onClick={() => setSelectedEq(null)}
                  className={`rounded-full p-2 active:scale-90 ${isDarkMode ? 'hover:bg-ink-800 text-ink-300' : 'hover:bg-cream-100 text-ink-500'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-3 sm:p-4">
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
