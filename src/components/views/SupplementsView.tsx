import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Pill, ShieldAlert, Sparkles } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';
import SectionBackdrop from './SectionBackdrop';

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
      <SectionBackdrop
        eyebrow="Suplementos"
        title="Apoyos opcionales, sin robar foco al plan"
        description="Consulta sugerencias puntuales para complementar el objetivo de cada perfil sin convertir la pantalla en un catalogo pesado."
        imageSrc="/images/meal-prep.png"
        accentGradientClass={ac.bgGradient}
        icon={Pill}
        aside={isAmbos ? (
          <div className="flex w-full rounded-2xl border border-white/14 bg-white/12 p-1 backdrop-blur-md sm:w-auto sm:min-w-[220px]">
            <button
              onClick={() => setAmbosSubTab('el')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                ambosSubTab === 'el'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-white/72'
              }`}
            >
              {perfilesData.el.nombre}
            </button>
            <button
              onClick={() => setAmbosSubTab('ella')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                ambosSubTab === 'ella'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-white/72'
              }`}
            >
              {perfilesData.ella.nombre}
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center rounded-full border border-white/14 bg-white/12 px-3 py-1.5 text-xs font-bold text-white/86 backdrop-blur-md">
            Opcional
          </div>
        )}
        stats={profilesToRender.map((profileId) => ({
          label: perfilesData[profileId].nombre,
          value: `${(supplementsData[profileId] || []).length}`,
        }))}
      />

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
                    className={`rounded-[28px] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${ac.bgGradientLight}`}>
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
                      <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                        <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Por que podria ayudar
                        </p>
                        <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {supplement.whyItMayHelp}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Como usarlo
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.howToUse}
                          </p>
                        </div>

                        <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                          <p className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Clock3 className="h-3.5 w-3.5" />
                            Momento
                          </p>
                          <p className={`mt-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {supplement.timing}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                          Nota
                        </p>
                        <p className="mt-1.5 text-emerald-900 dark:text-emerald-100">
                          {supplement.notes}
                        </p>
                      </div>

                      {supplement.caution && (
                        <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/30">
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
