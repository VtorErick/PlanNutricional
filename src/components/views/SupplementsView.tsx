import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Pill, ShieldAlert, Sparkles, User } from 'lucide-react';
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
      <section className={`rounded-[28px] border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/92' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-[18px] bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center shadow-sm`}>
            <Pill className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0">
            <h2 className={`text-xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Suplementos
            </h2>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              Son apoyos opcionales. No forman parte de la alimentación necesaria para cumplir tu meta o tus calorías.
            </p>
          </div>
        </div>
      </section>

      {isAmbos && (
        <div className={`lg:hidden flex p-1.5 rounded-2xl mx-auto max-w-xs shadow-inner w-full ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <button
            onClick={() => setAmbosSubTab('el')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              ambosSubTab === 'el'
                ? `${elAccent.bgLight} shadow-sm ${elAccent.text}`
                : isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {perfilesData.el.nombre}
          </button>
          <button
            onClick={() => setAmbosSubTab('ella')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              ambosSubTab === 'ella'
                ? `${ellaAccent.bgLight} shadow-sm ${ellaAccent.text}`
                : isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {perfilesData.ella.nombre}
          </button>
        </div>
      )}

      <div className={isAmbos ? 'grid lg:grid-cols-2 gap-4' : 'space-y-4'}>
        {profilesToRender.map((profileId, index) => {
          const profile = perfilesData[profileId];
          const items = supplementsData[profileId] || [];
          const isHidden =
            isAmbos && ambosSubTab !== profileId ? 'hidden lg:block' : 'block';
          const panelTone =
            profileId === 'el'
              ? isDarkMode
                ? `${elAccent.bgGradientLight} ${elAccent.border} ${elAccent.textDark}`
                : 'from-blue-50 to-indigo-50 border-blue-200 text-blue-900'
              : isDarkMode
                ? `${ellaAccent.bgGradientLight} ${ellaAccent.border} ${ellaAccent.textDark}`
                : 'from-rose-50 to-pink-50 border-rose-200 text-rose-900';

          return (
            <div key={profileId} className={`space-y-4 ${isHidden}`}>
              <section
                className={`rounded-[28px] border bg-gradient-to-br p-4 shadow-sm ${panelTone}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl shadow-sm flex items-center justify-center ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/90'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold opacity-70">
                      Apoyo opcional
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold">
                      {profile.nombre}
                    </h3>
                  </div>
                </div>
              </section>

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
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${ac.bgGradientLight} border ${ac.borderLight} flex items-center justify-center`}>
                        <Sparkles className={`w-5 h-5 ${ac.text}`} />
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
                      <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Por qué podría ayudar
                        </p>
                        <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {supplement.whyItMayHelp}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Cómo usarlo
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.howToUse}
                          </p>
                        </div>

                        <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] flex items-center gap-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Clock3 className="w-3.5 h-3.5" />
                            Momento
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.timing}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 dark:bg-emerald-950/30 dark:border-emerald-900/60">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                          Nota
                        </p>
                        <p className="mt-1.5 text-emerald-900 dark:text-emerald-100">
                          {supplement.notes}
                        </p>
                      </div>

                      {supplement.caution && (
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950/30 dark:border-amber-900/60">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Precaución
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
