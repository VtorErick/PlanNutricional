import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EquivalenciasCard from '../EquivalenciasCard';
import { Equivalencia, Profile } from '../../data';

import { useDiet } from '../../context/DietContext';

export default function EquivalenciasView() {
  const { perfilActivo, perfilesData, equivalenciasData, ac, isAmbos } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
  const equivalencias = (perfilActivo && perfilActivo !== 'ambos') 
    ? equivalenciasData[perfilActivo as 'el' | 'ella'] 
    : [];

  return (
    <motion.div key="equivalencias"
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-6">
      {isAmbos ? (
        <>
          <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-xl mb-2 mx-auto max-w-xs shadow-inner w-full">
            <button onClick={() => setAmbosSubTab('el')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'el' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{perfilesData.el.nombre}</button>
            <button onClick={() => setAmbosSubTab('ella')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'ella' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>{perfilesData.ella.nombre}</button>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className={`${ambosSubTab === 'el' ? 'block' : 'hidden lg:block'}`}>
              <h3 className="text-sm font-bold text-blue-800 mb-3 px-1 uppercase tracking-wider">Equivalencias de {perfilesData.el.nombre}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {equivalenciasData.el.map((eq, idx) => (
                  <EquivalenciasCard key={'el'+idx} equivalencia={eq} delay={idx * 0.05} accentClasses={{...ac, bgLight: 'bg-blue-50', text: 'text-blue-600', tagBg: 'bg-blue-100', tagText: 'text-blue-700'}} />
                ))}
              </div>
            </div>
            <div className={`${ambosSubTab === 'ella' ? 'block' : 'hidden lg:block'}`}>
              <h3 className="text-sm font-bold text-rose-800 mb-3 px-1 uppercase tracking-wider">Equivalencias de {perfilesData.ella.nombre}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {equivalenciasData.ella.map((eq, idx) => (
                  <EquivalenciasCard key={'ella'+idx} equivalencia={eq} delay={idx * 0.05} accentClasses={{...ac, bgLight: 'bg-rose-50', text: 'text-rose-600', tagBg: 'bg-rose-100', tagText: 'text-rose-700'}} />
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {equivalencias.map((eq, idx) => (
            <EquivalenciasCard key={idx} equivalencia={eq} delay={idx * 0.05} accentClasses={ac} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
