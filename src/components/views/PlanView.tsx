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
  Repeat2,
  SlidersHorizontal,
  Sparkles,
  Star,
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

// Los momentos usan una superficie neutral; el color queda reservado al perfil.
const momentoThemes: Record<string, { tile: string; icon: string; strip: string }> = {
  desayuno: {
    tile: 'bg-cream-100 dark:bg-ink-800',
    icon: 'text-ink-700 dark:text-cream-200',
    strip: 'bg-cream-200 dark:bg-ink-700',
  },
  colacion_am: {
    tile: 'bg-cream-100 dark:bg-ink-800',
    icon: 'text-ink-700 dark:text-cream-200',
    strip: 'bg-cream-200 dark:bg-ink-700',
  },
  comida: {
    tile: 'bg-cream-100 dark:bg-ink-800',
    icon: 'text-ink-700 dark:text-cream-200',
    strip: 'bg-cream-200 dark:bg-ink-700',
  },
  colacion_pm: {
    tile: 'bg-cream-100 dark:bg-ink-800',
    icon: 'text-ink-700 dark:text-cream-200',
    strip: 'bg-cream-200 dark:bg-ink-700',
  },
  cena: {
    tile: 'bg-cream-100 dark:bg-ink-800',
    icon: 'text-ink-700 dark:text-cream-200',
    strip: 'bg-cream-200 dark:bg-ink-700',
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
    comidasCompletadas,
    toggleComidaCompletada,
    isComidaFavorita,
    toggleFavoritoComida,
    repetirComida,
    momentosColapsados,
    setMomentosColapsados,
    momentoCompletado,
    completadosCount,
    totalMomentosProgress,
    progresoDia,
    ac,
    mealSectionRefs,
    isDarkMode,
    planRevisionLoading,
    planRevisionError,
    planRevisionErrorLog,
    lastValidPlanBackup,
    restoreLastValidPlan,
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
  // Las acciones útiles deben estar a la vista en móvil; el usuario aún puede
  // plegarlas si quiere concentrarse solo en sus comidas.
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

  const activeDayPlannedCount = React.useMemo(() => {
    const countForProfile = (profileId: ProfileId) => perfilesData[profileId].momentos.filter((moment) => (
      (perfilesData[profileId].plan[diaActivo]?.[moment.key] || []).some(
        (meal) => selecciones[`${profileId}-${diaActivo}-${moment.key}-${meal.nombre}`]
      )
    )).length;

    return perfilActivo === 'ambos'
      ? countForProfile('el') + countForProfile('ella')
      : countForProfile(perfilActivo === 'ella' ? 'ella' : 'el');
  }, [diaActivo, perfilActivo, perfilesData, selecciones]);

  const nextPendingMoment = perfilBase.momentos.find((moment) => !momentoCompletado[moment.key]);

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
    profileId: ProfileId,
    momentoKey: string,
    onChange: () => void,
    dataTestId?: string
  ) => (
    <div
      key={`${meal.nombre}-${meal.detalle}`}
      role="article"
      data-testid={dataTestId}
      className={`group surface-card p-3 ${
        isDarkMode
          ? 'bg-ink-800/50'
          : 'bg-white'
      } cursor-pointer transition-colors hover:border-cream-300 active:scale-[0.99]`}
    >
        <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${isDarkMode ? 'bg-ink-900' : 'bg-white shadow-soft'}`}>
          {getMealEmoji(meal.nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold ${accent.text}`}>{getProfileLabel(profileLabels, profileId)}</p>
          <h4 className={`line-clamp-2 font-display text-[15px] font-semibold leading-snug ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
            {meal.nombre}
          </h4>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-extrabold tabular-nums ${accent.tagBg} ${accent.tagText}`}>
            {meal.caloriasKcal || 0} kcal
          </span>
        </div>
        </div>
        <p className={`mt-2 pl-[52px] text-xs font-medium ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
          {meal.proteinaG || 0} g proteína · {meal.grasasG || 0} g grasas
        </p>
        {meal.porciones ? <p className={`mt-1 pl-[52px] line-clamp-1 text-xs ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>{meal.porciones}</p> : null}
      <div className={`mt-2.5 flex items-center gap-1.5 border-t pt-2 ${isDarkMode ? 'border-ink-700' : 'border-cream-200'}`}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleFavoritoComida(profileId, meal.nombre);
          }}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${isDarkMode ? 'text-apricot-200 hover:bg-ink-700' : 'text-apricot-600 hover:bg-apricot-50'}`}
          aria-label={isComidaFavorita(profileId, meal.nombre) ? `Quitar ${meal.nombre} de favoritos` : `Guardar ${meal.nombre} en favoritos`}
          title={isComidaFavorita(profileId, meal.nombre) ? 'Quitar de favoritos' : 'Guardar favorito'}
        >
          <Star className="h-4 w-4" fill={isComidaFavorita(profileId, meal.nombre) ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const targetDay = repetirComida(profileId, diaActivo, momentoKey, meal);
            void notify(
              targetDay ? 'Comida repetida' : 'No encontramos esa opción',
              targetDay
                ? `La dejamos planeada también para ${targetDay}.`
                : 'Esta opción no está disponible en otro día de este plan.'
            );
          }}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 ${isDarkMode ? 'bg-ink-900 text-ink-200 hover:bg-ink-700' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'}`}
          aria-label={`Repetir ${meal.nombre} en otro día`}
          title="Repetir en otro día"
        >
          <Repeat2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleComidaCompletada(profileId, diaActivo, momentoKey);
          }}
          className={`ml-auto inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-bold transition active:scale-95 ${
            comidasCompletadas[`${profileId}-${diaActivo}-${momentoKey}`]
              ? 'status-success'
              : isDarkMode ? 'bg-ink-900 text-ink-300 hover:bg-ink-700' : 'bg-white text-ink-600 shadow-sm hover:bg-cream-100'
          }`}
          aria-pressed={Boolean(comidasCompletadas[`${profileId}-${diaActivo}-${momentoKey}`])}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {comidasCompletadas[`${profileId}-${diaActivo}-${momentoKey}`] ? 'Completada' : 'Marcar lista'}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange();
          }}
          className={`inline-flex min-h-8 items-center rounded-full px-2.5 text-xs font-bold transition active:scale-95 ${isDarkMode ? 'text-ink-300 hover:bg-ink-700' : 'text-ink-500 hover:bg-cream-100'}`}
        >
          Cambiar
        </button>
      </div>
    </div>
  ), [comidasCompletadas, diaActivo, isComidaFavorita, isDarkMode, notify, profileLabels, repetirComida, toggleComidaCompletada, toggleFavoritoComida]);

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
      className={`flex min-h-[52px] items-center justify-start gap-2.5 rounded-[16px] border px-3 py-2.5 text-left transition-colors cursor-pointer active:scale-[0.99] ${
        isDarkMode
          ? 'border-ink-700 bg-ink-800/40 hover:border-ink-500'
          : `${accent.border} bg-white hover:bg-cream-50`
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
          ? 'min-h-[52px] flex-row gap-1.5 px-2 text-xs'
          : 'min-h-[52px] flex-row gap-1.5 px-3 text-xs'
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
      <span>{compact ? 'Registrar' : 'Registrar comida'}</span>
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
        className="space-y-3"
      >
        <div className="space-y-4">
          <div className="px-1">
            <p className="eyebrow-label">Tu semana</p>
            <div className="flex items-center justify-between gap-3">
              <div>
                 <h2 className={`font-display text-[30px] font-semibold tracking-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                  Mi plan
                </h2>
                 <p className={`mt-0.5 text-sm font-semibold ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                  {diaActivo}
                </p>
                {!nextPendingMoment ? (
                   <p className="mt-1 text-xs font-bold text-[var(--ui-success)]">Día completado</p>
                ) : null}
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 text-right">
                  <p className={`whitespace-nowrap text-sm font-black tabular-nums ${ac.text}`}>
                    {activeDayStats.kcal}
                    <span className="ml-1 text-xs font-bold text-ink-400">
                      / {activeDayStats.target} kcal
                    </span>
                  </p>
                  <p className={`mt-0.5 text-xs font-bold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                    Seleccionadas hoy
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

            <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Elegir día del plan">
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
                    className={`min-h-10 rounded-xl px-1 text-xs font-bold transition active:scale-95 ${
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
                className="h-full rounded-full bg-[var(--ui-brand)]"
                animate={{ width: `${calorieProgress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              />
            </div>

            <div className={`mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
              <span>{activeDayPlannedCount} de {totalMomentosProgress} planeadas</span>
              <span>{completadosCount} completadas</span>
              <span className="tabular-nums">{calorieProgress}% de kcal</span>
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
                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[14px] border text-xs font-bold transition active:scale-95 ${
                        isDarkMode ? 'border-ink-700 bg-ink-900 text-ink-200' : 'border-cream-200 bg-white text-ink-600'
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
                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[14px] border text-xs font-bold transition active:scale-95 ${
                        isDarkMode ? 'border-ink-700 bg-ink-900 text-ink-200' : 'border-cream-200 bg-white text-ink-600'
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
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[14px] bg-ink-900 px-3 text-xs font-bold text-white transition active:scale-95 dark:bg-cream-100 dark:text-ink-900"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Cambiar mi plan
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
            const isNext = nextPendingMoment?.key === momento.key;

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
                className={`surface-card overflow-hidden transition-colors ${isNext ? 'ring-2 ring-[var(--ui-brand)]/20' : ''}`}
              >
                <div className={`h-px w-full ${momentoTheme.strip}`} aria-hidden="true" />
                <button
                  onClick={() => {
                    setMomentosColapsados((prev) => ({
                      ...prev,
                      [momento.key]: !prev[momento.key],
                    }));
                  }}
                    className={`flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors focus:outline-none ${
                    isDarkMode
                      ? 'hover:bg-ink-800/60'
                      : 'hover:bg-cream-50'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[13px] ${
                        done
                          ? 'bg-[var(--ui-success)] text-white'
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
                       <h3 className={`flex items-center gap-2 truncate font-display text-base font-semibold leading-tight ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
                        <span className="truncate">{momento.label}</span>
                        {isNext ? <span className="eyebrow-label rounded-full bg-pine-50 px-2 py-0.5 normal-case tracking-normal dark:bg-pine-950/40">Siguiente</span> : null}
                      </h3>
                       <p className={`mt-0.5 text-xs font-semibold tabular-nums ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                        {momento.hora}
                        {done ? ' · Listo' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--ui-success)]" />
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
                      <div className="px-3.5 pb-3.5 pt-0">
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
                                    singleProfileId,
                                    momento.key,
                                    () => openSwapSheet(singleProfileId, momento.key, momento.label, momento.hora, mealsSingleAll, porcionesSingleMomento, singleEmptyAccent),
                                    `selected-meal-${perfilActivo}-${diaActivo}-${momento.key}-${meal.nombre}`
                                  ))}
                                </div>
                              )}
                            </div>
                            {renderLogMealButton(singleProfileId, momento.key, momento.label, singleEmptyAccent, true)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <div className={mealsElSeleccionadas.length === 0 ? 'grid self-start grid-cols-[minmax(0,1fr)_78px] items-stretch gap-2.5' : 'self-start space-y-2.5'}>
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
                                    'el',
                                    momento.key,
                                    () => openSwapSheet('el', momento.key, momento.label, momento.hora, mealsElAll, porcionesElMomento, elAccent),
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
                              {renderLogMealButton('el', momento.key, momento.label, elAccent, true)}
                            </div>

                            <div className={mealsEllaSeleccionadas.length === 0 ? 'grid self-start grid-cols-[minmax(0,1fr)_78px] items-stretch gap-2.5' : 'self-start space-y-2.5'}>
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
                                    'ella',
                                    momento.key,
                                    () => openSwapSheet('ella', momento.key, momento.label, momento.hora, mealsEllaAll, porcionesEllaMomento, ellaAccent),
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
                              {renderLogMealButton('ella', momento.key, momento.label, ellaAccent, true)}
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
            className="status-success mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border p-5 sm:flex-row"
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--ui-success)] text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold mb-1">
                  Día completado
                </h3>
                <p className="max-w-sm text-sm opacity-80">
                  Marcaste todas tus comidas planeadas como completadas.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                void handleDownloadDayPdf();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 py-3 text-sm font-bold text-[var(--ui-text)] transition active:scale-[0.98] sm:w-auto"
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
          isFavorite={isComidaFavorita}
          onToggleFavorite={toggleFavoritoComida}
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
          hasPreviousPlan={Boolean(lastValidPlanBackup)}
          onRestorePreviousPlan={() => {
            if (!restoreLastValidPlan()) return;
            setIsPlanAiSheetOpen(false);
            window.dispatchEvent(new CustomEvent('plan-adjust-open', { detail: false }));
            notifyOverlayClosed();
            void notify('Plan anterior recuperado', 'Volvimos al último plan válido.');
          }}
          defaultTarget={defaultPlanAiTarget}
        geminiModel={geminiModel}
        geminiRecommendedModel={geminiRecommendedModel}
        geminiFallbackModels={geminiFallbackModels}
      />
    </>
  );
}
