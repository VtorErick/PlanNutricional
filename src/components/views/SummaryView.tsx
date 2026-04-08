import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Heart, Shield, TrendingDown, User } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';

const mealKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'] as const;
const mealLabels = ['Des', 'C.AM', 'Com', 'C.PM', 'Cen'];

const categories = [
  { key: 'frutas', label: 'Frutas', icon: '🍎', color: 'text-rose-500', bg: 'bg-rose-50' },
  { key: 'verduras', label: 'Verduras', icon: '🥦', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'cereales', label: 'Cereales', icon: '🌾', color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'proteina', label: 'Proteína', icon: '🥩', color: 'text-red-500', bg: 'bg-red-50' },
  { key: 'grasas', label: 'Grasas', icon: '🥑', color: 'text-lime-600', bg: 'bg-lime-50' },
  { key: 'lacteos', label: 'Lácteos', icon: '🥛', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'leguminosas', label: 'Leguminosas', icon: '🫘', color: 'text-amber-700', bg: 'bg-amber-100' },
] as const;

export default function SummaryView() {
  const { perfilActivo, perfilesData, ac, isDarkMode } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);

  const isAmbos = perfilActivo === 'ambos';
  const perfil =
    perfilActivo && perfilActivo !== 'ambos'
      ? perfilesData[perfilActivo]
      : perfilesData.el;

  return (
    <motion.div
      key="resumen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-full flex flex-col"
    >
      <section className={`mb-4 rounded-[28px] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-[18px] bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center shadow-sm`}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className={`text-xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Resumen
            </h2>
          </div>

          {isAmbos && (
            <div className={`flex w-full rounded-2xl p-1 sm:w-auto sm:min-w-[200px] ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <button
                onClick={() => setAmbosSubTab('el')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  ambosSubTab === 'el'
                    ? `${elAccent.bgLight} shadow-sm ${elAccent.text}`
                    : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {perfilesData.el.nombre}
              </button>
              <button
                onClick={() => setAmbosSubTab('ella')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  ambosSubTab === 'ella'
                    ? `${ellaAccent.bgLight} shadow-sm ${ellaAccent.text}`
                    : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {perfilesData.ella.nombre}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className={isAmbos ? 'grid lg:grid-cols-2 gap-6' : 'space-y-8'}>
        {(isAmbos ? [perfilesData.el, perfilesData.ella] : [perfil]).map((p, pIdx) => {
          if (!p) return null;
          const summaryPoints = Array.isArray(p.resumenPersonal) ? p.resumenPersonal : [];

          const isFirst = pIdx === 0;
          const pfKey = isFirst ? 'el' : 'ella';
          const hiddenClass = isAmbos
            ? ambosSubTab === pfKey
              ? 'block'
              : 'hidden lg:block'
            : 'block';

          const dynamicAc = isAmbos
            ? {
                ...(isFirst ? elAccent : ellaAccent),
                color500: isFirst ? '#3b82f6' : '#f43f5e',
              }
            : ac;

          return (
            <div key={p.perfil} className={`space-y-4 ${hiddenClass}`}>
              {isAmbos && (
                <h3
                  className={`text-base font-bold ${
                    isFirst
                      ? `${elAccent.textDark}`
                      : `${ellaAccent.textDark}`
                  }`}
                >
                  Resumen de {p.nombre}
                </h3>
              )}

              <div className={`rounded-2xl p-4 sm:p-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className={`font-bold flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    <Heart className={`w-4 h-4 ${dynamicAc.text}`} />
                    {isAmbos ? `Puntos clave de ${p.nombre}` : 'Puntos clave de tu plan'}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${dynamicAc.tagBg} ${dynamicAc.tagText}`}>
                    {p.nombre}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {summaryPoints.map((linea, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className={`flex gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}
                      style={{ borderLeft: `3px solid ${dynamicAc.color500}` }}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${dynamicAc.dot} mt-1.5 flex-shrink-0`}
                      />
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {linea}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {p.objetivosPorMomento && (
                <div className={`rounded-2xl p-4 sm:p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] overflow-hidden relative w-full ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
                  <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl -z-10 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />

                  {/* Goal and profile summary */}
                  <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
                    <div
                      className={`bg-gradient-to-br ${dynamicAc.bgGradientLight} rounded-2xl p-4`}
                    >
                      <h3
                        className={`font-bold ${dynamicAc.textDark} mb-1.5 flex items-center gap-2 text-xs sm:text-sm`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        Meta
                      </h3>
                      <p className={`${dynamicAc.text} text-xs sm:text-sm leading-relaxed`}>
                        {p.meta}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-4 ${
                        isAmbos
                          ? isFirst
                            ? `${elAccent.bgGradientLight}`
                            : `${ellaAccent.bgGradientLight}`
                          : `${dynamicAc.bgGradientLight}`
                      }`}
                    >
                      <h3
                        className={`font-bold mb-1.5 flex items-center gap-2 text-xs sm:text-sm ${
                          isAmbos
                            ? isFirst
                              ? elAccent.textDark
                              : ellaAccent.textDark
                            : dynamicAc.textDark
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Perfil
                      </h3>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${
                          isAmbos
                            ? isFirst
                              ? elAccent.text
                              : ellaAccent.text
                            : dynamicAc.text
                        }`}
                      >
                        {p.perfil}
                      </p>
                    </div>
                  </div>

                  {p.detallesPerfil && (
                    <div
                      className={`mb-4 rounded-2xl p-4 ${
                        isDarkMode
                          ? 'bg-slate-900/80'
                          : 'bg-slate-50/80'
                      }`}
                    >
                      <h3
                        className={`mb-2 flex items-center gap-2 text-xs sm:text-sm font-bold ${
                          isDarkMode ? 'text-slate-100' : 'text-slate-800'
                        }`}
                      >
                        <Shield className={`w-3.5 h-3.5 ${dynamicAc.text}`} />
                        Detalles del perfil
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {p.detallesPerfil}
                      </p>
                    </div>
                  )}

                  {p.notaSalud && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-3.5 dark:bg-amber-950/40"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <p className="text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-100 sm:text-sm">
                        {p.notaSalud}
                      </p>
                    </motion.div>
                  )}

                  <h3 className={`font-bold mb-3 flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    <BarChart3 className={`w-4 h-4 ${dynamicAc.text}`} />
                    Tabla de macros y porciones
                  </h3>

                  {/* Mobile layout */}
                  <div className="sm:hidden space-y-3 mt-4">
                    {categories.map((cat) => {
                      const total = mealKeys.reduce(
                        (acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0),
                        0
                      );

                      return (
                        <div
                          key={cat.key}
                          className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : `${cat.bg}`}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg">{cat.icon}</span>
                              <span className={`font-bold text-sm ${cat.color} truncate`}>
                                {cat.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] uppercase tracking-wide font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Total
                              </span>
                              <span
                                className={`min-w-[34px] h-8 px-2 rounded-xl shadow-sm flex items-center justify-center font-black text-base ${cat.color} ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}
                              >
                                {total}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {mealKeys.map((m, idx) => {
                              const val = p.objetivosPorMomento?.[m]?.[cat.key] || 0;
                              const active = val > 0;

                              return (
                                <div
                                  key={m}
                                  className={`rounded-xl px-1.5 py-2 text-center ${
                                    active
                                      ? isDarkMode
                                        ? 'bg-slate-950 shadow-sm'
                                        : 'bg-white shadow-sm'
                                      : isDarkMode
                                        ? 'bg-slate-900'
                                        : 'bg-white/50'
                                  }`}
                                >
                                  <div
                                    className={`text-[9px] font-extrabold uppercase tracking-wide ${
                                      active
                                        ? isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                        : isDarkMode ? 'text-slate-600' : 'text-slate-300'
                                    }`}
                                  >
                                    {mealLabels[idx]}
                                  </div>
                                  <div
                                    className={`text-sm font-black mt-0.5 ${
                                      active
                                        ? isDarkMode ? 'text-slate-50' : 'text-slate-800'
                                        : isDarkMode ? 'text-slate-600' : 'text-slate-300'
                                    }`}
                                  >
                                    {val}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tablet / desktop layout */}
                  <div className="hidden sm:block overflow-x-auto w-full">
                    <table className="w-full text-left text-sm min-w-max">
                      <thead>
                        <tr
                          className={`font-bold uppercase tracking-wider text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                        >
                          <th className={`p-3 pb-3 sticky left-0 backdrop-blur-md z-10 w-32 ${isDarkMode ? 'bg-slate-950/95' : 'bg-white/95'}`}>
                            Grupo
                          </th>
                          {['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'].map((l) => (
                            <th key={l} className="p-3 pb-3 text-center w-16">
                              {l}
                            </th>
                          ))}
                          <th className={`p-3 pb-3 text-center rounded-tr-xl w-16 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100/60'}`}>
                        {categories.map((cat) => {
                          const total = mealKeys.reduce(
                            (acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0),
                            0
                          );

                          return (
                            <tr
                              key={cat.key}
                              className={`transition-colors group ${isDarkMode ? 'hover:bg-slate-900/70' : 'hover:bg-slate-50/70'}`}
                            >
                              <td className={`p-3 sticky left-0 backdrop-blur-md z-10 font-bold transition-colors ${isDarkMode ? 'bg-slate-950/95 group-hover:bg-slate-900/95 text-slate-100' : 'bg-white/95 group-hover:bg-slate-50/95 text-slate-700'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{cat.icon}</span>
                                  {cat.label}
                                </div>
                              </td>

                              {mealKeys.map((m) => {
                                const val = p.objetivosPorMomento?.[m]?.[cat.key] || 0;
                                return (
                                  <td
                                    key={m}
                                    className={`p-3 text-center font-medium ${
                                      val > 0
                                        ? isDarkMode ? 'text-slate-50' : 'text-slate-800'
                                        : isDarkMode ? 'text-slate-600' : 'text-slate-300'
                                    }`}
                                  >
                                    {val}
                                  </td>
                                );
                              })}

                              <td
                                className={`p-3 text-center font-bold ${dynamicAc.text} ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/50'}`}
                              >
                                {total}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
