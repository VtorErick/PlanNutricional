import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Clock3, Droplets, Pill, ShieldAlert, Sparkles, SunMoon } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';

export default function SupplementsView() {
  const { perfilActivo, perfilesData, supplementsData, isAmbos, ac, isDarkMode } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
  const [openSupplementKey, setOpenSupplementKey] = useState<string | null>(null);
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
        className={`relative overflow-hidden rounded-[28px] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-28"
            style={{ backgroundImage: "url('/images/meal-prep.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/88 via-white/74 to-white/88 dark:from-slate-950/86 dark:via-slate-950/74 dark:to-slate-950/88" />
        </div>

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br ${ac.bgGradient} shadow-sm`}>
              <Pill className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                  Suplementos
                </h2>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">
                  Opcional
                </span>
              </div>

              <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                Vista compacta con revelacion progresiva: abre un suplemento para ver dosis, momento y nota.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {isAmbos ? (
                  profilesToRender.map((profileId) => (
                    <span
                      key={`supplement-count-${profileId}`}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                        profileId === 'el'
                          ? `${elAccent.tagBg} ${elAccent.tagText}`
                          : `${ellaAccent.tagBg} ${ellaAccent.tagText}`
                      }`}
                    >
                      {perfilesData[profileId].nombre}: {(supplementsData[profileId] || []).length}
                    </span>
                  ))
                ) : (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${ac.tagBg} ${ac.tagText}`}>
                    {(supplementsData[profilesToRender[0]] || []).length} opciones
                  </span>
                )}
              </div>
            </div>
          </div>

          {isAmbos && (
            <div className={`flex w-full rounded-2xl p-1 sm:w-auto sm:min-w-[200px] ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <button
                onClick={() => setAmbosSubTab('el')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  ambosSubTab === 'el'
                    ? `${elAccent.btnActive} shadow-sm`
                    : isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                }`}
              >
                {perfilesData.el.nombre}
              </button>
              <button
                onClick={() => setAmbosSubTab('ella')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  ambosSubTab === 'ella'
                    ? `${ellaAccent.btnActive} shadow-sm`
                    : isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                }`}
              >
                {perfilesData.ella.nombre}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className={isAmbos ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'}>
        {profilesToRender.map((profileId, index) => {
          const items = supplementsData[profileId] || [];
          const isHidden = isAmbos && ambosSubTab !== profileId ? 'hidden lg:block' : 'block';

          return (
            <div key={profileId} className={`space-y-3 ${isHidden}`}>
              {items.map((supplement, itemIndex) => {
                const supplementKey = `${profileId}-${supplement.name}`;
                const isOpen = openSupplementKey === supplementKey;

                return (
                  <motion.article
                    key={supplementKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 + itemIndex * 0.04 }}
                    className={`rounded-2xl shadow-[0_10px_28px_rgba(15,23,42,0.05)] overflow-hidden ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenSupplementKey(isOpen ? null : supplementKey)}
                      className="w-full p-3.5 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ac.bgGradientLight}`}>
                          <Sparkles className={`h-4.5 w-4.5 ${ac.text}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                              {supplement.name}
                            </h4>
                            <ChevronDown className={`h-4 w-4 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                          </div>
                          <p className={`mt-0.5 text-xs font-semibold line-clamp-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {supplement.goalSupport}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${ac.tagBg} ${ac.tagText}`}>
                              <SunMoon className="h-3 w-3" />
                              {supplement.timing}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              <Droplets className="h-3 w-3" />
                              Toma guiada
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className={`border-t px-3.5 pb-3.5 pt-3 space-y-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Para que podria ayudar
                          </p>
                          <p className={`mt-1.5 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.whyItMayHelp}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                            <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              Dosis / uso
                            </p>
                            <p className={`mt-1.5 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {supplement.howToUse}
                            </p>
                          </div>

                          <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                            <p className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              <Clock3 className="h-3.5 w-3.5" />
                              Momento
                            </p>
                            <p className={`mt-1.5 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {supplement.timing}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                            Nota
                          </p>
                          <p className="mt-1.5 text-sm text-emerald-900 dark:text-emerald-100">
                            {supplement.notes}
                          </p>
                        </div>

                        {supplement.caution && (
                          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                            <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Precaucion
                            </p>
                            <p className="mt-1.5 text-sm text-amber-900 dark:text-amber-100">
                              {supplement.caution}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
