import { mealsDatabase } from '../data/mealsDB';
import type { SupplementRecommendation } from '../types';

const PORTION_TOKEN_PATTERN =
  /(?:(\d+(?:[.,]\d+)?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ_]+)|([a-zA-ZáéíóúÁÉÍÓÚñÑ_]+)\s*(\d+(?:[.,]\d+)?))/g;
const KNOWN_PORTION_TOKENS = new Set([
  'fruta',
  'frutas',
  'frut',
  'verdura',
  'verduras',
  'verd',
  'cereal',
  'cereales',
  'cer',
  'leguminosa',
  'leguminosas',
  'leg',
  'lacteo',
  'lacteos',
  'lact',
  'proteina',
  'proteinas',
  'prot',
  'grasa',
  'grasas',
  'gras',
]);
const INGREDIENT_STOPWORDS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'estilo',
  'ingredientes',
  'la',
  'las',
  'los',
  'para',
  'por',
  'sin',
  'un',
  'una',
  'y',
]);

function normalizeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractPortionTokens(value: string) {
  const tokens: string[] = [];
  const normalized = normalizeToken(value);
  for (const match of normalized.matchAll(PORTION_TOKEN_PATTERN)) {
    const token = (match[2] || match[3] || '').trim();
    if (token) tokens.push(token);
  }
  return tokens.filter((token) => KNOWN_PORTION_TOKENS.has(token));
}

function buildIngredientTokenSet(name: string, ingredients: string[]) {
  return new Set(
    [name, ...ingredients]
      .flatMap((entry) =>
        normalizeToken(entry)
          .split(/[^a-z0-9]+/g)
          .map((token) => token.trim())
          .filter((token) => token.length >= 3 && !INGREDIENT_STOPWORDS.has(token))
      )
  );
}

function countMeaningfulOverlap(detail: string, allowedTokens: Set<string>) {
  const detailTokens = normalizeToken(detail)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !INGREDIENT_STOPWORDS.has(token));

  return detailTokens.reduce((acc, token) => acc + (allowedTokens.has(token) ? 1 : 0), 0);
}

export function hasRecognizablePortions(value: unknown) {
  return typeof value === 'string' && extractPortionTokens(value).length > 0;
}

export function shouldTreatMacroAsMissing(value: unknown, estimatedValue: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return true;
  return value === 0 && estimatedValue > 0;
}

export function buildCanonicalMealDetail(name: string, ingredients: string[]) {
  const compactIngredients = ingredients
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (compactIngredients.length === 0) return `${name}.`;
  return `${name}. Ingredientes base: ${compactIngredients.join(', ')}.`;
}

export function shouldReplaceMealDetail(detail: unknown, mealName: string, ingredients: string[]) {
  if (typeof detail !== 'string' || !detail.trim()) return true;

  const overlap = countMeaningfulOverlap(detail, buildIngredientTokenSet(mealName, ingredients));
  const minimumOverlap = ingredients.length >= 4 ? 2 : 1;
  return overlap < minimumOverlap;
}

export function findCatalogMealByIdRef(idRef: unknown) {
  if (typeof idRef !== 'string' || !idRef.trim()) return null;
  const [baseId] = idRef.split('|MOD:');
  return mealsDatabase.find((meal) => meal.id === baseId.trim()) || null;
}

export function hydrateSupplementFromReference(
  item: unknown,
  catalog: Array<SupplementRecommendation & { id?: string }>
): SupplementRecommendation | null {
  if (typeof item === 'string') {
    return catalog.find((entry) => entry.id === item) || null;
  }

  if (!item || typeof item !== 'object') return null;

  const candidate = item as Partial<SupplementRecommendation> & { id?: string };
  if (candidate.id) {
    const fromId = catalog.find((entry) => entry.id === candidate.id);
    if (fromId) {
      return {
        ...fromId,
        ...candidate,
        notes: candidate.notes || fromId.notes,
      };
    }
  }

  if (candidate.name) {
    const normalizedName = normalizeToken(candidate.name);
    const fromName = catalog.find((entry) => normalizeToken(entry.name) === normalizedName);
    if (fromName) {
      return {
        ...fromName,
        ...candidate,
        notes: candidate.notes || fromName.notes,
      };
    }
  }

  if (
    candidate.name &&
    candidate.goalSupport &&
    candidate.whyItMayHelp &&
    candidate.howToUse &&
    candidate.timing &&
    candidate.notes
  ) {
    return candidate as SupplementRecommendation;
  }

  return null;
}
