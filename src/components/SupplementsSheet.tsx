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
  const [supplementProfile, setSupplementProfile] = React.useState<'el' | 'ella'>('el');
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);
  const profilesToRender = isAmbos
    ? ([supplementProfile] as const)
    : ([perfilActivo === 'ella' ? 'ella' : 'el'] as const);

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
            className={`flex h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-t-3xl border sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-3xl ${
              isDarkMode
                ? 'border-ink-700 bg-ink-900 shadow-lift'
                : 'border-cream-200 bg-white shadow-lift'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'
            }`}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream-300 dark:bg-ink-600 sm:hidden" />
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${ac.bgLight}`}>
                  <Pill className={`h-4.5 w-4.5 ${ac.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${ac.text}`}>Recomendaciones</p>
                  <h3 className={`font-display text-xl font-semibold leading-tight tracking-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                    Suplementos
                  </h3>
                  <p className={`mt-1 text-xs leading-snug ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                    Revisa dosis sugeridas, notas y precauciones.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
                    isDarkMode
                      ? 'border-ink-700 bg-ink-900 text-ink-200 hover:bg-ink-800'
                      : 'border-cream-200 bg-white text-ink-500 hover:bg-cream-100'
                  }`}
                  aria-label="Cerrar suplementos"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-5">
              {isAmbos ? (
                <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-2xl border border-cream-200 p-1.5 dark:border-ink-700">
                  {(['el', 'ella'] as const).map((profileId) => {
                    const active = supplementProfile === profileId;
                    const profileAccent = profileId === 'el' ? elAccent : ellaAccent;
                    return (
                      <button
                        key={profileId}
                        type="button"
                        onClick={() => {
                          setSupplementProfile(profileId);
                          setExpandedSupplement(null);
                        }}
                        aria-pressed={active}
                        className={`min-h-10 rounded-xl px-3 text-sm font-bold transition ${active ? `${profileAccent.tagBg} ${profileAccent.tagText}` : isDarkMode ? 'text-ink-300 hover:bg-ink-800' : 'text-ink-500 hover:bg-cream-100'}`}
                      >
                        {getProfileLabel(profileLabels, profileId)} · {(supplementsData[profileId] || []).length}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="space-y-3">
                {profilesToRender.map((profileId) => {
                  const items = supplementsData[profileId] || [];
                  const profileAccent = profileId === 'el' ? elAccent : ellaAccent;

                  return (
                    <section key={profileId} className="space-y-2.5">
                      {isAmbos ? (
                        <div className="flex items-center justify-between px-1">
                          <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${profileAccent.text}`}>{getProfileLabel(profileLabels, profileId)}</p>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                            {items.length} opciones
                          </p>
                        </div>
                      ) : null}

                      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white dark:border-ink-700 dark:bg-ink-900">
                        {items.map((supplement) => {
                          const key = `${profileId}-${supplement.name}`;
                          const expanded = expandedSupplement === key;

                          return (
                            <article
                              key={key}
                              className={`border-b px-3.5 py-3 last:border-b-0 ${
                                isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-100 bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedSupplement((current) => current === key ? null : key)}
                                className="flex w-full items-start gap-3 text-left active:scale-[0.99]"
                              >
                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${profileAccent.bgGradientLight}`}>
                                  <Pill className={`h-4.5 w-4.5 ${profileAccent.text}`} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className={`line-clamp-2 font-display text-[16px] font-semibold leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
                                    {supplement.name}
                                  </h4>
                                  <p className={`mt-1 line-clamp-2 text-[13px] font-medium leading-snug ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                                    {supplement.goalSupport}
                                  </p>
                                  <p className={`mt-1.5 flex items-start gap-1.5 text-xs font-bold leading-snug ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                                    <Clock3 className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${profileAccent.text}`} />
                                    <span className="min-w-0">{supplement.timing}</span>
                                  </p>
                                </div>

                                <ChevronDown className={`mt-2 h-4.5 w-4.5 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`} />
                              </button>

                              {expanded ? (
                                <div className="mt-3 space-y-3 border-t border-cream-200 pt-3 text-sm dark:border-ink-700">
                                  <div>
                                    <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                                      Por qué podría ayudar
                                    </p>
                                    <p className={`mt-1.5 ${isDarkMode ? 'text-ink-200' : 'text-ink-600'}`}>
                                      {supplement.whyItMayHelp}
                                    </p>
                                  </div>
                                  <div>
                                    <p className={`text-xs font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                                      Cómo usarlo
                                    </p>
                                    <p className={`mt-1.5 ${isDarkMode ? 'text-ink-200' : 'text-ink-600'}`}>
                                      {supplement.howToUse}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-pine-50 p-3.5 dark:bg-pine-950/40">
                                    <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-pine-700 dark:text-pine-300">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      Nota
                                    </p>
                                    <p className="mt-1.5 text-pine-800 dark:text-pine-100">
                                      {supplement.notes}
                                    </p>
                                  </div>
                                  {supplement.caution ? (
                                    <div className="rounded-2xl bg-apricot-50 p-3.5 dark:bg-apricot-950/30">
                                      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-apricot-700 dark:text-apricot-300">
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                        Precaucion
                                      </p>
                                      <p className="mt-1.5 text-apricot-700 dark:text-apricot-200">
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
