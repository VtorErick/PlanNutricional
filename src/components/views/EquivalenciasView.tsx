import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat } from 'lucide-react';
import EquivalenciasCard from '../EquivalenciasCard';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';

export default function EquivalenciasView() {
  const { perfilActivo, perfilesData, equivalenciasData, ac, isAmbos, isDarkMode } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);

  const equivalencias =
    perfilActivo && perfilActivo !== 'ambos'
      ? equivalenciasData[perfilActivo as 'el' | 'ella']
      : [];

  return (
    <motion.div
      key="equivalencias"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-5"
    >
      {isAmbos ? (
        <>
          <div className={`rounded-2xl border bg-gradient-to-br p-4 ${ac.bgGradientLight} ${ac.border}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/90'}`}>
                  <Repeat className={`h-5 w-5 ${ac.text}`} />
                </div>
                <h2 className={`truncate text-base font-extrabold sm:text-lg ${ac.textDark}`}>
                  Equivalencias
                </h2>
              </div>

              <div className={`flex w-full rounded-2xl p-1 sm:w-auto sm:min-w-[200px] ${isDarkMode ? 'bg-slate-900' : 'bg-white/80'}`}>
                <button
                  onClick={() => setAmbosSubTab('el')}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    ambosSubTab === 'el'
                      ? isDarkMode
                        ? `${elAccent.bgLight} shadow-sm ${elAccent.text}`
                        : 'bg-white text-blue-600 shadow-sm'
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
                      ? isDarkMode
                        ? `${ellaAccent.bgLight} shadow-sm ${ellaAccent.text}`
                        : 'bg-white text-rose-600 shadow-sm'
                      : isDarkMode
                        ? 'text-slate-400'
                        : 'text-slate-500'
                  }`}
                >
                  {perfilesData.ella.nombre}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${ambosSubTab === 'el' ? 'block' : 'hidden lg:block'}`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                {equivalenciasData.el.map((eq, idx) => (
                  <EquivalenciasCard
                    key={`el-${idx}`}
                    equivalencia={eq}
                    delay={idx * 0.05}
                    accentClasses={{ ...elAccent }}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>

            <div className={`${ambosSubTab === 'ella' ? 'block' : 'hidden lg:block'}`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                {equivalenciasData.ella.map((eq, idx) => (
                  <EquivalenciasCard
                    key={`ella-${idx}`}
                    equivalencia={eq}
                    delay={idx * 0.05}
                    accentClasses={{ ...ellaAccent }}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className={`rounded-2xl border bg-gradient-to-br p-4 ${ac.bgGradientLight} ${ac.border}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/90'}`}>
                <Repeat className={`h-5 w-5 ${ac.text}`} />
              </div>
              <div className="min-w-0">
                <h3 className={`truncate text-base font-extrabold sm:text-lg ${ac.textDark}`}>
                  {`Equivalencias ${perfilActivo === 'ella' ? perfilesData.ella.nombre : perfilesData.el.nombre}`}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {equivalencias.map((eq, idx) => (
              <EquivalenciasCard
                key={idx}
                equivalencia={eq}
                delay={idx * 0.05}
                accentClasses={ac}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
