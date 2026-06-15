/**
 * Claves canónicas de grupos de intercambio. Mantener alineado con src/utils/foodGroupKeys.ts
 */
export const FOOD_GROUP_KEYS = [
  'frutas',
  'verduras',
  'cereales',
  'leguminosas',
  'lacteos',
  'proteina',
  'grasas',
];

const ALIAS_BY_CANONICAL = {
  frutas: ['fruta', 'frut', 'fruts'],
  verduras: ['verdura', 'verd', 'vegetal', 'vegetales'],
  cereales: ['cereal', 'cer'],
  leguminosas: ['leguminosa', 'legumbre', 'legumbres', 'leg'],
  lacteos: ['lacteo', 'lact'],
  proteina: ['proteinas', 'proteínas', 'protein', 'prot'],
  grasas: ['grasa', 'gras'],
};

function normalizeKeyToken(raw) {
  return String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildAliasMap() {
  const map = new Map();
  for (const canonical of FOOD_GROUP_KEYS) {
    map.set(normalizeKeyToken(canonical), canonical);
    const aliases = ALIAS_BY_CANONICAL[canonical] || [];
    for (const a of aliases) {
      map.set(normalizeKeyToken(a), canonical);
    }
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

export function resolveFoodGroupKey(key) {
  if (typeof key !== 'string') return null;
  return ALIAS_MAP.get(normalizeKeyToken(key)) || null;
}

export function coerceFoodGroupInt(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const n = Number(String(value).trim().replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, number|undefined>}
 */
export function remapFoodGroupRow(row) {
  const explicit = {};
  const fromAlias = {};

  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return Object.fromEntries(FOOD_GROUP_KEYS.map((k) => [k, undefined]));
  }

  for (const [rawKey, rawVal] of Object.entries(row)) {
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

  const out = {};
  for (const key of FOOD_GROUP_KEYS) {
    out[key] = explicit[key] !== undefined ? explicit[key] : fromAlias[key];
  }
  return out;
}
