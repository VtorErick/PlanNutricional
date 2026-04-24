export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
export const MAX_MODEL_CANDIDATES = 4;

export const GEMINI_MODEL_OPTIONS = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-3-pro-preview',
  'gemini-3.1-pro-preview-customtools',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
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
  (id) => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
);

export function normalizeModelName(modelName) {
  if (!modelName) return '';
  return String(modelName).replace(/^models\//, '').trim();
}

export function modelSupportsGenerateContent(model) {
  return (model?.supportedGenerationMethods || []).includes('generateContent');
}

export function isSupportedGeminiTextModel(modelName) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  return GEMINI_TEXT_MODEL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getModelFamilyKey(modelName) {
  return normalizeModelName(modelName)
    .toLowerCase()
    .replace(/-001$/i, '')
    .replace(/-customtools$/i, '');
}

function getUniqueModelNames(modelNames, preferredModelRaw) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const rawUniqueNames = [...new Set(modelNames.map((name) => normalizeModelName(name)).filter(Boolean))];
  const sourceNames = preferredModel ? [preferredModel, ...rawUniqueNames] : rawUniqueNames;
  const seenFamilies = new Set();
  const uniqueNames = [];

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

export function getOrderedGeminiModels(modelNames, preferredModelRaw) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const remaining = getUniqueModelNames(modelNames, preferredModelRaw);
  const ordered = [];

  if (preferredModel && remaining.includes(preferredModel)) {
    ordered.push(preferredModel);
  }

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

export function getGeminiFallbackModels(modelNames, preferredModelRaw) {
  return getOrderedGeminiModels(modelNames, preferredModelRaw).slice(1);
}
