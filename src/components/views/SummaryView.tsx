import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Heart, Shield, TrendingDown } from 'lucide-react';
import { Profile } from '../../data';

import { useDiet } from '../../context/DietContext';

export default function SummaryView() {
  const { perfilActivo, perfilesData, ac } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
  const isAmbos = perfilActivo === 'ambos';
  const perfil = perfilActivo && perfilActivo !== 'ambos' ? perfilesData[perfilActivo] : perfilesData.el;

  return (
    <motion.div key="resumen"
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`w-full overflow-hidden sm:overflow-visible flex flex-col`}>
      
      {isAmbos && (
        <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-xl mb-4 mx-auto max-w-xs shadow-inner w-full">
          <button onClick={() => setAmbosSubTab('el')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'el' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{perfilesData.el.nombre}</button>
          <button onClick={() => setAmbosSubTab('ella')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'ella' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>{perfilesData.ella.nombre}</button>
        </div>
      )}

      <div className={isAmbos ? "grid lg:grid-cols-2 gap-8" : "space-y-10"}>
        {(isAmbos ? [perfilesData.el, perfilesData.ella] : [perfil]).map((p, pIdx) => {
          if (!p) return null;
          const isFirst = pIdx === 0;
          const pfKey = isFirst ? 'el' : 'ella';
          const hiddenClass = isAmbos ? (ambosSubTab === pfKey ? 'block' : 'hidden lg:block') : 'block';
          const dynamicAc = isAmbos ? {
            ...ac,
            color500: isFirst ? '#3b82f6' : '#f43f5e',
            text: isFirst ? 'text-blue-600' : 'text-rose-600',
            textDark: isFirst ? 'text-blue-900' : 'text-rose-900',
            bgLight: isFirst ? 'bg-blue-50' : 'bg-rose-50',
            bgGradientLight: isFirst ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
            border: isFirst ? 'border-blue-200' : 'border-rose-200',
            dot: isFirst ? 'bg-blue-500' : 'bg-rose-500',
          } : ac;

          return (
            <div key={p.perfil} className={`space-y-4 ${hiddenClass}`}>
            {isAmbos && (
              <h3 className={`text-lg font-bold pb-2 border-b-2 mt-4 ${isFirst ? 'text-blue-800 border-blue-200' : 'text-rose-800 border-rose-200'}`}>
                Resumen de {p.nombre}
              </h3>
            )}

            {p.objetivosPorMomento && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100/80 overflow-hidden relative w-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10" />
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className={`w-4 h-4 ${dynamicAc.text}`} />
                  Tabla de Macros y Porciones
                </h3>
                
                {/* Mobile Grid Layout - Improved */}
                <div className="grid grid-cols-2 gap-3 sm:hidden mt-4">
                  {[
                    { key: 'frutas', label: 'Frutas', icon: '🍎', color: 'text-rose-500', bg: 'bg-rose-50' },
                    { key: 'verduras', label: 'Verduras', icon: '🥦', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { key: 'cereales', label: 'Cereales', icon: '🌾', color: 'text-amber-500', bg: 'bg-amber-50' },
                    { key: 'proteina', label: 'Proteína', icon: '🥩', color: 'text-red-500', bg: 'bg-red-50' },
                    { key: 'grasas', label: 'Grasas', icon: '🥑', color: 'text-lime-500', bg: 'bg-lime-50' },
                    { key: 'lacteos', label: 'lacteos', icon: '🥛', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { key: 'leguminosas', label: 'Leguminosas', icon: '🫘', color: 'text-amber-700', bg: 'bg-amber-100' },
                  ].map(cat => {
                    const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
                    const mLabels = ['Des', 'C.AM', 'Com', 'C.PM', 'Cen'];
                    const total = mKeys.reduce((acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0), 0);
                    return (
                      <div key={cat.key} className={`${cat.bg} rounded-xl p-3 border border-slate-100`}>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`font-bold text-slate-700 text-xs flex items-center gap-1.5 ${cat.color}`}>
                            <span className="text-base">{cat.icon}</span> 
                            <span className="truncate">{cat.label}</span>
                          </span>
                          <span className={`font-black ${cat.color} text-lg bg-white shadow-sm px-2 py-0.5 rounded-md min-w-[28px] text-center`}>{total}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {mKeys.map((m, idx) => {
                            const val = p.objetivosPorMomento?.[m]?.[cat.key] || 0;
                            const isActive = val > 0;
                            return (
                              <div key={m} className="flex flex-col items-center">
                                <span className={`text-[8px] font-bold uppercase ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{mLabels[idx]}</span>
                                <span className={`text-sm font-bold ${isActive ? 'text-slate-700' : 'text-slate-300'}`}>{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto w-full scrollbar-none">
                  <table className="w-full text-left text-sm min-w-max">
                    <thead>
                      <tr className={`border-b-2 ${dynamicAc.border} text-slate-400 font-bold uppercase tracking-wider text-[11px]`}>
                        <th className="p-3 pb-3 sticky left-0 bg-white/95 backdrop-blur-md z-10 w-28">Grupo</th>
                        {['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'].map(l => <th key={l} className="p-3 pb-3 text-center w-16">{l}</th>)}
                        <th className="p-3 pb-3 text-center bg-slate-50/50 rounded-tr-xl w-16">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {[
                        { key: 'frutas', label: 'Frutas', icon: '🍎' },
                        { key: 'verduras', label: 'Verduras', icon: '🥦' },
                        { key: 'cereales', label: 'Cereales', icon: '🌾' },
                        { key: 'proteina', label: 'Proteína', icon: '🥩' },
                        { key: 'grasas', label: 'Grasas', icon: '🥑' },
                        { key: 'lacteos', label: 'lacteos', icon: '🥛' },
                        { key: 'leguminosas', label: 'Leguminosas', icon: '🫘' },
                      ].map((cat) => {
                        const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
                        const total = mKeys.reduce((acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0), 0);
                        return (
                          <tr key={cat.key} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="p-3 sticky left-0 bg-white/95 group-hover:bg-slate-50/95 backdrop-blur-md z-10 font-bold text-slate-700 flex items-center gap-2 border-r border-transparent group-hover:border-slate-100/50 transition-colors">
                              <span className="text-base drop-shadow-sm">{cat.icon}</span> {cat.label}
                            </td>
                            {mKeys.map(m => {
                              const val = p.objetivosPorMomento?.[m]?.[cat.key] || 0;
                              return (
                                <td key={m} className={`p-3 text-center font-medium ${val > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                  {val}
                                </td>
                              )
                            })}
                            <td className={`p-3 text-center font-bold ${dynamicAc.text} bg-slate-50/50`}>{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="relative rounded-2xl overflow-hidden shadow-sm">
              <img src="/images/meal-prep.png" alt="Plan de comidas" className="w-full h-36 sm:h-44 object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-r ${dynamicAc.bgGradient} opacity-60`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  Sobre {p.nombre}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Heart className={`w-4 h-4 ${dynamicAc.text}`} />
                Puntos clave de tu plan
              </h3>
              <div className="space-y-2.5">
                {p.resumenPersonal.map((linea, idx) => (
                  <motion.div key={idx}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}
                    className="flex gap-3 p-3 rounded-xl bg-slate-50"
                    style={{ borderLeft: `3px solid ${dynamicAc.color500}` }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${dynamicAc.dot} mt-1.5 flex-shrink-0`} />
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{linea}</p>
                  </motion.div>
                ))}
              </div>
            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`bg-gradient-to-br ${dynamicAc.bgGradientLight} rounded-2xl p-4 border ${dynamicAc.border}`}>
                <h3 className={`font-bold ${dynamicAc.textDark} mb-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
                  <TrendingDown className="w-3.5 h-3.5" /> Meta
                </h3>
                <p className={`${dynamicAc.text} text-xs sm:text-sm`}>{p.meta}</p>
              </div>
              <div className={`bg-gradient-to-br ${isAmbos ? (isFirst ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-rose-50 to-pink-50 border-rose-200') : 'from-emerald-50 to-green-50 border-emerald-200'} rounded-2xl p-4 border`}>
                <h3 className={`font-bold ${isAmbos ? (isFirst ? 'text-blue-900' : 'text-rose-900') : 'text-emerald-900'} mb-1.5 text-xs sm:text-sm`}>Perfil</h3>
                <p className={`${isAmbos ? (isFirst ? 'text-blue-700' : 'text-rose-700') : 'text-emerald-700'} text-xs sm:text-sm`}>{p.perfil}</p>
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
