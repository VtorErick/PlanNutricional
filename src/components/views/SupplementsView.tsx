import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Pill, ShieldAlert, Sparkles } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';

export default function SupplementsView() {
  const { perfilActivo, perfilesData, supplementsData, isAmbos, ac, isDarkMode } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
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
        className={`rounded-[28px] border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/92' : 'border-slate-200 bg-white'}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                Son apoyos adicionales. No forman parte de la alimentacion necesaria para cumplir tu meta o tus calorias.
              </p>
            </div>
          </div>

          {isAmbos && (
            <div className={`flex w-full rounded-2xl p-1 sm:w-auto sm:min-w-[200px] ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <button
                onClick={() => setAmbosSubTab('el')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  ambosSubTab === 'el'
                    ? `${elAccent.bgLight} shadow-sm ${elAccent.text}`
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
                    ? `${ellaAccent.bgLight} shadow-sm ${ellaAccent.text}`
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
          const profile = perfilesData[profileId];
          const items = supplementsData[profileId] || [];
          const isHidden = isAmbos && ambosSubTab !== profileId ? 'hidden lg:block' : 'block';
          return (
            <div key={profileId} className={`space-y-4 ${isHidden}`}>
              <div className="grid grid-cols-1 gap-3">
                {items.map((supplement, itemIndex) => (
                  <motion.article
                    key={`${profileId}-${supplement.name}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 + itemIndex * 0.04 }}
                    className={`rounded-[28px] border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/92' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-gradient-to-br ${ac.bgGradientLight} ${ac.borderLight}`}>
                        <Sparkles className={`h-5 w-5 ${ac.text}`} />
                      </div>

                      <div className="min-w-0">
                        <h4 className={`text-base font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                          {supplement.name}
                        </h4>
                        <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                          {supplement.goalSupport}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className={`rounded-2xl border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                        <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Por que podria ayudar
                        </p>
                        <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {supplement.whyItMayHelp}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className={`rounded-2xl border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Como usarlo
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.howToUse}
                          </p>
                        </div>

                        <div className={`rounded-2xl border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                          <p className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Clock3 className="h-3.5 w-3.5" />
                            Momento
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.timing}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                          Nota
                        </p>
                        <p className="mt-1.5 text-emerald-900 dark:text-emerald-100">
                          {supplement.notes}
                        </p>
                      </div>

                      {supplement.caution && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
                          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Precaucion
                          </p>
                          <p className="mt-1.5 text-amber-900 dark:text-amber-100">
                            {supplement.caution}
                          </p>
                        </div>
                      )}
                    </div>
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
