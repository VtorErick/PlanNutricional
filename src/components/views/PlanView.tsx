import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  ChevronUp,
  Coffee,
  FileText,
  Pill,
  Plus,
  SlidersHorizontal,
  Moon,
  Sun,
  UtensilsCrossed,
  Apple,
} from 'lucide-react';
import MealSwapSheet from '../MealSwapSheet';
import EquivalenciasSheet from '../EquivalenciasSheet';
import SupplementsSheet from '../SupplementsSheet';
import PlanAiRefreshSheet from '../PlanAiRefreshSheet';
import type { QuestionnairePayload } from '../NutritionQuestionnaire';
import { useDiet } from '../../context/DietContext';
import { getMomentMacroPortions } from '../../utils/macros';
import { type AccentColors, getAccentColors } from '../../utils/theme';
import type { MealItem } from '../../types';
import type { PlanRevisionRequest } from '../../services/aiService';
import {
  equivalenciasData as defaultEquivalenciasData,
  perfilesData as defaultPerfilesData,
  supplementsData as defaultSupplementsData,
} from '../../data';
import { buildSerializableProfileSnapshot } from '../../utils/planAiUtils';
import { getProfileLabel } from '../../utils/profileLabels';

const momentoIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

type ProfileId = 'el' | 'ella';

interface SwapSheetState {
  profileId: ProfileId;
  momentoKey: string;
  momentoLabel: string;
  momentoHora: string;
  meals: MealItem[];
  portions: { key: string; label: string; icon: string; cantidad: number }[];
  accent: AccentColors;
}

export default function PlanView() {
  const {
    perfilActivo,
    perfilBase,
    perfilesData,
    profileLabels,
    equivalenciasData,
    supplementsData,
    diaActivo,
    isAmbos,
    selecciones,
    toggleSeleccion,
    momentosColapsados,
    setMomentosColapsados,
    momentoCompletado,
    progresoDia,
    ac,
    mealSectionRefs,
    isDarkMode,
    planRevisionLoading,
    planRevisionError,
    planRevisionErrorLog,
    lastQuestionnaireContexts,
    handleRevisePlanWithAi,
    geminiModel,
    geminiFallbackModels,
    geminiRecommendedModel,
    notify,
    confirmAction,
  } = useDiet();

  const [isSupplementsSheetOpen, setIsSupplementsSheetOpen] = React.useState(false);
  const [isEquivalenciasSheetOpen, setIsEquivalenciasSheetOpen] = React.useState(false);
  const [isPlanAiSheetOpen, setIsPlanAiSheetOpen] = React.useState(false);
  const [swapSheet, setSwapSheet] = React.useState<SwapSheetState | null>(null);
  const isAnySheetOpen = Boolean(swapSheet) || isSupplementsSheetOpen || isEquivalenciasSheetOpen || isPlanAiSheetOpen;

  const notifyOverlayClosed = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('app-overlay-open', { detail: false }));
  }, []);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('plan-adjust-open', { detail: isPlanAiSheetOpen }));
    return () => {
      window.dispatchEvent(new CustomEvent('plan-adjust-open', { detail: false }));
    };
  }, [isPlanAiSheetOpen]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('app-overlay-open', { detail: isAnySheetOpen }));
    return () => {
      window.dispatchEvent(new CustomEvent('app-overlay-open', { detail: false }));
    };
  }, [isAnySheetOpen]);

  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);
  const labelEl = getProfileLabel(profileLabels, 'el');
  const labelElla = getProfileLabel(profileLabels, 'ella');

  const handleDownloadDayPdf = React.useCallback(async () => {
    if (!perfilActivo) return;
    try {
      const { downloadDaySelectionPdf } = await import('../../services/pdfService');

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
    } catch (error: any) {
      await notify('Error al exportar PDF', error?.message || 'No fue posible generar el PDF del dia.');
    }
  }, [perfilActivo, diaActivo, notify, perfilesData, selecciones]);

  const defaultPlanAiTarget = (perfilActivo === 'ambos' ? 'ambos' : (perfilActivo || 'el')) as 'el' | 'ella' | 'ambos';
  const getQuestionnaireContextForTarget = React.useCallback(
    (targetProfile: 'el' | 'ella' | 'ambos') =>
      (lastQuestionnaireContexts?.[targetProfile] as Partial<QuestionnairePayload> | null) || null,
    [lastQuestionnaireContexts]
  );

  const handlePlanAiSubmit = React.useCallback(async ({
    requestMode,
    targetProfile,
    instruction,
  }: {
    requestMode: PlanRevisionRequest['requestMode'];
    targetProfile: PlanRevisionRequest['targetProfile'];
    instruction: string;
  }) => {
    const buildSnapshot = (perfilId: 'el' | 'ella') => buildSerializableProfileSnapshot(
      perfilesData[perfilId],
      equivalenciasData[perfilId],
      supplementsData[perfilId]
    );

    const buildDefaultSnapshot = (perfilId: 'el' | 'ella') => buildSerializableProfileSnapshot(
      defaultPerfilesData[perfilId],
      defaultEquivalenciasData[perfilId],
      defaultSupplementsData[perfilId]
    );

    const revisionPayload: PlanRevisionRequest = {
      requestMode,
      targetProfile,
      instruction,
      questionnaireContext: getQuestionnaireContextForTarget(targetProfile),
      currentContext: {
        ...(targetProfile === 'el' || targetProfile === 'ambos' ? { el: buildSnapshot('el') } : {}),
        ...(targetProfile === 'ella' || targetProfile === 'ambos' ? { ella: buildSnapshot('ella') } : {}),
      },
      originalContext: {
        ...(targetProfile === 'el' || targetProfile === 'ambos' ? { el: buildDefaultSnapshot('el') } : {}),
        ...(targetProfile === 'ella' || targetProfile === 'ambos' ? { ella: buildDefaultSnapshot('ella') } : {}),
      },
    };

    await handleRevisePlanWithAi(revisionPayload);
    setIsPlanAiSheetOpen(false);
    window.dispatchEvent(new CustomEvent('plan-adjust-open', { detail: false }));
    notifyOverlayClosed();
  }, [
    equivalenciasData,
    handleRevisePlanWithAi,
    getQuestionnaireContextForTarget,
    notifyOverlayClosed,
    perfilesData,
    supplementsData,
  ]);



  const openSwapSheet = React.useCallback((
    profileId: ProfileId,
    momentoKey: string,
    momentoLabel: string,
    momentoHora: string,
    meals: MealItem[],
    portions: { key: string; label: string; icon: string; cantidad: number }[],
    accent: AccentColors,
  ) => {
    setSwapSheet({ profileId, momentoKey, momentoLabel, momentoHora, meals, portions, accent });
  }, []);

  const closeSwapSheet = React.useCallback(() => {
    setSwapSheet(null);
    notifyOverlayClosed();
  }, [notifyOverlayClosed]);

  const handleSwapToggle = React.useCallback((perfil: string, dia: string, momento: string, nombre: string) => {
    toggleSeleccion(perfil, dia, momento, nombre);
    setSwapSheet(null);
    notifyOverlayClosed();
  }, [notifyOverlayClosed, toggleSeleccion]);

  const renderSelectedMealCard = React.useCallback((
    meal: MealItem,
    accent: AccentColors,
    portions: { key: string; label: string; icon: string; cantidad: number }[],
    dataTestId?: string
  ) => (
    <div
      key={`${meal.nombre}-${meal.detalle}`}
      role="button"
      tabIndex={0}
      data-testid={dataTestId}
      className={`rounded-2xl border p-3.5 ${
        isDarkMode
          ? `border-slate-800 bg-slate-900/58`
          : `border-slate-100 bg-white`
      } cursor-pointer transition-all hover:opacity-95 active:scale-[0.99]`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${accent.bgGradient}`} />
        <span className={`text-[10px] font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Cambiar
        </span>
      </div>
      <h4 className={`text-sm font-black leading-snug ${accent.text}`}>
        {meal.nombre}
      </h4>
      <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        {meal.detalle}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
        <span className={`rounded-xl px-2 py-1 font-black ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
          {meal.caloriasKcal || 0} kcal
        </span>
        <span className={`rounded-xl px-2 py-1 font-bold ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
          {typeof meal.proteinaG === 'number' ? `${meal.proteinaG}g prot` : '-'}
        </span>
        <span className={`rounded-xl px-2 py-1 font-bold ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
          {typeof meal.grasasG === 'number' ? `${meal.grasasG}g grasa` : '-'}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {portions.slice(0, 3).map((item) => (
          <span
            key={`${meal.nombre}-${item.key}-${item.cantidad}`}
            title={`${item.label} ${item.cantidad}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}
          >
            <span className="text-[10px]">
              {item.icon}
            </span>
            <span>x{item.cantidad}</span>
          </span>
        ))}
        {portions.length > 3 ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDarkMode ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>
            +{portions.length - 3}
          </span>
        ) : null}
      </div>
    </div>
  ), [isDarkMode]);

  const renderEmptyMealState = React.useCallback((
    accent: AccentColors,
    _hora: string,
    dataTestId?: string,
    label?: string
  ) => (
    <div
      role="button"
      tabIndex={0}
      data-testid={dataTestId}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center transition-all cursor-pointer hover:opacity-95 active:scale-[0.99] ${
        isDarkMode
          ? `border-slate-800 bg-slate-900/58`
          : `border-slate-200 bg-slate-50/75`
      }`}
    >
      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${accent.tagBg} ${accent.text}`}>
        <Plus className="h-3.5 w-3.5" />
      </span>
      <span className={`text-sm font-bold ${accent.text}`}>
        Elegir{label ? ` para ${label}` : ' platillo'}
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>
                Mi plan
              </h2>
            </div>
            <div className="flex items-center gap-2 pr-1">
              <button
                type="button"
                onClick={() => setIsSupplementsSheetOpen(true)}
                data-testid="plan-suplementos-nav"
                aria-label="Suplementos"
                title="Suplementos"
                className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition active:scale-[0.99] [&>span]:hidden ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50'
                }`}
              >
                <Pill className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEquivalenciasSheetOpen(true)}
                data-testid="plan-equivalencias-open"
                aria-label="Guia"
                title="Guia"
                className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition active:scale-[0.99] [&>span]:hidden ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden min-[370px]:inline">Guía</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPlanAiSheetOpen(true)}
                data-testid="plan-ai-open"
                aria-label="Ajustar"
                title="Ajustar"
                className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition active:scale-[0.99] ${
                  isDarkMode
                    ? 'border-blue-900/60 bg-blue-950/60 text-blue-200 hover:bg-blue-950'
                    : 'border-blue-100 bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {perfilBase.momentos.map((momento) => {
            const Icon = momentoIcons[momento.key] || UtensilsCrossed;
            const done = momentoCompletado[momento.key];

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
              !isAmbos &&
              mealsSingleSeleccionadas.length === 0;

            const singleProfileId = (perfilActivo === 'ella' ? 'ella' : 'el') as ProfileId;

            return (
              <motion.div
                layout
                key={momento.key}
                ref={(element) => {
                  if (element) mealSectionRefs.current[momento.key] = element;
                }}
                id={`momento-${momento.key}`}
                data-testid={`moment-section-${momento.key}`}
                className={`rounded-[20px] overflow-hidden border transition-all duration-300 ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-950/92 shadow-sm'
                    : 'border-slate-100 bg-white shadow-sm'
                } ${
                  done
                    ? isDarkMode
                      ? 'border-slate-700'
                      : 'border-slate-200'
                    : ''
                }`}
              >
                <button
                  onClick={() => {
                    setMomentosColapsados((prev) => ({
                      ...prev,
                      [momento.key]: !prev[momento.key],
                    }));
                  }}
                  className={`w-full flex items-center justify-between text-left px-4 py-3.5 transition-colors focus:outline-none ${
                    done
                      ? isDarkMode
                        ? ac.bgLight
                        : 'bg-slate-50/55'
                      : isDarkMode
                        ? 'hover:bg-slate-900'
                        : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        done
                          ? `bg-gradient-to-br ${ac.bgGradient} text-white shadow-sm`
                          : ac.momentoIconBgPending
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          done ? 'text-white' : ac.momentoIconColorPending
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex items-center gap-2">
                      <h3 className={`text-[1.08rem] font-black truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {momento.label}
                      </h3>
                      <p className={`text-sm ml-auto whitespace-nowrap font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {momento.hora}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: momentosColapsados[momento.key] ? -180 : 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex-shrink-0"
                  >
                    <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {!momentosColapsados[momento.key] ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                    >
                      <div className="px-4 pb-4 pt-0">
                        {!isAmbos ? (
                          <div
                            onClick={() => openSwapSheet(
                              singleProfileId,
                              momento.key,
                              momento.label,
                              momento.hora,
                              mealsSingleAll,
                              porcionesSingleMomento,
                              singleEmptyAccent,
                            )}
                            className="cursor-pointer"
                          >
                            {isElegidoVacio ? (
                              renderEmptyMealState(
                                singleEmptyAccent,
                                momento.hora,
                                `moment-empty-${momento.key}-single`,
                                perfilActivo === 'ella' ? labelElla : labelEl
                              )
                            ) : (
                              <div className="space-y-3">
                                {mealsSingleSeleccionadas.map((meal) => renderSelectedMealCard(
                                  meal,
                                  singleEmptyAccent,
                                  porcionesSingleMomento,
                                  `selected-meal-${perfilActivo}-${diaActivo}-${momento.key}-${meal.nombre}`
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <div
                              onClick={() => openSwapSheet(
                                'el',
                                momento.key,
                                momento.label,
                                momento.hora,
                                mealsElAll,
                                porcionesElMomento,
                                elAccent,
                              )}
                              className="cursor-pointer space-y-3"
                            >
                              {mealsElSeleccionadas.length > 0 ? (
                                mealsElSeleccionadas.map((meal) => renderSelectedMealCard(
                                  meal,
                                  elAccent,
                                  porcionesElMomento,
                                  `selected-meal-el-${diaActivo}-${momento.key}-${meal.nombre}`
                                ))
                              ) : (
                                renderEmptyMealState(
                                  elAccent,
                                  momento.hora,
                                  `moment-empty-${momento.key}-el`,
                                  labelEl
                                )
                              )}
                            </div>

                            <div
                              onClick={() => openSwapSheet(
                                'ella',
                                momento.key,
                                momento.label,
                                momento.hora,
                                mealsEllaAll,
                                porcionesEllaMomento,
                                ellaAccent,
                              )}
                              className="cursor-pointer space-y-3"
                            >
                              {mealsEllaSeleccionadas.length > 0 ? (
                                mealsEllaSeleccionadas.map((meal) => renderSelectedMealCard(
                                  meal,
                                  ellaAccent,
                                  porcionesEllaMomento,
                                  `selected-meal-ella-${diaActivo}-${momento.key}-${meal.nombre}`
                                ))
                              ) : (
                                renderEmptyMealState(
                                  ellaAccent,
                                  momento.hora,
                                  `moment-empty-${momento.key}-ella`,
                                  labelElla
                                )
                              )}
                            </div>
                          </div>
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
              onClick={() => {
                void handleDownloadDayPdf();
              }}
              className="z-10 group flex items-center gap-2 bg-white text-slate-800 px-5 sm:px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto justify-center"
            >
              <FileText className={`w-5 h-5 ${ac.text}`} />
              <span>Descargar menu</span>
            </button>
          </motion.div>
        ) : null}
      </motion.div>

      {swapSheet ? (
        <MealSwapSheet
          open
          title="Elegir platillo"
          profileId={swapSheet.profileId}
          meals={swapSheet.meals}
          dia={diaActivo}
          momentoKey={swapSheet.momentoKey}
          momentoLabel={swapSheet.momentoLabel}
          momentoHora={swapSheet.momentoHora}
          selecciones={selecciones}
          onToggle={handleSwapToggle}
          onClose={closeSwapSheet}
          porciones={swapSheet.portions}
          accentClasses={swapSheet.accent}
          isDarkMode={isDarkMode}
        />
      ) : null}

      <EquivalenciasSheet
        open={isEquivalenciasSheetOpen}
        onClose={() => {
          setIsEquivalenciasSheetOpen(false);
          notifyOverlayClosed();
        }}
      />

      <SupplementsSheet
        open={isSupplementsSheetOpen}
        onClose={() => {
          setIsSupplementsSheetOpen(false);
          notifyOverlayClosed();
        }}
      />

      <PlanAiRefreshSheet
        open={isPlanAiSheetOpen}
        onClose={() => {
          setIsPlanAiSheetOpen(false);
          window.dispatchEvent(new CustomEvent('plan-adjust-open', { detail: false }));
          notifyOverlayClosed();
        }}
        onSubmit={(payload) => handlePlanAiSubmit(payload)}
        isDarkMode={isDarkMode}
        accentClasses={ac}
        loading={planRevisionLoading}
        errorMessage={planRevisionError}
        aiErrorLog={planRevisionErrorLog}
        defaultTarget={defaultPlanAiTarget}
        geminiModel={geminiModel}
        geminiRecommendedModel={geminiRecommendedModel}
        geminiFallbackModels={geminiFallbackModels}
      />
    </>
  );
}
