import { readStorageValue, removeStorageValue, writeStorageValue } from './safeStorage';

const LEGACY_GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';
const GEMINI_MODEL_STORAGE_KEY = 'geminiModel';

export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const MAX_MODEL_CANDIDATES = 4;

export interface GeminiModelOption {
  id: string;
  label: string;
  technicalLabel: string;
  description: string;
  badge: string;
  badgeClassName: string;
}

export const GEMINI_MODEL_OPTIONS: GeminiModelOption[] = [
  {
    id: 'gemini-3-flash-preview',
    label: 'Por defecto',
    technicalLabel: 'Gemini 3 Flash Preview',
    description: 'Modelo por defecto para generar planes con mejor latencia.',
    badge: 'Default',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Balance',
    technicalLabel: 'Gemini 2.5 Flash',
    description: 'Buen equilibrio entre estructura, velocidad y costo para reintentos.',
    badge: 'Balance',
    badgeClassName: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Ligero',
    technicalLabel: 'Gemini 2.5 Flash Lite',
    description: 'Opcion ligera para mantener continuidad si los modelos grandes fallan.',
    badge: 'Ligero',
    badgeClassName: 'bg-cyan-100 text-cyan-700',
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    label: '3.1 Lite',
    technicalLabel: 'Gemini 3.1 Flash Lite Preview',
    description: 'Respaldo adicional para cuentas con menor disponibilidad en la serie principal.',
    badge: 'Lite',
    badgeClassName: 'bg-lime-100 text-lime-700',
  },
  {
    id: 'gemini-flash-latest',
    label: 'Alias Flash',
    technicalLabel: 'Gemini Flash Latest',
    description: 'Alias oficial como ultimo respaldo antes de bajar a 2.0.',
    badge: 'Alias',
    badgeClassName: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'gemini-flash-lite-latest',
    label: 'Alias Flash Lite',
    technicalLabel: 'Gemini Flash Lite Latest',
    description: 'Alias ligero para cuentas que solo exponen la variante latest.',
    badge: 'Alias',
    badgeClassName: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Compatibilidad',
    technicalLabel: 'Gemini 2.0 Flash',
    description: 'Respaldo legacy si tu cuenta no puede usar series mas nuevas.',
    badge: 'Legacy',
    badgeClassName: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'gemini-2.0-flash-lite',
    label: 'Ultimo respaldo',
    technicalLabel: 'Gemini 2.0 Flash Lite',
    description: 'Ultimo escalon para no cortar la solicitud cuando hay disponibilidad limitada.',
    badge: 'Legacy',
    badgeClassName: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Maxima calidad',
    technicalLabel: 'Gemini 3.1 Pro Preview',
    description: 'Modelo principal para planes y ediciones cuando priorizas calidad sobre velocidad.',
    badge: 'Pro',
    badgeClassName: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Alta calidad',
    technicalLabel: 'Gemini 2.5 Pro',
    description: 'Alternativa potente y estable cuando la serie 3 no responde.',
    badge: 'Pro',
    badgeClassName: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro',
    technicalLabel: 'Gemini 3 Pro Preview',
    description: 'Variante previa de Gemini 3 Pro; se mantiene disponible como opcion secundaria.',
    badge: 'Preview',
    badgeClassName: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'gemini-3.1-pro-preview-customtools',
    label: '3.1 Pro Tools',
    technicalLabel: 'Gemini 3.1 Pro Preview Custom Tools',
    description: 'Version especializada; solo se usa si esta disponible y las anteriores no responden.',
    badge: 'Tools',
    badgeClassName: 'bg-fuchsia-100 text-fuchsia-700',
  },
  {
    id: 'gemini-pro-latest',
    label: 'Alias Pro',
    technicalLabel: 'Gemini Pro Latest',
    description: 'Alias Pro de Google como respaldo amplio.',
    badge: 'Alias',
    badgeClassName: 'bg-stone-100 text-stone-700',
  },
];

const GEMINI_TEXT_MODEL_PATTERNS = [
  /^gemini-3\.1-pro-preview$/i,
  /^gemini-3-flash-preview$/i,
  /^gemini-2\.5-pro$/i,
  /^gemini-2\.5-flash$/i,
  /^gemini-2\.5-flash-lite$/i,
  /^gemini-3-pro-preview$/i,
  /^gemini-3\.1-pro-preview-customtools$/i,
  /^gemini-3\.1-flash-lite-preview$/i,
  /^gemini-flash-latest$/i,
  /^gemini-flash-lite-latest$/i,
  /^gemini-pro-latest$/i,
  /^gemini-2\.0-flash(?:-001)?$/i,
  /^gemini-2\.0-flash-lite(?:-001)?$/i,
];

const MODEL_PRIORITY_MATCHERS = GEMINI_MODEL_OPTIONS.map(
  (option) => new RegExp(`^${option.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
);

export function normalizeModelName(modelName: string) {
  if (!modelName) return '';
  return modelName.replace(/^models\//, '').trim();
}

export function getGeminiModelOption(modelName: string) {
  const normalized = normalizeModelName(modelName);
  return GEMINI_MODEL_OPTIONS.find((option) => option.id === normalized);
}

export function getGeminiModelLabel(modelName: string) {
  const option = getGeminiModelOption(modelName);
  return option?.technicalLabel || normalizeModelName(modelName);
}

export function isSupportedGeminiTextModel(modelName: string) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  return GEMINI_TEXT_MODEL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getModelFamilyKey(modelName: string) {
  return normalizeModelName(modelName)
    .toLowerCase()
    .replace(/-001$/i, '')
    .replace(/-customtools$/i, '');
}

function getUniqueModelNames(modelNames: string[], preferredModelRaw?: string) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const rawUniqueNames = [...new Set(modelNames.map((name) => normalizeModelName(name)).filter(Boolean))];
  const sourceNames = preferredModel ? [preferredModel, ...rawUniqueNames] : rawUniqueNames;
  const seenFamilies = new Set<string>();
  const uniqueNames: string[] = [];

  sourceNames.forEach((name) => {
    if (!rawUniqueNames.includes(name)) {
      return;
    }

    const familyKey = getModelFamilyKey(name);
    if (seenFamilies.has(familyKey)) {
      return;
    }

    seenFamilies.add(familyKey);
    uniqueNames.push(name);
  });

  return uniqueNames;
}

export function getOrderedGeminiModels(modelNames: string[], preferredModelRaw?: string) {
  const remaining = getUniqueModelNames(modelNames, preferredModelRaw);
  const ordered: string[] = [];

  MODEL_PRIORITY_MATCHERS.forEach((matcher) => {
    const match = remaining.find((name) => matcher.test(name) && !ordered.includes(name));
    if (match) {
      ordered.push(match);
    }
  });

  remaining.forEach((name) => {
    if (!ordered.includes(name)) {
      ordered.push(name);
    }
  });

  return ordered.slice(0, MAX_MODEL_CANDIDATES);
}

export function getGeminiFallbackModels(modelNames: string[], preferredModelRaw?: string) {
  return getOrderedGeminiModels(modelNames, preferredModelRaw).slice(1);
}

export function getStoredGeminiModel() {
  if (typeof window === 'undefined') return DEFAULT_GEMINI_MODEL;

  const saved = readStorageValue(window.localStorage, GEMINI_MODEL_STORAGE_KEY);
  const normalized = normalizeModelName(saved || '');
  return isSupportedGeminiTextModel(normalized) ? normalized : DEFAULT_GEMINI_MODEL;
}

export function persistGeminiModel(modelName: string) {
  if (typeof window === 'undefined') return;

  const normalized = normalizeModelName(modelName);
  if (!normalized) {
    removeStorageValue(window.localStorage, GEMINI_MODEL_STORAGE_KEY);
    return;
  }

  writeStorageValue(window.localStorage, GEMINI_MODEL_STORAGE_KEY, normalized);
}

export function clearLegacyGeminiApiKeyStorage() {
  if (typeof window === 'undefined') return;

  removeStorageValue(window.localStorage, LEGACY_GEMINI_API_KEY_STORAGE_KEY);
  removeStorageValue(window.sessionStorage, LEGACY_GEMINI_API_KEY_STORAGE_KEY);
}
