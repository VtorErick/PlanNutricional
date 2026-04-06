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
  } = useDiet();

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
              className={`bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] border border-white/70 overflow-hidden transition-shadow duration-300 ${
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
                  done ? 'bg-slate-50/60' : 'hover:bg-slate-50'
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
                      <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 truncate">
                        {momento.label}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{momento.hora}</p>
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
                    <ChevronUp className="w-5 h-5 text-slate-400" />
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
                        <div className="text-center py-7 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-600 text-sm font-bold">
                            Ningún platillo reservado
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
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
                                    className={`p-4 rounded-2xl border border-white/70 bg-gradient-to-br ${ac.bgLight} via-white to-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]`}
                                  >
                                    <h4 className={`font-bold text-sm mb-1 ${ac.text}`}>
                                      {meal.nombre}
                                    </h4>
                                    <p className="text-slate-600 text-xs leading-relaxed">
                                      {meal.detalle}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {porcionesSingleMomento.map((item) => (
                                        <span
                                          key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                          title={`${item.label} ${item.cantidad}`}
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${ac.tagBg} ${ac.tagText} text-[11px] font-bold`}
                                        >
                                          <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[12px] shadow-sm shadow-slate-200/50">
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
                              />
                            ))}

                          {isAmbos && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider px-1">
                                  Para {perfilesData.el.nombre}
                                </div>

                                {!estaEnEdicionEl ? (
                                  <>
                                    {mealsElSeleccionadas.length > 0 ? (
                                      mealsElSeleccionadas.map((meal, idx) => (
                                        <div
                                          key={idx}
                                          className="p-4 rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 via-white to-white shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
                                        >
                                          <h4 className="font-bold text-sm mb-1 text-blue-800">
                                            {meal.nombre}
                                          </h4>
                                          <p className="text-slate-600 text-xs leading-relaxed">
                                            {meal.detalle}
                                          </p>

                                          <div className="mt-3 flex flex-wrap gap-1.5">
                                            {porcionesElMomento.map((item) => (
                                              <span
                                                key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                                title={`${item.label} ${item.cantidad}`}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold"
                                              >
                                                <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-[12px] shadow-sm shadow-blue-200/60">
                                                  {item.icon}
                                                </span>
                                                <span>x{item.cantidad}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-5 px-4 bg-blue-50/50 rounded-2xl border border-dashed border-blue-200">
                                        <p className="text-blue-700 text-sm font-semibold">
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
                                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-95 transition"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      {mealsElSeleccionadas.length > 0
                                        ? 'Cambiar opción para él'
                                        : 'Ir a elegir para él'}
                                    </button>
                                  </>
                                ) : (
                                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
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
                                      accentClasses={{
                                        bg: 'bg-blue-500',
                                        bgLight: 'bg-blue-50',
                                        bgGradient: 'from-blue-500 to-indigo-600',
                                        text: 'text-blue-600',
                                        border: 'border-blue-200',
                                        borderAccent: 'border-blue-500',
                                        tagBg: 'bg-blue-100',
                                        tagText: 'text-blue-700',
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider px-1">
                                  Para {perfilesData.ella.nombre}
                                </div>

                                {!estaEnEdicionElla ? (
                                  <>
                                    {mealsEllaSeleccionadas.length > 0 ? (
                                      mealsEllaSeleccionadas.map((meal, idx) => (
                                        <div
                                          key={idx}
                                          className="p-4 rounded-2xl border border-white/70 bg-gradient-to-br from-rose-50 via-white to-white shadow-[0_10px_24px_rgba(244,63,94,0.10)]"
                                        >
                                          <h4 className="font-bold text-sm mb-1 text-rose-800">
                                            {meal.nombre}
                                          </h4>
                                          <p className="text-slate-600 text-xs leading-relaxed">
                                            {meal.detalle}
                                          </p>

                                          <div className="mt-3 flex flex-wrap gap-1.5">
                                            {porcionesEllaMomento.map((item) => (
                                              <span
                                                key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                                title={`${item.label} ${item.cantidad}`}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold"
                                              >
                                                <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-[12px] shadow-sm shadow-rose-200/60">
                                                  {item.icon}
                                                </span>
                                                <span>x{item.cantidad}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-5 px-4 bg-rose-50/50 rounded-2xl border border-dashed border-rose-200">
                                        <p className="text-rose-700 text-sm font-semibold">
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
                                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 transition"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      {mealsEllaSeleccionadas.length > 0
                                        ? 'Cambiar opción para ella'
                                        : 'Ir a elegir para ella'}
                                    </button>
                                  </>
                                ) : (
                                  <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
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
                                      accentClasses={{
                                        bg: 'bg-rose-500',
                                        bgLight: 'bg-rose-50',
                                        bgGradient: 'from-rose-500 to-pink-600',
                                        text: 'text-rose-600',
                                        border: 'border-rose-200',
                                        borderAccent: 'border-rose-500',
                                        tagBg: 'bg-rose-100',
                                        tagText: 'text-rose-700',
                                      }}
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