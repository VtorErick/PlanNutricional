import type { MealItem, MealOriginalSnapshot, Profile } from '../types';
import type { CatalogMealItem } from '../data/mealsDB';
import { mealsDatabase } from '../data/mealsDB';
import { ensureMealNutrition } from './nutrition';
import { buildCanonicalMealDetail } from './nutritionValidation';
import { buildConfigFromQuestionnaire, getRankedMealsForUser } from './mealScoring';

export interface MealOccurrence {
  id: string;
  dia: string;
  momento: string;
  momentoLabel: string;
  nombreAnterior: string;
  profileId?: 'el' | 'ella';
  profileLabel?: string;
}

export interface MealEditorDraft {
  nombre: string;
  detalle: string;
  porciones: string;
  tagsText: string;
  superText: string;
  caloriasKcal: string;
  proteinaG: string;
  grasasG: string;
}

export interface CatalogMealRecommendation {
  id: string;
  nombre: string;
  detalle: string;
  tags: string[];
  super: string[];
  porciones: string;
  caloriasKcal: number;
  proteinaG: number;
  grasasG: number;
  score: number;
  reasons: string[];
}

export interface PortionDiffItem {
  key: string;
  label: string;
  original: number;
  actual: number;
  diff: number;
}

const PORTION_LABELS: Record<string, string> = {
  frutas: 'Frutas',
  verduras: 'Verduras',
  cereales: 'Cereales',
  proteina: 'Proteina',
  grasas: 'Grasas',
  lacteos: 'Lacteos',
  leguminosas: 'Leguminosas',
};

const PORTION_ALIASES: Record<string, string> = {
  fruta: 'frutas',
  frutas: 'frutas',
  verdura: 'verduras',
  verduras: 'verduras',
  cereal: 'cereales',
  cereales: 'cereales',
  leguminosa: 'leguminosas',
  leguminosas: 'leguminosas',
  lacteo: 'lacteos',
  lacteos: 'lacteos',
  proteina: 'proteina',
  proteinas: 'proteina',
  grasas: 'grasas',
  grasa: 'grasas',
};

const PORTION_ORDER = ['frutas', 'verduras', 'cereales', 'leguminosas', 'lacteos', 'proteina', 'grasas'];
const PORTION_TEXT_LABELS: Record<string, string> = {
  frutas: 'frutas',
  verduras: 'verduras',
  cereales: 'cereales',
  leguminosas: 'leguminosas',
  lacteos: 'lacteos',
  proteina: 'proteina',
  grasas: 'grasas',
};

function normalizePortionKeyToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function sanitizeList(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

function getMomentLabel(profile: Profile, momentoKey: string) {
  return profile.momentos.find((momento) => momento.key === momentoKey)?.label || momentoKey;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildTargetPortionsText(profile: Profile, momentoKey: string, fallback: string) {
  const momentPortions = profile.objetivosPorMomento?.[momentoKey];
  if (!momentPortions) return fallback;

  const portions = PORTION_ORDER
    .map((key) => ({ key, amount: momentPortions[key] || 0 }))
    .filter(({ amount }) => amount > 0)
    .map(({ key, amount }) => `${amount} ${PORTION_TEXT_LABELS[key] || key}`);

  return portions.length > 0 ? portions.join(' | ') : fallback;
}

function buildRecommendationReasons(meal: CatalogMealItem, questionnaireContext: any, score: number) {
  const reasons: string[] = [];
  const tagsText = normalizeText([meal.nombre, ...meal.tags, ...meal.super, ...(meal.cuisineStyles || [])].join(' '));
  const prefs = questionnaireContext?.preferences || questionnaireContext?.preferencesContext || {};
  const rawFavorites = [
    prefs.favoriteFoods,
    prefs.favoriteCuisineStyles,
    questionnaireContext?.profileContext?.objectives,
  ].flat().filter(Boolean).join(' ');
  const favoriteTokens = normalizeText(rawFavorites).split(/[,;\s]+/).filter((token) => token.length > 3);

  if (favoriteTokens.some((token) => tagsText.includes(token))) {
    reasons.push('Coincide con gustos');
  }
  if (meal.macroEstimate?.protein && meal.macroEstimate.protein >= 20) {
    reasons.push('Buena proteina');
  }
  if (meal.prepTimeMinutes && meal.prepTimeMinutes <= 15) {
    reasons.push('Rapido');
  }
  if (/(fibra|omega3|saciante|digestivo|anti-inflamatorio|volumen)/.test(tagsText)) {
    reasons.push('Buen perfil nutricional');
  }
  if (score >= 10 && reasons.length < 3) {
    reasons.push('Alta afinidad');
  }

  return Array.from(new Set(reasons)).slice(0, 3);
}

function getBaseMealId(mealId?: string) {
  return mealId?.split('|MOD:')[0]?.trim() || '';
}

function catalogMealToRecommendation(
  meal: CatalogMealItem,
  profile: Profile,
  momentoKey: string,
  questionnaireContext: any,
  score: number
): CatalogMealRecommendation {
  const porciones = buildTargetPortionsText(profile, momentoKey, '1 porcion');
  const hydrated = ensureMealNutrition({
    id: meal.id,
    nombre: meal.nombre,
    porciones,
    detalle: buildCanonicalMealDetail(meal.nombre, meal.super),
    tags: meal.tags,
    super: meal.super,
    caloriasKcal: meal.macroEstimate?.calories,
    proteinaG: meal.macroEstimate?.protein,
    grasasG: meal.macroEstimate?.fat,
  });

  return {
    id: meal.id,
    nombre: hydrated.nombre,
    detalle: hydrated.detalle,
    tags: hydrated.tags,
    super: hydrated.super,
    porciones: hydrated.porciones,
    caloriasKcal: hydrated.caloriasKcal || 0,
    proteinaG: hydrated.proteinaG || 0,
    grasasG: hydrated.grasasG || 0,
    score,
    reasons: buildRecommendationReasons(meal, questionnaireContext, score),
  };
}

export function snapshotMeal(meal: MealItem): MealOriginalSnapshot {
  return {
    nombre: meal.nombre,
    porciones: meal.porciones,
    detalle: meal.detalle,
    tags: [...(meal.tags || [])],
    super: [...(meal.super || [])],
    caloriasKcal: meal.caloriasKcal,
    proteinaG: meal.proteinaG,
    grasasG: meal.grasasG,
  };
}

export function getMealOriginalSnapshot(meal: MealItem) {
  return meal.editMeta?.original || snapshotMeal(meal);
}

export function isMealEdited(meal: MealItem) {
  return Boolean(meal.editMeta?.isEdited);
}

export function createMealEditorDraft(meal: MealItem): MealEditorDraft {
  return {
    nombre: meal.nombre,
    detalle: meal.detalle,
    porciones: meal.porciones,
    tagsText: (meal.tags || []).join(', '),
    superText: (meal.super || []).join(', '),
    caloriasKcal: meal.caloriasKcal ? String(meal.caloriasKcal) : '',
    proteinaG: typeof meal.proteinaG === 'number' ? String(meal.proteinaG) : '',
    grasasG: typeof meal.grasasG === 'number' ? String(meal.grasasG) : '',
  };
}

export function createMealEditorDraftFromRecommendation(recommendation: CatalogMealRecommendation): MealEditorDraft {
  return {
    nombre: recommendation.nombre,
    detalle: recommendation.detalle,
    porciones: recommendation.porciones,
    tagsText: recommendation.tags.join(', '),
    superText: recommendation.super.join(', '),
    caloriasKcal: String(recommendation.caloriasKcal),
    proteinaG: String(recommendation.proteinaG),
    grasasG: String(recommendation.grasasG),
  };
}

export function getRecommendedCatalogMealsForSlot(
  profile: Profile,
  profileId: 'el' | 'ella',
  momentoKey: string,
  questionnaireContext: any,
  currentMealId?: string,
  limit = 6
): CatalogMealRecommendation[] {
  const context = questionnaireContext || {};
  const config = buildConfigFromQuestionnaire({
    ...context,
    targetProfile: profileId,
  });
  const currentBaseId = getBaseMealId(currentMealId);
  const slotMeals = mealsDatabase.filter((meal) => (
    meal.momentos.includes(momentoKey) && meal.id !== currentBaseId
  ));
  const ranked = getRankedMealsForUser(slotMeals, config);
  const source = ranked.length > 0
    ? ranked
    : slotMeals.map((meal) => ({ meal, score: 0 }));

  return source
    .slice(0, limit)
    .map(({ meal, score }) => catalogMealToRecommendation(meal, profile, momentoKey, context, score));
}

export function buildMealFromDraft(meal: MealItem, draft: MealEditorDraft): MealItem {
  const original = getMealOriginalSnapshot(meal);
  const nextMeal = ensureMealNutrition({
    ...meal,
    nombre: draft.nombre.trim() || meal.nombre,
    detalle: draft.detalle.trim(),
    porciones: draft.porciones.trim() || meal.porciones,
    tags: sanitizeList(draft.tagsText.split(',')),
    super: sanitizeList(draft.superText.split(',')),
    caloriasKcal: parseNumberInput(draft.caloriasKcal),
    proteinaG: parseNumberInput(draft.proteinaG),
    grasasG: parseNumberInput(draft.grasasG),
    editMeta: {
      isEdited: true,
      original,
    },
  });

  return nextMeal;
}

export function restoreMealToOriginal(meal: MealItem): MealItem {
  const original = meal.editMeta?.original;
  if (!original) return meal;

  return ensureMealNutrition({
    ...original,
    editMeta: undefined,
  });
}

export function getMealLinkKey(meal: MealItem) {
  return getMealOriginalSnapshot(meal).nombre.trim().toLowerCase();
}

export function getMealOccurrences(profile: Profile, meal: MealItem): MealOccurrence[] {
  const linkKey = getMealLinkKey(meal);
  const occurrences: MealOccurrence[] = [];

  Object.entries(profile.plan || {}).forEach(([dia, momentos]) => {
    Object.entries(momentos || {}).forEach(([momentoKey, comidas]) => {
      (comidas || []).forEach((candidate, index) => {
        if (getMealLinkKey(candidate) !== linkKey) return;

        occurrences.push({
          id: `${dia}::${momentoKey}::${index}`,
          dia,
          momento: momentoKey,
          momentoLabel: getMomentLabel(profile, momentoKey),
          nombreAnterior: candidate.nombre,
        });
      });
    });
  });

  return occurrences;
}

export function applyMealDraftToPlan(
  profile: Profile,
  meal: MealItem,
  draft: MealEditorDraft,
  targetOccurrenceIds?: string[]
) {
  const linkKey = getMealLinkKey(meal);
  const referenceMeal = buildMealFromDraft(meal, draft);
  const selectedIds = targetOccurrenceIds && targetOccurrenceIds.length > 0
    ? new Set(targetOccurrenceIds)
    : null;
  const selectionRenames: Array<{
    dia: string;
    momento: string;
    previousName: string;
    nextName: string;
  }> = [];

  const nextPlan = Object.fromEntries(
    Object.entries(profile.plan || {}).map(([dia, momentos]) => [
      dia,
      Object.fromEntries(
        Object.entries(momentos || {}).map(([momentoKey, comidas]) => [
          momentoKey,
          (comidas || []).map((candidate, index) => {
            if (getMealLinkKey(candidate) !== linkKey) return candidate;
            const occurrenceId = `${dia}::${momentoKey}::${index}`;
            if (selectedIds && !selectedIds.has(occurrenceId)) return candidate;

            const updatedMeal = ensureMealNutrition({
              ...referenceMeal,
              editMeta: {
                isEdited: true,
                original: getMealOriginalSnapshot(candidate),
              },
            });

            if (candidate.nombre !== updatedMeal.nombre) {
              selectionRenames.push({
                dia,
                momento: momentoKey,
                previousName: candidate.nombre,
                nextName: updatedMeal.nombre,
              });
            }

            return updatedMeal;
          }),
        ])
      ),
    ])
  ) as Profile['plan'];

  return {
    nextPlan,
    updatedMeal: referenceMeal,
    occurrences: getMealOccurrences(profile, meal).filter((occurrence) => (
      selectedIds ? selectedIds.has(occurrence.id) : true
    )),
    selectionRenames,
  };
}

export function restoreMealInPlan(
  profile: Profile,
  meal: MealItem,
  targetOccurrenceIds?: string[]
) {
  const linkKey = getMealLinkKey(meal);
  const selectionRenames: Array<{
    dia: string;
    momento: string;
    previousName: string;
    nextName: string;
  }> = [];
  const occurrences = getMealOccurrences(profile, meal);
  const restoredOccurrenceIds = new Set<string>();
  const selectedIds = targetOccurrenceIds && targetOccurrenceIds.length > 0
    ? new Set(targetOccurrenceIds)
    : null;

  const nextPlan = Object.fromEntries(
    Object.entries(profile.plan || {}).map(([dia, momentos]) => [
      dia,
      Object.fromEntries(
        Object.entries(momentos || {}).map(([momentoKey, comidas]) => [
          momentoKey,
          (comidas || []).map((candidate, index) => {
            if (getMealLinkKey(candidate) !== linkKey) return candidate;
            const occurrenceId = `${dia}::${momentoKey}::${index}`;
            if (selectedIds && !selectedIds.has(occurrenceId)) return candidate;
            if (!candidate.editMeta?.original) return candidate;

            const restoredMeal = restoreMealToOriginal(candidate);

            if (candidate.nombre !== restoredMeal.nombre) {
              selectionRenames.push({
                dia,
                momento: momentoKey,
                previousName: candidate.nombre,
                nextName: restoredMeal.nombre,
              });
            }

            restoredOccurrenceIds.add(occurrenceId);

            return restoredMeal;
          }),
        ])
      ),
    ])
  ) as Profile['plan'];

  return {
    nextPlan,
    restoredMeal: restoreMealToOriginal(meal),
    occurrences: occurrences.filter((occurrence) => (
      restoredOccurrenceIds.has(occurrence.id) && (selectedIds ? selectedIds.has(occurrence.id) : true)
    )),
    selectionRenames,
  };
}

export function parsePortionsText(portionsText: string) {
  const totals: Record<string, number> = {};

  portionsText
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const match = entry.match(/([\p{L}]+)\s*(\d+)/u);
      if (!match) return;

      const key = PORTION_ALIASES[normalizePortionKeyToken(match[1])];
      const amount = Number(match[2]);
      if (!key || Number.isNaN(amount)) return;

      totals[key] = (totals[key] || 0) + amount;
    });

  return totals;
}

export function getMealPortionDifferences(meal: MealItem): PortionDiffItem[] {
  if (!meal.editMeta?.original?.porciones) return [];

  const current = parsePortionsText(meal.porciones || '');
  const original = parsePortionsText(meal.editMeta.original.porciones || '');
  const keys = Array.from(new Set([...Object.keys(original), ...Object.keys(current)]));

  return keys
    .map((key) => {
      const originalAmount = original[key] || 0;
      const currentAmount = current[key] || 0;
      return {
        key,
        label: PORTION_LABELS[key] || key,
        original: originalAmount,
        actual: currentAmount,
        diff: currentAmount - originalAmount,
      };
    })
    .filter((item) => item.diff !== 0);
}

export function getMealPortionDifferenceSummary(meal: MealItem) {
  return getMealPortionDifferences(meal)
    .map((item) => `${item.label}: ${item.original} -> ${item.actual} (${item.diff > 0 ? '+' : ''}${item.diff})`)
    .join(' | ');
}
