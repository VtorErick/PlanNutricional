import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, ChevronDown, Heart, Shield, TrendingDown } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';
import { getProfileLabel } from '../../utils/profileLabels';

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
  const { perfilActivo, perfilesData, profileLabels, ac, isDarkMode } = useDiet();
  const [expandedSummaryPoint, setExpandedSummaryPoint] = useState<string | null>(null);
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
      <section className={`mb-3 rounded-[22px] p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-[16px] bg-gradient-to-br ${ac.bgGradient} shadow-sm`}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className={`text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Resumen
            </h2>
          </div>
        </div>
      </section>

      <div className={isAmbos ? 'grid gap-4 lg:grid-cols-2' : 'space-y-6'}>
        {(isAmbos ? [perfilesData.el, perfilesData.ella] : [perfil]).map((p, pIdx) => {
          if (!p) return null;
          const profileLabel = getProfileLabel(profileLabels, p.id === 'ella' ? 'ella' : 'el');
          
          // Data-Driven: Construimos el resumen a partir de las descripciones estáticas del perfil y sus metas
          const summaryPoints = [
            p.descripcion,
            p.metaCaloricaKcalDia ? `Meta calculada a precisión de ${p.metaCaloricaKcalDia} kcal diarias globales.` : null,
            `Diseño optimizado para paciente de ${p.edad} años.`,
            p.horariosTexto ? `Horarios estratégicos: ${p.horariosTexto}.` : null
          ].filter(Boolean) as string[];
          const compactSummaryPoints = summaryPoints.map((linea, idx) => {
            if (idx === 0) {
              return 'Plan diseñado para pérdida de grasa y manejo de intolerancia a la lactosa.';
            }
            if (idx === 1 && p.metaCaloricaKcalDia) {
              return `Meta diaria personalizada: ${p.metaCaloricaKcalDia} kcal.`;
            }
            if (idx === 2) {
              return `Diseño optimizado para paciente de ${p.edad} años.`;
            }
            if (idx === 3) {
              return 'Horarios estratégicos definidos para 5 momentos del día.';
            }
            return linea;
          });

          const isFirst = pIdx === 0;
          const hiddenClass = 'block';

          const dynamicAc = isAmbos
            ? {
                ...(isFirst ? elAccent : ellaAccent),
                color500: isFirst ? '#3b82f6' : '#f43f5e',
              }
            : ac;

          const profileTextTone = isDarkMode
            ? (isAmbos ? (isFirst ? elAccent.text : ellaAccent.text) : dynamicAc.text)
            : (isAmbos ? (isFirst ? elAccent.textDark : ellaAccent.textDark) : dynamicAc.textDark);

          const restrictionsText = p.notaSalud || p.detallesPerfil || 'Sin restricciones criticas registradas.';
          const momentsText = p.horariosTexto || '5 momentos del dia definidos.';

          return (
            <div key={p.perfil} className={`space-y-3 ${hiddenClass}`}>
              {isAmbos && (
                <h3
                  className={`text-sm font-black ${
                    isFirst
                      ? `${elAccent.textDark}`
                      : `${ellaAccent.textDark}`
                  }`}
                >
                  Resumen de {profileLabel}
                </h3>
              )}

              <div className={`rounded-[20px] p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`rounded-2xl p-3 ${dynamicAc.bgGradientLight}`}>
                    <p className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${dynamicAc.textDark}`}>
                      <TrendingDown className="h-3.5 w-3.5" />
                      Objetivo
                    </p>
                    <p className={`mt-1 line-clamp-2 text-xs font-semibold leading-snug ${isDarkMode ? dynamicAc.text : dynamicAc.textDark}`}>
                      {p.meta}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Kcal / perfil
                    </p>
                    <p className={`mt-1 text-xl font-black leading-none ${dynamicAc.text}`}>
                      {p.metaCaloricaKcalDia || '-'}
                      <span className={`ml-1 text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>día</span>
                    </p>
                    <p className={`mt-1 line-clamp-1 text-[11px] font-semibold ${profileTextTone}`}>
                      {p.perfil}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Horarios
                    </p>
                    <p className={`mt-1 line-clamp-2 text-xs font-semibold leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {momentsText}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-amber-950/30' : 'bg-amber-50'}`}>
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                      <Shield className="h-3.5 w-3.5" />
                      Restricciones
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-amber-900 dark:text-amber-100">
                      {restrictionsText}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-[20px] p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className={`flex items-center gap-2 text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    <Heart className={`w-4 h-4 ${dynamicAc.text}`} />
                    {isAmbos ? `Puntos clave de ${profileLabel}` : 'Puntos clave de tu plan'}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {summaryPoints.map((linea, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => {
                        const pointKey = `${p.perfil}-${idx}`;
                        setExpandedSummaryPoint((current) => current === pointKey ? null : pointKey);
                      }}
                      className={`flex w-full items-start gap-2.5 rounded-2xl p-2.5 text-left transition-all active:scale-[0.99] ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}
                      style={{ borderLeft: `3px solid ${dynamicAc.color500}` }}
                    >
                      <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${dynamicAc.tagBg} ${dynamicAc.tagText}`}>
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-xs font-semibold leading-snug ${expandedSummaryPoint === `${p.perfil}-${idx}` ? '' : 'line-clamp-2'} ${isDarkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                          {expandedSummaryPoint === `${p.perfil}-${idx}` ? linea : compactSummaryPoints[idx]}
                        </span>
                        {linea !== compactSummaryPoints[idx] ? (
                          <span className={`mt-0.5 block text-[10px] font-bold ${dynamicAc.text}`}>
                            {expandedSummaryPoint === `${p.perfil}-${idx}` ? 'Ocultar detalle' : 'Ver detalle'}
                          </span>
                        ) : null}
                      </span>
                      <ChevronDown
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 transition-transform ${expandedSummaryPoint === `${p.perfil}-${idx}` ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {p.objetivosPorMomento && (
                <div className={`relative w-full overflow-hidden rounded-[20px] p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] sm:p-5 ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
                  <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl -z-10 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />

                  {p.detallesPerfil && (
                    <div
                      className={`mb-3 rounded-2xl p-3 ${
                        isDarkMode
                          ? 'bg-slate-900/80'
                          : 'bg-slate-50/80'
                      }`}
                    >
                      <h3
                        className={`mb-1.5 flex items-center gap-2 text-xs font-bold sm:text-sm ${
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
                      className="mb-3 flex items-start gap-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <p className="text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-100 sm:text-sm">
                        {p.notaSalud}
                      </p>
                    </motion.div>
                  )}

                  <h3 className={`mb-2.5 flex items-center gap-2 text-sm font-bold sm:text-base ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
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
