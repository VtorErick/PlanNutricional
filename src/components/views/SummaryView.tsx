import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, ChevronDown, Clock3, Heart, Shield, TrendingDown, UserRound } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';
import { getProfileLabel } from '../../utils/profileLabels';

const mealKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'] as const;
const mealLabels = ['Des', 'C.AM', 'Com', 'C.PM', 'Cen'];

const categories = [
  { key: 'frutas', label: 'Frutas', icon: '🍎', color: 'text-coral-500', bg: 'bg-coral-50' },
  { key: 'verduras', label: 'Verduras', icon: '🥦', color: 'text-pine-600', bg: 'bg-pine-50' },
  { key: 'cereales', label: 'Cereales', icon: '🌾', color: 'text-apricot-600', bg: 'bg-apricot-50' },
  { key: 'proteina', label: 'Proteína', icon: '🥩', color: 'text-coral-600', bg: 'bg-coral-50' },
  { key: 'grasas', label: 'Grasas', icon: '🥑', color: 'text-pine-500', bg: 'bg-pine-50' },
  { key: 'lacteos', label: 'Lácteos', icon: '🥛', color: 'text-ocean-500', bg: 'bg-ocean-50' },
  { key: 'leguminosas', label: 'Leguminosas', icon: '🫘', color: 'text-apricot-700', bg: 'bg-apricot-100' },
] as const;

function firstSentence(value: string | null | undefined, fallback: string) {
  const text = String(value || '').trim();
  if (!text) return fallback;
  const [sentence] = text.split(/(?<=\.)\s+/);
  return sentence || text;
}

function compactSchedule(value: string | null | undefined) {
  return String(value || '5 momentos definidos')
    .replace('Desayuno:', 'Des')
    .replace('Colación mañana:', 'C.AM')
    .replace('Comida:', 'Com')
    .replace('Colación tarde:', 'C.PM')
    .replace('Cena:', 'Cena')
    .replace(/, /g, ' · ');
}

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
      <section className="mb-3 px-1">
        <p className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${ac.text}`}>
          Tu plan en contexto
        </p>
        <h2 className={`mt-0.5 font-display text-[28px] font-semibold tracking-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
          Resumen
        </h2>
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
                color500: isFirst ? '#3568d8' : '#d93a56',
              }
            : ac;

          const profileTextTone = isDarkMode
            ? (isAmbos ? (isFirst ? elAccent.text : ellaAccent.text) : dynamicAc.text)
            : (isAmbos ? (isFirst ? elAccent.textDark : ellaAccent.textDark) : dynamicAc.textDark);

          const restrictionsText = p.notaSalud || p.detallesPerfil || 'Sin restricciones criticas registradas.';
          const goalSummary = firstSentence(p.meta, 'Objetivo nutricional definido.');
          const restrictionsSummary = firstSentence(p.detallesPerfil || p.notaSalud, restrictionsText);
          const momentsText = compactSchedule(p.horariosTexto);

          return (
            <div key={p.perfil} className={`space-y-3 ${hiddenClass}`}>
              {isAmbos && (
                <h3
                  className={`font-display text-lg font-semibold px-1 ${
                    isFirst
                      ? `${elAccent.textDark}`
                      : `${ellaAccent.textDark}`
                  }`}
                >
                  Resumen de {profileLabel}
                </h3>
              )}

              <div className={`rounded-[26px] border p-4 shadow-soft ${isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'}`}>
                <div className="space-y-2.5">
                  <div className={`rounded-2xl p-4 bg-gradient-to-br ${dynamicAc.bgGradient} text-white`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/85">
                          <TrendingDown className="h-3.5 w-3.5" />
                          Objetivo
                        </p>
                        <p className="mt-1.5 text-[13px] font-medium leading-snug text-white/95">
                          {goalSummary}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-display text-3xl font-semibold leading-none">
                          {p.metaCaloricaKcalDia || '-'}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-white/75">kcal/día</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className={`rounded-2xl p-3.5 ${isDarkMode ? 'bg-ink-800/70' : 'bg-cream-100'}`}>
                      <p className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                        <UserRound className="h-3.5 w-3.5" />
                        Perfil
                      </p>
                      <p className={`mt-1.5 text-xs font-bold leading-snug ${profileTextTone}`}>
                        {p.perfil}
                      </p>
                    </div>

                    <div className={`rounded-2xl p-3.5 ${isDarkMode ? 'bg-ink-800/70' : 'bg-cream-100'}`}>
                      <p className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                        <Clock3 className="h-3.5 w-3.5" />
                        Horarios
                      </p>
                      <p className={`mt-1.5 text-xs font-semibold leading-snug ${isDarkMode ? 'text-ink-200' : 'text-ink-600'}`}>
                        {momentsText}
                      </p>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-3.5 ${isDarkMode ? 'bg-apricot-950/30' : 'bg-apricot-50'}`}>
                    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-apricot-700 dark:text-apricot-300">
                      <Shield className="h-3.5 w-3.5" />
                      Restricciones
                    </p>
                    <p className="mt-1.5 text-xs font-semibold leading-snug text-apricot-700 dark:text-apricot-200">
                      {restrictionsSummary}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-[26px] border p-4 shadow-soft ${isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'}`}>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h3 className={`flex items-center gap-2 font-display text-base font-semibold ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                    <Heart className={`w-4 h-4 ${dynamicAc.text}`} />
                    {isAmbos ? `Puntos clave de ${profileLabel}` : 'Puntos clave de tu plan'}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {summaryPoints.map((linea, idx) => {
                    const pointKey = `${p.perfil}-${idx}`;
                    const compactText = compactSummaryPoints[idx];
                    const canExpand = linea !== compactText && linea.length > compactText.length + 45;
                    const isExpanded = expandedSummaryPoint === pointKey;
                    const content = canExpand && isExpanded ? linea : compactText;
                    const Component = canExpand ? motion.button : motion.div;

                    return (
                      <Component
                        key={idx}
                        {...(canExpand ? { type: 'button' } : {})}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={canExpand ? () => {
                          setExpandedSummaryPoint((current) => current === pointKey ? null : pointKey);
                        } : undefined}
                        className={`flex w-full items-start gap-2.5 rounded-2xl p-3 text-left transition-all ${canExpand ? 'active:scale-[0.99]' : ''} ${isDarkMode ? 'bg-ink-800/70 hover:bg-ink-800' : 'bg-cream-100 hover:bg-cream-200/70'}`}
                      >
                        <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${dynamicAc.tagBg} ${dynamicAc.tagText}`}>
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-medium leading-relaxed ${isDarkMode ? 'text-ink-100' : 'text-ink-600'}`}>
                            {content}
                          </span>
                          {canExpand ? (
                            <span className={`mt-0.5 block text-[10px] font-extrabold ${dynamicAc.text}`}>
                              {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                            </span>
                          ) : null}
                        </span>
                        {canExpand ? (
                          <ChevronDown
                            className={`mt-0.5 h-4 w-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}
                          />
                        ) : null}
                      </Component>
                    );
                  })}
                </div>
              </div>

              {p.objetivosPorMomento && (
                <div className={`relative w-full overflow-hidden rounded-[26px] border p-4 shadow-soft sm:p-5 ${isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'}`}>
                  {p.detallesPerfil && (
                    <details
                      className={`mb-3 rounded-2xl p-3.5 ${
                        isDarkMode
                          ? 'bg-ink-800/70'
                          : 'bg-cream-100'
                      }`}
                    >
                      <summary
                        className={`flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-extrabold sm:text-sm [&::-webkit-details-marker]:hidden ${
                          isDarkMode ? 'text-cream-100' : 'text-ink-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Shield className={`w-3.5 h-3.5 ${dynamicAc.text}`} />
                          Detalles del perfil
                        </span>
                        <ChevronDown className="h-4 w-4 text-ink-400" />
                      </summary>
                      <p className={`mt-2.5 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                        {p.detallesPerfil}
                      </p>
                    </details>
                  )}

                  {p.notaSalud && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 flex items-start gap-3 rounded-2xl bg-apricot-50 p-3.5 dark:bg-apricot-950/30"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-apricot-600" />
                      <p className="text-xs font-medium leading-relaxed text-apricot-700 dark:text-apricot-200 sm:text-sm">
                        {p.notaSalud}
                      </p>
                    </motion.div>
                  )}

                  <h3 className={`mb-2.5 flex items-center gap-2 font-display text-base font-semibold ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
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
                          className={`rounded-2xl p-3 ${isDarkMode ? 'bg-ink-800/70' : `${cat.bg}`}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg">{cat.icon}</span>
                              <span className={`font-bold text-sm ${cat.color} truncate`}>
                                {cat.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] uppercase tracking-wide font-bold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                                Total
                              </span>
                              <span
                                className={`min-w-[34px] h-8 px-2 rounded-xl shadow-sm flex items-center justify-center font-extrabold text-base ${cat.color} ${isDarkMode ? 'bg-ink-900' : 'bg-white'}`}
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
                                        ? 'bg-ink-900 shadow-sm'
                                        : 'bg-white shadow-sm'
                                      : isDarkMode
                                        ? 'bg-ink-800/50'
                                        : 'bg-white/50'
                                  }`}
                                >
                                  <div
                                    className={`text-[9px] font-extrabold uppercase tracking-wide ${
                                      active
                                        ? isDarkMode ? 'text-ink-400' : 'text-ink-400'
                                        : isDarkMode ? 'text-ink-500' : 'text-cream-300'
                                    }`}
                                  >
                                    {mealLabels[idx]}
                                  </div>
                                  <div
                                    className={`text-sm font-extrabold mt-0.5 ${
                                      active
                                        ? isDarkMode ? 'text-cream-100' : 'text-ink-800'
                                        : isDarkMode ? 'text-ink-500' : 'text-cream-300'
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
                          className={`font-bold uppercase tracking-wider text-[11px] ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}
                        >
                          <th className={`p-3 pb-3 sticky left-0 backdrop-blur-md z-10 w-32 ${isDarkMode ? 'bg-ink-900/95' : 'bg-white/95'}`}>
                            Grupo
                          </th>
                          {['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'].map((l) => (
                            <th key={l} className="p-3 pb-3 text-center w-16">
                              {l}
                            </th>
                          ))}
                          <th className={`p-3 pb-3 text-center rounded-tr-xl w-16 ${isDarkMode ? 'bg-ink-800' : 'bg-cream-100'}`}>
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className={`divide-y ${isDarkMode ? 'divide-ink-700' : 'divide-cream-200'}`}>
                        {categories.map((cat) => {
                          const total = mealKeys.reduce(
                            (acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0),
                            0
                          );

                          return (
                            <tr
                              key={cat.key}
                              className={`transition-colors group ${isDarkMode ? 'hover:bg-ink-800/60' : 'hover:bg-cream-100/70'}`}
                            >
                              <td className={`p-3 sticky left-0 backdrop-blur-md z-10 font-bold transition-colors ${isDarkMode ? 'bg-ink-900/95 group-hover:bg-ink-800/95 text-cream-100' : 'bg-white/95 group-hover:bg-cream-100/95 text-ink-600'}`}>
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
                                        ? isDarkMode ? 'text-cream-100' : 'text-ink-800'
                                        : isDarkMode ? 'text-ink-500' : 'text-cream-300'
                                    }`}
                                  >
                                    {val}
                                  </td>
                                );
                              })}

                              <td
                                className={`p-3 text-center font-bold ${dynamicAc.text} ${isDarkMode ? 'bg-ink-800' : 'bg-cream-100'}`}
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
