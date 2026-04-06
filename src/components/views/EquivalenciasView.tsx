import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, User } from 'lucide-react';
import EquivalenciasCard from '../EquivalenciasCard';
import { useDiet } from '../../context/DietContext';

export default function EquivalenciasView() {
  const { perfilActivo, perfilesData, equivalenciasData, ac, isAmbos } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');

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
          <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-2xl mx-auto max-w-xs shadow-inner w-full">
            <button
              onClick={() => setAmbosSubTab('el')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                ambosSubTab === 'el'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-500'
              }`}
            >
              {perfilesData.el.nombre}
            </button>
            <button
              onClick={() => setAmbosSubTab('ella')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                ambosSubTab === 'ella'
                  ? 'bg-white shadow-sm text-rose-600'
                  : 'text-slate-500'
              }`}
            >
              {perfilesData.ella.nombre}
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`${ambosSubTab === 'el' ? 'block' : 'hidden lg:block'} space-y-4`}>
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-blue-500">
                      Equivalencias
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold text-blue-900 truncate">
                      {perfilesData.el.nombre}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                {equivalenciasData.el.map((eq, idx) => (
                  <EquivalenciasCard
                    key={`el-${idx}`}
                    equivalencia={eq}
                    delay={idx * 0.05}
                    accentClasses={{
                      ...ac,
                      bgLight: 'bg-blue-50',
                      text: 'text-blue-600',
                      tagBg: 'bg-blue-100',
                      tagText: 'text-blue-700',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className={`${ambosSubTab === 'ella' ? 'block' : 'hidden lg:block'} space-y-4`}>
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center">
                    <User className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-rose-500">
                      Equivalencias
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold text-rose-900 truncate">
                      {perfilesData.ella.nombre}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                {equivalenciasData.ella.map((eq, idx) => (
                  <EquivalenciasCard
                    key={`ella-${idx}`}
                    equivalencia={eq}
                    delay={idx * 0.05}
                    accentClasses={{
                      ...ac,
                      bgLight: 'bg-rose-50',
                      text: 'text-rose-600',
                      tagBg: 'bg-rose-100',
                      tagText: 'text-rose-700',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 bg-gradient-to-br ${ac.bgGradientLight} ${ac.border}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center">
                <Repeat className={`w-5 h-5 ${ac.text}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] uppercase tracking-[0.18em] font-bold ${ac.text}`}>
                  Equivalencias
                </p>
                <h3 className={`text-base sm:text-lg font-extrabold ${ac.textDark} truncate`}>
                  {perfilActivo === 'ella' ? perfilesData.ella.nombre : perfilesData.el.nombre}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {equivalencias.map((eq, idx) => (
              <EquivalenciasCard
                key={idx}
                equivalencia={eq}
                delay={idx * 0.05}
                accentClasses={ac}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}