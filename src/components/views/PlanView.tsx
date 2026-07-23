import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronUp,
  Coffee,
  FileText,
  Pill,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Moon,
  Sun,
  UtensilsCrossed,
  Apple,
} from 'lucide-react';
import MealSwapSheet from '../MealSwapSheet';
import MealLogSheet from '../MealLogSheet';
import EquivalenciasSheet from '../EquivalenciasSheet';
import SupplementsSheet from '../SupplementsSheet';
import PlanAiRefreshSheet from '../PlanAiRefreshSheet';
import type { QuestionnairePayload } from '../NutritionQuestionnaire';
import { useDiet } from '../../context/DietContext';
import { getMomentMacroPortions } from '../../utils/macros';
import { type AccentColors, getAccentColors } from '../../utils/theme';
import { getMealEmoji } from '../../utils/mealEmoji';
import type { MealItem } from '../../types';
import type { PlanRevisionRequest } from '../../services/aiService';
import {
  equivalenciasData as defaultEquivalenciasData,
  perfilesData as defaultPerfilesData,
  supplementsData as defaultSupplementsData,
} from '../../data';
import { buildSerializableProfileSnapshot } from '../../utils/planAiUtils';
import { getProfileLabel } from '../../utils/profileLabels';
import {
  estimateDailyCaloriesFromObjectives,
  sumSelectedMealCalories,
} from '../../utils/nutrition';

const momentoIcons: Record<string, React.ElementType> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

// Cada momento tiene su propio color para que el plan se sienta vivo
const momentoThemes: Record<string, { tile: string; icon: string; strip: string }> = {
  desayuno: {
    tile: 'bg-apricot-100 dark:bg-apricot-950/50',
    icon: 'text-apricot-600 dark:text-apricot-300',
    strip: 'bg-apricot-400',
  },
  colacion_am: {
    tile: 'bg-coral-100 dark:bg-coral-950/50',
    icon: 'text-coral-500 dark:text-coral-300',
    strip: 'bg-coral-400',
  },
  comida: {
    tile: 'bg-pine-100 dark:bg-pine-950/50',
    icon: 'text-pine-600 dark:text-pine-300',
    strip: 'bg-pine-500',
  },
  colacion_pm: {
    tile: 'bg-ocean-100 dark:bg-ocean-950/50',
    icon: 'text-ocean-500 dark:text-ocean-300',
    strip: 'bg-ocean-400',
  },
  cena: {
    tile: 'bg-ink-800 dark:bg-ink-700',
    icon: 'text-cream-100 dark:text-cream-200',
    strip: 'bg-ink-500',
  },
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

interface LogSheetState {
  profileId: ProfileId;
  momentoKey: string;
  momentoLabel: string;
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
    diasDisponibles,
    setDiaActivo,
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
  const [arePlanToolsOpen, setArePlanToolsOpen] = React.useState(false);
  const [swapSheet, setSwapSheet] = React.useState<SwapSheetState | null>(null);
  const [logSheet, setLogSheet] = React.useState<LogSheetState | null>(null);
  const isAnySheetOpen = Boolean(swapSheet) || Boolean(logSheet) || isSupplementsSheetOpen || isEquivalenciasSheetOpen || isPlanAiSheetOpen;

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

  const profileDayStats = React.useMemo(() => {
    const sumForProfile = (profileId: ProfileId) => {
      const profile = perfilesData[profileId];
      const dayPlan = profile?.plan?.[diaActivo] || {};
      const selectedMeals = Object.entries(dayPlan).flatMap(([momentKey, meals]) =>
        (meals || []).filter(
          (meal) => selecciones[`${profileId}-${diaActivo}-${momentKey}-${meal.nombre}`]
        )
      );
      const estimatedTarget = estimateDailyCaloriesFromObjectives(profile);
      const target = profile.metaCaloricaKcalDia && profile.metaCaloricaKcalDia > 0
        ? profile.metaCaloricaKcalDia
        : estimatedTarget;

      return {
        kcal: sumSelectedMealCalories(selectedMeals),
        target,
      };
    };

    return {
      el: sumForProfile('el'),
      ella: sumForProfile('ella'),
    };
  }, [diaActivo, perfilesData, selecciones]);

  const activeDayStats = React.useMemo(() => {
    if (perfilActivo === 'ambos') {
      return {
        kcal: profileDayStats.el.kcal + profileDayStats.ella.kcal,
        target: profileDayStats.el.target + profileDayStats.ella.target,
      };
    }

    return profileDayStats[perfilActivo === 'ella' ? 'ella' : 'el'];
  }, [perfilActivo, profileDayStats]);

  const calorieProgress = activeDayStats.target > 0
    ? Math.min(100, Math.round((activeDayStats.kcal / activeDayStats.target) * 100))
    : 0;

  const handleDownloadDayPdf = React.useCallback(async () => {
    if (!perfilActivo) return;
    try {
      const { downloadDaySelectionPdf } = await import('../../services/pdfService');

      if (perfilActivo === 'ambos') {
        downloadDaySelectionPdf(
          diaActivo,
          [
            { perfilData: perfilesData.el, color: [33, 80, 196], planObj: perfilesData.el.plan, perfilId: 'el' },
            { perfilData: perfilesData.ella, color: [192, 34, 68], planObj: perfilesData.ella.plan, perfilId: 'ella' },
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
            color: isElla ? [192, 34, 68] : [33, 80, 196],
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

  const openLogSheet = React.useCallback((
    profileId: ProfileId,
    momentoKey: string,
    momentoLabel: string,
  ) => {
    setSwapSheet(null);
    setLogSheet({ profileId, momentoKey, momentoLabel });
  }, []);

  const closeLogSheet = React.useCallback(() => {
    setLogSheet(null);
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
    dataTestId?: string
  ) => (
    <div
      key={`${meal.nombre}-${meal.detalle}`}
      role="button"
      tabIndex={0}
      data-testid={dataTestId}
      className={`group rounded-[18px] border p-3 ${
        isDarkMode
          ? 'border-ink-700 bg-ink-800/50'
          : 'border-cream-200 bg-cream-50'
      } cursor-pointer transition-all hover:shadow-soft active:scale-[0.99]`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${isDarkMode ? 'bg-ink-900' : 'bg-white shadow-soft'}`}>
          {getMealEmoji(meal.nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`line-clamp-2 font-display text-[15px] font-semibold leading-snug ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
            {meal.nombre}
          </h4>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${accent.tagBg} ${accent.tagText}`}>
            {meal.caloriasKcal || 0} kcal
          </span>
          <span className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${isDarkMode ? 'text-ink-500 group-hover:text-ink-300' : 'text-ink-400 group-hover:text-ink-500'}`}>
            Cambiar
          </span>
        </div>
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
      className={`flex items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed px-4 py-4 text-center transition-all cursor-pointer hover:shadow-soft active:scale-[0.99] ${
        isDarkMode
          ? 'border-ink-600 bg-ink-800/30 hover:border-ink-500'
          : `${accent.border} bg-cream-50 hover:bg-cream-100`
      }`}
    >
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${accent.tagBg} ${accent.text}`}>
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className={`text-sm font-bold ${accent.text}`}>
        Elegir{label ? ` para ${label}` : ' platillo'}
      </span>
    </div>
  ), [isDarkMode]);

  const renderLogMealButton = React.useCallback((
    profileId: ProfileId,
    momentoKey: string,
    momentoLabel: string,
    accent: AccentColors,
    compact = false,
  ) => (
    <button
      type="button"
      onClick={() => openLogSheet(profileId, momentoKey, momentoLabel)}
      data-testid={`meal-log-open-${profileId}-${diaActivo}-${momentoKey}`}
      className={`flex w-full items-center justify-center rounded-[20px] border font-extrabold transition hover:shadow-soft active:scale-[0.97] ${
        compact
          ? 'min-h-9 flex-row gap-1.5 px-3 text-[11px]'
          : 'min-h-[74px] flex-col gap-1 px-2 text-[11px]'
      } ${
        isDarkMode
          ? 'border-ink-700 bg-ink-800/60 text-ink-200 hover:bg-ink-800'
          : 'border-cream-200 bg-white text-ink-600 hover:bg-cream-50'
      }`}
      aria-label={`Registrar ${momentoLabel} con foto o texto`}
    >
      <span className={`flex items-center justify-center rounded-full ${compact ? 'h-6 w-6' : 'h-8 w-8'} ${accent.tagBg} ${accent.text}`}>
        <Camera className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </span>
      <span>{compact ? 'Registrar lo que comí' : 'Con foto'}</span>
    </button>
  ), [diaActivo, isDarkMode, openLogSheet]);

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
          <div className="px-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className={`font-display text-[27px] font-semibold tracking-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                  Mi plan
                </h2>
                <p className={`mt-0.5 text-[11px] font-bold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                  {diaActivo}
                </p>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 text-right">
                  <p className={`whitespace-nowrap text-sm font-black tabular-nums ${ac.text}`}>
                    {activeDayStats.kcal}
                    <span className={`ml-1 text-[10px] font-bold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                      de {activeDayStats.target} kcal
                    </span>
                  </p>
                  <p className={`mt-0.5 text-[9px] font-bold ${isDarkMode ? 'text-ink-500' : 'text-ink-400'}`}>
                    Total del día
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setArePlanToolsOpen((open) => !open)}
                  data-testid="plan-tools-toggle"
                  aria-expanded={arePlanToolsOpen}
                  aria-label="Opciones del plan"
                  title="Opciones del plan"
                  className={`inline-flex h-8 flex-shrink-0 items-center justify-center gap-0.5 rounded-full px-2 transition active:scale-90 ${
                    isDarkMode ? 'bg-ink-900 text-ink-300' : 'bg-white text-ink-500 shadow-soft'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <ChevronUp className={`h-3 w-3 transition-transform ${arePlanToolsOpen ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1" aria-label="Elegir día del plan">
              {diasDisponibles.map((day) => {
                const isActiveDay = day === diaActivo;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDiaActivo(day)}
                    aria-label={`Ver ${day}`}
                    aria-pressed={isActiveDay}
                    data-testid={`plan-day-${day}`}
                    className={`min-h-10 rounded-xl px-1 text-[10px] font-extrabold transition active:scale-90 sm:text-xs ${
                      isActiveDay
                        ? `${ac.btnActive} shadow-sm`
                        : isDarkMode
                          ? 'bg-ink-900 text-ink-300 hover:bg-ink-800'
                          : 'border border-cream-200 bg-white text-ink-500 hover:bg-cream-100'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>

            <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDarkMode ? 'bg-ink-800' : 'bg-cream-200'}`}>
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${ac.progressFill}`}
                animate={{ width: `${calorieProgress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              />
            </div>

            <AnimatePresence initial={false}>
              {arePlanToolsOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -4 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -4 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setArePlanToolsOpen(false);
                        setIsSupplementsSheetOpen(true);
                      }}
                      data-testid="plan-suplementos-nav"
                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[11px] font-bold transition active:scale-90 ${
                        isDarkMode ? 'bg-ink-900 text-ink-200' : 'bg-white text-ink-500 shadow-soft'
                      }`}
                    >
                      <Pill className="h-4 w-4" />
                      Extras
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setArePlanToolsOpen(false);
                        setIsEquivalenciasSheetOpen(true);
                      }}
                      data-testid="plan-equivalencias-open"
                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[11px] font-bold transition active:scale-90 ${
                        isDarkMode ? 'bg-ink-900 text-ink-200' : 'bg-white text-ink-500 shadow-soft'
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Guía
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setArePlanToolsOpen(false);
                        setIsPlanAiSheetOpen(true);
                      }}
                      data-testid="plan-ai-open"
                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r px-3 text-[11px] font-bold text-white transition active:scale-90 ${ac.bgGradient}`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ajustar IA
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {perfilBase.momentos.map((momento) => {
            const Icon = momentoIcons[momento.key] || UtensilsCrossed;
            const momentoTheme = momentoThemes[momento.key] || momentoThemes.comida;
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
                className={`rounded-[24px] overflow-hidden border transition-all duration-300 shadow-soft ${
                  isDarkMode
                    ? 'border-ink-700 bg-ink-900'
                    : 'border-cream-200 bg-white'
                }`}
              >
                <div className={`h-1 w-full ${momentoTheme.strip}`} aria-hidden="true" />
                <button
                  onClick={() => {
                    setMomentosColapsados((prev) => ({
                      ...prev,
                      [momento.key]: !prev[momento.key],
                    }));
                  }}
                  className={`w-full flex items-center justify-between text-left px-4 py-3.5 transition-colors focus:outline-none ${
                    isDarkMode
                      ? 'hover:bg-ink-800/60'
                      : 'hover:bg-cream-50'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        done
                          ? `bg-gradient-to-br ${ac.bgGradient} text-white shadow-sm`
                          : momentoTheme.tile
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          done ? 'text-white' : momentoTheme.icon
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className={`font-display text-lg font-semibold truncate leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
                        {momento.label}
                      </h3>
                      <p className={`mt-0.5 text-xs font-semibold tabular-nums ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                        {momento.hora}
                        {done ? ' · Listo' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {done ? (
                      <CheckCircle2 className={`w-4 h-4 ${isDarkMode ? 'text-pine-300' : 'text-pine-600'}`} />
                    ) : null}
                    <motion.div
                      animate={{ rotate: momentosColapsados[momento.key] ? -180 : 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="flex-shrink-0"
                    >
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-ink-500' : 'text-ink-400'}`} />
                    </motion.div>
                  </div>
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
                          <div className={isElegidoVacio ? 'grid grid-cols-[minmax(0,1fr)_78px] items-stretch gap-2.5' : 'space-y-2.5'}>
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
                                    `selected-meal-${perfilActivo}-${diaActivo}-${momento.key}-${meal.nombre}`
                                  ))}
                                </div>
                              )}
                            </div>
                            {renderLogMealButton(singleProfileId, momento.key, momento.label, singleEmptyAccent, !isElegidoVacio)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <div className={mealsElSeleccionadas.length === 0 ? 'grid grid-cols-[minmax(0,1fr)_78px] items-stretch gap-2.5' : 'space-y-2.5'}>
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
                              {renderLogMealButton('el', momento.key, momento.label, elAccent, mealsElSeleccionadas.length > 0)}
                            </div>

                            <div className={mealsEllaSeleccionadas.length === 0 ? 'grid grid-cols-[minmax(0,1fr)_78px] items-stretch gap-2.5' : 'space-y-2.5'}>
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
                              {renderLogMealButton('ella', momento.key, momento.label, ellaAccent, mealsEllaSeleccionadas.length > 0)}
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
            className={`mt-8 p-5 sm:p-6 lg:p-8 rounded-[2rem] bg-gradient-to-br ${ac.bgGradient} text-white shadow-lift relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-4 sm:gap-5 z-10 text-center sm:text-left">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-full flex flex-shrink-0 items-center justify-center shadow-inner">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow" />
              </div>

              <div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold mb-1">
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
              className="z-10 group flex items-center gap-2 bg-white text-ink-800 px-5 sm:px-6 py-3 rounded-full font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto justify-center"
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

      {logSheet ? (
        <MealLogSheet
          open
          onClose={closeLogSheet}
          profileId={logSheet.profileId}
          dia={diaActivo}
          momentoKey={logSheet.momentoKey}
          momentoLabel={logSheet.momentoLabel}
          accentClasses={logSheet.profileId === 'ella' ? ellaAccent : elAccent}
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
