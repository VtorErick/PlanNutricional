/**
 * Claves canónicas de grupos de intercambio (equivalentes).
 * Mantener alineado con api/_foodGroupKeys.js (misma lista y alias).
 */
export const FOOD_GROUP_KEYS = [
  'frutas',
  'verduras',
  'cereales',
  'leguminosas',
  'lacteos',
  'proteina',
  'grasas',
] as const;

export type FoodGroupKey = (typeof FOOD_GROUP_KEYS)[number];

const ALIAS_BY_CANONICAL: Record<FoodGroupKey, string[]> = {
  frutas: ['fruta', 'frut', 'fruts'],
  verduras: ['verdura', 'verd', 'vegetal', 'vegetales'],
  cereales: ['cereal', 'cer'],
  leguminosas: ['leguminosa', 'legumbre', 'legumbres', 'leg'],
  lacteos: ['lacteo', 'lact'],
  proteina: ['proteinas', 'proteínas', 'protein', 'prot'],
  grasas: ['grasa', 'gras'],
};

function normalizeKeyToken(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildAliasMap(): Map<string, FoodGroupKey> {
  const map = new Map<string, FoodGroupKey>();
  for (const canonical of FOOD_GROUP_KEYS) {
    map.set(normalizeKeyToken(canonical), canonical);
    const aliases = ALIAS_BY_CANONICAL[canonical];
    for (const a of aliases) {
      map.set(normalizeKeyToken(a), canonical);
    }
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

/** Resuelve una clave devuelta por la IA (con abreviatura o typo común) al nombre canónico, o null. */
export function resolveFoodGroupKey(key: unknown): FoodGroupKey | null {
  if (typeof key !== 'string') return null;
  const resolved = ALIAS_MAP.get(normalizeKeyToken(key));
  return resolved ?? null;
}

export function coerceFoodGroupInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.trim().replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

type FoodGroupRow = Record<string, unknown>;

/**
 * Fusiona claves alias en canónicas. Si la IA envía la forma correcta y un alias duplicado,
 * gana el valor asociado a la clave canónica explícita.
 */
export function remapFoodGroupRow(row: unknown): Record<FoodGroupKey, number | undefined> {
  const explicit: Partial<Record<FoodGroupKey, number>> = {};
  const fromAlias: Partial<Record<FoodGroupKey, number>> = {};

  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return Object.fromEntries(FOOD_GROUP_KEYS.map((k) => [k, undefined])) as Record<
      FoodGroupKey,
      number | undefined
    >;
  }

  for (const [rawKey, rawVal] of Object.entries(row as FoodGroupRow)) {
    if (rawKey === 'momento') continue;
    const canon = resolveFoodGroupKey(rawKey);
    if (!canon) continue;
    const n = coerceFoodGroupInt(rawVal);
    if (n === null) continue;
    if (normalizeKeyToken(rawKey) === normalizeKeyToken(canon)) {
      explicit[canon] = n;
    } else {
      fromAlias[canon] = n;
    }
  }

  const out = {} as Record<FoodGroupKey, number | undefined>;
  for (const key of FOOD_GROUP_KEYS) {
    out[key] = explicit[key] !== undefined ? explicit[key] : fromAlias[key];
  }
  return out;
}
