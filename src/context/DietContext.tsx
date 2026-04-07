import React, { createContext, useContext, useState, useMemo, useRef, useEffect, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Profile, Equivalencia, MealEditMeta, MealItem, MealOriginalSnapshot, MealTime, SupplementRecommendation } from '../types';
import { getRawDataText, perfilesData as origPerfilesData, equivalenciasData as origEquivData, supplementsData as origSupplementsData, iconsMap } from '../data';
import { AccentColors, getAccentColors } from '../utils/theme';
import { Heart } from 'lucide-react';
import { parseObjectToData } from '../dataManager';
import { callGeminiDirectly } from '../services/aiService';
import { showAppAlert, showAppConfirm } from '../utils/appDialogs';
import type { QuestionnairePayload, TargetProfile } from '../components/NutritionQuestionnaire';
import { enrichPlanWithNutrition } from '../utils/nutrition';
import {
  applyMealDraftToPlan,
  restoreMealInPlan,
  type MealEditorDraft,
} from '../utils/mealEditing';
import { normalizeProfileSummary } from '../utils/profileSummary';
import { getEnvGeminiApiKey, getStoredGeminiApiKey, persistGeminiApiKey } from '../utils/geminiKey';
import { fetchGeminiStatus, type GeminiStatusResponse } from '../services/geminiStatusService';

export type PerfilActivo = 'el' | 'ella' | 'ambos' | null;
export type TabState = 'plan' | 'equivalencias' | 'compras' | 'resumen' | 'calorias' | 'suplementos';

type RouteState =
  | { view: 'home' }
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
};

const PATH_TO_TAB: Record<string, TabState> = {
  plan: 'plan',
  miplan: 'plan',
  equivalencias: 'equivalencias',
  calorias: 'calorias',
  compras: 'compras',
  resumen: 'resumen',
  suplementos: 'suplementos',
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

function isEquivalencesLike(value: unknown): value is any[] {
  return Array.isArray(value);
}

function sanitizeStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function sanitizeNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return [...fallback];
  return value.filter((entry): entry is string => typeof entry === 'string');
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
    normalized[momentKey] = {};

    Object.entries(fallbackGroups).forEach(([groupKey, fallbackAmount]) => {
      normalized[momentKey][groupKey] = sanitizeNumberValue(
        sourceGroups[groupKey],
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

      const grupo = sanitizeStringValue(entry.grupo, fallbackEntry?.grupo ?? '');
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
    return { view: 'home' };
  }

  try {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (!path || path === 'home') {
      return { view: 'home' };
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

  return { view: 'home' };
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

  if (!perfilActivo) {
    return '/home';
  }

  return `/${TAB_PATHS[tab]}?profile=${encodeURIComponent(perfilActivo)}`;
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
    draft: MealEditorDraft
  ) => {
    updatedMeal: MealItem;
    affectedCount: number;
    affectedLabels: string[];
  };
  restoreMealRecipe: (
    perfilId: 'el' | 'ella',
    meal: MealItem
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

  // Gemini AI settings
  geminiApiKey: string;
  setGeminiApiKey: React.Dispatch<React.SetStateAction<string>>;
  geminiModel: string;
  setGeminiModel: React.Dispatch<React.SetStateAction<string>>;
  geminiAvailableModels: string[];
  geminiRecommendedModel: string;
  geminiAvailabilityLoading: boolean;
  geminiAvailabilityMessage: string;
  refreshGeminiAvailability: (options?: {
    customApiKey?: string;
    preferredModel?: string;
    checkGeneration?: boolean;
    syncModel?: boolean;
  }) => Promise<GeminiStatusResponse | null>;
  generationLoading: boolean;
  generationError: string;
  lastGeneratedData: any;
  handleGenerateWithAi: (payload: QuestionnairePayload) => Promise<void>;

  // Questionnaire state
  questionnaireTargetProfile: TargetProfile;
  setQuestionnaireTargetProfile: React.Dispatch<React.SetStateAction<TargetProfile>>;
  questionnaireStepIdx: number;
  setQuestionnaireStepIdx: React.Dispatch<React.SetStateAction<number>>;
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
  momentosEnEdicion: Record<string, boolean>;
  setMomentosEnEdicion: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

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
const defaultQuestionnaireData = (weight: string, height: string) => ({
  age: '', currentWeightKg: weight, heightCm: height, targetWeightKg: '',
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
    initialRoute.view === 'app' ? initialRoute.profile : null
  );
  const [tab, setTab] = useState<TabState>(
    initialRoute.view === 'app' ? initialRoute.tab : 'plan'
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

  // 4. UI States
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [momentosEnEdicion, setMomentosEnEdicion] = useState<Record<string, boolean>>({});

  // 5. Gemini AI settings
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try {
      return getStoredGeminiApiKey();
    } catch { return ''; }
  });
  const [geminiModel, setGeminiModel] = useState(() => {
    try {
      const saved = localStorage.getItem('geminiModel');
      const validModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'];
      if (!saved || !validModels.includes(saved)) return '';
      return saved;
    } catch { return ''; }
  });
  const [geminiAvailableModels, setGeminiAvailableModels] = useState<string[]>([]);
  const [geminiRecommendedModel, setGeminiRecommendedModel] = useState('');
  const [geminiAvailabilityLoading, setGeminiAvailabilityLoading] = useState(false);
  const [geminiAvailabilityMessage, setGeminiAvailabilityMessage] = useState('');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [lastGeneratedData, setLastGeneratedData] = useState<any>(null);
  const geminiModelRef = useRef(geminiModel);

  const getDefaultCustomBucket = useCallback(
    (perfilId: 'el' | 'ella') => JSON.parse(getRawDataText(perfilId)),
    []
  );

  // 6. Questionnaire state
  const [questionnaireTargetProfile, setQuestionnaireTargetProfile] = useState<TargetProfile>(
    initialRoute.view === 'questionnaire' ? initialRoute.target : 'ambos'
  );
  const [questionnaireStepIdx, setQuestionnaireStepIdx] = useState(0);
  const [questionnaireEl, setQuestionnaireEl] = useState<any>(defaultQuestionnaireData('70', '165'));
  const [questionnaireElla, setQuestionnaireElla] = useState<any>(defaultQuestionnaireData('60', '160'));
  const [questionnairePortionMode, setQuestionnairePortionMode] = useState<'auto' | 'manual'>('auto');
  const [questionnaireManualPortions, setQuestionnaireManualPortions] = useState<Record<string, Record<string, number>>>({});
  const [questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes] = useState('');

  // 7. Scroll refs
  const mealSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingAutoScrollMomento, setPendingAutoScrollMomento] = useState<string | null>(null);
  const hasInitializedRouteRef = useRef(false);

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
    const wasCompleted = comidasMomento.some((item) => selecciones[`${perfilId}-${dia}-${momento}-${item.nombre}`]);
    const willSelectCurrentMeal = !selecciones[key];
    const isNowCompleted = wasCompleted || willSelectCurrentMeal;

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

    if (!wasCompleted && isNowCompleted && nextMomento) {
      setPendingAutoScrollMomento(nextMomento);
    }
  }, [getNextMomentoKey, perfilesData.ella, perfilesData.el, selecciones]);

  const editMealRecipe = useCallback((
    perfilId: 'el' | 'ella',
    meal: MealItem,
    draft: MealEditorDraft
  ) => {
    const profileData = perfilesData[perfilId];
    const { nextPlan, updatedMeal, occurrences, selectionRenames } = applyMealDraftToPlan(
      profileData,
      meal,
      draft
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
        (occurrence) => `${occurrence.dia} - ${occurrence.momentoLabel}`
      ),
    };
  }, [getDefaultCustomBucket, perfilesData, setCustomData, setDataVersions, setSelecciones]);

  const restoreMealRecipe = useCallback((
    perfilId: 'el' | 'ella',
    meal: MealItem
  ) => {
    const profileData = perfilesData[perfilId];
    const { nextPlan, restoredMeal, occurrences, selectionRenames } = restoreMealInPlan(
      profileData,
      meal
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
  const handleGenerateWithAi = useCallback(async (payload: QuestionnairePayload) => {
    setGenerationError('');
    setGenerationLoading(true);
    try {
      const customApiKey = geminiApiKey.trim();
      const payloadWithKey = {
        ...payload,
        customApiKey: customApiKey || undefined,
        preferredModel: geminiModel,
      };
      let json: any;
      let usedDirectApi = false;
      const shouldBypassServerRoute = Boolean((import.meta as any).env?.DEV);

      try {
        if (shouldBypassServerRoute) {
          throw new Error('SERVER_UNAVAILABLE');
        }

        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithKey),
        });
        const responseText = await res.text();
        if (!responseText || responseText.trim() === '') throw new Error('SERVER_UNAVAILABLE');
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) throw new Error('SERVER_UNAVAILABLE');
        try { json = JSON.parse(responseText); } catch { throw new Error('SERVER_UNAVAILABLE'); }
        if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      } catch (serverErr: any) {
        const isServerUnavailable = serverErr.message === 'SERVER_UNAVAILABLE' ||
          serverErr.message?.includes('fetch') ||
          serverErr.message?.includes('Failed to fetch') ||
          serverErr.message?.includes('NetworkError');

        if (isServerUnavailable) {
          const envApiKey = getEnvGeminiApiKey();
          if (!envApiKey && !customApiKey) {
            throw new Error('En desarrollo local, configura tu GEMINI_API_KEY en el archivo .env o en el panel de Administración (Ajustes IA) para generar planes con IA.');
          }
          usedDirectApi = true;
          const keyToUse = customApiKey || envApiKey;
          json = await callGeminiDirectly(payloadWithKey, keyToUse, geminiModel);
        } else {
          throw serverErr;
        }
      }

      if (!json.elData && !json.ellaData) {
        throw new Error('La respuesta no contiene datos del plan. Intenta de nuevo.');
      }

      setLastGeneratedData(json);

      setCustomData((prev: any) => {
        const updated = { ...prev };
        try {
          if (json.elData) updated.el = parseObjectToData(json.elData, 'EL');
          if (json.ellaData) updated.ella = parseObjectToData(json.ellaData, 'ELLA');
        } catch (parseErr: any) {
          throw new Error(`Error en los datos generados: ${parseErr.message}. La IA no generó la estructura esperada.`);
        }
        return updated;
      });

      setDataVersions((prev) => ({
        el: json.elData ? 'custom' : prev.el,
        ella: json.ellaData ? 'custom' : prev.ella,
      }));

      setShowQuestionnaire(false);
      await notify('Plan generado', usedDirectApi ? '¡Plan generado con IA (modo directo)!' : '¡Plan generado con IA y cargado automáticamente!');
    } catch (err: any) {
      console.error('Error en handleGenerateWithAi:', err);
      setGenerationError(err?.message || 'Error desconocido al generar con IA.');
    } finally {
      setGenerationLoading(false);
    }
  }, [geminiApiKey, geminiModel, notify]);

  const refreshGeminiAvailability = useCallback(async (options?: {
    customApiKey?: string;
    preferredModel?: string;
    checkGeneration?: boolean;
    syncModel?: boolean;
  }) => {
    setGeminiAvailabilityLoading(true);

    try {
      const currentModel = options?.preferredModel ?? geminiModelRef.current;
      const status = await fetchGeminiStatus({
        customApiKey: options?.customApiKey ?? geminiApiKey,
        preferredModel: currentModel,
        checkGeneration: options?.checkGeneration,
      });

      setGeminiAvailableModels(status.availableModels);
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
      setGeminiRecommendedModel('');
      setGeminiAvailabilityMessage(message);
      return {
        ok: false,
        error: message,
        selectedModel: '',
        availableModels: [],
      } satisfies GeminiStatusResponse;
    } finally {
      setGeminiAvailabilityLoading(false);
    }
  }, [geminiApiKey]);

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
        case 'home':
          setShowAdmin(false);
          setShowQuestionnaire(false);
          setPerfilActivo(null);
          setTab('plan');
          return;
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
      setQuestionnaireTargetProfile('ambos');
      setQuestionnaireStepIdx(0);
      setQuestionnaireEl(defaultQuestionnaireData('70', '165'));
      setQuestionnaireElla(defaultQuestionnaireData('60', '160'));
      setQuestionnairePortionMode('auto');
      setQuestionnaireManualPortions({});
      setQuestionnaireAdditionalNotes('');
    }
  }, [showAdmin, showQuestionnaire]);

  // Clean generation state when opening questionnaire at step 0
  useEffect(() => {
    if (showQuestionnaire && !questionnaireStepIdx) {
      setLastGeneratedData(null);
      setGenerationError('');
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

  // Persist Gemini settings
  useEffect(() => { persistGeminiApiKey(geminiApiKey); }, [geminiApiKey]);
  useEffect(() => {
    try {
      if (!geminiModel) {
        localStorage.removeItem('geminiModel');
        return;
      }
      localStorage.setItem('geminiModel', geminiModel);
    } catch (error) {
      console.warn('Failed to persist geminiModel:', error);
    }
  }, [geminiModel]);
  useEffect(() => {
    try {
      if (perfilActivo) {
        localStorage.setItem('perfilActivo', perfilActivo);
        return;
      }
      localStorage.removeItem('perfilActivo');
    } catch (error) {
      console.warn('Failed to persist active profile:', error);
    }
  }, [perfilActivo]);
  useEffect(() => {
    geminiModelRef.current = geminiModel;
  }, [geminiModel]);

  useEffect(() => {
    refreshGeminiAvailability();
  }, [geminiApiKey, refreshGeminiAvailability]);

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
    setMomentosEnEdicion({});
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
    perfilesData, equivalenciasData, supplementsData,
    geminiApiKey, setGeminiApiKey,
    geminiModel, setGeminiModel,
    geminiAvailableModels,
    geminiRecommendedModel,
    geminiAvailabilityLoading,
    geminiAvailabilityMessage,
    refreshGeminiAvailability,
    generationLoading, generationError, lastGeneratedData,
    handleGenerateWithAi,
    questionnaireTargetProfile, setQuestionnaireTargetProfile,
    questionnaireStepIdx, setQuestionnaireStepIdx,
    questionnaireEl, setQuestionnaireEl,
    questionnaireElla, setQuestionnaireElla,
    questionnairePortionMode, setQuestionnairePortionMode,
    questionnaireManualPortions, setQuestionnaireManualPortions,
    questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes,
    isDarkMode, setIsDarkMode,
    momentosColapsados, setMomentosColapsados,
    progressExpanded, setProgressExpanded,
    momentosEnEdicion, setMomentosEnEdicion,
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
