import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronUp,
  Coffee,
  FileText,
  Moon,
  Sun,
  UtensilsCrossed,
  Apple,
  Zap,
} from 'lucide-react';
import MealSelector from '../MealSelector';
import MealEditSheet from '../MealEditSheet';
import { useDiet } from '../../context/DietContext';
import { getMomentMacroPortions } from '../../utils/macros';
import { downloadDaySelectionPdf } from '../../services/pdfService';
import { type AccentColors, getAccentColors } from '../../utils/theme';
import type { MealItem } from '../../types';
import {
  createMealEditorDraft,
  getMealOccurrences,
  type MealEditorDraft,
} from '../../utils/mealEditing';

const momentoIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

type EditableProfileId = 'el' | 'ella';

type ActiveMealEditor = {
  profileId: EditableProfileId;
  meal: MealItem;
  accent: AccentColors;
  title: string;
  suggestions: { key: string; label: string; icon: string; cantidad: number }[];
  dia: string;
  momentoKey: string;
  editStateKey: string;
};

function buildMealMacroLine(meal: MealItem) {
  const parts = [`${meal.caloriasKcal || 0} kcal`];

  if (typeof meal.proteinaG === 'number') {
    parts.push(`${meal.proteinaG}g proteina`);
  }

  if (typeof meal.grasasG === 'number') {
    parts.push(`${meal.grasasG}g grasas`);
  }

  return parts.join(' · ');
}

export default function PlanView() {
  const {
    perfilActivo,
    perfilBase,
    perfilesData,
    diaActivo,
    isAmbos,
    selecciones,
    setSelecciones,
    toggleSeleccion,
    editMealRecipe,
    restoreMealRecipe,
    momentosEnEdicion,
    setMomentosEnEdicion,
    momentosColapsados,
    setMomentosColapsados,
    momentoCompletado,
    progresoDia,
    ac,
    mealSectionRefs,
    isDarkMode,
    notify,
    confirmAction,
  } = useDiet();

  const [mealEditor, setMealEditor] = React.useState<ActiveMealEditor | null>(null);
  const [mealEditorDraft, setMealEditorDraft] = React.useState<MealEditorDraft | null>(null);
  const [isSavingMealEdit, setIsSavingMealEdit] = React.useState(false);

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
      return;
    }

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
  }, [perfilActivo, diaActivo, perfilesData, selecciones]);

  const closeMealEditor = React.useCallback(() => {
    setMealEditor(null);
    setMealEditorDraft(null);
    setIsSavingMealEdit(false);
  }, []);

  const openMealEditor = React.useCallback((
    profileId: EditableProfileId,
    meal: MealItem,
    suggestions: { key: string; label: string; icon: string; cantidad: number }[],
    accent: AccentColors,
    momentoKey: string,
    editStateKey: string
  ) => {
    setMealEditor({
      profileId,
      meal,
      accent,
      title: meal.nombre,
      suggestions,
      dia: diaActivo,
      momentoKey,
      editStateKey,
    });
    setMealEditorDraft(createMealEditorDraft(meal));
  }, [diaActivo]);

  const mealEditorOccurrences = React.useMemo(() => {
    if (!mealEditor) return [];
    return getMealOccurrences(perfilesData[mealEditor.profileId], mealEditor.meal);
  }, [mealEditor, perfilesData]);

  const handleMealDraftChange = React.useCallback((field: keyof MealEditorDraft, value: string) => {
    setMealEditorDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleMealEditorSave = React.useCallback(async () => {
    if (!mealEditor || !mealEditorDraft) return;

    setIsSavingMealEdit(true);

    try {
      const result = editMealRecipe(mealEditor.profileId, mealEditor.meal, mealEditorDraft);
      setSelecciones((prev) => {
        const next = { ...prev };
        const prefix = `${mealEditor.profileId}-${mealEditor.dia}-${mealEditor.momentoKey}-`;

        Object.keys(next).forEach((key) => {
          if (key.startsWith(prefix)) {
            delete next[key];
          }
        });

        next[`${prefix}${result.updatedMeal.nombre}`] = true;
        return next;
      });
      setMomentosEnEdicion((prev) => ({
        ...prev,
        [mealEditor.editStateKey]: false,
      }));
      closeMealEditor();

      const summary = result.affectedLabels.slice(0, 4).join(', ');
      const extra = result.affectedLabels.length > 4
        ? ` y ${result.affectedLabels.length - 4} mas`
        : '';

      await notify(
        'Platillo actualizado',
        `Se reemplazo en ${result.affectedCount} comida${result.affectedCount === 1 ? '' : 's'}: ${summary}${extra}.`
      );
    } catch (error) {
      console.error('Failed to save meal edition:', error);
      setIsSavingMealEdit(false);
      await notify(
        'No se pudo guardar',
        'Ocurrio un error al actualizar el platillo. Intenta nuevamente.'
      );
    }
  }, [closeMealEditor, editMealRecipe, mealEditor, mealEditorDraft, notify, setMomentosEnEdicion, setSelecciones]);

  const handleRestoreMeal = React.useCallback(async (
    profileId: EditableProfileId,
    meal: MealItem
  ) => {
    try {
      const accepted = await confirmAction(
        'Restaurar platillo',
        'Se desharan tus cambios en este platillo y en todas sus apariciones vinculadas. ¿Deseas continuar?'
      );

      if (!accepted) {
        return;
      }

      const result = restoreMealRecipe(profileId, meal);
      const summary = result.affectedLabels.slice(0, 4).join(', ');
      const extra = result.affectedLabels.length > 4
        ? ` y ${result.affectedLabels.length - 4} mas`
        : '';

      await notify(
        'Platillo restaurado',
        `Se restauro en ${result.affectedCount} comida${result.affectedCount === 1 ? '' : 's'}: ${summary}${extra}.`
      );
    } catch (error) {
      console.error('Failed to restore meal edition:', error);
      await notify(
        'No se pudo restaurar',
        'Ocurrio un error al restaurar el platillo.'
      );
    }
  }, [confirmAction, notify, restoreMealRecipe]);

  const renderSelectedMealCard = React.useCallback((
    meal: MealItem,
    accent: AccentColors,
    portions: { key: string; label: string; icon: string; cantidad: number }[],
    _profileId: EditableProfileId,
    onChangeMeal: () => void
  ) => (
    <div
      key={`${meal.nombre}-${meal.detalle}`}
      role="button"
      tabIndex={0}
      onClick={onChangeMeal}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onChangeMeal();
        }
      }}
      className={`p-4 rounded-2xl border bg-gradient-to-br ${
        isDarkMode
          ? `${accent.bgGradientLight} ${accent.borderLight} shadow-[0_14px_28px_rgba(2,6,23,0.38)]`
          : `border-white/70 ${accent.bgLight} via-white to-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]`
      } cursor-pointer transition-all hover:opacity-95 active:scale-[0.99]`}
    >
      <h4 className={`font-bold text-sm mb-1 ${accent.textDark}`}>
        {meal.nombre}
      </h4>
      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
        {meal.detalle}
      </p>
      <p className={`text-[11px] mt-2 font-bold ${accent.text}`}>
        {buildMealMacroLine(meal)}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {portions.map((item) => (
          <span
            key={`${meal.nombre}-${item.key}-${item.cantidad}`}
            title={`${item.label} ${item.cantidad}`}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${accent.tagBg} ${accent.tagText} text-[10px] font-bold`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm ${isDarkMode ? 'bg-slate-900 text-slate-100 shadow-black/30' : 'bg-white/70 shadow-slate-200/50'}`}>
              {item.icon}
            </span>
            <span>x{item.cantidad}</span>
          </span>
        ))}
      </div>
    </div>
  ), [isDarkMode]);

  const renderEmptyMealState = React.useCallback((
    accent: AccentColors,
    onOpen: () => void
  ) => (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`flex items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-5 text-center transition-all cursor-pointer hover:opacity-95 active:scale-[0.99] ${
        isDarkMode
          ? `${accent.bgLight} ${accent.border}`
          : `${accent.bgLight} ${accent.border}`
      }`}
    >
      <Zap className={`w-4 h-4 flex-shrink-0 ${accent.text}`} />
      <span className={`text-sm font-bold ${accent.text}`}>
        Ir a elegir platillo
      </span>
    </div>
  ), [isDarkMode]);

  return (
    <>
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
              (meal) => selecciones[`${perfilActivo}-${diaActivo}-${momento.key}-${meal.nombre}`]
            );
            const mealsElSeleccionadas = mealsElAll.filter(
              (meal) => selecciones[`el-${diaActivo}-${momento.key}-${meal.nombre}`]
            );
            const mealsEllaSeleccionadas = mealsEllaAll.filter(
              (meal) => selecciones[`ella-${diaActivo}-${momento.key}-${meal.nombre}`]
            );

            const porcionesSingleMomento =
              !isAmbos && perfilActivo && perfilActivo !== 'ambos'
                ? getMomentMacroPortions(perfilesData[perfilActivo], momento.key)
                : [];

            const porcionesElMomento = getMomentMacroPortions(perfilesData.el, momento.key);
            const porcionesEllaMomento = getMomentMacroPortions(perfilesData.ella, momento.key);
            const singleEmptyAccent = perfilActivo === 'ella' ? ellaAccent : elAccent;
            const isElegidoVacio =
              !estaEnEdicion &&
              !isAmbos &&
              mealsSingleSeleccionadas.length === 0;

            return (
              <motion.div
                layout
                key={momento.key}
                ref={(element) => {
                  if (element) mealSectionRefs.current[momento.key] = element;
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
                      setMomentosColapsados((prev) => ({
                        ...prev,
                        [momento.key]: !prev[momento.key],
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

                    <div className="min-w-0 flex items-center gap-2">
                        <h3 className={`text-sm sm:text-[15px] font-bold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {momento.label}
                        </h3>
                      <p className={`text-[11px] ml-auto whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                        {momento.hora}
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
                  {(!momentosColapsados[momento.key] || estaEnEdicion) ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                    >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                          {isElegidoVacio ? (
                            renderEmptyMealState(
                              singleEmptyAccent,
                              () =>
                                setMomentosEnEdicion((prev) => ({
                                  ...prev,
                                  [momento.key]: true,
                                }))
                            )
                          ) : (
                          <>
                            {!isAmbos ? (
                              !estaEnEdicion ? (
                                <div className="space-y-3">
                                  {mealsSingleSeleccionadas.map((meal) => renderSelectedMealCard(
                                    meal,
                                    ac,
                                    porcionesSingleMomento,
                                    perfilActivo as EditableProfileId,
                                    () =>
                                      setMomentosEnEdicion((prev) => ({
                                        ...prev,
                                        [momento.key]: true,
                                      }))
                                  ))}
                                </div>
                              ) : (
                                <MealSelector
                                  perfil={perfilActivo as EditableProfileId}
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
                                  onEditMeal={(meal) => {
                                    openMealEditor(
                                      perfilActivo as EditableProfileId,
                                      meal,
                                      porcionesSingleMomento,
                                      ac,
                                      momento.key,
                                      momento.key
                                    );
                                  }}
                                  onRestoreMeal={(meal) => {
                                    void handleRestoreMeal(perfilActivo as EditableProfileId, meal);
                                  }}
                                  accentClasses={ac}
                                  isDarkMode={isDarkMode}
                                />
                              )
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className={`text-[10px] font-bold uppercase tracking-wider px-1 ${elAccent.text}`}>
                                    Para {perfilesData.el.nombre}
                                  </div>

                                  {!estaEnEdicionEl ? (
                                    <>
                                      {mealsElSeleccionadas.length > 0 ? (
                                        mealsElSeleccionadas.map((meal) => renderSelectedMealCard(
                                          meal,
                                          elAccent,
                                          porcionesElMomento,
                                          'el',
                                          () =>
                                            setMomentosEnEdicion((prev) => ({
                                              ...prev,
                                              [`${momento.key}-el`]: true,
                                            }))
                                        ))
                                      ) : (
                                        renderEmptyMealState(
                                          elAccent,
                                          () =>
                                            setMomentosEnEdicion((prev) => ({
                                              ...prev,
                                              [`${momento.key}-el`]: true,
                                            }))
                                        )
                                      )}
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
                                        onEditMeal={(meal) => {
                                          openMealEditor('el', meal, porcionesElMomento, elAccent, momento.key, `${momento.key}-el`);
                                        }}
                                        onRestoreMeal={(meal) => {
                                          void handleRestoreMeal('el', meal);
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
                                        mealsEllaSeleccionadas.map((meal) => renderSelectedMealCard(
                                          meal,
                                          ellaAccent,
                                          porcionesEllaMomento,
                                          'ella',
                                          () =>
                                            setMomentosEnEdicion((prev) => ({
                                              ...prev,
                                              [`${momento.key}-ella`]: true,
                                            }))
                                        ))
                                      ) : (
                                        renderEmptyMealState(
                                          ellaAccent,
                                          () =>
                                            setMomentosEnEdicion((prev) => ({
                                              ...prev,
                                              [`${momento.key}-ella`]: true,
                                            }))
                                        )
                                      )}
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
                                        onEditMeal={(meal) => {
                                          openMealEditor('ella', meal, porcionesEllaMomento, ellaAccent, momento.key, `${momento.key}-ella`);
                                        }}
                                        onRestoreMeal={(meal) => {
                                          void handleRestoreMeal('ella', meal);
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
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {progresoDia === 100 ? (
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
                  Dia completado
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
              <span>Descargar menu</span>
            </button>
          </motion.div>
        ) : null}
      </motion.div>

      {mealEditor && mealEditorDraft ? (
        <MealEditSheet
          open
          title={mealEditor.title}
          draft={mealEditorDraft}
          referencePortions={mealEditor.meal.porciones}
          onDraftChange={handleMealDraftChange}
          onClose={closeMealEditor}
          onSave={() => {
            void handleMealEditorSave();
          }}
          affectedMeals={mealEditorOccurrences}
          suggestions={mealEditor.suggestions}
          isDarkMode={isDarkMode}
          accentClasses={mealEditor.accent}
          isSaving={isSavingMealEdit}
        />
      ) : null}
    </>
  );
}
