export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-pro';
export const DEEPSEEK_PRO_MODEL = 'deepseek-v4-pro';
export const MAX_DEEPSEEK_MODEL_CANDIDATES = 2;

export const DEEPSEEK_MODEL_OPTIONS = [
  'deepseek-v4-flash',
  'deepseek-v4-pro',
];

const DEEPSEEK_MODEL_PATTERNS = [
  /^deepseek-v4-flash$/i,
  /^deepseek-v4-pro$/i,
];

const MODEL_PRIORITY_MATCHERS = DEEPSEEK_MODEL_OPTIONS.map(
  (id) => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
);

export function normalizeDeepSeekModelName(modelName) {
  return String(modelName || '').trim().replace(/^['"]|['"]$/g, '');
}

export function isSupportedDeepSeekModel(modelName) {
  const normalized = normalizeDeepSeekModelName(modelName);
  return DEEPSEEK_MODEL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getUniqueModelNames(modelNames, preferredModelRaw) {
  const preferredModel = normalizeDeepSeekModelName(preferredModelRaw);
  const rawUniqueNames = [...new Set(modelNames.map(normalizeDeepSeekModelName).filter(Boolean))];
  const sourceNames = preferredModel ? [preferredModel, ...rawUniqueNames] : rawUniqueNames;
  const uniqueNames = [];

  sourceNames.forEach((name) => {
    if (!rawUniqueNames.includes(name) || uniqueNames.includes(name)) {
      return;
    }

    uniqueNames.push(name);
  });

  return uniqueNames;
}

export function getOrderedDeepSeekModels(modelNames, preferredModelRaw) {
  const preferredModel = normalizeDeepSeekModelName(preferredModelRaw);
  const remaining = getUniqueModelNames(modelNames, preferredModelRaw)
    .filter(isSupportedDeepSeekModel);
  const ordered = [];

  const preferredMatch = remaining.find(
    (name) => preferredModel && name.toLowerCase() === preferredModel.toLowerCase()
  );
  if (preferredMatch) {
    ordered.push(preferredMatch);
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

  return ordered.slice(0, MAX_DEEPSEEK_MODEL_CANDIDATES);
}

export function getDeepSeekFallbackModels(modelNames, preferredModelRaw) {
  return getOrderedDeepSeekModels(modelNames, preferredModelRaw).slice(1);
}
