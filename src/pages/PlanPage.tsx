import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { CheckCircle2, FileText, Zap, ChevronUp, ChevronDown, TrendingDown, UtensilsCrossed } from 'lucide-react';
import MealSelector from '../components/MealSelector';

export function PlanPage() {
  const {
    perfilesData,
    perfilActivo,
    perfilBase,
    diaActivo,
    setDiaActivo,
    diasDisponibles,
    selecciones,
    toggleSeleccion,
    ac,
    accentColors,
    isEl,
    isAmbos,
    progresoDia,
    momentoCompletado,
    momentoCompletadoEl,
    momentoCompletadoElla,
    completadosCount,
    totalMomentosProgress,
    progressExpanded,
    setProgressExpanded,
    scrollToMomento,
    handleDownloadDayPdf,
    momentosEnEdicion,
    setMomentosEnEdicion,
    momentosColapsados,
    setMomentosColapsados,
    mealSectionRefs,
    getMomentMacroPortions,
    momentoIcons,
  } = useAppContext();

  const perfil = isEl ? perfilesData.el : perfilesData.ella;

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      {/* ── Selector de Días ───────────────────────────────── */}
      <div className="text-center">
        {/* Selector de días */}
        <div className="flex gap-1.5 overflow-x-auto snap-x scrollbar-none items-center justify-center pb-2">
          {diasDisponibles.map((dia) => (
            <button 
              key={dia} 
              onClick={() => setDiaActivo(dia)}
              className={`py-1.5 px-3 rounded-xl font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${
                diaActivo === dia ? `${ac.btnActive} shadow-sm` : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className="sm:hidden">{dia.slice(0, 3)}</span>
              <span className="hidden sm:inline">{dia}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Barra de Progreso ────────────────────────────────────────── */}
      <div className={`bg-white rounded-2xl border ${ac.border} shadow-sm overflow-hidden`}>
        {/* Compact bar */}
        <div
          className="px-4 sm:px-5 py-3 flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setProgressExpanded((e) => !e)}
        >
          {/* Active day icon */}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${ac.bgGradient} flex-shrink-0 shadow-sm`}>
            <TrendingDown className="w-3 h-3 text-white" />
          </div>

          {/* Moment indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {perfilBase?.momentos?.map((momento: any) => {
              const Icon = momentoIcons[momento.key] || UtensilsCrossed;
              const done = isAmbos
                ? momentoCompletadoEl[momento.key] && momentoCompletadoElla[momento.key]
                : momentoCompletado[momento.key];
              return (
                <button
                  key={momento.key}
                  title={`Ir a ${momento.label}`}
                  onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key, progressExpanded); }}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                    done
                      ? `bg-gradient-to-br ${ac.bgGradient} shadow-sm hover:opacity-80`
                      : `${ac.bgLight} border ${ac.border} hover:opacity-70`
                  }`}
                >
                  {done
                    ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                    : <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${ac.iconColorPending}`} />
                  }
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className={`flex-1 h-2 bg-gradient-to-r ${ac.progressBg} rounded-full overflow-hidden shadow-inner shadow-slate-200/70`}>
            <motion.div
              className={`h-full bg-gradient-to-r ${ac.progressFill} rounded-full shadow-[0_0_12px_rgba(15,23,42,0.25)]`}
              animate={{ width: `${progresoDia}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />
          </div>

          {/* Percentage */}
          <span className={`text-[11px] sm:text-xs font-bold ${progresoDia === 100 ? 'text-emerald-600' : ac.text} flex-shrink-0 tabular-nums w-7 sm:w-8 text-right`}>
            {progresoDia}%
          </span>

          {/* Toggle expand */}
          <button
            className={`flex-shrink-0 p-1 rounded-full hover:${ac.bgLight} transition-colors`}
            onClick={(e) => { e.stopPropagation(); setProgressExpanded((x) => !x); }}
            aria-label={progressExpanded ? 'Colapsar progreso' : 'Expandir progreso'}
          >
            {progressExpanded
              ? <ChevronUp className={`w-4 h-4 ${ac.text}`} />
              : <ChevronDown className={`w-4 h-4 ${ac.text}`} />
            }
          </button>
        </div>

        {/* Expanded panel with moment cards */}
        <AnimatePresence>
          {progressExpanded && (
            <motion.div
              key="progress-expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="px-4 sm:px-5 pb-4 pt-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-slate-500">
                    {completadosCount} de {totalMomentosProgress} momentos completados
                  </p>
                  {progresoDia === 100 && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ¡Día completo! 🎉
                    </span>
                  )}
                </div>

                {/* Moment cards */}
                <div className="grid grid-cols-5 gap-2">
                  {perfilBase?.momentos?.map((momento: any) => {
                    const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                    const done = isAmbos
                      ? momentoCompletadoEl[momento.key] && momentoCompletadoElla[momento.key]
                      : momentoCompletado[momento.key];
                    const shortLabel = momento.label
                      .replace('Colación ', 'Col. ')
                      .replace('mañana', 'AM')
                      .replace('tarde', 'PM');
                    return (
                      <motion.button
                        key={momento.key}
                        animate={{ scale: done ? 1.03 : 1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key, true); }}
                        className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${
                          done ? ac.cardDone : `${ac.cardPending} hover:shadow-md`
                        }`}
                      >
                        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${done ? ac.iconDone : ac.iconPending}`}>
                          {done
                            ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            : <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${ac.iconColorPending}`} />
                          }
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-tight ${done ? 'text-white' : 'text-slate-700'}`}>
                          {shortLabel}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] text-center leading-tight ${done ? 'text-white/70' : 'text-slate-400'}`}>
                          {momento.hora}
                        </span>
                        {done && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center shadow"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Meal cards ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {perfilBase?.momentos?.map((momento) => {
          const Icon = momentoIcons[momento.key];
          const done = isAmbos
            ? momentoCompletadoEl[momento.key] && momentoCompletadoElla[momento.key]
            : momentoCompletado[momento.key];
          const estaEnEdicionEl = Boolean(momentosEnEdicion[`${momento.key}-el`]);
          const estaEnEdicionElla = Boolean(momentosEnEdicion[`${momento.key}-ella`]);
          const estaEnEdicionSingle = Boolean(momentosEnEdicion[momento.key]);
          const estaEnEdicion = isAmbos
            ? estaEnEdicionEl || estaEnEdicionElla
            : estaEnEdicionSingle;

          const mealsSingleAll = perfilBase?.plan?.[diaActivo]?.[momento.key] || [];
          const mealsElAll = perfilesData.el?.plan?.[diaActivo]?.[momento.key] || [];
          const mealsEllaAll = perfilesData.ella?.plan?.[diaActivo]?.[momento.key] || [];

          const mealsSingleSeleccionadas = mealsSingleAll.filter((m: any) =>
            selecciones[`${perfilActivo}-${diaActivo}-${momento.key}-${m.nombre}`]
          );
          const mealsElSeleccionadas = mealsElAll.filter((m: any) =>
            selecciones[`el-${diaActivo}-${momento.key}-${m.nombre}`]
          );
          const mealsEllaSeleccionadas = mealsEllaAll.filter((m: any) =>
            selecciones[`ella-${diaActivo}-${momento.key}-${m.nombre}`]
          );

          const porcionesSingleMomento =
            !isAmbos && perfilActivo
              ? getMomentMacroPortions(perfilesData[perfilActivo], momento.key)
              : [];
          const porcionesElMomento = getMomentMacroPortions(perfilesData.el, momento.key);
          const porcionesEllaMomento = getMomentMacroPortions(perfilesData.ella, momento.key);

          const isElegidoVacio =
            !estaEnEdicion && !isAmbos && mealsSingleSeleccionadas.length === 0;

          return (
            <motion.div
              layout
              key={momento.key}
              ref={(el) => { mealSectionRefs.current[momento.key] = el; }}
              className={`bg-white rounded-[28px] sm:rounded-3xl shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] border border-white/70 overflow-hidden transition-shadow duration-300 ${
                done ? ac.borderAccent : ''
              }`}
            >
              <button
                onClick={() => {
                  if (!estaEnEdicion) {
                    setMomentosColapsados((p) => ({ ...p, [momento.key]: !p[momento.key] }));
                  }
                }}
                className={`w-full flex items-center justify-between text-left p-4 sm:p-5 transition-colors focus:outline-none ${
                  done ? 'bg-slate-50/50' : 'hover:bg-slate-50'
                } ${estaEnEdicion ? 'cursor-default' : ''}`}
              >
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      done ? ac.momentoIconBgDone : ac.momentoIconBgPending
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        done ? ac.momentoIconColorDone : ac.momentoIconColorPending
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="truncate leading-none">{momento.label}</span>
                    <span className="text-[10px] font-normal text-slate-400 whitespace-nowrap leading-none">
                      {momento.hora}
                    </span>
                  </div>
                </h3>
                {estaEnEdicion ? (
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-br ${ac.bgGradient}`}
                  />
                ) : (
                  <motion.div
                    animate={{ rotate: momentosColapsados[momento.key] ? -180 : 0 }}
                    transition={{ type: 'spring', damping: 20 }}
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
                        <div className="text-center py-6 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-500 text-sm font-medium">
                            Ningún platillo reservado
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            Elige tu comida para este horario.
                          </p>
                          <button
                            onClick={() =>
                              setMomentosEnEdicion((prev) => ({ ...prev, [momento.key]: true }))
                            }
                            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r ${ac.bgGradient} shadow-sm hover:opacity-95 active:scale-95 transition`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Ir a elegir
                          </button>
                        </div>
                      ) : (
                        <>
                          {!isAmbos && (
                            <>
                              {!estaEnEdicion ? (
                                <div className="space-y-3">
                                  {mealsSingleSeleccionadas.map((meal: any, idx: number) => (
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
                                      <div className="mt-2 flex flex-wrap gap-1.5">
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
                                  <button
                                    onClick={() =>
                                      setMomentosEnEdicion((prev) => ({
                                        ...prev,
                                        [momento.key]: true,
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${ac.text} ${ac.bgLight} border ${ac.border} hover:opacity-90 active:scale-95 transition`}
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                    Cambiar opción
                                  </button>
                                </div>
                              ) : (
                                <MealSelector
                                  perfil={perfilActivo || 'el'}
                                  comidas={mealsSingleAll}
                                  dia={diaActivo}
                                  momento={momento.key}
                                  selecciones={selecciones}
                                  porciones={porcionesSingleMomento}
                                  onToggle={(perfilId, dia, momentoKey, nombre) => {
                                    toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                    setMomentosEnEdicion((prev) => ({ ...prev, [momentoKey]: false }));
                                  }}
                                  accentClasses={accentColors}
                                />
                              )}
                            </>
                          )}

                          {isAmbos && (
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">
                                  Para {perfilesData.el.nombre}
                                </div>
                                {!estaEnEdicionEl ? (
                                  <>
                                    {mealsElSeleccionadas.length > 0 ? (
                                      mealsElSeleccionadas.map((meal: any, idx: number) => (
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
                                          <div className="mt-2 flex flex-wrap gap-1.5">
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
                                      <div className="text-center py-5 px-4 bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
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
                                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-95 transition"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      {mealsElSeleccionadas.length > 0
                                        ? 'Cambiar opción para el'
                                        : 'Ir a elegir para el'}
                                    </button>
                                  </>
                                ) : (
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
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
                                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">
                                  Para {perfilesData.ella.nombre}
                                </div>
                                {!estaEnEdicionElla ? (
                                  <>
                                    {mealsEllaSeleccionadas.length > 0 ? (
                                      mealsEllaSeleccionadas.map((meal: any, idx: number) => (
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
                                          <div className="mt-2 flex flex-wrap gap-1.5">
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
                                      <div className="text-center py-5 px-4 bg-rose-50/50 rounded-xl border border-dashed border-rose-200">
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
                                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 transition"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      {mealsEllaSeleccionadas.length > 0
                                        ? 'Cambiar opción para ella'
                                        : 'Ir a elegir para ella'}
                                    </button>
                                  </>
                                ) : (
                                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
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

      {/* Día completado */}
      {progresoDia === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`mt-8 p-6 lg:p-8 rounded-[2rem] bg-gradient-to-br ${ac.bgGradient} text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-5 z-10 text-center sm:text-left">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex flex-shrink-0 items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-white drop-shadow" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">¡Día Completado! 🎉</h3>
              <p className="text-white/80 text-sm max-w-sm">
                Has registrado todas tus comidas planeadas para hoy.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadDayPdf}
            className="z-10 group flex items-center gap-2 bg-white text-slate-800 px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <FileText className={`w-5 h-5 ${ac.text}`} />
            <span>Descargar Menú</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
