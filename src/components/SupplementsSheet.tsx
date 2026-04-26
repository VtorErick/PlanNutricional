import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock3, Pill, ShieldAlert, X } from 'lucide-react';
import { useDiet } from '../context/DietContext';
import { getAccentColors } from '../utils/theme';
import { getProfileLabel } from '../utils/profileLabels';

interface SupplementsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SupplementsSheet({ open, onClose }: SupplementsSheetProps) {
  const { perfilActivo, supplementsData, profileLabels, isAmbos, ac, isDarkMode } = useDiet();
  const [expandedSupplement, setExpandedSupplement] = React.useState<string | null>(null);
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);
  const profilesToRender = isAmbos
    ? (['el', 'ella'] as const)
    : ([perfilActivo === 'ella' ? 'ella' : 'el'] as const);

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
                ? 'border-slate-700 bg-slate-900 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
                : 'border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${ac.bgLight}`}>
                  <Pill className={`h-4 w-4 ${ac.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${ac.text}`}>
                    Opcional
                  </p>
                  <h3 className={`text-lg font-black leading-tight tracking-tight sm:text-xl ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    Suplementos
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    Revisa dosis sugeridas, notas y precauciones.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                  aria-label="Cerrar suplementos"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className={isAmbos ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'}>
                {profilesToRender.map((profileId) => {
                  const items = supplementsData[profileId] || [];
                  const profileAccent = profileId === 'el' ? elAccent : ellaAccent;

                  return (
                    <section key={profileId} className="space-y-3">
                      {isAmbos ? (
                        <div className={`rounded-2xl border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'}`}>
                          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${profileAccent.text}`}>
                            {getProfileLabel(profileLabels, profileId)}
                          </p>
                          <p className={`mt-1 text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            {items.length} opciones
                          </p>
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {items.map((supplement) => {
                          const key = `${profileId}-${supplement.name}`;
                          const expanded = expandedSupplement === key;

                          return (
                            <article
                              key={key}
                              className={`rounded-[24px] border p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${
                                isDarkMode ? 'border-slate-800 bg-slate-950/92' : 'border-slate-100 bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedSupplement((current) => current === key ? null : key)}
                                className="flex w-full items-start gap-3 text-left"
                              >
                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${profileAccent.bgGradientLight}`}>
                                  <Pill className={`h-5 w-5 ${profileAccent.text}`} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-base font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                                    {supplement.name}
                                  </h4>
                                  <p className={`mt-1 text-sm font-semibold leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {supplement.goalSupport}
                                  </p>
                                  <span className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${profileAccent.tagBg} ${profileAccent.tagText}`}>
                                    {supplement.timing}
                                  </span>
                                </div>

                                <ChevronDown className={`mt-2 h-5 w-5 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                              </button>

                              {expanded ? (
                                <div className="mt-4 space-y-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                                  <div>
                                    <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                      Por que podria ayudar
                                    </p>
                                    <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                      {supplement.whyItMayHelp}
                                    </p>
                                  </div>
                                  <div>
                                    <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                      Como usarlo
                                    </p>
                                    <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                      {supplement.howToUse}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      Nota
                                    </p>
                                    <p className="mt-1.5 text-emerald-900 dark:text-emerald-100">
                                      {supplement.notes}
                                    </p>
                                  </div>
                                  {supplement.caution ? (
                                    <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/30">
                                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                        Precaucion
                                      </p>
                                      <p className="mt-1.5 text-amber-900 dark:text-amber-100">
                                        {supplement.caution}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
