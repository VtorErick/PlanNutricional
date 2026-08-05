import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Clock3, Pill, ShieldAlert } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';
import { getProfileLabel } from '../../utils/profileLabels';

export default function SupplementsView() {
  const { perfilActivo, supplementsData, profileLabels, isAmbos, ac, isDarkMode } = useDiet();
  const [expandedSupplement, setExpandedSupplement] = useState<string | null>(null);
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);
  const profilesToRender = isAmbos
    ? (['el', 'ella'] as const)
    : ([perfilActivo === 'ella' ? 'ella' : 'el'] as const);

  return (
    <motion.div
      key="suplementos"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      <section
        className={`rounded-[28px] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-ink-900/92' : 'bg-white'}`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br ${ac.bgGradient} shadow-sm`}>
            <Pill className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className={`text-xl font-black ${isDarkMode ? 'text-cream-50' : 'text-ink-800'}`}>
                Suplementos
              </h2>
              <span className="text-sm font-bold text-pine-600 dark:text-pine-300">
                Opcional
              </span>
            </div>

            <p className={`mt-1 text-sm ${isDarkMode ? 'text-cream-300' : 'text-ink-400'}`}>
              Opcionales. Consulta el detalle solo si quieres usarlos.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {isAmbos ? (
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${ac.tagBg} ${ac.tagText}`}>
                  2 perfiles
                </span>
              ) : (
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${ac.tagBg} ${ac.tagText}`}>
                  {(supplementsData[profilesToRender[0]] || []).length} opciones
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={isAmbos ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'}>
        {profilesToRender.map((profileId, index) => {
          const items = supplementsData[profileId] || [];
          const profileAccent = profileId === 'el' ? elAccent : ellaAccent;
          return (
            <div key={profileId} className="space-y-3">
              {isAmbos ? (
                <div className={`flex items-center justify-between rounded-[22px] border p-3 ${isDarkMode ? 'border-ink-700 bg-ink-900/92' : 'border-cream-100 bg-white'}`}>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${profileAccent.text}`}>
                      {getProfileLabel(profileLabels, profileId)}
                    </p>
                    <h3 className={`text-base font-black ${isDarkMode ? 'text-cream-50' : 'text-ink-800'}`}>
                      Suplementos sugeridos
                    </h3>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${profileAccent.tagBg} ${profileAccent.tagText}`}>
                    {items.length} opciones
                  </span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3">
                {items.map((supplement, itemIndex) => (
                  <motion.article
                    key={`${profileId}-${supplement.name}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 + itemIndex * 0.04 }}
                    className={`rounded-[24px] border p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${isDarkMode ? 'border-ink-700 bg-ink-900/92' : 'border-cream-100 bg-white'}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const key = `${profileId}-${supplement.name}`;
                        setExpandedSupplement((current) => current === key ? null : key);
                      }}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${profileAccent.bgGradientLight}`}>
                        <Pill className={`h-5 w-5 ${profileAccent.text}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-base font-black ${isDarkMode ? 'text-cream-50' : 'text-ink-800'}`}>
                          {supplement.name}
                        </h4>
                        <p className={`mt-1 text-sm font-semibold leading-snug ${isDarkMode ? 'text-cream-300' : 'text-ink-500'}`}>
                          {supplement.goalSupport}
                        </p>
                        <span className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-black uppercase tracking-[0.12em] ${profileAccent.tagBg} ${profileAccent.tagText}`}>
                          {supplement.timing}
                        </span>
                      </div>

                      <ChevronDown className={`mt-2 h-5 w-5 flex-shrink-0 transition-transform ${expandedSupplement === `${profileId}-${supplement.name}` ? 'rotate-180' : ''} ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`} />
                    </button>

                    {expandedSupplement === `${profileId}-${supplement.name}` ? (
                      <div className="mt-4 space-y-3 border-t border-cream-100 pt-3 text-sm dark:border-ink-700">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-400">
                            Por que podria ayudar
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-cream-200' : 'text-ink-600'}`}>
                            {supplement.whyItMayHelp}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-400">
                            Como usarlo
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-cream-200' : 'text-ink-600'}`}>
                            {supplement.howToUse}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-pine-50 p-3 dark:bg-pine-950/30">
                          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-pine-700 dark:text-pine-300">
                            <Clock3 className="h-3.5 w-3.5" />
                            Nota
                          </p>
                          <p className="mt-1.5 text-pine-800 dark:text-pine-100">
                            {supplement.notes}
                          </p>
                        </div>
                        {supplement.caution ? (
                          <div className="rounded-2xl bg-apricot-50 p-3 dark:bg-apricot-950/30">
                            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-apricot-700 dark:text-apricot-300">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Precaucion
                            </p>
                            <p className="mt-1.5 text-apricot-700 dark:text-apricot-100">
                              {supplement.caution}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </motion.article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
