import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronUp,
  Zap,
  UtensilsCrossed,
  FileText,
  Sun,
  Apple,
  Coffee,
  Moon,
} from 'lucide-react';
import MealSelector from '../MealSelector';
import { useDiet } from '../../context/DietContext';
import { getMomentMacroPortions } from '../../utils/macros';
import { downloadDaySelectionPdf } from '../../services/pdfService';
import { sumSelectedMealCalories } from '../../utils/nutrition';
import { getAccentColors } from '../../utils/theme';

const momentoIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

export default function PlanView() {
  const {
    perfilActivo,
    perfilBase,
    perfilesData,
    diaActivo,
    isAmbos,
    selecciones,
    toggleSeleccion,
    momentosEnEdicion,
    setMomentosEnEdicion,
    momentosColapsados,
    setMomentosColapsados,
    momentoCompletado,
    progresoDia,
    ac,
    mealSectionRefs,
    isDarkMode,
  } = useDiet();

  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);

  const handleDownloadDayPdf = React.useCallback(() => {
    if (!perfilActivo) return;

    if (perfilActivo === 'ambos') {
      downloadDaySelectionPdf(
        diaActivo,
        [
          { perfilData: perfilesData.el, color: [37, 99, 235], planObj: perfilesData.el.plan, perfilId: 'el' },
          { perfilData: perfilesData.ella, color: [225, 29, 72], planObj: perfilesData.ella.plan, perfilId: 'ella' },
        ],
        selecciones
      );
    } else {
      const isElla = perfilActivo === 'ella';
      downloadDaySelectionPdf(
        diaActivo,
        [
          {
            perfilData: perfilesData[perfilActivo],
            color: isElla ? [225, 29, 72] : [37, 99, 235],
            planObj: perfilesData[perfilActivo].plan,
            perfilId: perfilActivo,
          },
        ],
        selecciones
      );
    }
  }, [perfilActivo, diaActivo, perfilesData, selecciones]);

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      <div className="space-y-4">
        {perfilBase.momentos.map((momento) => {
          const Icon = momentoIcons[momento.key] || UtensilsCrossed;
          const done = momentoCompletado[momento.key];

          const estaEnEdicionEl = Boolean(momentosEnEdicion[`${momento.key}-el`]);
          const estaEnEdicionElla = Boolean(momentosEnEdicion[`${momento.key}-ella`]);
          const estaEnEdicionSingle = Boolean(momentosEnEdicion[momento.key]);
          const estaEnEdicion = isAmbos
            ? estaEnEdicionEl || estaEnEdicionElla
            : estaEnEdicionSingle;

          const mealsSingleAll = perfilBase.plan[diaActivo]?.[momento.key] || [];
          const mealsElAll = perfilesData.el.plan[diaActivo]?.[momento.key] || [];
          const mealsEllaAll = perfilesData.ella.plan[diaActivo]?.[momento.key] || [];

          const mealsSingleSeleccionadas = mealsSingleAll.filter(
            (m) => selecciones[`${perfilActivo}-${diaActivo}-${momento.key}-${m.nombre}`]
          );
          const mealsElSeleccionadas = mealsElAll.filter(
            (m) => selecciones[`el-${diaActivo}-${momento.key}-${m.nombre}`]
          );
          const mealsEllaSeleccionadas = mealsEllaAll.filter(
            (m) => selecciones[`ella-${diaActivo}-${momento.key}-${m.nombre}`]
          );

          const porcionesSingleMomento =
            !isAmbos && perfilActivo && perfilActivo !== 'ambos'
              ? getMomentMacroPortions(perfilesData[perfilActivo], momento.key)
              : [];

          const porcionesElMomento = getMomentMacroPortions(perfilesData.el, momento.key);
          const porcionesEllaMomento = getMomentMacroPortions(perfilesData.ella, momento.key);
          const kcalSingle = sumSelectedMealCalories(mealsSingleSeleccionadas);
          const kcalEl = sumSelectedMealCalories(mealsElSeleccionadas);
          const kcalElla = sumSelectedMealCalories(mealsEllaSeleccionadas);

          const isElegidoVacio =
            !estaEnEdicion &&
            !isAmbos &&
            mealsSingleSeleccionadas.length === 0;

          return (
            <motion.div
              layout
              key={momento.key}
              ref={(el) => {
                if (el) mealSectionRefs.current[momento.key] = el;
              }}
              id={`momento-${momento.key}`}
              className={`rounded-[24px] sm:rounded-[28px] overflow-hidden transition-shadow duration-300 ${
                isDarkMode
                  ? 'bg-slate-950/92 border border-slate-800 shadow-[0_12px_32px_rgba(2,6,23,0.42)] hover:shadow-[0_16px_40px_rgba(2,6,23,0.52)]'
                  : 'bg-white border border-white/70 shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]'
              } ${
                done ? ac.borderAccent : ''
              }`}
            >
              <button
                onClick={() => {
                  if (!estaEnEdicion) {
                    setMomentosColapsados((p) => ({
                      ...p,
                      [momento.key]: !p[momento.key],
                    }));
                  }
                }}
                className={`w-full flex items-center justify-between text-left p-4 sm:p-5 transition-colors focus:outline-none ${
                  done
                    ? isDarkMode
                      ? ac.bgLight
                      : 'bg-slate-50/60'
                    : isDarkMode
                      ? 'hover:bg-slate-900'
                      : 'hover:bg-slate-50'
                } ${estaEnEdicion ? 'cursor-default' : ''}`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      done ? ac.momentoIconBgDone : ac.momentoIconBgPending
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        done ? ac.momentoIconColorDone : ac.momentoIconColorPending
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className={`text-sm sm:text-[15px] font-bold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {momento.label}
                      </h3>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{momento.hora}</p>
                    <p className={`text-[11px] mt-1 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {!isAmbos
                        ? `${momento.label}: ${kcalSingle} kcal`
                        : `Subtotal: Él ${kcalEl} kcal · Ella ${kcalElla} kcal`}
                    </p>
                  </div>
                </div>

                {estaEnEdicion ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`hidden sm:inline text-[11px] font-semibold ${ac.text}`}>
                      Editando
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${ac.bgGradient}`} />
                  </div>
                ) : (
                  <motion.div
                    animate={{ rotate: momentosColapsados[momento.key] ? -180 : 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex-shrink-0"
                  >
                    <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </motion.div>
                )}
              </button>

              <AnimatePresence initial={false}>
                {(!momentosColapsados[momento.key] || estaEnEdicion) && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                  >
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                      {isElegidoVacio ? (
                        <div className={`text-center py-7 px-4 rounded-2xl border border-dashed ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50/60 border-slate-200'}`}>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-600'}`}>
                            Ningún platillo reservado
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                            Elige tu comida para este horario.
                          </p>
                          <button
                            onClick={() =>
                              setMomentosEnEdicion((prev) => ({
                                ...prev,
                                [momento.key]: true,
                              }))
                            }
                            className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r ${ac.bgGradient} shadow-sm hover:opacity-95 active:scale-95 transition`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Ir a elegir
                          </button>
                        </div>
                      ) : (
                        <>
                          {!isAmbos &&
                            (!estaEnEdicion ? (
                              <div className="space-y-3">
                                {mealsSingleSeleccionadas.map((meal, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-4 rounded-2xl border bg-gradient-to-br ${
                                      isDarkMode
                                        ? `${ac.bgGradientLight} ${ac.borderLight} shadow-[0_14px_28px_rgba(2,6,23,0.38)]`
                                        : `border-white/70 ${ac.bgLight} via-white to-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]`
                                    }`}
                                  >
                                    <h4 className={`font-bold text-sm mb-1 ${ac.text}`}>
                                      {meal.nombre}
                                    </h4>
                                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                                      {meal.detalle}
                                    </p>
                                    <p className={`text-[11px] mt-2 font-bold ${ac.text}`}>
                                      {meal.caloriasKcal || 0} kcal
                                      {typeof meal.proteinaG === 'number' ? ` · ${meal.proteinaG}g proteína` : ''}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {porcionesSingleMomento.map((item) => (
                                        <span
                                          key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                          title={`${item.label} ${item.cantidad}`}
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${ac.tagBg} ${ac.tagText} text-[11px] font-bold`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] shadow-sm ${isDarkMode ? 'bg-slate-900 text-slate-100 shadow-black/30' : 'bg-white/70 shadow-slate-200/50'}`}>
                                            {item.icon}
                                          </span>
                                          <span>x{item.cantidad}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}

                                <div>
                                  <button
                                    onClick={() =>
                                      setMomentosEnEdicion((prev) => ({
                                        ...prev,
                                        [momento.key]: true,
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold ${ac.text} ${ac.bgLight} border ${ac.border} hover:opacity-90 active:scale-95 transition`}
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                    Cambiar opción
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <MealSelector
                                perfil={perfilActivo as 'el' | 'ella'}
                                comidas={mealsSingleAll}
                                dia={diaActivo}
                                momento={momento.key}
                                selecciones={selecciones}
                                porciones={porcionesSingleMomento}
                                onToggle={(perfilId, dia, momentoKey, nombre) => {
                                  toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                  setMomentosEnEdicion((prev) => ({
                                    ...prev,
                                    [momentoKey]: false,
                                  }));
                                }}
                                accentClasses={ac}
                                isDarkMode={isDarkMode}
                              />
                            ))}

                          {isAmbos && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-1 ${elAccent.text}`}>
                                  Para {perfilesData.el.nombre}
                                </div>

                                {!estaEnEdicionEl ? (
                                  <>
                                    {mealsElSeleccionadas.length > 0 ? (
                                      mealsElSeleccionadas.map((meal, idx) => (
                                        <div
                                          key={idx}
                                          className={`p-4 rounded-2xl border bg-gradient-to-br ${
                                            isDarkMode
                                              ? `${elAccent.bgGradientLight} ${elAccent.borderLight} shadow-[0_14px_28px_rgba(2,6,23,0.38)]`
                                              : 'border-white/70 from-blue-50 via-white to-white shadow-[0_10px_24px_rgba(37,99,235,0.10)]'
                                          }`}
                                        >
                                          <h4 className={`font-bold text-sm mb-1 ${elAccent.textDark}`}>
                                            {meal.nombre}
                                          </h4>
                                          <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                                            {meal.detalle}
                                          </p>
                                          <p className={`text-[11px] mt-2 font-bold ${elAccent.text}`}>
                                            {meal.caloriasKcal || 0} kcal
                                            {typeof meal.proteinaG === 'number' ? ` · ${meal.proteinaG}g proteína` : ''}
                                          </p>

                                          <div className="mt-3 flex flex-wrap gap-1.5">
                                            {porcionesElMomento.map((item) => (
                                              <span
                                                key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                                title={`${item.label} ${item.cantidad}`}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${elAccent.tagBg} ${elAccent.tagText} text-[11px] font-bold`}
                                              >
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] shadow-sm ${isDarkMode ? 'bg-slate-900 text-slate-100 shadow-black/30' : 'bg-white/80 shadow-blue-200/60'}`}>
                                                  {item.icon}
                                                </span>
                                                <span>x{item.cantidad}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className={`text-center py-5 px-4 rounded-2xl border border-dashed ${isDarkMode ? `${elAccent.bgLight} ${elAccent.border}` : 'bg-blue-50/50 border-blue-200'}`}>
                                        <p className={`text-sm font-semibold ${elAccent.text}`}>
                                          Ningún platillo reservado
                                        </p>
                                      </div>
                                    )}

                                    <button
                                      onClick={() =>
                                        setMomentosEnEdicion((prev) => ({
                                          ...prev,
                                          [`${momento.key}-el`]: true,
                                        }))
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold ${elAccent.text} ${elAccent.bgLight} border ${elAccent.border} hover:opacity-90 active:scale-95 transition`}
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      {mealsElSeleccionadas.length > 0
                                        ? 'Cambiar opción para él'
                                        : 'Ir a elegir para él'}
                                    </button>
                                  </>
                                ) : (
                                  <div className={`p-3 rounded-2xl border ${isDarkMode ? `${elAccent.bgLight} ${elAccent.border}` : 'bg-blue-50/50 border-blue-100'}`}>
                                    <MealSelector
                                      perfil="el"
                                      comidas={mealsElAll}
                                      dia={diaActivo}
                                      momento={momento.key}
                                      selecciones={selecciones}
                                      porciones={porcionesElMomento}
                                      onToggle={(perfilId, dia, momentoKey, nombre) => {
                                        toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                        setMomentosEnEdicion((prev) => ({
                                          ...prev,
                                          [`${momentoKey}-el`]: false,
                                        }));
                                      }}
                                      accentClasses={elAccent}
                                      isDarkMode={isDarkMode}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-1 ${ellaAccent.text}`}>
                                  Para {perfilesData.ella.nombre}
                                </div>

                                {!estaEnEdicionElla ? (
                                  <>
                                    {mealsEllaSeleccionadas.length > 0 ? (
                                      mealsEllaSeleccionadas.map((meal, idx) => (
                                        <div
                                          key={idx}
                                          className={`p-4 rounded-2xl border bg-gradient-to-br ${
                                            isDarkMode
                                              ? `${ellaAccent.bgGradientLight} ${ellaAccent.borderLight} shadow-[0_14px_28px_rgba(2,6,23,0.38)]`
                                              : 'border-white/70 from-rose-50 via-white to-white shadow-[0_10px_24px_rgba(244,63,94,0.10)]'
                                          }`}
                                        >
                                          <h4 className={`font-bold text-sm mb-1 ${ellaAccent.textDark}`}>
                                            {meal.nombre}
                                          </h4>
                                          <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                                            {meal.detalle}
                                          </p>
                                          <p className={`text-[11px] mt-2 font-bold ${ellaAccent.text}`}>
                                            {meal.caloriasKcal || 0} kcal
                                            {typeof meal.proteinaG === 'number' ? ` · ${meal.proteinaG}g proteína` : ''}
                                          </p>

                                          <div className="mt-3 flex flex-wrap gap-1.5">
                                            {porcionesEllaMomento.map((item) => (
                                              <span
                                                key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                                title={`${item.label} ${item.cantidad}`}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${ellaAccent.tagBg} ${ellaAccent.tagText} text-[11px] font-bold`}
                                              >
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] shadow-sm ${isDarkMode ? 'bg-slate-900 text-slate-100 shadow-black/30' : 'bg-white/80 shadow-rose-200/60'}`}>
                                                  {item.icon}
                                                </span>
                                                <span>x{item.cantidad}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className={`text-center py-5 px-4 rounded-2xl border border-dashed ${isDarkMode ? `${ellaAccent.bgLight} ${ellaAccent.border}` : 'bg-rose-50/50 border-rose-200'}`}>
                                        <p className={`text-sm font-semibold ${ellaAccent.text}`}>
                                          Ningún platillo reservado
                                        </p>
                                      </div>
                                    )}

                                    <button
                                      onClick={() =>
                                        setMomentosEnEdicion((prev) => ({
                                          ...prev,
                                          [`${momento.key}-ella`]: true,
                                        }))
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold ${ellaAccent.text} ${ellaAccent.bgLight} border ${ellaAccent.border} hover:opacity-90 active:scale-95 transition`}
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      {mealsEllaSeleccionadas.length > 0
                                        ? 'Cambiar opción para ella'
                                        : 'Ir a elegir para ella'}
                                    </button>
                                  </>
                                ) : (
                                  <div className={`p-3 rounded-2xl border ${isDarkMode ? `${ellaAccent.bgLight} ${ellaAccent.border}` : 'bg-rose-50/50 border-rose-100'}`}>
                                    <MealSelector
                                      perfil="ella"
                                      comidas={mealsEllaAll}
                                      dia={diaActivo}
                                      momento={momento.key}
                                      selecciones={selecciones}
                                      porciones={porcionesEllaMomento}
                                      onToggle={(perfilId, dia, momentoKey, nombre) => {
                                        toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                        setMomentosEnEdicion((prev) => ({
                                          ...prev,
                                          [`${momentoKey}-ella`]: false,
                                        }));
                                      }}
                                      accentClasses={ellaAccent}
                                      isDarkMode={isDarkMode}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {progresoDia === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`mt-8 p-5 sm:p-6 lg:p-8 rounded-[2rem] bg-gradient-to-br ${ac.bgGradient} text-white shadow-xl ${ac.shadowLight} relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 sm:gap-5 z-10 text-center sm:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-full flex flex-shrink-0 items-center justify-center shadow-inner">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                ¡Día completado!
              </h3>
              <p className="text-white/85 text-sm max-w-sm">
                Has registrado todas tus comidas planeadas para hoy.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadDayPdf}
            className="z-10 group flex items-center gap-2 bg-white text-slate-800 px-5 sm:px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <FileText className={`w-5 h-5 ${ac.text}`} />
            <span>Descargar menú</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
