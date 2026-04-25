import React, { createContext, useContext, useState, useMemo, useRef, useEffect, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Profile, Equivalencia, MealEditMeta, MealItem, MealOriginalSnapshot, MealTime, SupplementRecommendation } from '../types';
import { getRawDataText, perfilesData as origPerfilesData, equivalenciasData as origEquivData, supplementsData as origSupplementsData, iconsMap } from '../data';
import { AccentColors, getAccentColors } from '../utils/theme';
import { Heart } from 'lucide-react';
import { parseObjectToData } from '../dataManager';
import {
  validateAndNormalizeDirectAiData,
  type PlanRevisionProfilePatch,
  type PlanRevisionRequest,
} from '../services/aiService';
import { showAppAlert, showAppConfirm } from '../utils/appDialogs';
import type { QuestionnairePayload, TargetProfile } from '../components/NutritionQuestionnaire';
import { enrichPlanWithNutrition } from '../utils/nutrition';
import {
  applyMealDraftToPlan,
  restoreMealInPlan,
  type MealEditorDraft,
} from '../utils/mealEditing';
import { normalizeProfileSummary } from '../utils/profileSummary';
import {
  clearLegacyGeminiApiKeyStorage,
  DEFAULT_GEMINI_MODEL,
  getGeminiModelLabel,
  getStoredGeminiModel,
  persistGeminiModel,
} from '../utils/geminiModels';
import { fetchGeminiStatus, type GeminiStatusResponse } from '../services/geminiStatusService';
import { APP_STORAGE_ERROR_EVENT, type AppStorageErrorDetail } from '../utils/storageEvents';
import { readStorageValue, removeStorageValue, writeStorageValue } from '../utils/safeStorage';
import {
  createClientAiDebugLog,
  createClientAiError,
  extractAiDebugLog,
  resolveAiErrorMessage,
  type AiDebugAttempt,
  type AiDebugLog,
} from '../utils/aiDiagnostics';
import {
  applyPlanRevisionPatchToBucket,
  buildRawBucketFromSnapshot,
  buildSerializableProfileSnapshot,
  getAffectedPlanSlotsFromPatch,
  getPatchSummaryLines,
  hasPlanRevisionPatchChanges,
} from '../utils/planAiUtils';
import { repairBrokenText } from '../utils/text';
import { remapFoodGroupRow, resolveFoodGroupKey } from '../utils/foodGroupKeys';
import {
  DEFAULT_PROFILE_LABELS,
  sanitizeProfileLabels,
  type ProfileLabels,
} from '../utils/profileLabels';

export type PerfilActivo = 'el' | 'ella' | 'ambos' | null;
export type TabState = 'plan' | 'equivalencias' | 'compras' | 'resumen' | 'calorias' | 'suplementos' | 'inicio';

type RouteState =
  | { view: 'admin' }
  | { view: 'questionnaire'; target: TargetProfile }
  | { view: 'app'; tab: TabState; profile: Exclude<PerfilActivo, null> };

const TAB_PATHS: Record<TabState, string> = {
  plan: 'miplan',
  equivalencias: 'equivalencias',
  calorias: 'calorias',
  compras: 'compras',
  resumen: 'resumen',
  suplementos: 'suplementos',
  inicio: 'home',
};

const PATH_TO_TAB: Record<string, TabState> = {
  plan: 'plan',
  miplan: 'plan',
  equivalencias: 'equivalencias',
  calorias: 'calorias',
  compras: 'compras',
  resumen: 'resumen',
  suplementos: 'suplementos',
  home: 'inicio',
};

const AVAILABLE_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeActiveDay(value: unknown): string {
  return typeof value === 'string' && AVAILABLE_DAYS.includes(value as typeof AVAILABLE_DAYS[number])
    ? value
    : 'Lunes';
}

function sanitizeBooleanRecord(value: unknown): Record<string, boolean> {
  if (!isPlainObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, Boolean(entryValue)])
  );
}

function sanitizeBooleanValue(value: unknown): boolean {
  return value === true;
}

function sanitizeDataVersions(
  value: unknown
): { el: 'original' | 'custom'; ella: 'original' | 'custom' } {
  const fallback = { el: 'original', ella: 'original' } as const;
  if (!isPlainObject(value)) return { ...fallback };

  return {
    el: value.el === 'custom' ? 'custom' : 'original',
    ella: value.ella === 'custom' ? 'custom' : 'original',
  };
}

function sanitizeCustomData(value: unknown) {
  if (!isPlainObject(value)) return {};

  const next: Record<string, any> = {};
  if (isPlainObject(value.el)) next.el = value.el;
  if (isPlainObject(value.ella)) next.ella = value.ella;
  return next;
}

function sanitizeNullableObject(value: unknown) {
  return isPlainObject(value) ? value : null;
}

type StoredQuestionnaireContexts = {
  el: any | null;
  ella: any | null;
  ambos: any | null;
};

type QuestionnaireStepsByProfile = {
  el: number;
  ella: number;
  ambos: number;
};

function sanitizeStepsByProfile(value: unknown): QuestionnaireStepsByProfile {
  const empty: QuestionnaireStepsByProfile = { el: 0, ella: 0, ambos: 0 };
  if (!isPlainObject(value)) return empty;
  return {
    el: typeof value.el === 'number' && value.el >= 0 ? value.el : 0,
    ella: typeof value.ella === 'number' && value.ella >= 0 ? value.ella : 0,
    ambos: typeof value.ambos === 'number' && value.ambos >= 0 ? value.ambos : 0,
  };
}

function sanitizeStoredQuestionnaireContexts(value: unknown): StoredQuestionnaireContexts {
  const empty = { el: null, ella: null, ambos: null };

  if (!isPlainObject(value)) return empty;

  // Backward compatibility: migrate the old single-slot payload into its target slot.
  if (typeof value.targetProfile === 'string') {
    const target = value.targetProfile === 'el' || value.targetProfile === 'ella' || value.targetProfile === 'ambos'
      ? value.targetProfile
      : null;
    if (!target) return empty;
    return {
      ...empty,
      [target]: sanitizeNullableObject(value),
    };
  }

  return {
    el: sanitizeNullableObject(value.el),
    ella: sanitizeNullableObject(value.ella),
    ambos: sanitizeNullableObject(value.ambos),
  };
}

function getInitialQuestionnaireContexts(): StoredQuestionnaireContexts {
  const empty = { el: null, ella: null, ambos: null };
  if (typeof window === 'undefined') return empty;

  try {
    const legacyRaw = readStorageValue(window.localStorage, 'lastQuestionnaireContext');
    return legacyRaw ? sanitizeStoredQuestionnaireContexts(JSON.parse(legacyRaw)) : empty;
  } catch {
    return empty;
  }
}

function isEquivalencesLike(value: unknown): value is any[] {
  return Array.isArray(value);
}

function sanitizeStringValue(value: unknown, fallback = ''): string {
  return repairBrokenText(typeof value === 'string' ? value : fallback);
}

function sanitizeNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return [...fallback];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => repairBrokenText(entry));
}

function normalizeSupplementsData(
  value: unknown,
  fallback: SupplementRecommendation[]
): SupplementRecommendation[] {
  if (!Array.isArray(value)) {
    return fallback.map((item) => ({ ...item }));
  }

  const normalized = value
    .map((entry, index) => {
      const fallbackEntry = fallback[index];
      if (!isPlainObject(entry)) {
        return fallbackEntry ? { ...fallbackEntry } : null;
      }

      const name = sanitizeStringValue(entry.name, fallbackEntry?.name ?? '');
      const goalSupport = sanitizeStringValue(
        entry.goalSupport,
        fallbackEntry?.goalSupport ?? ''
      );
      const whyItMayHelp = sanitizeStringValue(
        entry.whyItMayHelp,
        fallbackEntry?.whyItMayHelp ?? ''
      );
      const howToUse = sanitizeStringValue(entry.howToUse, fallbackEntry?.howToUse ?? '');
      const timing = sanitizeStringValue(entry.timing, fallbackEntry?.timing ?? '');
      const notes = sanitizeStringValue(entry.notes, fallbackEntry?.notes ?? '');
      const caution = sanitizeStringValue(entry.caution, fallbackEntry?.caution ?? '');

      if (!name || !goalSupport || !whyItMayHelp || !howToUse || !timing || !notes) {
        return fallbackEntry ? { ...fallbackEntry } : null;
      }

      return {
        name,
        goalSupport,
        whyItMayHelp,
        howToUse,
        timing,
        notes,
        caution,
      };
    })
    .filter((entry): entry is SupplementRecommendation => Boolean(entry));

  return normalized.length > 0
    ? normalized
    : fallback.map((item) => ({ ...item }));
}

function normalizePlanDayName(day: string) {
  return day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeMealTime(value: unknown, fallback: MealTime): MealTime {
  if (!isPlainObject(value)) return { ...fallback };

  return {
    key: sanitizeStringValue(value.key, fallback.key),
    label: sanitizeStringValue(value.label, fallback.label),
    hora: sanitizeStringValue(value.hora, fallback.hora),
  };
}

function normalizeMealItem(value: unknown, fallback?: MealItem): MealItem | null {
  if (!isPlainObject(value)) {
    return fallback ? { ...fallback } : null;
  }

  const nombre = sanitizeStringValue(value.nombre, fallback?.nombre ?? '');
  if (!nombre) {
    return fallback ? { ...fallback } : null;
  }

  return {
    nombre,
    porciones: sanitizeStringValue(value.porciones, fallback?.porciones ?? ''),
    detalle: sanitizeStringValue(value.detalle, fallback?.detalle ?? ''),
    tags: sanitizeStringArray(value.tags, fallback?.tags ?? []),
    super: sanitizeStringArray(value.super, fallback?.super ?? []),
    caloriasKcal:
      typeof value.caloriasKcal === 'number' && Number.isFinite(value.caloriasKcal)
        ? Math.round(value.caloriasKcal)
        : fallback?.caloriasKcal,
    proteinaG:
      typeof value.proteinaG === 'number' && Number.isFinite(value.proteinaG)
        ? Math.round(value.proteinaG)
        : fallback?.proteinaG,
    grasasG:
      typeof value.grasasG === 'number' && Number.isFinite(value.grasasG)
        ? Math.round(value.grasasG)
        : fallback?.grasasG,
    editMeta: normalizeMealEditMeta(value.editMeta, fallback?.editMeta),
  };
}

function normalizeMealOriginalSnapshot(
  value: unknown,
  fallback?: MealOriginalSnapshot
): MealOriginalSnapshot | undefined {
  if (!isPlainObject(value)) return fallback ? { ...fallback } : undefined;

  const nombre = sanitizeStringValue(value.nombre, fallback?.nombre ?? '');
  if (!nombre) {
    return fallback ? { ...fallback } : undefined;
  }

  return {
    nombre,
    porciones: sanitizeStringValue(value.porciones, fallback?.porciones ?? ''),
    detalle: sanitizeStringValue(value.detalle, fallback?.detalle ?? ''),
    tags: sanitizeStringArray(value.tags, fallback?.tags ?? []),
    super: sanitizeStringArray(value.super, fallback?.super ?? []),
    caloriasKcal:
      typeof value.caloriasKcal === 'number' && Number.isFinite(value.caloriasKcal)
        ? Math.round(value.caloriasKcal)
        : fallback?.caloriasKcal,
    proteinaG:
      typeof value.proteinaG === 'number' && Number.isFinite(value.proteinaG)
        ? Math.round(value.proteinaG)
        : fallback?.proteinaG,
    grasasG:
      typeof value.grasasG === 'number' && Number.isFinite(value.grasasG)
        ? Math.round(value.grasasG)
        : fallback?.grasasG,
  };
}

function normalizeMealEditMeta(
  value: unknown,
  fallback?: MealEditMeta
): MealEditMeta | undefined {
  if (!isPlainObject(value)) return fallback ? { ...fallback } : undefined;

  const original = normalizeMealOriginalSnapshot(value.original, fallback?.original);
  if (!original) return fallback ? { ...fallback } : undefined;

  return {
    isEdited: value.isEdited === true || fallback?.isEdited === true,
    original,
  };
}

function normalizePlanData(
  value: unknown,
  fallbackPlan: Record<string, Record<string, MealItem[]>>
) {
  const sourceByDay = new Map<string, Record<string, unknown>>();

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([dayKey, dayValue]) => {
      if (isPlainObject(dayValue)) {
        sourceByDay.set(normalizePlanDayName(dayKey), dayValue);
      }
    });
  }

  const normalizedPlan: Record<string, Record<string, MealItem[]>> = {};

  Object.entries(fallbackPlan).forEach(([dayKey, fallbackMoments]) => {
    const sourceDay = sourceByDay.get(normalizePlanDayName(dayKey));
    normalizedPlan[dayKey] = {};

    Object.entries(fallbackMoments).forEach(([momentKey, fallbackMeals]) => {
      const sourceMeals =
        sourceDay && Array.isArray(sourceDay[momentKey]) ? sourceDay[momentKey] : fallbackMeals;

      const normalizedMeals = (sourceMeals as unknown[])
        .map((meal, index) => normalizeMealItem(meal, fallbackMeals[index]))
        .filter((meal): meal is MealItem => Boolean(meal));

      normalizedPlan[dayKey][momentKey] =
        normalizedMeals.length > 0
          ? normalizedMeals
          : fallbackMeals.map((meal) => ({ ...meal }));
    });
  });

  return normalizedPlan;
}

function normalizeObjectivesData(
  value: unknown,
  fallback: Record<string, Record<string, number>>
) {
  const normalized: Record<string, Record<string, number>> = {};
  const source = isPlainObject(value) ? value : {};

  Object.entries(fallback).forEach(([momentKey, fallbackGroups]) => {
    const sourceGroups = isPlainObject(source[momentKey]) ? source[momentKey] : {};
    const remappedGroups = remapFoodGroupRow(sourceGroups);
    normalized[momentKey] = {};

    Object.entries(fallbackGroups).forEach(([groupKey, fallbackAmount]) => {
      const fromRemap = remappedGroups[groupKey as keyof typeof remappedGroups];
      normalized[momentKey][groupKey] = sanitizeNumberValue(
        fromRemap !== undefined ? fromRemap : sourceGroups[groupKey],
        fallbackAmount
      );
    });
  });

  return normalized;
}

function normalizeDistributionData(
  value: unknown,
  fallback: Profile['distribucionDiaria']
): Profile['distribucionDiaria'] {
  if (!Array.isArray(value)) {
    return fallback.map((entry) => ({ ...entry }));
  }

  const normalized = value
    .map((entry, index) => {
      const fallbackEntry = fallback[index];
      if (!isPlainObject(entry)) {
        return fallbackEntry ? { ...fallbackEntry } : null;
      }

      const grupoRaw = sanitizeStringValue(entry.grupo, fallbackEntry?.grupo ?? '');
      const grupoCanon = resolveFoodGroupKey(grupoRaw);
      const grupo = grupoCanon || grupoRaw;
      const detalle = sanitizeStringValue(entry.detalle, fallbackEntry?.detalle ?? '');
      const total = sanitizeNumberValue(entry.total, fallbackEntry?.total ?? 0);

      if (!grupo) {
        return fallbackEntry ? { ...fallbackEntry } : null;
      }

      return { grupo, total, detalle };
    })
    .filter((entry): entry is Profile['distribucionDiaria'][number] => Boolean(entry));

  return normalized.length > 0
    ? normalized
    : fallback.map((entry) => ({ ...entry }));
}

function normalizeProfileData(
  value: unknown,
  fallback: Profile,
  plan: Record<string, Record<string, MealItem[]>>
): Profile {
  const source = isPlainObject(value) ? value : {};
  const profileSummary = normalizeProfileSummary({
    perfil: sanitizeStringValue(source.perfil, fallback.perfil),
    detallesPerfil: sanitizeStringValue(source.detallesPerfil, fallback.detallesPerfil ?? ''),
    fallbackPerfil: fallback.perfil,
    fallbackDetallesPerfil: fallback.detallesPerfil ?? '',
  });

  return {
    id: sanitizeStringValue(source.id, fallback.id),
    nombre: sanitizeStringValue(source.nombre, fallback.nombre),
    edad: sanitizeNumberValue(source.edad, fallback.edad),
    descripcion: sanitizeStringValue(source.descripcion, fallback.descripcion),
    perfil: profileSummary.perfil,
    detallesPerfil: profileSummary.detallesPerfil,
    meta: sanitizeStringValue(source.meta, fallback.meta),
    horariosTexto: sanitizeStringValue(source.horariosTexto, fallback.horariosTexto),
    notaSalud: sanitizeStringValue(source.notaSalud, fallback.notaSalud ?? ''),
    momentos: fallback.momentos.map((moment, index) =>
      normalizeMealTime(Array.isArray(source.momentos) ? source.momentos[index] : null, moment)
    ),
    objetivosPorMomento: normalizeObjectivesData(
      source.objetivosPorMomento,
      fallback.objetivosPorMomento
    ),
    distribucionDiaria: normalizeDistributionData(
      source.distribucionDiaria,
      fallback.distribucionDiaria
    ),
    resumenPersonal: sanitizeStringArray(source.resumenPersonal, fallback.resumenPersonal),
    metaCaloricaKcalDia: sanitizeNumberValue(
      source.metaCaloricaKcalDia,
      fallback.metaCaloricaKcalDia ?? 0
    ),
    plan,
  };
}

function normalizeEquivalencesData(
  value: unknown,
  fallback: Equivalencia[]
): Equivalencia[] {
  if (!Array.isArray(value)) {
    return fallback.map((entry) => ({ ...entry }));
  }

  const normalized = value
    .map((entry, index) => {
      const fallbackEntry = fallback[index];
      if (!isPlainObject(entry)) {
        return fallbackEntry ? { ...fallbackEntry } : null;
      }

      const titulo = sanitizeStringValue(
        entry.categoria ?? entry.titulo,
        fallbackEntry?.titulo ?? ''
      );
      const items = sanitizeStringArray(
        entry.items ?? (typeof entry.ejemplos === 'string' ? [entry.ejemplos] : []),
        fallbackEntry?.items ?? []
      );
      const icon =
        (typeof entry.icon === 'string' ? iconsMap[entry.icon] : entry.icon) ||
        fallbackEntry?.icon ||
        Heart;

      if (!titulo || items.length === 0) {
        return fallbackEntry ? { ...fallbackEntry } : null;
      }

      return { titulo, items, icon };
    })
    .filter((entry): entry is Equivalencia => Boolean(entry));

  return normalized.length > 0
    ? normalized
    : fallback.map((entry) => ({ ...entry }));
}
function normalizeProfile(value: string | null | undefined): PerfilActivo {
  return value === 'el' || value === 'ella' || value === 'ambos' ? value : null;
}

function normalizeQuestionnaireTarget(
  value: string | null | undefined
): TargetProfile | null {
  return value === 'el' || value === 'ella' || value === 'ambos' ? value : null;
}

function isSelectionKeyValid(
  key: string,
  profiles: Record<string, Profile>
) {
  const parts = key.split('-');
  if (parts.length < 4) return false;

  const [profileId, day, mealTimeKey, ...mealNameParts] = parts;
  if ((profileId !== 'el' && profileId !== 'ella') || mealNameParts.length === 0) {
    return false;
  }

  const mealName = mealNameParts.join('-');
  const meals = profiles[profileId]?.plan?.[day]?.[mealTimeKey] || [];
  return meals.some((meal) => meal.nombre === mealName);
}

function parseRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { view: 'app', tab: 'inicio', profile: 'ambos' };
  }

  try {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (!path || path === 'home') {
      return {
        view: 'app',
        tab: 'inicio',
        profile: normalizeProfile(params.get('profile')) || 'ambos',
      };
    }

    if (path === 'admin') {
      return { view: 'admin' };
    }

    if (path === 'plan-ia') {
      return {
        view: 'questionnaire',
        target: normalizeQuestionnaireTarget(params.get('target')) ?? 'ambos',
      };
    }

    const tab = PATH_TO_TAB[path];
    const profile = normalizeProfile(params.get('profile'));

    if (tab && profile) {
      return { view: 'app', tab, profile };
    }
  } catch (error) {
    console.warn('Failed to parse route state:', error);
  }

  return { view: 'app', tab: 'inicio', profile: 'ambos' };
}

function buildRoutePath({
  perfilActivo,
  tab,
  showAdmin,
  showQuestionnaire,
  questionnaireTargetProfile,
}: {
  perfilActivo: PerfilActivo;
  tab: TabState;
  showAdmin: boolean;
  showQuestionnaire: boolean;
  questionnaireTargetProfile: TargetProfile;
}) {
  if (showQuestionnaire) {
    return `/plan-ia?target=${encodeURIComponent(questionnaireTargetProfile)}`;
  }

  if (showAdmin) {
    return '/admin';
  }

  if (tab === 'inicio') {
    return '/home';
  }

  return `/${TAB_PATHS[tab]}?profile=${encodeURIComponent(perfilActivo || 'ambos')}`;
}

// ─── Context Interface ───────────────────────────────────────────────
interface DietContextType {
  // Navigation & Profile Selection
  perfilActivo: PerfilActivo;
  setPerfilActivo: React.Dispatch<React.SetStateAction<PerfilActivo>>;
  tab: TabState;
  setTab: React.Dispatch<React.SetStateAction<TabState>>;

  // View toggles
  showAdmin: boolean;
  setShowAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  showQuestionnaire: boolean;
  setShowQuestionnaire: React.Dispatch<React.SetStateAction<boolean>>;

  // Date and Week logic
  diaActivo: string;
  setDiaActivo: React.Dispatch<React.SetStateAction<string>>;
  diasDisponibles: string[];

  // Persisted Database State
  selecciones: Record<string, boolean>;
  setSelecciones: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleSeleccion: (perfilId: string, dia: string, momentoKey: string, nombre: string) => void;
  editMealRecipe: (
    perfilId: 'el' | 'ella',
    meal: MealItem,
    draft: MealEditorDraft,
    targetOccurrenceIds?: string[]
  ) => {
    updatedMeal: MealItem;
    affectedCount: number;
    affectedLabels: string[];
  };
  restoreMealRecipe: (
    perfilId: 'el' | 'ella',
    meal: MealItem,
    targetOccurrenceIds?: string[]
  ) => {
    restoredMeal: MealItem;
    affectedCount: number;
    affectedLabels: string[];
  };
  comprasCheck: Record<string, boolean>;
  setComprasCheck: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // AI & Custom Data
  dataVersions: { el: 'original' | 'custom'; ella: 'original' | 'custom' };
  setDataVersions: React.Dispatch<React.SetStateAction<{ el: 'original' | 'custom'; ella: 'original' | 'custom' }>>;
  customData: any;
  setCustomData: React.Dispatch<React.SetStateAction<any>>;
  perfilesData: Record<string, Profile>;
  equivalenciasData: Record<string, Equivalencia[]>;
  supplementsData: Record<string, SupplementRecommendation[]>;
  profileLabels: ProfileLabels;
  setProfileLabels: React.Dispatch<React.SetStateAction<ProfileLabels>>;

  // Gemini AI settings
  geminiModel: string;
  setGeminiModel: React.Dispatch<React.SetStateAction<string>>;
  geminiAvailableModels: string[];
  geminiFallbackModels: string[];
  geminiRecommendedModel: string;
  geminiAvailabilityLoading: boolean;
  geminiAvailabilityMessage: string;
  refreshGeminiAvailability: (options?: {
    preferredModel?: string;
    checkGeneration?: boolean;
    syncModel?: boolean;
    force?: boolean;
  }) => Promise<GeminiStatusResponse | null>;
  generationLoading: boolean;
  generationError: string;
  generationErrorLog: AiDebugLog | null;
  lastGeneratedData: any;
  planRevisionLoading: boolean;
  planRevisionError: string;
  planRevisionErrorLog: AiDebugLog | null;
  lastQuestionnaireContexts: StoredQuestionnaireContexts;
  handleGenerateWithAi: (payload: QuestionnairePayload) => Promise<void>;
  handleRevisePlanWithAi: (payload: PlanRevisionRequest) => Promise<void>;

  // Questionnaire state
  questionnaireTargetProfile: TargetProfile;
  setQuestionnaireTargetProfile: React.Dispatch<React.SetStateAction<TargetProfile>>;
  questionnaireStepIdx: number;
  setQuestionnaireStepIdx: (step: number | ((prev: number) => number), targetOverride?: TargetProfile) => void;
  questionnaireEl: any;
  setQuestionnaireEl: React.Dispatch<React.SetStateAction<any>>;
  questionnaireElla: any;
  setQuestionnaireElla: React.Dispatch<React.SetStateAction<any>>;
  questionnairePortionMode: 'auto' | 'manual';
  setQuestionnairePortionMode: React.Dispatch<React.SetStateAction<'auto' | 'manual'>>;
  questionnaireManualPortions: Record<string, Record<string, number>>;
  setQuestionnaireManualPortions: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  questionnaireAdditionalNotes: string;
  setQuestionnaireAdditionalNotes: React.Dispatch<React.SetStateAction<string>>;

  // UI States
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  momentosColapsados: Record<string, boolean>;
  setMomentosColapsados: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  progressExpanded: boolean;
  setProgressExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  // Progress Tracking
  momentoCompletado: Record<string, boolean>;
  progresoDia: number;
  completadosCount: number;
  totalMomentosProgress: number;

  // Scroll
  scrollToMomento: (momentoKey: string, isExpanded: boolean) => void;
  mealSectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;

  // Computed
  isAmbos: boolean;
  perfilBase: Profile;
  perfilObj: Profile | null;
  ac: AccentColors;

  // Utility
  notify: (title: string, message: string) => Promise<void>;
  confirmAction: (title: string, message: string) => Promise<boolean>;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

// ─── Default questionnaire data ──────────────────────────────────────
const defaultQuestionnaireData = (weight: string, height: string, age = '', targetWeightKg = '') => ({
  age, currentWeightKg: weight, heightCm: height, targetWeightKg,
  objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
  medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
  dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
  wakeTime: '', sleepTime: '', trainingFrequency: '',
  bodyMeasurements: {
    waistCm: '',
    hipCm: '',
    neckCm: '',
    chestCm: '',
    armCm: '',
    thighCm: '',
  },
  assessmentReportPdf: null,
});

// ─── Provider ────────────────────────────────────────────────────────
export const DietProvider = ({ children }: { children: ReactNode }) => {
  const initialRoute = useMemo(() => parseRoute(), []);

  // 1. Navigation
  const [perfilActivo, setPerfilActivo] = useState<PerfilActivo>(
    initialRoute.view === 'app' ? initialRoute.profile : 'ambos'
  );
  const [tab, setTab] = useState<TabState>(
    initialRoute.view === 'app' ? initialRoute.tab : 'inicio'
  );
  const [showAdmin, setShowAdmin] = useState(initialRoute.view === 'admin');
  const [showQuestionnaire, setShowQuestionnaire] = useState(
    initialRoute.view === 'questionnaire'
  );
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>(
    'darkMode',
    false,
    sanitizeBooleanValue
  );

  // 2. Days
  const diasDisponibles = useMemo(() => [...AVAILABLE_DAYS], []);
  const [diaActivo, setDiaActivo] = useLocalStorage<string>(
    'diaActivo',
    'Lunes',
    sanitizeActiveDay
  );

  // 3. Persisted State
  const [selecciones, setSelecciones] = useLocalStorage<Record<string, boolean>>(
    'seleccionesDieta',
    {},
    sanitizeBooleanRecord
  );
  const [comprasCheck, setComprasCheck] = useLocalStorage<Record<string, boolean>>(
    'comprasCheck',
    {},
    sanitizeBooleanRecord
  );
  const [momentosColapsados, setMomentosColapsados] = useState<Record<string, boolean>>({});

  // 3.1 Custom Data
  const [dataVersions, setDataVersions] = useLocalStorage<{
    el: 'original' | 'custom';
    ella: 'original' | 'custom';
  }>('dataVersions', { el: 'original', ella: 'original' }, sanitizeDataVersions);
  const [customData, setCustomData] = useLocalStorage<any>('customData', {}, sanitizeCustomData);
  const [profileLabels, setProfileLabels] = useLocalStorage<ProfileLabels>(
    'profileLabels',
    DEFAULT_PROFILE_LABELS,
    sanitizeProfileLabels
  );

  // 4. UI States
  const [progressExpanded, setProgressExpanded] = useState(false);
  // 5. Gemini AI settings
  const [geminiModel, setGeminiModel] = useState(() => {
    try {
      return getStoredGeminiModel();
    } catch { return DEFAULT_GEMINI_MODEL; }
  });
  const [geminiAvailableModels, setGeminiAvailableModels] = useState<string[]>([]);
  const [geminiFallbackModels, setGeminiFallbackModels] = useState<string[]>([]);
  const [geminiRecommendedModel, setGeminiRecommendedModel] = useState('');
  const [geminiAvailabilityLoading, setGeminiAvailabilityLoading] = useState(false);
  const [geminiAvailabilityMessage, setGeminiAvailabilityMessage] = useState('');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationErrorLog, setGenerationErrorLog] = useState<AiDebugLog | null>(null);
  const [planRevisionLoading, setPlanRevisionLoading] = useState(false);
  const [planRevisionError, setPlanRevisionError] = useState('');
  const [planRevisionErrorLog, setPlanRevisionErrorLog] = useState<AiDebugLog | null>(null);
  const [lastGeneratedData, setLastGeneratedData] = useState<any>(null);
  const [lastQuestionnaireContexts, setLastQuestionnaireContexts] = useLocalStorage<StoredQuestionnaireContexts>(
    'lastQuestionnaireContexts',
    getInitialQuestionnaireContexts(),
    sanitizeStoredQuestionnaireContexts
  );
  const geminiModelRef = useRef(geminiModel);

  const getDefaultCustomBucket = useCallback(
    (perfilId: 'el' | 'ella') => JSON.parse(getRawDataText(perfilId)),
    []
  );

  // 6. Questionnaire state
  const [questionnaireTargetProfile, setQuestionnaireTargetProfile] = useLocalStorage<TargetProfile>("questionnaireTargetProfile", 
    initialRoute.view === 'questionnaire' ? initialRoute.target : 'ambos'
  );
  const [questionnaireStepsByProfile, setQuestionnaireStepsByProfile] = useLocalStorage<QuestionnaireStepsByProfile>(
    'questionnaireStepsByProfile',
    { el: 0, ella: 0, ambos: 0 },
    sanitizeStepsByProfile
  );
  // Derived step for the current target profile
  const questionnaireStepIdx = questionnaireStepsByProfile[questionnaireTargetProfile] ?? 0;
  const setQuestionnaireStepIdx = useCallback(
    (step: number | ((prev: number) => number), targetOverride?: TargetProfile) => {
      setQuestionnaireStepsByProfile((prev) => {
        const target = targetOverride ?? questionnaireTargetProfile;
        const current = prev[target] ?? 0;
        const next = typeof step === 'function' ? step(current) : step;
        return { ...prev, [target]: Math.max(0, next) };
      });
    },
    [questionnaireTargetProfile, setQuestionnaireStepsByProfile]
  );
  const [questionnaireEl, setQuestionnaireEl] = useLocalStorage<any>("questionnaireEl", defaultQuestionnaireData("80", "170", "30", "70"), sanitizeNullableObject);
  const [questionnaireElla, setQuestionnaireElla] = useLocalStorage<any>("questionnaireElla", defaultQuestionnaireData("60", "160", "28", "55"), sanitizeNullableObject);
  const [questionnairePortionMode, setQuestionnairePortionMode] = useState<'auto' | 'manual'>('auto');
  const [questionnaireManualPortions, setQuestionnaireManualPortions] = useState<Record<string, Record<string, number>>>({});
  const [questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes] = useState('');

  // 7. Scroll refs
  const mealSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingAutoScrollMomento, setPendingAutoScrollMomento] = useState<string | null>(null);
  const hasInitializedRouteRef = useRef(false);
  const lastStorageErrorRef = useRef<Record<string, number>>({});
  const lastGeminiStatusCheckTime = useRef<number>(0);
  const lastGeminiStatusRef = useRef<GeminiStatusResponse | null>(null);

  // ─── Utilities ─────────────────────────────────────────────────────
  const notify = useCallback(async (title: string, message: string) => { await showAppAlert({ title, message }); }, []);
  const confirmAction = useCallback(async (title: string, message: string) => showAppConfirm({ title, message }), []);

  // ─── Computed: Profiles & Equivalences ─────────────────────────────
  const perfilesData: Record<string, Profile> = useMemo(() => {
    const elPlan =
      dataVersions.el === 'custom'
        ? enrichPlanWithNutrition(
            normalizePlanData(customData.el?.planEL, origPerfilesData.el.plan)
          )
        : origPerfilesData.el.plan;

    const ellaPlan =
      dataVersions.ella === 'custom'
        ? enrichPlanWithNutrition(
            normalizePlanData(customData.ella?.planELLA, origPerfilesData.ella.plan)
          )
        : origPerfilesData.ella.plan;

    return {
      el:
        dataVersions.el === 'custom'
          ? normalizeProfileData(customData.el?.perfilEL, origPerfilesData.el, elPlan)
          : origPerfilesData.el,
      ella:
        dataVersions.ella === 'custom'
          ? normalizeProfileData(customData.ella?.perfilELLA, origPerfilesData.ella, ellaPlan)
          : origPerfilesData.ella,
    };
  }, [dataVersions, customData]);

  const equivalenciasData: Record<string, Equivalencia[]> = useMemo(
    () => ({
      el:
        dataVersions.el === 'custom'
          ? normalizeEquivalencesData(customData.el?.equivalenciasEL, origEquivData.el)
          : origEquivData.el,
      ella:
        dataVersions.ella === 'custom'
          ? normalizeEquivalencesData(customData.ella?.equivalenciasELLA, origEquivData.ella)
          : origEquivData.ella,
    }),
    [dataVersions, customData]
  );

  const supplementsData: Record<string, SupplementRecommendation[]> = useMemo(
    () => ({
      el:
        dataVersions.el === 'custom'
          ? normalizeSupplementsData(customData.el?.suplementosEL, origSupplementsData.el)
          : origSupplementsData.el,
      ella:
        dataVersions.ella === 'custom'
          ? normalizeSupplementsData(customData.ella?.suplementosELLA, origSupplementsData.ella)
          : origSupplementsData.ella,
    }),
    [dataVersions, customData]
  );

  const sanitizeQuestionnairePayloadForMemory = useCallback((payload: QuestionnairePayload | null | undefined) => {
    if (!payload || typeof payload !== 'object') return null;

    const clone = JSON.parse(JSON.stringify(payload));
    const stripPdfPayload = (scope: any) => {
      if (!isPlainObject(scope?.assessmentReportPdf)) return;
      scope.assessmentReportPdf = {
        name: scope.assessmentReportPdf.name,
        mimeType: scope.assessmentReportPdf.mimeType,
      };
    };

    stripPdfPayload(clone);
    stripPdfPayload(clone.el);
    stripPdfPayload(clone.ella);

    return clone;
  }, []);

  const buildCurrentProfileSnapshot = useCallback((perfilId: 'el' | 'ella') => (
    buildSerializableProfileSnapshot(
      perfilesData[perfilId],
      equivalenciasData[perfilId],
      supplementsData[perfilId]
    )
  ), [equivalenciasData, perfilesData, supplementsData]);

  const buildCurrentRawBucket = useCallback((perfilId: 'el' | 'ella') => (
    buildRawBucketFromSnapshot(perfilId, buildCurrentProfileSnapshot(perfilId))
  ), [buildCurrentProfileSnapshot]);

  const syncSelectionsForUpdatedSlots = useCallback((
    perfilId: 'el' | 'ella',
    previousPlan: Record<string, Record<string, MealItem[]>>,
    nextPlan: Record<string, Record<string, MealItem[]>>,
    affectedSlots: { dia: string; momento: string }[]
  ) => {
    if (affectedSlots.length === 0) return;

    setSelecciones((prev) => {
      const next = { ...prev };

      affectedSlots.forEach(({ dia, momento }) => {
        const keyPrefix = `${perfilId}-${dia}-${momento}-`;
        const previousMeals = previousPlan[dia]?.[momento] || [];
        const nextMeals = nextPlan[dia]?.[momento] || [];
        const previousSelectedNames = previousMeals
          .filter((meal) => prev[`${keyPrefix}${meal.nombre}`])
          .map((meal) => meal.nombre);

        Object.keys(next).forEach((key) => {
          if (key.startsWith(keyPrefix)) {
            delete next[key];
          }
        });

        if (previousSelectedNames.length === 0) {
          return;
        }

        const preservedName =
          nextMeals.find((meal) => previousSelectedNames.includes(meal.nombre))?.nombre ||
          nextMeals[0]?.nombre;

        if (preservedName) {
          next[`${keyPrefix}${preservedName}`] = true;
        }
      });

      return next;
    });
  }, [setSelecciones]);

  const getAllPlanSlots = useCallback((plan: Record<string, Record<string, MealItem[]>>) => (
    Object.entries(plan).flatMap(([dia, dayPlan]) => (
      Object.keys(dayPlan || {}).map((momento) => ({ dia, momento }))
    ))
  ), []);

  // ─── Computed: Derived state ───────────────────────────────────────
  const isAmbos = perfilActivo === 'ambos';
  const isEl = perfilActivo === 'el';
  const perfilObj = perfilActivo === 'ambos' || !perfilActivo ? null : perfilesData[perfilActivo];
  const perfilBase = perfilActivo === 'ambos' ? perfilesData.el : perfilObj || perfilesData.el;
  const ac = getAccentColors(perfilActivo, isDarkMode);

  // ─── Actions ───────────────────────────────────────────────────────
  const getNextMomentoKey = useCallback((momentoKey: string) => {
    const momentKeys = perfilBase.momentos.map((m) => m.key);
    const currentIdx = momentKeys.indexOf(momentoKey);
    if (currentIdx === -1 || currentIdx >= momentKeys.length - 1) return null;
    return momentKeys[currentIdx + 1];
  }, [perfilBase.momentos]);

  const toggleSeleccion = useCallback((perfilId: string, dia: string, momento: string, nombre: string) => {
    const key = `${perfilId}-${dia}-${momento}-${nombre}`;
    const profileData = perfilId === 'ella' ? perfilesData.ella : perfilesData.el;
    const comidasMomento = profileData.plan[dia]?.[momento] || [];
    const nextMomento = getNextMomentoKey(momento);
    const wasCompletedForProfile = comidasMomento.some((item) => selecciones[`${perfilId}-${dia}-${momento}-${item.nombre}`]);
    const willSelectCurrentMeal = !selecciones[key];
    const isNowCompletedForProfile = willSelectCurrentMeal;
    const shouldAutoScroll = (() => {
      if (!nextMomento) return false;
      if (perfilActivo !== 'ambos') {
        return !wasCompletedForProfile && isNowCompletedForProfile;
      }

      const otherProfileId = perfilId === 'el' ? 'ella' : 'el';
      const otherProfileData = otherProfileId === 'ella' ? perfilesData.ella : perfilesData.el;
      const otherProfileCompleted = (otherProfileData.plan[dia]?.[momento] || []).some(
        (item) => selecciones[`${otherProfileId}-${dia}-${momento}-${item.nombre}`]
      );

      return !wasCompletedForProfile && isNowCompletedForProfile && otherProfileCompleted;
    })();

    setSelecciones((prev) => {
      const next = { ...prev };
      if (willSelectCurrentMeal) {
        comidasMomento.forEach((item) => {
          const otherKey = `${perfilId}-${dia}-${momento}-${item.nombre}`;
          if (otherKey !== key && next[otherKey]) delete next[otherKey];
        });
      }
      next[key] = !prev[key];
      return next;
    });

    if (shouldAutoScroll) {
      setPendingAutoScrollMomento(nextMomento);
    }
  }, [getNextMomentoKey, perfilActivo, perfilesData.ella, perfilesData.el, selecciones]);

  const editMealRecipe = useCallback((
    perfilId: 'el' | 'ella',
    meal: MealItem,
    draft: MealEditorDraft,
    targetOccurrenceIds?: string[]
  ) => {
    const profileData = perfilesData[perfilId];
    const { nextPlan, updatedMeal, occurrences, selectionRenames } = applyMealDraftToPlan(
      profileData,
      meal,
      draft,
      targetOccurrenceIds
    );
    const profileBucketKey = perfilId;
    const planKey = perfilId === 'ella' ? 'planELLA' : 'planEL';
    const profileKey = perfilId === 'ella' ? 'perfilELLA' : 'perfilEL';
    const equivalenciasKey = perfilId === 'ella' ? 'equivalenciasELLA' : 'equivalenciasEL';
    const supplementsKey = perfilId === 'ella' ? 'suplementosELLA' : 'suplementosEL';
    const defaultBucket = getDefaultCustomBucket(perfilId);

    setCustomData((prev: any) => {
      const previousBucket =
        isPlainObject(prev?.[profileBucketKey]) ? { ...prev[profileBucketKey] } : {};

      return {
        ...prev,
        [profileBucketKey]: {
          [profileKey]: previousBucket[profileKey] || defaultBucket[profileKey],
          [equivalenciasKey]:
            previousBucket[equivalenciasKey] || defaultBucket[equivalenciasKey],
          [supplementsKey]:
            previousBucket[supplementsKey] || defaultBucket[supplementsKey],
          ...previousBucket,
          [planKey]: nextPlan,
        },
      };
    });

    setDataVersions((prev) => ({
      ...prev,
      [perfilId]: 'custom',
    }));

    if (selectionRenames.length > 0) {
      setSelecciones((prev) => {
        const next = { ...prev };

        selectionRenames.forEach(({ dia, momento, previousName, nextName }) => {
          const previousKey = `${perfilId}-${dia}-${momento}-${previousName}`;
          const nextKey = `${perfilId}-${dia}-${momento}-${nextName}`;

          if (next[previousKey]) {
            delete next[previousKey];
            next[nextKey] = true;
          }
        });

        return next;
      });
    }

    return {
      updatedMeal,
      affectedCount: occurrences.length,
      affectedLabels: occurrences.map(
        (occurrence) => `${occurrence.dia} - ${occurrence.momentoLabel} - ${perfilId === 'el' ? 'El' : 'Ella'}`
      ),
    };
  }, [getDefaultCustomBucket, perfilesData, setCustomData, setDataVersions, setSelecciones]);

  const restoreMealRecipe = useCallback((
    perfilId: 'el' | 'ella',
    meal: MealItem,
    targetOccurrenceIds?: string[]
  ) => {
    const profileData = perfilesData[perfilId];
    const { nextPlan, restoredMeal, occurrences, selectionRenames } = restoreMealInPlan(
      profileData,
      meal,
      targetOccurrenceIds
    );
    const profileBucketKey = perfilId;
    const planKey = perfilId === 'ella' ? 'planELLA' : 'planEL';
    const profileKey = perfilId === 'ella' ? 'perfilELLA' : 'perfilEL';
    const equivalenciasKey = perfilId === 'ella' ? 'equivalenciasELLA' : 'equivalenciasEL';
    const supplementsKey = perfilId === 'ella' ? 'suplementosELLA' : 'suplementosEL';
    const defaultBucket = getDefaultCustomBucket(perfilId);

    setCustomData((prev: any) => {
      const previousBucket =
        isPlainObject(prev?.[profileBucketKey]) ? { ...prev[profileBucketKey] } : {};

      return {
        ...prev,
        [profileBucketKey]: {
          [profileKey]: previousBucket[profileKey] || defaultBucket[profileKey],
          [equivalenciasKey]:
            previousBucket[equivalenciasKey] || defaultBucket[equivalenciasKey],
          [supplementsKey]:
            previousBucket[supplementsKey] || defaultBucket[supplementsKey],
          ...previousBucket,
          [planKey]: nextPlan,
        },
      };
    });

    setDataVersions((prev) => ({
      ...prev,
      [perfilId]: 'custom',
    }));

    if (selectionRenames.length > 0) {
      setSelecciones((prev) => {
        const next = { ...prev };

        selectionRenames.forEach(({ dia, momento, previousName, nextName }) => {
          const previousKey = `${perfilId}-${dia}-${momento}-${previousName}`;
          const nextKey = `${perfilId}-${dia}-${momento}-${nextName}`;

          if (next[previousKey]) {
            delete next[previousKey];
            next[nextKey] = true;
          }
        });

        return next;
      });
    }

    return {
      restoredMeal,
      affectedCount: occurrences.length,
      affectedLabels: occurrences.map(
        (occurrence) => `${occurrence.dia} - ${occurrence.momentoLabel}`
      ),
    };
  }, [getDefaultCustomBucket, perfilesData, setCustomData, setDataVersions, setSelecciones]);

  // ─── Scroll logic ──────────────────────────────────────────────────
  const scrollToMomento = useCallback((momentoKey: string, isExpanded: boolean) => {
    const doScroll = () => {
      try {
        const el = mealSectionRefs.current[momentoKey];
        if (!el) return;
        const offset = 56 + 48 + 44 + 12;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      } catch (error) {
        console.warn('Failed to scroll to meal time section:', error);
      }
    };

    if (isExpanded) {
      setProgressExpanded(false);
      setTimeout(doScroll, 260);
    } else {
      doScroll();
    }
  }, []);

  // ─── Progress Tracking ─────────────────────────────────────────────
  const momentoCompletadoEl = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (perfilesData.el?.momentos) {
      perfilesData.el.momentos.forEach((m) => {
        const comidas = perfilesData.el.plan[diaActivo]?.[m.key] || [];
        result[m.key] = comidas.some((item) => selecciones[`el-${diaActivo}-${m.key}-${item.nombre}`]);
      });
    }
    return result;
  }, [diaActivo, perfilesData, selecciones]);

  const momentoCompletadoElla = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (perfilesData.ella?.momentos) {
      perfilesData.ella.momentos.forEach((m) => {
        const comidas = perfilesData.ella.plan[diaActivo]?.[m.key] || [];
        result[m.key] = comidas.some((item) => selecciones[`ella-${diaActivo}-${m.key}-${item.nombre}`]);
      });
    }
    return result;
  }, [diaActivo, perfilesData, selecciones]);

  const momentoCompletado = useMemo(() => {
    if (!perfilActivo) return {} as Record<string, boolean>;
    if (isAmbos) {
      const result: Record<string, boolean> = {};
      perfilBase.momentos.forEach((m) => {
        result[m.key] = momentoCompletadoEl[m.key] && momentoCompletadoElla[m.key];
      });
      return result;
    }
    return isEl ? momentoCompletadoEl : momentoCompletadoElla;
  }, [isAmbos, isEl, perfilActivo, momentoCompletadoEl, momentoCompletadoElla, perfilBase]);

  const progresoDia = useMemo(() => {
    if (!perfilActivo) return 0;
    if (isAmbos) {
      const cEl = Object.values(momentoCompletadoEl).filter(Boolean).length;
      const cElla = Object.values(momentoCompletadoElla).filter(Boolean).length;
      const total = perfilesData.el.momentos.length * 2;
      return Math.round(((cEl + cElla) / total) * 100);
    }
    const total = perfilBase.momentos.length;
    const completados = Object.values(momentoCompletado).filter(Boolean).length;
    return Math.round((completados / total) * 100);
  }, [perfilActivo, isAmbos, perfilBase, momentoCompletado, momentoCompletadoEl, momentoCompletadoElla]);

  const completadosCount = isAmbos
    ? Object.values(momentoCompletadoEl).filter(Boolean).length + Object.values(momentoCompletadoElla).filter(Boolean).length
    : Object.values(momentoCompletado).filter(Boolean).length;

  const totalMomentosProgress = isAmbos ? perfilBase.momentos.length * 2 : perfilBase.momentos.length;

  // ─── AI Generation Handler ─────────────────────────────────────────
  const buildAttemptHistoryFromModelUsed = useCallback((
    modelUsed: unknown,
    stage: AiDebugLog['stage'],
    rawMessage: string,
    statusCode = 200
  ): AiDebugAttempt[] | undefined => {
    if (typeof modelUsed !== 'string' || !modelUsed.trim()) {
      return undefined;
    }

    const orderedModels = modelUsed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry, index, source) => source.indexOf(entry) === index);

    if (!orderedModels.length) {
      return undefined;
    }

    return orderedModels.map((model, index) => ({
      order: index + 1,
      model,
      stage,
      statusCode,
      rawMessage,
      willRetry: false,
    }));
  }, []);

  const formatModelUsedLabel = useCallback((modelUsed: unknown) => {
    if (typeof modelUsed !== 'string' || !modelUsed.trim()) {
      return getGeminiModelLabel(geminiModel);
    }

    return modelUsed
      .split(',')
      .map((entry) => getGeminiModelLabel(entry.trim()))
      .filter(Boolean)
      .filter((entry, index, source) => source.indexOf(entry) === index)
      .join(', ');
  }, [geminiModel]);

  const requestAiResponse = useCallback(async (payload: any) => {
    const { mealsDatabase } = await import('../data/mealsDB');
    const { buildQuestionnaireSupplementsCatalog } = await import('../data/supplementsDB');
    const { buildOptimizedMealsCatalog } = await import('../utils/mealCatalogBuilder');
    const questionnaireContext = payload.questionnaireContext || payload;

    // Extract recent meal IDs from current plan for rotation variety
    const targetProfile = payload.targetProfile || 'el';
    const profileId = targetProfile === 'ambos' ? 'el' : targetProfile;
    const currentPlan = perfilesData[profileId]?.plan || {};
    const recentMealIds: string[] = [];
    Object.values(currentPlan).forEach((dayPlan: any) => {
      Object.values(dayPlan || {}).forEach((options: any) => {
        if (Array.isArray(options)) {
          options.forEach((meal: any) => {
            if (meal?.id) recentMealIds.push(meal.id);
          });
        }
      });
    });

    const USE_ROTATION = true;

    const catalogResult = await buildOptimizedMealsCatalog(
      mealsDatabase,
      questionnaireContext,
      {
        useRotation: USE_ROTATION,
        recentMealIds: [...new Set(recentMealIds)],
        varietyWindow: 14,
        targetProfile,
        allowFallback: true,
      }
    );

    const payloadWithKey = {
      ...payload,
      preferredModel: geminiModel,
      mealsCatalog: catalogResult.catalog,
      supplementsCatalog: buildQuestionnaireSupplementsCatalog(questionnaireContext),
    };
    let json: any;
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithKey),
      });
      const responseText = await res.text();
      const trimmedResponse = responseText?.trim() || '';
      const isHtmlResponse =
        trimmedResponse.startsWith('<!DOCTYPE') || trimmedResponse.startsWith('<html');

      if (!res.ok && (!trimmedResponse || isHtmlResponse)) {
        throw createClientAiError(
          createClientAiDebugLog({
            flow: payload?.requestMode ? 'plan-revision' : 'questionnaire-submit',
            transport: 'serverless',
            stage: 'generate-content',
            targetProfile: payload?.targetProfile,
            requestMode: payload?.requestMode || 'generate',
            requestedModel: geminiModel,
            apiKeySource: 'server-env',
            requestPayload: payloadWithKey,
            rawMessage:
              res.status === 504
                ? 'El servidor excedio el tiempo maximo de ejecucion antes de terminar la respuesta.'
                : `El servidor devolvio una respuesta no JSON (HTTP ${res.status}).`,
          }),
          res.status || 503
        );
      }
      if (!trimmedResponse) throw new Error('SERVER_UNAVAILABLE');
      if (isHtmlResponse) throw new Error('SERVER_UNAVAILABLE');
      try {
        json = JSON.parse(trimmedResponse);
      } catch {
        throw new Error('SERVER_UNAVAILABLE');
      }
      if (!res.ok) {
        const serverError = new Error(json?.error || `Error ${res.status}`) as Error & {
          aiDebugLog?: AiDebugLog | null;
        };
        serverError.aiDebugLog = json?.aiDebugLog || null;
        throw serverError;
      }
    } catch (serverErr: any) {
      const isServerUnavailable = serverErr.message === 'SERVER_UNAVAILABLE' ||
        serverErr.message?.includes('fetch') ||
        serverErr.message?.includes('Failed to fetch') ||
        serverErr.message?.includes('NetworkError');

      if (!isServerUnavailable) {
        throw serverErr;
      }

      throw createClientAiError(
        createClientAiDebugLog({
          flow: payload?.requestMode ? 'plan-revision' : 'questionnaire-submit',
          transport: 'serverless',
          stage: 'generate-content',
          targetProfile: payload?.targetProfile,
          requestMode: payload?.requestMode || 'generate',
          requestedModel: geminiModel,
          apiKeySource: 'server-env',
          requestPayload: payloadWithKey,
          rawMessage:
            'No fue posible contactar la API del servidor. La respuesta estuvo vacia, fue HTML o fallo la red antes de obtener JSON.',
        }),
        503
      );
    }

    return { json, payloadWithKey };
  }, [geminiModel, perfilesData]);

  const handleGenerateWithAi = useCallback(async (payload: QuestionnairePayload) => {
    setGenerationError('');
    setGenerationErrorLog(null);
    setGenerationLoading(true);
    try {
      const {
        json,
        payloadWithKey,
      } = await requestAiResponse(payload);

      if (!json.elData && !json.ellaData) {
        throw createClientAiError(
          createClientAiDebugLog({
            flow: 'questionnaire-submit',
            transport: 'serverless',
            stage: 'response-parse',
            targetProfile: payload.targetProfile,
            requestMode: 'generate',
            requestedModel: geminiModel,
            selectedModel: json?.modelUsed || geminiModel,
            apiKeySource: 'server-env',
            requestPayload: payloadWithKey,
            geminiResponse: {
              status: 200,
              body: json,
            },
            attempts: buildAttemptHistoryFromModelUsed(
              json?.modelUsed,
              'response-parse',
              'La respuesta 200 no incluyo elData ni ellaData.'
            ),
            rawMessage: 'La respuesta 200 no incluyo elData ni ellaData.',
          }),
          502
        );
      }

      let parsedElData: any;
      let parsedEllaData: any;
      try {
        if (json.elData) {
            parsedElData = validateAndNormalizeDirectAiData(
              json.elData,
              {
                flow: (payload as any)?.requestMode ? 'plan-revision' : 'questionnaire-submit',
                transport: 'serverless',
                stage: 'response-parse',
                targetProfile: payload.targetProfile,
                profilePrefix: 'EL',
                requestMode: (payload as any)?.requestMode || 'generate',
                payload: payloadWithKey,
                requestedModel: geminiModel,
                selectedModel: json.modelUsed || geminiModel,
                apiKeySource: 'server-env',
              },
              payloadWithKey,
              json.elData,
            json.modelUsed || geminiModel
          );
        }
        if (json.ellaData) {
          parsedEllaData = validateAndNormalizeDirectAiData(
            json.ellaData,
            {
              flow: (payload as any)?.requestMode ? 'plan-revision' : 'questionnaire-submit',
              transport: 'serverless',
              stage: 'response-parse',
              targetProfile: payload.targetProfile,
              profilePrefix: 'ELLA',
              requestMode: (payload as any)?.requestMode || 'generate',
              payload: payloadWithKey,
              requestedModel: geminiModel,
              selectedModel: json.modelUsed || geminiModel,
              apiKeySource: 'server-env',
            },
            payloadWithKey,
            json.ellaData,
            json.modelUsed || geminiModel
          );
        }
      } catch (parseErr: any) {
        throw createClientAiError(
          createClientAiDebugLog({
            flow: 'questionnaire-submit',
            transport: 'serverless',
            stage: 'response-parse',
            targetProfile: payload.targetProfile,
            profilePrefix: json?.elData && !json?.ellaData ? 'EL' : json?.ellaData ? 'ELLA' : undefined,
            requestMode: 'generate',
            requestedModel: geminiModel,
            selectedModel: json?.modelUsed || geminiModel,
            apiKeySource: 'server-env',
            requestPayload: payloadWithKey,
            geminiResponse: {
              status: 200,
              body: json,
            },
            attempts: buildAttemptHistoryFromModelUsed(
              json?.modelUsed,
              'response-parse',
              `Error al parsear la estructura generada por la IA: ${parseErr?.message || String(parseErr)}`
            ),
            rawMessage: `Error al parsear la estructura generada por la IA: ${parseErr?.message || String(parseErr)}`,
          }),
          502
        );
      }

      setLastGeneratedData({
        elData: parsedElData || null,
        ellaData: parsedEllaData || null,
        modelUsed: json.modelUsed,
      });
      setLastQuestionnaireContexts((prev) => ({
        ...prev,
        [payload.targetProfile]: sanitizeQuestionnairePayloadForMemory(payload),
      }));
      // Reset the step for the generated profile so re-opening starts fresh
      setQuestionnaireStepsByProfile((prev) => ({
        ...prev,
        [payload.targetProfile]: 0,
      }));

      setCustomData((prev: any) => {
        const updated = { ...prev };
        if (parsedElData) updated.el = parsedElData;
        if (parsedEllaData) updated.ella = parsedEllaData;
        return updated;
      });

      setDataVersions((prev) => ({
        el: json.elData ? 'custom' : prev.el,
        ella: json.ellaData ? 'custom' : prev.ella,
      }));

      setGenerationErrorLog(null);
      setShowQuestionnaire(false);
      const modelUsedLabel = formatModelUsedLabel(json?.modelUsed);
      await notify(
        'Plan generado',
        `Plan generado con IA y cargado automaticamente.\nModelo usado: ${modelUsedLabel}.`
      );
    } catch (err: any) {
      console.error('Error en handleGenerateWithAi:', err);
      setGenerationErrorLog(extractAiDebugLog(err));
      setGenerationError(
        resolveAiErrorMessage(err, 'Error desconocido al generar con IA.')
      );
    } finally {
      setGenerationLoading(false);
    }
  }, [buildAttemptHistoryFromModelUsed, formatModelUsedLabel, geminiModel, notify, requestAiResponse, sanitizeQuestionnairePayloadForMemory, setLastQuestionnaireContexts, setQuestionnaireStepsByProfile]);

  const handleRevisePlanWithAi = useCallback(async (payload: PlanRevisionRequest) => {
    setPlanRevisionError('');
    setPlanRevisionErrorLog(null);
    setPlanRevisionLoading(true);

    try {
      const {
        json,
        payloadWithKey,
      } = await requestAiResponse(payload);

      if (!json?.elData && !json?.ellaData) {
        throw createClientAiError(
          createClientAiDebugLog({
            flow: 'plan-revision',
            transport: 'serverless',
            stage: 'response-parse',
            targetProfile: payload.targetProfile,
            requestMode: payload.requestMode,
            requestedModel: geminiModel,
            selectedModel: json?.modelUsed || geminiModel,
            apiKeySource: 'server-env',
            requestPayload: payloadWithKey,
            geminiResponse: {
              status: 200,
              body: json,
            },
            attempts: buildAttemptHistoryFromModelUsed(
              json?.modelUsed,
              'response-parse',
              'La respuesta 200 no incluyo cambios aplicables para el plan.'
            ),
            rawMessage: 'La respuesta 200 no incluyo cambios aplicables para el plan.',
          }),
          502
        );
      }

      const updatedBuckets: Partial<Record<'el' | 'ella', any>> = {};
      const versionUpdates: Partial<Record<'el' | 'ella', 'custom'>> = {};
      const summaries: string[] = [];

      (['el', 'ella'] as const).forEach((perfilId) => {
        const responseData = json?.[perfilId === 'el' ? 'elData' : 'ellaData'];
        if (!responseData) return;

        if (json.responseMode === 'adjust') {
          const patch = responseData as PlanRevisionProfilePatch;
          const summaryLines = getPatchSummaryLines(patch);
          const hasChanges = hasPlanRevisionPatchChanges(patch);

          if (!hasChanges) {
            const noChangesSummary = patch.noChangesReason || summaryLines[0];
            if (noChangesSummary) {
              summaries.push(`${perfilId === 'el' ? 'El' : 'Ella'}: ${noChangesSummary}`);
            }
            return;
          }

          const currentBucket = buildCurrentRawBucket(perfilId);
          const previousPlan = perfilesData[perfilId].plan;
          const parsedBucket = applyPlanRevisionPatchToBucket(perfilId, currentBucket, patch);
          const nextPlan = perfilId === 'el' ? parsedBucket.planEL : parsedBucket.planELLA;
          const affectedSlots = getAffectedPlanSlotsFromPatch(patch);

          if (affectedSlots.length > 0) {
            syncSelectionsForUpdatedSlots(perfilId, previousPlan, nextPlan, affectedSlots);
          }

          updatedBuckets[perfilId] = parsedBucket;
          versionUpdates[perfilId] = 'custom';
          summaries.push(
            ...(
              summaryLines.length > 0
                ? summaryLines.map((line) => `${perfilId === 'el' ? 'El' : 'Ella'}: ${line}`)
                : [`${perfilId === 'el' ? 'El' : 'Ella'}: Se actualizaron partes del plan.`]
            )
          );
          return;
        }

        if (
          isPlainObject(responseData) &&
          (
            Object.prototype.hasOwnProperty.call(responseData, 'planPatch') ||
            Object.prototype.hasOwnProperty.call(responseData, 'profilePatch') ||
            Object.prototype.hasOwnProperty.call(responseData, 'summary')
          )
        ) {
          const patch = responseData as PlanRevisionProfilePatch;
          const currentBucket = buildCurrentRawBucket(perfilId);
          const previousPlan = perfilesData[perfilId].plan;
          const parsedBucket = applyPlanRevisionPatchToBucket(perfilId, currentBucket, patch);
          const nextPlan = perfilId === 'el' ? parsedBucket.planEL : parsedBucket.planELLA;
          const affectedSlots = getAffectedPlanSlotsFromPatch(patch);

          syncSelectionsForUpdatedSlots(
            perfilId,
            previousPlan,
            nextPlan,
            affectedSlots.length > 0 ? affectedSlots : getAllPlanSlots(nextPlan)
          );

          updatedBuckets[perfilId] = parsedBucket;
          versionUpdates[perfilId] = 'custom';
          summaries.push(
            ...(
              getPatchSummaryLines(patch).length > 0
                ? getPatchSummaryLines(patch).map((line) => `${perfilId === 'el' ? 'El' : 'Ella'}: ${line}`)
                : [`${perfilId === 'el' ? 'El' : 'Ella'}: Plan recreado con la nueva instruccion.`]
            )
          );
          return;
        }

        const parsedBucket = validateAndNormalizeDirectAiData(
          responseData,
          {
            flow: 'plan-revision',
            transport: 'serverless',
            stage: 'response-parse',
            targetProfile: payload.targetProfile,
            profilePrefix: perfilId === 'el' ? 'EL' : 'ELLA',
            requestMode: payload.requestMode,
            payload: payloadWithKey,
            requestedModel: geminiModel,
            selectedModel: json.modelUsed || geminiModel,
            apiKeySource: 'server-env',
          },
          payloadWithKey,
          responseData,
          json.modelUsed || geminiModel
        );
        const previousPlan = perfilesData[perfilId].plan;
        const nextPlan = perfilId === 'el' ? parsedBucket.planEL : parsedBucket.planELLA;
        syncSelectionsForUpdatedSlots(perfilId, previousPlan, nextPlan, getAllPlanSlots(nextPlan));
        updatedBuckets[perfilId] = parsedBucket;
        versionUpdates[perfilId] = 'custom';
        summaries.push(`${perfilId === 'el' ? 'El' : 'Ella'}: Plan recreado con la nueva instruccion.`);
      });

      if (Object.keys(updatedBuckets).length === 0) {
        const summaryMessage = summaries.join('\n');
        await notify(
          'Sin cambios',
          summaryMessage || 'La IA considero que no hacia falta modificar el plan actual.'
        );
        return;
      }

      setCustomData((prev: any) => ({
        ...prev,
        ...updatedBuckets,
      }));

      setDataVersions((prev) => ({
        ...prev,
        ...versionUpdates,
      }));

      setLastGeneratedData((prev: any) => ({
        elData: updatedBuckets.el || prev?.elData || null,
        ellaData: updatedBuckets.ella || prev?.ellaData || null,
        modelUsed: json.modelUsed,
      }));
      setPlanRevisionErrorLog(null);

      const modelUsedLabel = formatModelUsedLabel(json?.modelUsed);
      await notify(
        payload.requestMode === 'regenerate' ? 'Plan recreado' : 'Plan actualizado con IA',
        `${summaries.join('\n')}\nModelo usado: ${modelUsedLabel}.`
      );
    } catch (error: any) {
      console.error('Error en handleRevisePlanWithAi:', error);
      setPlanRevisionErrorLog(extractAiDebugLog(error));
      setPlanRevisionError(
        resolveAiErrorMessage(error, 'No se pudo actualizar el plan con IA.')
      );
      throw error;
    } finally {
      setPlanRevisionLoading(false);
    }
  }, [
    buildAttemptHistoryFromModelUsed,
    buildCurrentRawBucket,
    formatModelUsedLabel,
    getAllPlanSlots,
    notify,
    perfilesData,
    requestAiResponse,
    syncSelectionsForUpdatedSlots,
  ]);

  const refreshGeminiAvailability = useCallback(async (options?: {
    preferredModel?: string;
    checkGeneration?: boolean;
    syncModel?: boolean;
    force?: boolean;
  }) => {
    // Throttle duplicate background checks (5 minute threshold for non-forced calls)
    const now = Date.now();
    const isForced = options?.force === true;
    const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
    if (!isForced && now - lastGeminiStatusCheckTime.current < THROTTLE_MS) {
      return lastGeminiStatusRef.current;
    }

    setGeminiAvailabilityLoading(true);

    try {
      const currentModel = options?.preferredModel ?? geminiModelRef.current;
      const status = await fetchGeminiStatus({
        preferredModel: currentModel,
        checkGeneration: options?.checkGeneration,
      });

      lastGeminiStatusCheckTime.current = Date.now();
      lastGeminiStatusRef.current = status;

      setGeminiAvailableModels(status.availableModels);
      setGeminiFallbackModels(status.fallbackModels);
      setGeminiRecommendedModel(status.selectedModel || '');
      setGeminiAvailabilityMessage(status.ok ? status.message || '' : status.error || '');

      const shouldSyncModel =
        Boolean(options?.syncModel) ||
        !currentModel.trim() ||
        (status.selectedModel ? !status.availableModels.includes(currentModel) : false);

      if (status.ok && status.selectedModel && shouldSyncModel && status.selectedModel !== currentModel) {
        setGeminiModel(status.selectedModel);
      }

      return status;
    } catch (error: any) {
      const message = error?.message || 'No fue posible validar Gemini.';
      setGeminiAvailableModels([]);
      setGeminiFallbackModels([]);
      setGeminiRecommendedModel('');
      setGeminiAvailabilityMessage(message);
      const fallbackStatus = {
        ok: false,
        error: message,
        selectedModel: '',
        availableModels: [],
        orderedModels: [],
        fallbackModels: [],
      } satisfies GeminiStatusResponse;
      lastGeminiStatusRef.current = fallbackStatus;
      return fallbackStatus;
    } finally {
      setGeminiAvailabilityLoading(false);
    }
  }, []);

  // ─── Side Effects ──────────────────────────────────────────────────

  // Keep browser history aligned with the current in-app view state.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const nextPath = buildRoutePath({
        perfilActivo,
        tab,
        showAdmin,
        showQuestionnaire,
        questionnaireTargetProfile,
      });
      const currentPath = `${window.location.pathname}${window.location.search}`;

      if (!hasInitializedRouteRef.current) {
        hasInitializedRouteRef.current = true;
        if (currentPath !== nextPath) {
          window.history.replaceState({}, '', nextPath);
        }
        return;
      }

      if (currentPath !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
    } catch (error) {
      console.warn('Failed to sync route state with browser history:', error);
    }
  }, [perfilActivo, questionnaireTargetProfile, showAdmin, showQuestionnaire, tab]);

  // Restore UI state when the user navigates with back/forward buttons.
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute();

      switch (route.view) {
        case 'admin':
          setShowQuestionnaire(false);
          setShowAdmin(true);
          return;
        case 'questionnaire':
          setShowAdmin(false);
          setShowQuestionnaire(true);
          setQuestionnaireTargetProfile(route.target);
          return;
        case 'app':
          setShowAdmin(false);
          setShowQuestionnaire(false);
          setPerfilActivo(route.profile);
          setTab(route.tab);
          return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reset questionnaire when leaving both admin and questionnaire views
  useEffect(() => {
    if (!showAdmin && !showQuestionnaire) {
      // setQuestionnaireTargetProfile('ambos');
      // setQuestionnaireStepIdx(0);
      // setQuestionnaireEl(defaultQuestionnaireData('70', '165'));
      // setQuestionnaireElla(defaultQuestionnaireData('60', '160'));
      // setQuestionnairePortionMode('auto');
      // setQuestionnaireManualPortions({});
      // setQuestionnaireAdditionalNotes('');
    }
  }, [showAdmin, showQuestionnaire]);

  // Reset questionnaire step deleted to allow users to navigate natively.

  // Clean generation state when opening questionnaire at step 0
  useEffect(() => {
    if (showQuestionnaire && !questionnaireStepIdx) {
      setLastGeneratedData(null);
      setGenerationError('');
      setGenerationErrorLog(null);
    }
  }, [showQuestionnaire, questionnaireStepIdx]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  useEffect(() => {
    setSelecciones((prev) => {
      let changed = false;
      const next = Object.fromEntries(
        Object.entries(prev).filter(([key, value]) => {
          const keep = value && isSelectionKeyValid(key, perfilesData);
          if (!keep) changed = true;
          return keep;
        })
      );

      return changed ? next : prev;
    });
  }, [perfilesData, setSelecciones]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageError = (event: Event) => {
      const detail = (event as CustomEvent<AppStorageErrorDetail>).detail;
      if (!detail?.key) return;

      const dedupeKey = `${detail.operation}:${detail.key}`;
      const now = Date.now();
      const lastShownAt = lastStorageErrorRef.current[dedupeKey] || 0;
      if (now - lastShownAt < 8000) return;

      lastStorageErrorRef.current[dedupeKey] = now;
      void notify(
        'No se pudo guardar localmente',
        'El navegador bloqueó o saturó el almacenamiento local. Exporta tu respaldo JSON antes de recargar para no perder cambios recientes.'
      );
    };

    window.addEventListener(APP_STORAGE_ERROR_EVENT, handleStorageError as EventListener);
    return () => {
      window.removeEventListener(APP_STORAGE_ERROR_EVENT, handleStorageError as EventListener);
    };
  }, [notify]);

  // Persist Gemini settings
  useEffect(() => {
    clearLegacyGeminiApiKeyStorage();
  }, []);
  useEffect(() => {
    try {
      persistGeminiModel(geminiModel);
    } catch (error) {
      console.warn('Failed to persist geminiModel:', error);
    }
  }, [geminiModel]);
  useEffect(() => {
    try {
      writeStorageValue(window.localStorage, 'perfilActivo', perfilActivo || 'ambos');
    } catch (error) {
      console.warn('Failed to persist active profile:', error);
    }
  }, [perfilActivo]);
  useEffect(() => {
    geminiModelRef.current = geminiModel;
  }, [geminiModel]);

  // Check Gemini availability once at app startup (non-blocking)
  useEffect(() => {
    void refreshGeminiAvailability({ checkGeneration: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top on day/tab change
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (error) {
      console.warn('Failed to reset scroll position:', error);
    }
  }, [diaActivo, tab]);

  // Auto-scroll pending
  useEffect(() => {
    if (!pendingAutoScrollMomento) return;
    const timer = setTimeout(() => {
      scrollToMomento(pendingAutoScrollMomento, progressExpanded);
      setPendingAutoScrollMomento(null);
    }, 680);
    return () => clearTimeout(timer);
  }, [pendingAutoScrollMomento, progressExpanded, scrollToMomento]);

  // Collapse progress on tab/day/profile change
  useEffect(() => {
    setProgressExpanded(false);
    setMomentosColapsados({});
  }, [tab, diaActivo, perfilActivo]);

  // ─── Context Value ─────────────────────────────────────────────────
  const value: DietContextType = {
    perfilActivo, setPerfilActivo,
    tab, setTab,
    showAdmin, setShowAdmin,
    showQuestionnaire, setShowQuestionnaire,
    diaActivo, setDiaActivo, diasDisponibles,
    selecciones, setSelecciones, toggleSeleccion, editMealRecipe, restoreMealRecipe,
    comprasCheck, setComprasCheck,
    dataVersions, setDataVersions,
    customData, setCustomData,
    profileLabels, setProfileLabels,
    perfilesData, equivalenciasData, supplementsData,
    geminiModel, setGeminiModel,
    geminiAvailableModels,
    geminiFallbackModels,
    geminiRecommendedModel,
    geminiAvailabilityLoading,
    geminiAvailabilityMessage,
    refreshGeminiAvailability,
    generationLoading, generationError, generationErrorLog, lastGeneratedData,
    planRevisionLoading, planRevisionError, planRevisionErrorLog, lastQuestionnaireContexts,
    handleGenerateWithAi, handleRevisePlanWithAi,
    questionnaireTargetProfile, setQuestionnaireTargetProfile,
    questionnaireStepIdx, setQuestionnaireStepIdx: setQuestionnaireStepIdx as any,
    questionnaireEl, setQuestionnaireEl,
    questionnaireElla, setQuestionnaireElla,
    questionnairePortionMode, setQuestionnairePortionMode,
    questionnaireManualPortions, setQuestionnaireManualPortions,
    questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes,
    isDarkMode, setIsDarkMode,
    momentosColapsados, setMomentosColapsados,
    progressExpanded, setProgressExpanded,
    momentoCompletado, progresoDia, completadosCount, totalMomentosProgress,
    scrollToMomento, mealSectionRefs,
    isAmbos, perfilBase, perfilObj, ac,
    notify, confirmAction,
  };

  return <DietContext.Provider value={value}>{children}</DietContext.Provider>;
};

export const useDiet = (): DietContextType => {
  const context = useContext(DietContext);
  if (context === undefined) {
    throw new Error('useDiet must be used within a DietProvider');
  }
  return context;
};
