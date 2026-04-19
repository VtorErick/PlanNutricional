import React, { createContext, useContext, useMemo, useState } from 'react';

import { perfilesData, equivalenciasData, supplementsData } from '../data';
import { mealsDatabase } from '../data/mealsDB';
import type { Equivalencia, MealItem, Profile, SupplementRecommendation } from '../types';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { fetchGeminiStatus, type GeminiStatusResponse } from '../services/geminiStatusService';
import { generatePlanPDF } from '../services/pdfService';
import { requestAiPlan, requestAiPlanRevision } from '../services/questionnaireService';
import {
  type PlanRevisionMode,
  type PlanRevisionProfilePatch,
  validateAndNormalizeDirectAiData,
} from '../services/aiService';
import { generateShoppingListFromSelections, type ShoppingItem } from '../utils/shoppingList';
import type { QuestionnairePayload } from '../types/questionnaire';
import {
  applyPlanRevisionPatchToBucket,
  buildRawBucketFromSnapshot,
  buildSerializableProfileSnapshot,
  getAffectedPlanSlotsFromPatch,
  getPatchSummaryLines,
  hasPlanRevisionPatchChanges,
} from '../utils/planAiUtils';
import { showAppAlert } from '../utils/appDialogs';
import {
  calculateClinicalTDEE,
  distributeSmaeToMeals,
  ensureMealNutrition,
  generateSmaePortionsFromKcal,
} from '../utils/nutrition';
import { extractProfileMetrics } from '../utils/profileSummary';

export type PerfilActivo = 'el' | 'ella' | 'ambos';
export type ProfileObjective = 'perder_grasa' | 'mantener' | 'ganar_musculo';
export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'intenso';

export type ProfileMetricsUpdate = {
  nombre: string;
  edad: number;
  pesoKg: number;
  estaturaCm: number;
  objetivo: ProfileObjective;
  actividad: ActivityLevel;
  notas?: string;
};

type ActiveProfileBundle = {
  id: 'el' | 'ella';
  profile: Profile;
  equivalencias: Equivalencia[];
  supplements: SupplementRecommendation[];
};

type DietContextValue = {
  perfilActivo: PerfilActivo;
  setPerfilActivo: (perfil: PerfilActivo) => void;
  diaActivo: string;
  setDiaActivo: (day: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isHydrated: boolean;
  activeBundles: ActiveProfileBundle[];
  allBundles: ActiveProfileBundle[];
  completedMeals: Record<string, boolean>;
  shoppingChecks: Record<string, boolean>;
  toggleMealComplete: (key: string) => void;
  toggleShoppingCheck: (key: string) => void;
  updateMeal: (
    profileId: 'el' | 'ella',
    day: string,
    moment: string,
    index: number,
    draft: MealItem
  ) => void;
  restoreMeal: (
    profileId: 'el' | 'ella',
    day: string,
    moment: string,
    index: number
  ) => void;
  replaceMealWithCatalog: (
    profileId: 'el' | 'ella',
    day: string,
    moment: string,
    index: number,
    catalogMealId: string,
    options?: {
      syncCompanion?: boolean;
    }
  ) => void;
  updateProfileMetrics: (profileId: 'el' | 'ella', payload: ProfileMetricsUpdate) => void;
  geminiStatus: GeminiStatusResponse | null;
  geminiLoading: boolean;
  generationLoading: boolean;
  generationError: string;
  planRevisionLoading: boolean;
  planRevisionError: string;
  refreshGeminiStatus: () => Promise<void>;
  generateWithAi: (payload: QuestionnairePayload) => Promise<void>;
  revisePlanWithAi: (instruction: string, requestMode?: PlanRevisionMode) => Promise<void>;
  exportProfilePdf: (profileId: 'el' | 'ella') => Promise<void>;
  shoppingItems: ShoppingItem[];
};

const DIET_CONTEXT = createContext<DietContextValue | null>(null);

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;
const DEFAULT_PORTIONS_BY_MOMENT: Record<string, string> = {
  desayuno: 'Proteina 2 | Cereales 1 | Verduras 1 | Grasas 1',
  colacion_am: 'Frutas 1 | Grasas 1',
  colacion_pm: 'Frutas 1 | Grasas 1',
  comida: 'Proteina 3 | Cereales 2 | Verduras 2 | Grasas 1',
  cena: 'Proteina 2 | Verduras 2 | Cereales 1 | Grasas 1',
};
const SMAE_GROUPS = ['frutas', 'verduras', 'cereales', 'leguminosas', 'lacteos', 'proteina', 'grasas'] as const;
const SMAE_LABELS: Record<(typeof SMAE_GROUPS)[number], string> = {
  frutas: 'Frutas',
  verduras: 'Verduras',
  cereales: 'Cereales',
  leguminosas: 'Leguminosas',
  lacteos: 'Lacteos',
  proteina: 'Proteina',
  grasas: 'Grasas',
};

function sanitizeDay(value: unknown) {
  return typeof value === 'string' && DAYS.includes(value as (typeof DAYS)[number]) ? value : 'Lunes';
}

function sanitizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, Boolean(entry)]));
}

function sanitizeBoolean(value: unknown) {
  return value === true;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildMealKey(profileId: 'el' | 'ella', day: string, moment: string, mealName: string) {
  return `${profileId}:${day}:${moment}:${mealName}`;
}

function normalizeMetricInput(value: string | number | null | undefined, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : fallback;
}

function objectiveLabel(objective: ProfileObjective) {
  if (objective === 'ganar_musculo') return 'ganar masa muscular';
  if (objective === 'mantener') return 'mantener composicion corporal';
  return 'bajar grasa sin rebote';
}

function objectiveGoalToken(objective: ProfileObjective) {
  if (objective === 'ganar_musculo') return 'ganar musculo';
  if (objective === 'mantener') return 'mantener';
  return 'perder grasa';
}

function sanitizeActivityLabel(value: ActivityLevel) {
  if (value === 'sedentario') return 'sedentario';
  if (value === 'ligero') return 'ligero';
  if (value === 'activo') return 'activo';
  if (value === 'intenso') return 'intenso';
  return 'moderado';
}

function buildMealFromCatalog(
  moment: string,
  catalogMealId: string,
  fallbackMeal: MealItem
): MealItem | null {
  const catalogMeal = mealsDatabase.find(
    (entry) => entry.id === catalogMealId && entry.momentos.includes(moment)
  );
  if (!catalogMeal) return null;

  const macroEstimate = catalogMeal.macroEstimate;
  const detailBase = catalogMeal.super.slice(0, 6).join(', ');

  return ensureMealNutrition({
    nombre: catalogMeal.nombre,
    porciones: fallbackMeal.porciones || DEFAULT_PORTIONS_BY_MOMENT[moment] || 'Proteina 2 | Verduras 1',
    detalle: detailBase ? `Ingredientes base: ${detailBase}.` : fallbackMeal.detalle,
    tags: [...(catalogMeal.tags || [])],
    super: [...(catalogMeal.super || [])],
    caloriasKcal: macroEstimate?.calories,
    proteinaG: macroEstimate?.protein,
    grasasG: macroEstimate?.fat,
  });
}

function resolveOverrideBundle(
  override: any,
  profileId: 'el' | 'ella'
): ActiveProfileBundle | null {
  if (!override || typeof override !== 'object') return null;
  const prefix = profileId === 'el' ? 'EL' : 'ELLA';
  const rawProfile = override[`perfil${prefix}`] as Profile | undefined;
  const equivalencias = override[`equivalencias${prefix}`] as Equivalencia[] | undefined;
  const suplementos = override[`suplementos${prefix}`] as SupplementRecommendation[] | undefined;
  const plan = override[`plan${prefix}`] as Record<string, Record<string, MealItem[]>> | undefined;

  if (!rawProfile || !equivalencias || !suplementos) return null;

  const profile: Profile = {
    ...rawProfile,
    plan:
      plan && typeof plan === 'object'
        ? plan
        : rawProfile.plan && typeof rawProfile.plan === 'object'
          ? rawProfile.plan
          : {},
  };

  return {
    id: profileId,
    profile,
    equivalencias,
    supplements: suplementos,
  };
}

function buildStoredSnapshot(profileId: 'el' | 'ella', bundle: ActiveProfileBundle) {
  const prefix = profileId === 'el' ? 'EL' : 'ELLA';
  return {
    [`perfil${prefix}`]: bundle.profile,
    [`equivalencias${prefix}`]: bundle.equivalencias,
    [`suplementos${prefix}`]: bundle.supplements,
    [`plan${prefix}`]: bundle.profile.plan,
  };
}

export function DietProvider({ children }: { children: React.ReactNode }) {
  const [perfilActivo, setPerfilActivo] = useAsyncStorage<PerfilActivo>('@app:perfilActivo', 'el');
  const [diaActivo, setDiaActivo] = useAsyncStorage('@app:diaActivo', 'Lunes', sanitizeDay);
  const [isDarkMode, setIsDarkMode, darkHydrated] = useAsyncStorage('@app:darkMode', false, sanitizeBoolean);
  const [completedMeals, setCompletedMeals, completedHydrated] = useAsyncStorage<Record<string, boolean>>(
    '@app:completedMeals',
    {},
    sanitizeBooleanRecord
  );
  const [shoppingChecks, setShoppingChecks, shoppingHydrated] = useAsyncStorage<Record<string, boolean>>(
    '@app:comprasCheck',
    {},
    sanitizeBooleanRecord
  );
  const [customData, setCustomData] = useAsyncStorage<Record<'el' | 'ella', any | null>>(
    '@app:customData',
    { el: null, ella: null }
  );

  const [geminiStatus, setGeminiStatus] = useState<GeminiStatusResponse | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [planRevisionLoading, setPlanRevisionLoading] = useState(false);
  const [planRevisionError, setPlanRevisionError] = useState('');
  const [lastQuestionnairePayload, setLastQuestionnairePayload] = useState<QuestionnairePayload | null>(null);

  const getBundleForProfile = React.useCallback(
    (profileId: 'el' | 'ella'): ActiveProfileBundle =>
      resolveOverrideBundle(customData[profileId], profileId) || {
        id: profileId,
        profile: perfilesData[profileId],
        equivalencias: equivalenciasData[profileId],
        supplements: supplementsData[profileId],
      },
    [customData]
  );

  const buildCurrentProfileSnapshot = React.useCallback(
    (profileId: 'el' | 'ella') => {
      const bundle = getBundleForProfile(profileId);
      return buildSerializableProfileSnapshot(
        bundle.profile,
        bundle.equivalencias,
        bundle.supplements
      );
    },
    [getBundleForProfile]
  );

  const buildOriginalProfileSnapshot = React.useCallback(
    (profileId: 'el' | 'ella') =>
      buildSerializableProfileSnapshot(
        perfilesData[profileId],
        equivalenciasData[profileId],
        supplementsData[profileId]
      ),
    []
  );

  const activeBundles = useMemo<ActiveProfileBundle[]>(() => {
    const ids = perfilActivo === 'ambos' ? (['el', 'ella'] as const) : ([perfilActivo] as const);
    return ids.map((id) => {
      const overrideBundle = resolveOverrideBundle(customData[id], id);
      return (
        overrideBundle || {
          id,
          profile: perfilesData[id],
          equivalencias: equivalenciasData[id],
          supplements: supplementsData[id],
        }
      );
    });
  }, [customData, perfilActivo]);

  const allBundles = useMemo<ActiveProfileBundle[]>(
    () => (['el', 'ella'] as const).map((profileId) => getBundleForProfile(profileId)),
    [getBundleForProfile]
  );

  const shoppingItems = useMemo(() => {
    const selections = activeBundles.flatMap(({ profile }) =>
      Object.values(profile.plan || {}).flatMap((moments) =>
        Object.values(moments || {}).flatMap((meals) =>
          (Array.isArray(meals) ? meals : []).map((meal) => ({
            meal,
            catalogMeal: undefined,
          }))
        )
      )
    );

    return generateShoppingListFromSelections(selections, {
      peopleCount: activeBundles.length,
      daysCount: 7,
    });
  }, [activeBundles]);

  const refreshGeminiStatus = async () => {
    setGeminiLoading(true);
    try {
      const status = await fetchGeminiStatus({ checkGeneration: true });
      setGeminiStatus(status);
    } finally {
      setGeminiLoading(false);
    }
  };

  const toggleMealComplete = (key: string) => {
    setCompletedMeals((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const toggleShoppingCheck = (key: string) => {
    setShoppingChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const getAllPlanSlots = React.useCallback((plan: Record<string, Record<string, MealItem[]>>) => (
    Object.entries(plan).flatMap(([dia, moments]) =>
      Object.keys(moments).map((momento) => ({ dia, momento }))
    )
  ), []);

  const resetCompletedMealsForSlots = React.useCallback(
    (
      profileId: 'el' | 'ella',
      previousPlan: Record<string, Record<string, MealItem[]>>,
      nextPlan: Record<string, Record<string, MealItem[]>>,
      affectedSlots: { dia: string; momento: string }[]
    ) => {
      if (affectedSlots.length === 0) return;

      setCompletedMeals((current) => {
        const next = { ...current };

        affectedSlots.forEach(({ dia, momento }) => {
          const previousMeals = previousPlan[dia]?.[momento] || [];
          const nextMeals = nextPlan[dia]?.[momento] || [];

          [...previousMeals, ...nextMeals].forEach((meal) => {
            delete next[getMealCompletionKey(profileId, dia, momento, meal)];
          });
        });

        return next;
      });
    },
    [setCompletedMeals]
  );

  const updateMeal = (
    profileId: 'el' | 'ella',
    day: string,
    moment: string,
    index: number,
    draft: MealItem
  ) => {
    const active = activeBundles.find((bundle) => bundle.id === profileId);
    if (!active) return;

    setCustomData((current) => {
      const snapshot = buildStoredSnapshot(profileId, active) as any;
      const prefix = profileId === 'el' ? 'EL' : 'ELLA';
      const planKey = `plan${prefix}`;
      const plan = JSON.parse(JSON.stringify((current[profileId] || snapshot)[planKey]));

      if (!plan?.[day]?.[moment]?.[index]) {
        return current;
      }

      plan[day][moment][index] = draft;

      return {
        ...current,
        [profileId]: {
          ...(current[profileId] || snapshot),
          [planKey]: plan,
        },
      };
    });
  };

  const restoreMeal = (
    profileId: 'el' | 'ella',
    day: string,
    moment: string,
    index: number
  ) => {
    const baseMeal = perfilesData[profileId]?.plan?.[day]?.[moment]?.[index];
    if (!baseMeal) return;
    updateMeal(profileId, day, moment, index, JSON.parse(JSON.stringify(baseMeal)) as MealItem);
  };

  const replaceMealWithCatalog = React.useCallback(
    (
      profileId: 'el' | 'ella',
      day: string,
      moment: string,
      index: number,
      catalogMealId: string,
      options?: { syncCompanion?: boolean }
    ) => {
      const shouldSyncCompanion = Boolean(options?.syncCompanion) && perfilActivo === 'ambos';
      const targetProfiles = shouldSyncCompanion ? (['el', 'ella'] as const) : ([profileId] as const);
      const completionResets: {
        profileId: 'el' | 'ella';
        day: string;
        moment: string;
        previousMealName: string;
        nextMealName: string;
      }[] = [];

      setCustomData((current) => {
        const nextState = { ...current };

        targetProfiles.forEach((targetId) => {
          const active = getBundleForProfile(targetId);
          const snapshot = buildStoredSnapshot(targetId, active) as any;
          const prefix = targetId === 'el' ? 'EL' : 'ELLA';
          const planKey = `plan${prefix}`;
          const baseBucket = (nextState[targetId] || current[targetId] || snapshot) as any;
          const plan = JSON.parse(JSON.stringify(baseBucket[planKey] || active.profile.plan || {}));
          const previousMeal = plan?.[day]?.[moment]?.[index] as MealItem | undefined;

          if (!previousMeal) return;

          const replacement = buildMealFromCatalog(moment, catalogMealId, previousMeal);
          if (!replacement) return;

          plan[day][moment][index] = replacement;
          nextState[targetId] = {
            ...baseBucket,
            [planKey]: plan,
          };

          completionResets.push({
            profileId: targetId,
            day,
            moment,
            previousMealName: previousMeal.nombre,
            nextMealName: replacement.nombre,
          });
        });

        return nextState;
      });

      if (completionResets.length > 0) {
        setCompletedMeals((current) => {
          const next = { ...current };
          completionResets.forEach((entry) => {
            delete next[buildMealKey(entry.profileId, entry.day, entry.moment, entry.previousMealName)];
            delete next[buildMealKey(entry.profileId, entry.day, entry.moment, entry.nextMealName)];
          });
          return next;
        });
      }
    },
    [perfilActivo, getBundleForProfile, setCompletedMeals, setCustomData]
  );

  const updateProfileMetrics = React.useCallback(
    (profileId: 'el' | 'ella', payload: ProfileMetricsUpdate) => {
      const currentBundle = getBundleForProfile(profileId);
      const currentProfile = currentBundle.profile;
      const parsed = extractProfileMetrics(
        [currentProfile.perfil, currentProfile.detallesPerfil].filter(Boolean).join(' | ')
      );

      const age = Math.max(16, Math.round(normalizeMetricInput(payload.edad, currentProfile.edad || 30)));
      const weightKg = Math.max(35, normalizeMetricInput(payload.pesoKg, Number(parsed.weightKg) || 70));
      const heightCm = Math.max(
        130,
        normalizeMetricInput(
          payload.estaturaCm,
          parsed.heightM ? Number(parsed.heightM) * 100 : 170
        )
      );
      const bmi = weightKg / Math.pow(heightCm / 100, 2);
      const goalToken = objectiveGoalToken(payload.objetivo);
      const tdee = calculateClinicalTDEE(
        weightKg,
        heightCm,
        age,
        profileId === 'el',
        sanitizeActivityLabel(payload.actividad),
        [goalToken]
      );
      const portions = generateSmaePortionsFromKcal(tdee.targetKcal, weightKg, [goalToken]);
      const distributed = distributeSmaeToMeals(portions, currentProfile.momentos?.length || 5);

      const nextObjectives = Object.fromEntries(
        (currentProfile.momentos || []).map((momento) => [
          momento.key,
          Object.fromEntries(
            SMAE_GROUPS.map((group) => [group, distributed[momento.key]?.[group] || 0])
          ),
        ])
      ) as Profile['objetivosPorMomento'];

      const nextDistribution = SMAE_GROUPS.map((group) => ({
        grupo: SMAE_LABELS[group],
        total: portions[group] || 0,
        detalle: `Distribuido en ${Math.max(1, currentProfile.momentos?.length || 5)} momentos`,
      })).filter((item) => item.total > 0);

      const objectiveText = objectiveLabel(payload.objetivo);
      const name = payload.nombre.trim() || currentProfile.nombre;
      const detailsBits = [
        `Actividad ${sanitizeActivityLabel(payload.actividad)}`,
        `Objetivo ${objectiveText}`,
        payload.notas?.trim() ? `Notas: ${payload.notas.trim()}` : '',
      ].filter(Boolean);

      const nextProfile: Profile = {
        ...currentProfile,
        nombre: name,
        edad: age,
        perfil: `${weightKg.toFixed(1)} kg | ${(heightCm / 100).toFixed(2)} m | ${age} anos | IMC ${bmi.toFixed(1)}`,
        detallesPerfil: detailsBits.join('. '),
        meta: objectiveText,
        descripcion: `Plan ajustado para ${name}. Meta: ${objectiveText}.`,
        metaCaloricaKcalDia: tdee.targetKcal,
        objetivosPorMomento: nextObjectives,
        distribucionDiaria: nextDistribution,
        resumenPersonal: [
          `Meta calorica diaria estimada: ${tdee.targetKcal} kcal.`,
          `Actividad declarada: ${sanitizeActivityLabel(payload.actividad)}.`,
          `Objetivo principal: ${objectiveText}.`,
          `Actualizado para ${name} con IMC estimado ${bmi.toFixed(1)}.`,
        ],
      };

      setCustomData((current) => {
        const snapshot = buildStoredSnapshot(profileId, currentBundle) as any;
        const prefix = profileId === 'el' ? 'EL' : 'ELLA';
        const profileKey = `perfil${prefix}`;
        const planKey = `plan${prefix}`;
        const equivalenciasKey = `equivalencias${prefix}`;
        const suplementosKey = `suplementos${prefix}`;
        const baseBucket = (current[profileId] || snapshot) as any;

        return {
          ...current,
          [profileId]: {
            ...baseBucket,
            [profileKey]: nextProfile,
            [planKey]: nextProfile.plan,
            [equivalenciasKey]: baseBucket[equivalenciasKey] || currentBundle.equivalencias,
            [suplementosKey]: baseBucket[suplementosKey] || currentBundle.supplements,
          },
        };
      });
    },
    [getBundleForProfile, setCustomData]
  );

  const exportProfilePdf = async (profileId: 'el' | 'ella') => {
    const bundle = activeBundles.find((entry) => entry.id === profileId);
    if (!bundle) {
      throw new Error('No se encontro el perfil solicitado.');
    }
    await generatePlanPDF(bundle.profile, bundle.profile.plan);
  };

  const generateWithAi = async (payload: QuestionnairePayload) => {
    setGenerationError('');
    setGenerationLoading(true);

    try {
      const { json, payloadWithKey } = await requestAiPlan(payload, geminiStatus?.selectedModel);
      const updates: Record<'el' | 'ella', any | null> = { el: null, ella: null };

      if (json?.elData) {
        updates.el = validateAndNormalizeDirectAiData(
          json.elData,
          {
            flow: 'questionnaire-submit',
            transport: 'serverless',
            stage: 'response-parse',
            targetProfile: payload.targetProfile,
            profilePrefix: 'EL',
            requestMode: 'generate',
            payload: payloadWithKey,
            requestedModel: geminiStatus?.selectedModel || '',
            selectedModel: json.modelUsed || geminiStatus?.selectedModel || '',
            apiKeySource: 'server-env',
          },
          payloadWithKey,
          json.elData,
          json.modelUsed || geminiStatus?.selectedModel || ''
        );
      }

      if (json?.ellaData) {
        updates.ella = validateAndNormalizeDirectAiData(
          json.ellaData,
          {
            flow: 'questionnaire-submit',
            transport: 'serverless',
            stage: 'response-parse',
            targetProfile: payload.targetProfile,
            profilePrefix: 'ELLA',
            requestMode: 'generate',
            payload: payloadWithKey,
            requestedModel: geminiStatus?.selectedModel || '',
            selectedModel: json.modelUsed || geminiStatus?.selectedModel || '',
            apiKeySource: 'server-env',
          },
          payloadWithKey,
          json.ellaData,
          json.modelUsed || geminiStatus?.selectedModel || ''
        );
      }

      setCustomData((current) => ({
        el: updates.el ?? current.el,
        ella: updates.ella ?? current.ella,
      }));

      if (payload.targetProfile === 'el' || payload.targetProfile === 'ella') {
        setPerfilActivo(payload.targetProfile);
      } else {
        setPerfilActivo('ambos');
      }
      setLastQuestionnairePayload(payload);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'No se pudo generar el plan con IA.');
      throw error;
    } finally {
      setGenerationLoading(false);
    }
  };

  const revisePlanWithAi = async (
    instruction: string,
    requestMode: PlanRevisionMode = 'adjust'
  ) => {
    const trimmedInstruction = instruction.trim();
    if (!trimmedInstruction) {
      throw new Error('Escribe una instruccion para actualizar el plan.');
    }

    const targetProfile: PerfilActivo = perfilActivo === 'ambos' ? 'ambos' : perfilActivo;
    const profileIds = targetProfile === 'ambos' ? (['el', 'ella'] as const) : ([targetProfile] as const);

    setPlanRevisionError('');
    setPlanRevisionLoading(true);

    try {
      const payload = {
        requestMode,
        targetProfile,
        instruction: trimmedInstruction,
        questionnaireContext: lastQuestionnairePayload
          ? (JSON.parse(JSON.stringify(lastQuestionnairePayload)) as Record<string, unknown>)
          : null,
        currentContext: Object.fromEntries(
          profileIds.map((id) => [id, buildCurrentProfileSnapshot(id)])
        ),
        originalContext: Object.fromEntries(
          profileIds.map((id) => [id, buildOriginalProfileSnapshot(id)])
        ),
      };

      const { json, payloadWithKey } = await requestAiPlanRevision(
        payload,
        geminiStatus?.selectedModel
      );

      if (!json?.elData && !json?.ellaData) {
        throw new Error('La IA no devolvio cambios aplicables para el plan.');
      }

      const updatedBuckets: Partial<Record<'el' | 'ella', any>> = {};
      const summaries: string[] = [];

      (['el', 'ella'] as const).forEach((profileId) => {
        const responseData = json?.[profileId === 'el' ? 'elData' : 'ellaData'];
        if (!responseData) return;

        if (json.responseMode === 'adjust') {
          const patch = responseData as PlanRevisionProfilePatch;
          const summaryLines = getPatchSummaryLines(patch);
          const hasChanges = hasPlanRevisionPatchChanges(patch);

          if (!hasChanges) {
            const noChangesSummary = patch.noChangesReason || summaryLines[0];
            if (noChangesSummary) {
              summaries.push(`${profileId === 'el' ? 'El' : 'Ella'}: ${noChangesSummary}`);
            }
            return;
          }

          const currentBundle = getBundleForProfile(profileId);
          const currentBucket = buildRawBucketFromSnapshot(
            profileId,
            buildCurrentProfileSnapshot(profileId)
          );
          const parsedBucket = applyPlanRevisionPatchToBucket(profileId, currentBucket, patch);
          const nextPlan = profileId === 'el' ? parsedBucket.planEL : parsedBucket.planELLA;
          const affectedSlots = getAffectedPlanSlotsFromPatch(patch);

          resetCompletedMealsForSlots(
            profileId,
            currentBundle.profile.plan,
            nextPlan,
            affectedSlots
          );

          updatedBuckets[profileId] = parsedBucket;
          summaries.push(
            ...(
              summaryLines.length > 0
                ? summaryLines.map((line) => `${profileId === 'el' ? 'El' : 'Ella'}: ${line}`)
                : [`${profileId === 'el' ? 'El' : 'Ella'}: Se actualizaron partes del plan.`]
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
          const currentBundle = getBundleForProfile(profileId);
          const currentBucket = buildRawBucketFromSnapshot(
            profileId,
            buildCurrentProfileSnapshot(profileId)
          );
          const parsedBucket = applyPlanRevisionPatchToBucket(profileId, currentBucket, patch);
          const nextPlan = profileId === 'el' ? parsedBucket.planEL : parsedBucket.planELLA;
          const affectedSlots = getAffectedPlanSlotsFromPatch(patch);

          resetCompletedMealsForSlots(
            profileId,
            currentBundle.profile.plan,
            nextPlan,
            affectedSlots.length > 0 ? affectedSlots : getAllPlanSlots(nextPlan)
          );

          updatedBuckets[profileId] = parsedBucket;
          summaries.push(
            ...(
              getPatchSummaryLines(patch).length > 0
                ? getPatchSummaryLines(patch).map((line) => `${profileId === 'el' ? 'El' : 'Ella'}: ${line}`)
                : [`${profileId === 'el' ? 'El' : 'Ella'}: Plan recreado con la nueva instruccion.`]
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
            targetProfile,
            profilePrefix: profileId === 'el' ? 'EL' : 'ELLA',
            requestMode,
            payload: payloadWithKey,
            requestedModel: geminiStatus?.selectedModel || '',
            selectedModel: json.modelUsed || geminiStatus?.selectedModel || '',
            apiKeySource: 'server-env',
          },
          payloadWithKey,
          responseData,
          json.modelUsed || geminiStatus?.selectedModel || ''
        );
        const currentBundle = getBundleForProfile(profileId);
        const nextPlan = profileId === 'el' ? parsedBucket.planEL : parsedBucket.planELLA;

        resetCompletedMealsForSlots(
          profileId,
          currentBundle.profile.plan,
          nextPlan,
          getAllPlanSlots(nextPlan)
        );

        updatedBuckets[profileId] = parsedBucket;
        summaries.push(`${profileId === 'el' ? 'El' : 'Ella'}: Plan recreado con la nueva instruccion.`);
      });

      if (Object.keys(updatedBuckets).length === 0) {
        await showAppAlert(
          'Sin cambios',
          summaries.join('\n') || 'La IA considero que no hacia falta modificar el plan actual.'
        );
        return;
      }

      setCustomData((current) => ({
        ...current,
        ...updatedBuckets,
      }));

      await showAppAlert(
        requestMode === 'regenerate' ? 'Plan recreado' : 'Plan actualizado con IA',
        `${summaries.join('\n')}\nModelo usado: ${json.modelUsed || geminiStatus?.selectedModel || 'Gemini'}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el plan con IA.';
      setPlanRevisionError(message);
      throw error;
    } finally {
      setPlanRevisionLoading(false);
    }
  };

  const value = useMemo<DietContextValue>(
    () => ({
      perfilActivo,
      setPerfilActivo,
      diaActivo,
      setDiaActivo,
      isDarkMode,
      setIsDarkMode,
      isHydrated: darkHydrated && completedHydrated && shoppingHydrated,
      activeBundles,
      allBundles,
      completedMeals,
      shoppingChecks,
      toggleMealComplete,
      toggleShoppingCheck,
      updateMeal,
      restoreMeal,
      replaceMealWithCatalog,
      updateProfileMetrics,
      geminiStatus,
      geminiLoading,
      generationLoading,
      generationError,
      planRevisionLoading,
      planRevisionError,
      refreshGeminiStatus,
      generateWithAi,
      revisePlanWithAi,
      exportProfilePdf,
      shoppingItems,
    }),
    [
      perfilActivo,
      setPerfilActivo,
      diaActivo,
      setDiaActivo,
      isDarkMode,
      setIsDarkMode,
      darkHydrated,
      completedHydrated,
      shoppingHydrated,
      activeBundles,
      allBundles,
      completedMeals,
      shoppingChecks,
      geminiStatus,
      geminiLoading,
      generationLoading,
      generationError,
      planRevisionLoading,
      planRevisionError,
      shoppingItems,
      replaceMealWithCatalog,
      updateProfileMetrics,
    ]
  );

  return <DIET_CONTEXT.Provider value={value}>{children}</DIET_CONTEXT.Provider>;
}

export function useDiet() {
  const context = useContext(DIET_CONTEXT);
  if (!context) {
    throw new Error('useDiet must be used within a DietProvider.');
  }
  return context;
}

export function getMealCompletionKey(
  profileId: 'el' | 'ella',
  day: string,
  moment: string,
  meal: MealItem
) {
  return buildMealKey(profileId, day, moment, meal.nombre);
}
