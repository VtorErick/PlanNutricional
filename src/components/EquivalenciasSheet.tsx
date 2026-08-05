import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BookOpen, ChevronRight, X } from 'lucide-react';
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
  const handleClose = React.useCallback(() => {
    setSelectedEq(null);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-ink-950/50 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <div className="flex h-full items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`flex h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-t-3xl border sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-3xl ${
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
                  <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${ac.text}`}>Guía rápida</p>
                  <h3 className={`font-display text-xl font-semibold tracking-tight leading-tight sm:text-2xl ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                    {selectedEq ? selectedEq.titulo : 'Equivalencias'}
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                    {selectedEq ? 'Revisa las alternativas y vuelve a la lista cuando termines.' : 'Toca una categoría para ver todas las opciones de intercambio.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
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
              {selectedEq ? (
                <motion.div
                  key={selectedEq.titulo}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEq(null)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ${isDarkMode ? 'bg-ink-800 text-cream-200' : 'bg-cream-100 text-ink-600'}`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Todas las categorías
                  </button>
                  <EquivalenciasCard
                    equivalencia={selectedEq}
                    accentClasses={ac}
                    isDarkMode={isDarkMode}
                  />
                </motion.div>
              ) : (
              <div className="grid overflow-hidden rounded-2xl border border-cream-200 bg-white dark:border-ink-700 dark:bg-ink-900 sm:grid-cols-2">
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
                      className={`grid min-h-[72px] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-cream-100 px-3 py-2.5 text-left transition-colors last:border-b-0 active:bg-cream-50 dark:border-ink-700 sm:[&:nth-last-child(-n+2)]:border-b-0 ${
                        isDarkMode
                          ? 'bg-ink-900 hover:bg-ink-800'
                          : 'bg-white hover:bg-cream-50'
                      }`}
                    >
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${ac.bgLight}`}>
                        {typeof Icon === 'string' ? (
                          <span className="text-lg">{Icon}</span>
                        ) : (() => {
                          const LucideIcon = Icon as React.ComponentType<{ className?: string }>;
                          return <LucideIcon className={`h-5 w-5 ${ac.text}`} />;
                        })()}
                      </div>

                      <div className="min-w-0">
                        <h3 className={`line-clamp-2 font-display text-[15px] font-semibold leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-800'}`}>
                          {eq.titulo}
                        </h3>
                        <p className={`mt-1 text-xs font-medium ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                          {eq.items.length} opciones
                        </p>
                      </div>

                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${ac.text}`} />
                    </motion.button>
                  );
                })}
              </div>
              )}
            </div>
          </motion.div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
