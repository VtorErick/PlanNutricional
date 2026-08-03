import { applyCorsHeaders, enforceRateLimit } from './_requestGuard.js';
import { FOOD_GROUP_KEYS, remapFoodGroupRow, resolveFoodGroupKey } from './_foodGroupKeys.js';
import {
  DEFAULT_GEMINI_MODEL,
  getOrderedGeminiModels,
  isSupportedGeminiTextModel,
  normalizeModelName,
} from './_geminiModels.js';
import { AI_PROVIDER_GEMINI, normalizeAiProvider } from './_aiProvider.js';
import {
  DEFAULT_DEEPSEEK_MODEL,
  DEEPSEEK_MODEL_OPTIONS,
  getOrderedDeepSeekModels,
  isSupportedDeepSeekModel,
  normalizeDeepSeekModelName,
} from './_deepseekModels.js';
import { callDeepSeekChatCompletion } from './_deepseekClient.js';
import { generateProfile, generateSupplements } from './profileGenerator.js';

const ALLOWED_ICONS = [
  'Apple',
  'Carrot',
  'Wheat',
  'Bean',
  'Milk',
  'Beef',
  'Droplets',
  'Candy',
  'AlertTriangle',
  'Heart',
];
const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const MEAL_MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
const MEAL_ITEM_REQUIRED_KEYS = [
  'nombre',
  'porciones',
  'detalle',
  'tags',
  'super',
];
const PLAN_SLOT_REQUIRED_KEYS = ['dia', 'momento', 'opciones'];
const SUPPLEMENT_REQUIRED_KEYS = [
  'name',
  'goalSupport',
  'whyItMayHelp',
  'howToUse',
  'timing',
  'notes',
  'caution',
];
const PROFILE_REQUIRED_KEYS = [
  'id',
  'nombre',
  'perfil',
  'detallesPerfil',
  'meta',
  'metaCaloricaKcalDia',
  'descripcion',
  'edad',
  'horariosTexto',
  'notaSalud',
  'momentos',
  'objetivosPorMomento',
  'distribucionDiaria',
  'resumenPersonal',
];
const MAX_ASSESSMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSESSMENT_PDF_MB = Math.round(MAX_ASSESSMENT_PDF_BYTES / (1024 * 1024));
const GEMINI_SEQUENTIAL_REQUEST_DELAY_MS = 1500;
const AI_GENERIC_ERROR_MESSAGE =
  'No se pudo completar la solicitud con IA. Inténtalo de nuevo en unos segundos.';

function resolvePreferredGeminiModel(payloadPreferredModel, envModel) {
  const requestedModel =
    normalizeModelName(payloadPreferredModel || envModel || DEFAULT_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;

  return isSupportedGeminiTextModel(requestedModel) ? requestedModel : DEFAULT_GEMINI_MODEL;
}
function resolvePreferredDeepSeekModel(envModel, payloadPreferredModel) {
  const requestedModel =
    normalizeDeepSeekModelName(envModel || payloadPreferredModel || DEFAULT_DEEPSEEK_MODEL) ||
    DEFAULT_DEEPSEEK_MODEL;

  return isSupportedDeepSeekModel(requestedModel) ? requestedModel : DEFAULT_DEEPSEEK_MODEL;
}

function stripProfileCalorieAdjustmentNote(value) {
  if (!isNonEmptyString(value)) return '';
  const source = String(value);
  const normalizedSource = source.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/^\s*porcion\s+ajustada\s+segun\s+objetivo,\s+horario\s+y\s+restricciones\s+del\s+perfil\.?\s*$/i.test(normalizedSource)) {
    return '';
  }

  return source
    .replace(/\s*\(\s*porci[oó]n\s+ajustad[ao]\s+a\s+~?\d+(?:[.,]\d+)?\s*kcal\s+para\s+este\s+perfil\s*\)\s*/gi, ' ')
    .replace(/\s*\(\s*porcion\s+ajustada\s+segun\s+objetivo,\s+horario\s+y\s+restricciones\s+del\s+perfil\.?\s*\)\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

const CLINICAL_PROTOCOLS = [
  {
    regex: /(diabetes|insulina|sop|poliquistico|azucar)/i,
    rule: "PROTOCOLO CLÍNICO: Resistencia Insulina / SOP / Diabetes. 1) EXCLUYE carbohidratos simples. 2) Elige SOLO opciones con bajo índice glucémico. 3) NUNCA asignes una fruta sola en colación sin acompañarla de grasa (ej. nueces/almendras) o proteína."
  },
  {
    regex: /(hipertension|presion)/i,
    rule: "PROTOCOLO CLÍNICO: Hipertensión. Elige opciones del mealsCatalog con perfil e ingredientes bajos en sodio."
  },
  {
    regex: /(hipotiroidismo|tiroides)/i,
    rule: "PROTOCOLO CLÍNICO: Hipotiroidismo. Evita usar ingredientes bociógenos crudos (brócoli, col) y grandes cantidades de soya."
  },
  {
    regex: /(gastritis|colitis|reflujo|acidez|ulcera)/i,
    rule: "PROTOCOLO CLÍNICO: Gastritis / Colitis. EXCLUYE irritantes (chile, café, tomate crudo excesivo), cítricos en ayunas, vegetales flatulentos y demasiada grasa en las preparaciones."
  }
];

function resolveClinicalProtocols(diagnosticsText) {
  if (typeof diagnosticsText !== 'string' || !diagnosticsText.trim()) return '';
  const activeProtocols = [];
  for (const { regex, rule } of CLINICAL_PROTOCOLS) {
    if (regex.test(diagnosticsText)) {
      activeProtocols.push(rule);
    }
  }
  return activeProtocols.length ? `\n\nREGLAS CLÍNICAS ACTIVAS ALTA PRIORIDAD:\n${activeProtocols.join('\n')}` : '';
}

function extractDiagnosticsText(payload) {
  const candidates = [
    payload?.diagnostics,
    payload?.healthContext?.diagnostics,
    payload?.questionnaireContext?.diagnostics,
    payload?.questionnaireContext?.healthContext?.diagnostics,
  ];

  return candidates.find((entry) => typeof entry === 'string' && entry.trim()) || '';
}

function buildCanonicalMealDetail(name, ingredients) {
  const compactIngredients = Array.isArray(ingredients)
    ? ingredients.map((entry) => String(entry).trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!compactIngredients.length) return `${name}.`;
  return `${name}. Ingredientes base: ${compactIngredients.join(', ')}.`;
}

function createDebugLogId(flow) {
  return `${flow}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeAttemptLogs(attempts) {
  if (!Array.isArray(attempts) || attempts.length === 0) return undefined;

  return attempts.map((attempt) => ({
    ...attempt,
    model: attempt.model ? normalizeModelName(attempt.model) : attempt.model,
    aiRequest: sanitizeDebugValue(attempt.aiRequest || attempt.geminiRequest),
    aiResponse: attempt.aiResponse
      ? {
          status: attempt.aiResponse.status,
          body: sanitizeDebugValue(attempt.aiResponse.body),
        }
      : attempt.geminiResponse
        ? {
            status: attempt.geminiResponse.status,
            body: sanitizeDebugValue(attempt.geminiResponse.body),
          }
        : undefined,
    geminiRequest: sanitizeDebugValue(attempt.geminiRequest),
    geminiResponse: attempt.geminiResponse
      ? {
          status: attempt.geminiResponse.status,
          body: sanitizeDebugValue(attempt.geminiResponse.body),
        }
      : undefined,
  }));
}

function buildAttemptLog(error, input) {
  const candidate = error || {};
  const debugLog = candidate.aiDebugLog;
  const response = input.geminiResponse || debugLog?.geminiResponse;

  return {
    order: input.order,
    model: normalizeModelName(debugLog?.selectedModel || input.modelName || ''),
    stage: debugLog?.stage || input.stage || 'generate-content',
    statusCode: input.statusCode ?? candidate.statusCode ?? response?.status,
    rawMessage:
      input.rawMessage ||
      debugLog?.error?.rawMessage ||
      candidate.message ||
      AI_GENERIC_ERROR_MESSAGE,
    willRetry: input.willRetry,
    aiRequest: input.geminiRequest || debugLog?.aiRequest || debugLog?.geminiRequest,
    aiResponse: response
      ? {
          status: response.status,
          body: response.body,
        }
      : undefined,
    geminiRequest: input.geminiRequest || debugLog?.geminiRequest,
    geminiResponse: response
      ? {
          status: response.status,
          body: response.body,
        }
      : undefined,
  };
}

function attachAttemptsToError(error, attempts, debugContext) {
  if (error && typeof error === 'object' && error.aiDebugLog) {
    error.aiDebugLog = {
      ...error.aiDebugLog,
      attempts: sanitizeAttemptLogs(attempts),
    };
    return error;
  }

  return createLoggedAiError(debugContext, {
    rawMessage:
      error instanceof Error ? error.message : 'No se pudo completar la solicitud con IA.',
    attempts,
  });
}

function maskApiKey(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return '[redacted]';
  if (trimmed.length <= 8) return '[redacted]';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function sanitizeDebugValue(value, path = []) {
  if (typeof value === 'string') {
    const currentKey = path[path.length - 1] || '';
    const parentKey = path[path.length - 2] || '';

    if (/api[-_]?key/i.test(currentKey)) {
      return maskApiKey(value);
    }

    if (currentKey === 'dataBase64' || (currentKey === 'data' && parentKey === 'inlineData')) {
      return {
        omitted: true,
        base64Length: value.length,
        approxBytes: estimateBase64Size(value),
      };
    }

    if (value.length > 8000) {
      return `${value.slice(0, 8000)}... [truncated ${value.length - 8000} chars]`;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => sanitizeDebugValue(entry, [...path, String(index)]));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        sanitizeDebugValue(entryValue, [...path, key]),
      ])
    );
  }

  return value;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createLoggedAiError(debugContext, options) {
  const error = new Error(AI_GENERIC_ERROR_MESSAGE);
  error.userMessage = AI_GENERIC_ERROR_MESSAGE;
  error.statusCode = options.statusCode >= 400 ? options.statusCode : 502;
  error.aiDebugLog = {
    id: createDebugLogId(debugContext.flow),
    occurredAt: new Date().toISOString(),
    flow: debugContext.flow,
    transport: debugContext.transport,
    stage: options.stage || debugContext.stage,
    targetProfile: debugContext.targetProfile,
    profilePrefix: debugContext.profilePrefix,
    requestMode: debugContext.requestMode,
    requestedModel: debugContext.requestedModel,
    selectedModel: debugContext.selectedModel,
    aiProvider: debugContext.aiProvider,
    apiKeySource: debugContext.apiKeySource,
    requestPayload: sanitizeDebugValue(debugContext.payload),
    aiRequest: sanitizeDebugValue(options.geminiRequest),
    aiResponse: options.geminiResponse
      ? {
          status: options.geminiResponse.status,
          body: sanitizeDebugValue(options.geminiResponse.body),
        }
      : undefined,
    geminiRequest: sanitizeDebugValue(options.geminiRequest),
    geminiResponse: options.geminiResponse
      ? {
          status: options.geminiResponse.status,
          body: sanitizeDebugValue(options.geminiResponse.body),
        }
      : undefined,
    attempts: sanitizeAttemptLogs(options.attempts),
    error: {
      message: AI_GENERIC_ERROR_MESSAGE,
      rawMessage: options.rawMessage,
    },
  };
  return error;
}

function getMaxOutputTokens(modelName, requestMode) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  const hardLimit = normalized.includes('gemini-2.0') || normalized.includes('gemma') ? 8192 : 65536;
  const desired = requestMode === 'adjust' ? 4096 : 16384;
  return Math.min(desired, hardLimit);
}

function getThinkingConfig(modelName, debugContext) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  const requestMode = debugContext?.requestMode || 'generate';

  if (normalized.includes('gemini-3')) {
    if (normalized.includes('pro')) {
      return {
        thinkingLevel: requestMode === 'adjust' ? 'low' : 'medium',
      };
    }

    return {
      thinkingLevel: requestMode === 'adjust' ? 'minimal' : 'low',
    };
  }

  if (normalized.includes('gemini-2.5-pro')) {
    return {
      thinkingBudget: requestMode === 'adjust' ? 256 : 1024,
    };
  }

  if (normalized.includes('gemini-2.5-flash')) {
    return {
      thinkingBudget: 0,
    };
  }

  return undefined;
}

function buildMealItemSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: MEAL_ITEM_REQUIRED_KEYS,
    properties: {
      nombre: { type: 'string', maxLength: 90 },
      porciones: { type: 'string', maxLength: 160 },
      detalle: { type: 'string', maxLength: 240 },
      tags: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 32 } },
      super: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 48 } },
    },
  };
}

function buildMomentDistributionSchema() {
  return {
    type: 'object',
    required: ['momento', ...FOOD_GROUP_KEYS],
    properties: {
      momento: { type: 'string' },
      ...Object.fromEntries(FOOD_GROUP_KEYS.map((groupKey) => [groupKey, { type: 'integer' }])),
    },
  };
}

function buildDailyDistributionSchema() {
  return {
    type: 'array',
    items: {
      type: 'object',
      required: ['grupo', 'total', 'detalle'],
      properties: {
        grupo: { type: 'string' },
        total: { type: 'integer' },
        detalle: { type: 'string' },
      },
    },
  };
}

function buildMomentTimeSchema() {
  return {
    type: 'object',
    required: ['key', 'label', 'hora'],
    properties: {
      key: { type: 'string' },
      label: { type: 'string' },
      hora: { type: 'string' },
    },
  };
}

function buildProfileSchema(partial = false) {
  return {
    type: 'object',
    required: partial ? [] : PROFILE_REQUIRED_KEYS,
    properties: {
      id: { type: 'string' },
      nombre: { type: 'string' },
      perfil: { type: 'string' },
      detallesPerfil: { type: 'string' },
      meta: { type: 'string' },
      metaCaloricaKcalDia: { type: 'integer' },
      descripcion: { type: 'string' },
      edad: { type: 'integer' },
      horariosTexto: { type: 'string' },
      notaSalud: { type: 'string' },
      momentos: {
        type: 'array',
        items: buildMomentTimeSchema(),
      },
      objetivosPorMomento: {
        type: 'array',
        items: buildMomentDistributionSchema(),
      },
      distribucionDiaria: buildDailyDistributionSchema(),
      resumenPersonal: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arreglo con breves frases de resumen y justificación del plan.'
      },
    },
  };
}

function buildEquivalenciasSchema() {
  return {
    type: 'array',
    items: {
      type: 'object',
      required: ['titulo', 'icon', 'items'],
      properties: {
        titulo: { type: 'string' },
        icon: { type: 'string' },
        items: { type: 'array', items: { type: 'string' } },
      },
    },
  };
}

function buildSuplementosSchema() {
  return {
    type: 'array',
    items: { type: 'string' },
  };
}

function buildPlanSlotSchema() {
  return {
    type: 'object',
    required: ['dia', 'momento', 'opciones'],
    properties: {
      dia: { type: 'string' },
      momento: { type: 'string' },
      opciones: {
        type: 'array',
        items: {
          type: 'object',
          required: ['idRef', 'porciones', 'detalle', 'caloriasKcal', 'proteinaG', 'grasasG'],
          properties: {
            idRef: { type: 'string' },
            porciones: { type: 'string' },
            detalle: { type: 'string' },
            caloriasKcal: { type: 'integer' },
            proteinaG: { type: 'integer' },
            grasasG: { type: 'integer' },
          }
        }
      }
    },
  };
}

function buildPlanSlotsSchema(requireAllSlots) {
  return {
    type: 'array',
    items: buildPlanSlotSchema(),
  };
}

function buildFullResponseSchema(prefix) {
  const profileKey = `perfil${prefix}`;
  const suplementosKey = `suplementos${prefix}`;
  const planTransportKey = `planSemanal${prefix}`;
  return {
    type: 'object',
    required: [profileKey, suplementosKey, planTransportKey],
    properties: {
      [profileKey]: buildProfileSchema(false),
      [suplementosKey]: buildSuplementosSchema(),
      [planTransportKey]: buildPlanSlotsSchema(true),
    },
  };
}

function buildAdjustResponseSchema() {
  return {
    type: 'object',
    required: ['summary'],
    properties: {
      summary: {
        type: 'array',
        items: { type: 'string' },
      },
      noChangesReason: { type: 'string' },
      profilePatch: buildProfileSchema(true),
      suplementos: buildSuplementosSchema(),
      planPatchSlots: buildPlanSlotsSchema(false),
    },
  };
}

function buildPlanOnlyResponseSchema(prefix) {
  const planTransportKey = `planSemanal${prefix}`;
  return {
    type: 'object',
    required: [planTransportKey],
    properties: {
      [planTransportKey]: buildPlanSlotsSchema(true),
    },
  };
}

function buildGenerationOutputContract(prefix) {
  return {
    rootKeys: [
      `perfil${prefix}`,
      `suplementos${prefix}`,
      `planSemanal${prefix}`,
    ],
    fixedDays: WEEK_DAYS,
    fixedMoments: MEAL_MOMENT_KEYS,
    slotOrdering: {
      days: WEEK_DAYS,
      moments: MEAL_MOMENT_KEYS,
      rule: 'Ordena los slots por dia y dentro de cada dia por momento.',
    },
    fixedFoodGroups: FOOD_GROUP_KEYS,
    profileRequiredKeys: PROFILE_REQUIRED_KEYS,
    objetivosPorMomentoFormat: {
      type: 'array',
      itemKeys: ['momento', ...FOOD_GROUP_KEYS],
    },
    distribucionDiariaFormat: {
      type: 'array',
      itemKeys: ['grupo', 'total', 'detalle'],
      requiredGroups: FOOD_GROUP_KEYS,
    },
    mealsRequiredKeys: MEAL_ITEM_REQUIRED_KEYS,
    supplementRequiredKeys: SUPPLEMENT_REQUIRED_KEYS,
  };
}

function cloneSerializableData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDayName(day) {
  if (typeof day !== 'string') return '';
  return day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (match) => match.toUpperCase());
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIntegerValue(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function coerceIntegerValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return Math.round(Number(trimmed));
    }
  }

  return null;
}

function normalizeNutritionToken(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function hasRecognizablePortions(value) {
  if (!isNonEmptyString(value)) return false;
  const knownTokens = new Set([
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

  for (const match of normalizeNutritionToken(value).matchAll(/(?:(\d+(?:[.,]\d+)?)\s*([a-z_]+)|([a-z_]+)\s*(\d+(?:[.,]\d+)?))/g)) {
    const token = (match[2] || match[3] || '').trim();
    if (knownTokens.has(token)) return true;
  }

  return false;
}

function findCatalogMealByIdRef(idRef, payload) {
  if (!isNonEmptyString(idRef)) return null;
  const [baseId] = idRef.split('|MOD:');
  const base = baseId.trim();
  return (payload?.mealsCatalog || []).find((item) => item?.id === base) || null;
}

function normalizeMealOptionAgainstCatalog(meal, catalogMeal) {
  if (!meal || typeof meal !== 'object' || !catalogMeal) return meal;

  const normalizedMeal = { ...meal };
  const fallbackName = isNonEmptyString(catalogMeal.nombre) ? catalogMeal.nombre : normalizedMeal.nombre;

  if (!isNonEmptyString(normalizedMeal.nombre) && fallbackName) {
    normalizedMeal.nombre = fallbackName;
  }

  normalizedMeal.porciones = stripProfileCalorieAdjustmentNote(normalizedMeal.porciones);

  if (!isNonEmptyString(normalizedMeal.porciones)) {
    normalizedMeal.porciones = 'Porcion ajustada segun objetivo, horario y restricciones del perfil.';
  }

  ['caloriasKcal', 'proteinaG', 'grasasG'].forEach((fieldName) => {
    const coercedValue = coerceIntegerValue(normalizedMeal[fieldName]);
    if (coercedValue !== null) {
      normalizedMeal[fieldName] = coercedValue;
    }
  });

  if (
    !String(normalizedMeal.idRef || '').includes('|MOD:') &&
    shouldReplaceMealDetail(normalizedMeal.detalle, fallbackName, catalogMeal.super)
  ) {
    normalizedMeal.detalle = buildCanonicalMealDetail(fallbackName, catalogMeal.super);
  }

  return normalizedMeal;
}

function shouldReplaceMealDetail(detail, mealName, ingredients) {
  if (!isNonEmptyString(detail)) return true;
  const stopwords = new Set(['a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'sin', 'un', 'una', 'y']);
  const allowed = new Set(
    [mealName, ...(ingredients || [])]
      .flatMap((entry) =>
        normalizeNutritionToken(entry)
          .split(/[^a-z0-9]+/g)
          .filter((token) => token.length >= 3 && !stopwords.has(token))
      )
  );
  const detailTokens = normalizeNutritionToken(detail)
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3 && !stopwords.has(token));
  const overlap = detailTokens.reduce((acc, token) => acc + (allowed.has(token) ? 1 : 0), 0);
  const minimumOverlap = Array.isArray(ingredients) && ingredients.length >= 4 ? 2 : 1;
  return overlap < minimumOverlap;
}

function getExpectedProfileId(prefix) {
  return prefix === 'EL' ? 'el' : 'ella';
}

function getExpectedProfileName(prefix) {
  return prefix === 'EL' ? 'El' : 'Ella';
}

function sanitizeMomentArray(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      key: typeof entry.key === 'string' ? entry.key : '',
      label: typeof entry.label === 'string' ? entry.label : '',
      hora: typeof entry.hora === 'string' ? entry.hora : '',
    }))
    .filter((entry) => entry.key && entry.label);
}

function resolveMomentSource(payload, prefix) {
  const profileId = getExpectedProfileId(prefix);
  const sources = [
    payload?.planConfig?.selectedMoments,
    payload?.currentContext?.[profileId]?.perfil?.momentos,
    payload?.originalContext?.[profileId]?.perfil?.momentos,
  ];

  for (const source of sources) {
    const normalized = sanitizeMomentArray(source);
    if (normalized.length) return normalized;
  }

  return [];
}

function createInvalidStructureError(debugContext, rawMessage, geminiRequest, geminiResponseBody, modelName) {
  return createLoggedAiError(
    {
      ...debugContext,
      stage: 'response-parse',
      selectedModel: modelName,
    },
    {
      rawMessage,
      statusCode: 200,
      geminiRequest,
      geminiResponse: {
        status: 200,
        body: geminiResponseBody,
      },
    }
  );
}

function validateRequiredStringField(container, fieldName, location, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!isNonEmptyString(container?.[fieldName])) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location}.${fieldName} esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }
}

function validateRequiredIntegerField(container, fieldName, location, debugContext, geminiRequest, geminiResponseBody, modelName) {
  const coercedValue = coerceIntegerValue(container?.[fieldName]);
  if (coercedValue !== null) {
    container[fieldName] = coercedValue;
    return;
  }

  if (!isIntegerValue(container?.[fieldName])) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location}.${fieldName} no es un entero valido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }
}

function validateMealItemStructure(item, location, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} no es un objeto de comida valido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  validateRequiredStringField(item, 'nombre', location, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(item, 'porciones', location, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(item, 'detalle', location, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredIntegerField(item, 'caloriasKcal', location, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredIntegerField(item, 'proteinaG', location, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredIntegerField(item, 'grasasG', location, debugContext, geminiRequest, geminiResponseBody, modelName);

  if (!Array.isArray(item.tags)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location}.tags debe ser un arreglo.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  if (!Array.isArray(item.super)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location}.super debe ser un arreglo.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }
}

function validateMealOptionsArray(options, location, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!Array.isArray(options) || options.length !== 3) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} debe incluir exactamente 3 opciones.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  options.forEach((meal, index) => {
    if (!meal || typeof meal !== 'object' || !isNonEmptyString(meal.idRef)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] no tiene idRef valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    const catalogMeal = findCatalogMealByIdRef(meal.idRef, debugContext.payload);
    if (!catalogMeal) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}].idRef no existe en el catalogo permitido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    const normalizedMeal = normalizeMealOptionAgainstCatalog(meal, catalogMeal);
    options[index] = normalizedMeal;
    validateRequiredStringField(normalizedMeal, 'porciones', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(normalizedMeal, 'caloriasKcal', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(normalizedMeal, 'proteinaG', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(normalizedMeal, 'grasasG', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(
      normalizedMeal,
      'detalle',
      `${location}[${index}]`,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );

    if (
      hasRecognizablePortions(normalizedMeal.porciones) &&
      Number(normalizedMeal.caloriasKcal) <= 0 &&
      Number(normalizedMeal.proteinaG) <= 0 &&
      Number(normalizedMeal.grasasG) <= 0
    ) {
      normalizedMeal.caloriasKcal = Number(normalizedMeal.caloriasKcal) || 0;
      normalizedMeal.proteinaG = Number(normalizedMeal.proteinaG) || 0;
      normalizedMeal.grasasG = Number(normalizedMeal.grasasG) || 0;
    }
  });
}

function validateEquivalenciasStructure(equivalencias, location, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!Array.isArray(equivalencias) || equivalencias.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  equivalencias.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] no es un objeto valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    validateRequiredStringField(item, 'titulo', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(item, 'icon', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);

    if (!ALLOWED_ICONS.includes(item.icon)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}].icon no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (!Array.isArray(item.items) || item.items.length === 0 || item.items.some((entry) => !isNonEmptyString(entry))) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}].items esta vacio o invalido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }
  });
}

function validateSupplementsStructure(supplements, location, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!Array.isArray(supplements)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} debe ser un arreglo.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  const allowedSupplementIds = new Set(
    Array.isArray(debugContext?.payload?.supplementsCatalog)
      ? debugContext.payload.supplementsCatalog
          .map((item) => (item && typeof item === 'object' ? item.id : ''))
          .filter(Boolean)
      : []
  );

  supplements.forEach((item, index) => {
    if (!item || typeof item !== 'string') {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] no es un string válido (debe ser un ID).`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (allowedSupplementIds.size > 0 && !allowedSupplementIds.has(item)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] no existe en supplementsCatalog.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }
  });
}

function validateProfileStructure(perfil, profilePrefix, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: falta perfil${profilePrefix}.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  validateRequiredStringField(perfil, 'id', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'nombre', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'perfil', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'detallesPerfil', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'meta', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredIntegerField(perfil, 'metaCaloricaKcalDia', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'descripcion', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredIntegerField(perfil, 'edad', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'horariosTexto', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);
  validateRequiredStringField(perfil, 'notaSalud', `perfil${profilePrefix}`, debugContext, geminiRequest, geminiResponseBody, modelName);

  if (!Array.isArray(perfil.momentos) || perfil.momentos.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      'Respuesta de IA incompleta: el perfil no incluyo momentos.',
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  perfil.momentos.forEach((momento, index) => {
    if (!momento || typeof momento !== 'object' || Array.isArray(momento)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: perfil${profilePrefix}.momentos[${index}] no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    validateRequiredStringField(momento, 'key', `perfil${profilePrefix}.momentos[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(momento, 'label', `perfil${profilePrefix}.momentos[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(momento, 'hora', `perfil${profilePrefix}.momentos[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
  });

  const momentKeys = perfil.momentos.map((moment) => moment?.key).filter(Boolean);
  if (!momentKeys.length) {
    throw createInvalidStructureError(
      debugContext,
      'Respuesta de IA incompleta: el perfil no incluyo keys de momentos validas.',
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  if (Array.isArray(perfil.objetivosPorMomento)) {
    const normalizedGoals = {};
    const seenGoalMoments = new Set();

    perfil.objetivosPorMomento.forEach((distribution, index) => {
      if (!distribution || typeof distribution !== 'object' || Array.isArray(distribution)) {
        throw createInvalidStructureError(
          debugContext,
          `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento[${index}] es invalido.`,
          geminiRequest,
          geminiResponseBody,
          modelName
        );
      }

      validateRequiredStringField(
        distribution,
        'momento',
        `perfil${profilePrefix}.objetivosPorMomento[${index}]`,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );

      const momentKey = distribution.momento.trim();
      if (!momentKeys.includes(momentKey)) {
        throw createInvalidStructureError(
          debugContext,
          `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento[${index}].momento no corresponde a un momento valido.`,
          geminiRequest,
          geminiResponseBody,
          modelName
        );
      }

      if (seenGoalMoments.has(momentKey)) {
        throw createInvalidStructureError(
          debugContext,
          `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento repitio el momento ${momentKey}.`,
          geminiRequest,
          geminiResponseBody,
          modelName
        );
      }

      const remappedGoals = remapFoodGroupRow(distribution);
      FOOD_GROUP_KEYS.forEach((groupKey) => {
        if (!isIntegerValue(remappedGoals[groupKey])) {
          throw createInvalidStructureError(
            debugContext,
            `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento[${index}].${groupKey} no es entero.`,
            geminiRequest,
            geminiResponseBody,
            modelName
          );
        }
      });

      normalizedGoals[momentKey] = Object.fromEntries(
        FOOD_GROUP_KEYS.map((groupKey) => [groupKey, remappedGoals[groupKey]])
      );
      seenGoalMoments.add(momentKey);
    });

    perfil.objetivosPorMomento = normalizedGoals;
  }

  if (!perfil.objetivosPorMomento || typeof perfil.objetivosPorMomento !== 'object' || Array.isArray(perfil.objetivosPorMomento)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento es invalido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  momentKeys.forEach((momentKey) => {
    const distribution = perfil.objetivosPorMomento?.[momentKey];
    if (!distribution || typeof distribution !== 'object' || Array.isArray(distribution)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento.${momentKey} es invalido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    const remappedMoment = remapFoodGroupRow(distribution);
    FOOD_GROUP_KEYS.forEach((groupKey) => {
      if (!isIntegerValue(remappedMoment[groupKey])) {
        throw createInvalidStructureError(
          debugContext,
          `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento.${momentKey}.${groupKey} no es entero.`,
          geminiRequest,
          geminiResponseBody,
          modelName
        );
      }
    });
    perfil.objetivosPorMomento[momentKey] = Object.fromEntries(
      FOOD_GROUP_KEYS.map((groupKey) => [groupKey, remappedMoment[groupKey]])
    );
  });

  if (!Array.isArray(perfil.distribucionDiaria) || perfil.distribucionDiaria.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: perfil${profilePrefix}.distribucionDiaria esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  const seenDistributionGroups = new Set();
  perfil.distribucionDiaria.forEach((item, index) => {
    validateRequiredStringField(item, 'grupo', `perfil${profilePrefix}.distribucionDiaria[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(item, 'total', `perfil${profilePrefix}.distribucionDiaria[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(item, 'detalle', `perfil${profilePrefix}.distribucionDiaria[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);

    const resolvedGrupo = resolveFoodGroupKey(item.grupo.trim());
    if (!resolvedGrupo || !FOOD_GROUP_KEYS.includes(resolvedGrupo)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: perfil${profilePrefix}.distribucionDiaria[${index}].grupo no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }
    item.grupo = resolvedGrupo;
    const groupKey = resolvedGrupo;

    if (seenDistributionGroups.has(groupKey)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: perfil${profilePrefix}.distribucionDiaria repitio el grupo ${groupKey}.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    seenDistributionGroups.add(groupKey);
  });

  FOOD_GROUP_KEYS.forEach((groupKey) => {
    if (!seenDistributionGroups.has(groupKey)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: perfil${profilePrefix}.distribucionDiaria no incluyo el grupo ${groupKey}.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }
  });

  return momentKeys;
}

function buildPlanObjectFromSlots(slots, expectedMomentKeys, location, requireAllSlots, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  const plan = {};
  const seenSlots = new Set();

  slots.forEach((slot, index) => {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] no es un slot valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    const dia = normalizeDayName(slot.dia);
    const momento = typeof slot.momento === 'string' ? slot.momento.trim() : '';
    if (!WEEK_DAYS.includes(dia)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}].dia no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (!expectedMomentKeys.includes(momento)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}].momento no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    const slotKey = `${dia}.${momento}`;
    if (seenSlots.has(slotKey)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location} repitio el slot ${slotKey}.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    validateMealOptionsArray(
      slot.opciones,
      `${location}[${index}].opciones`,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );

    if (!plan[dia]) {
      plan[dia] = {};
    }

    plan[dia][momento] = slot.opciones;
    seenSlots.add(slotKey);
  });

  if (!requireAllSlots) {
    return plan;
  }

  const missingSlots = [];
  WEEK_DAYS.forEach((dayKey) => {
    expectedMomentKeys.forEach((momentKey) => {
      if (!Array.isArray(plan?.[dayKey]?.[momentKey]) || plan[dayKey][momentKey].length !== 3) {
        missingSlots.push(`${dayKey}.${momentKey}`);
      }
    });
  });

  if (missingSlots.length > 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: faltan secciones en ${missingSlots.join(', ')}.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  return plan;
}

function validateLegacyPlanStructure(plan, expectedMomentKeys, location, requireAllSlots, debugContext, geminiRequest, geminiResponseBody, modelName) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} no tiene un formato valido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  const normalizedPlan = Object.fromEntries(
    Object.entries(plan).map(([dayKey, dayValue]) => [normalizeDayName(dayKey), dayValue])
  );

  const missingSlots = [];

  Object.entries(normalizedPlan).forEach(([dayKey, dayValue]) => {
    if (!dayValue || typeof dayValue !== 'object' || Array.isArray(dayValue)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}.${dayKey} no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    expectedMomentKeys.forEach((momentKey) => {
      const options = dayValue[momentKey];
      if (!Array.isArray(options)) {
        if (requireAllSlots) {
          missingSlots.push(`${dayKey}.${momentKey}`);
        }
        return;
      }

      validateMealOptionsArray(
        options,
        `${location}.${dayKey}.${momentKey}`,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    });
  });

  if (requireAllSlots) {
    WEEK_DAYS.forEach((dayKey) => {
      if (!normalizedPlan[dayKey]) {
        missingSlots.push(dayKey);
      }
    });
  }

  if (missingSlots.length > 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: faltan secciones en ${missingSlots.join(', ')}.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  return normalizedPlan;
}

const MOMENT_CALORIE_WEIGHTS = {
  desayuno: 0.25,
  colacion_am: 0.10,
  comida: 0.35,
  colacion_pm: 0.10,
  cena: 0.20,
};

const MOMENT_PROTEIN_WEIGHTS = {
  desayuno: 0.24,
  colacion_am: 0.08,
  comida: 0.36,
  colacion_pm: 0.08,
  cena: 0.24,
};

function parseWeightFromProfile(profile) {
  const directCandidates = [
    profile?.currentWeightKg,
    profile?.pesoKg,
    profile?.weightKg,
  ];
  for (const candidate of directCandidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const match = String(profile?.perfil || '').match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (!match) return 0;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getProfileCalorieTarget(profile) {
  const target = Number(profile?.metaCaloricaKcalDia);
  return Number.isFinite(target) && target >= 1200 ? Math.round(target) : 0;
}

function getDailyProteinTarget(profile) {
  const weightKg = parseWeightFromProfile(profile);
  if (weightKg > 0) {
    return Math.round(Math.min(170, Math.max(80, weightKg * 1.4)));
  }

  const calories = getProfileCalorieTarget(profile);
  return calories ? Math.round(Math.min(160, Math.max(75, calories * 0.24 / 4))) : 100;
}

function roundToStep(value, step = 5) {
  return Math.round(value / step) * step;
}

function normalizeMealNutritionToTargets(meal, momentKey, profile) {
  if (!meal || typeof meal !== 'object') return meal;

  meal.porciones = stripProfileCalorieAdjustmentNote(meal.porciones);

  const caloriesTarget = getProfileCalorieTarget(profile);
  if (!caloriesTarget) return meal;

  const momentWeight = MOMENT_CALORIE_WEIGHTS[momentKey] || 0.2;
  const targetCalories = roundToStep(caloriesTarget * momentWeight, 10);
  const currentCalories = Number(meal.caloriasKcal || 0);
  const shouldAdjustCalories =
    !Number.isFinite(currentCalories) ||
    currentCalories <= 0 ||
    currentCalories < targetCalories * 0.85 ||
    currentCalories > targetCalories * 1.15;

  if (shouldAdjustCalories) {
    meal.caloriasKcal = targetCalories;
    meal.aiMeta = {
      ...(meal.aiMeta || {}),
      normalizedByProfile: true,
      normalizedTargetKcal: targetCalories,
      profileId: profile?.id === 'ella' ? 'ella' : profile?.id === 'el' ? 'el' : meal.aiMeta?.profileId,
    };
  } else {
    meal.caloriasKcal = Math.round(currentCalories);
  }

  const dailyProteinTarget = getDailyProteinTarget(profile);
  const proteinTarget = Math.round(dailyProteinTarget * (MOMENT_PROTEIN_WEIGHTS[momentKey] || 0.2));
  const maxProteinForMeal = Math.max(proteinTarget, Math.floor(meal.caloriasKcal * 0.45 / 4));
  const currentProtein = Number(meal.proteinaG || 0);
  meal.proteinaG = Math.min(
    maxProteinForMeal,
    Math.max(
      Math.round(proteinTarget * 0.85),
      Number.isFinite(currentProtein) && currentProtein > 0 ? Math.round(currentProtein) : 0
    )
  );

  const targetFat = Math.round((meal.caloriasKcal * 0.30) / 9);
  const currentFat = Number(meal.grasasG || 0);
  if (!Number.isFinite(currentFat) || currentFat <= 0) {
    meal.grasasG = targetFat;
  } else {
    const cappedFat = Math.min(Math.round(currentFat), Math.round((meal.caloriasKcal * 0.45) / 9));
    meal.grasasG = Math.max(Math.round(targetFat * 0.65), cappedFat);
  }

  return meal;
}

function normalizePlanNutritionToProfile(plan, profile) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan) || !getProfileCalorieTarget(profile)) {
    return plan;
  }

  WEEK_DAYS.forEach((dayKey) => {
    const dayPlan = plan[dayKey];
    if (!dayPlan || typeof dayPlan !== 'object' || Array.isArray(dayPlan)) return;

    MEAL_MOMENT_KEYS.forEach((momentKey) => {
      const options = dayPlan[momentKey];
      if (!Array.isArray(options)) return;
      options.forEach((meal) => normalizeMealNutritionToTargets(meal, momentKey, profile));
    });
  });

  return plan;
}

function validateAndNormalizeAiData(data, debugContext, geminiRequest, geminiResponseBody, modelName) {
  const profilePrefix = debugContext.profilePrefix;
  const requestMode = debugContext.requestMode;

  if (!profilePrefix) return data;

  if (requestMode === 'adjust') {
    if (!Array.isArray(data?.summary) || data.summary.length === 0) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: el ajuste no incluyo summary.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (data.profilePatch !== undefined && (typeof data.profilePatch !== 'object' || data.profilePatch === null || Array.isArray(data.profilePatch))) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: profilePatch no tiene un formato valido.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (data.suplementos !== undefined) {
      validateSupplementsStructure(
        data.suplementos,
        'suplementos',
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (Array.isArray(data.planPatchSlots) && data.planPatchSlots.length > 0) {
      data.planPatch = buildPlanObjectFromSlots(
        data.planPatchSlots,
        MEAL_MOMENT_KEYS,
        'planPatchSlots',
        false,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
      delete data.planPatchSlots;
    } else if (data.planPatch !== undefined) {
      data.planPatch = validateLegacyPlanStructure(
        data.planPatch,
        MEAL_MOMENT_KEYS,
        'planPatch',
        false,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (!data.planPatch && !data.noChangesReason && !data.profilePatch && !data.suplementos) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: el ajuste no incluyo cambios ni noChangesReason.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (data.noChangesReason !== undefined && !isNonEmptyString(data.noChangesReason)) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: noChangesReason esta vacio.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (data.summary.some((entry) => !isNonEmptyString(entry))) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: summary contiene lineas vacias.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    return data;
  }

  const normalized = cloneSerializableData(data || {});
  const perfilKey = `perfil${profilePrefix}`;
  const supplementsKey = `suplementos${profilePrefix}`;
  const planKey = `plan${profilePrefix}`;
  const planTransportKey = `planSemanal${profilePrefix}`;
  const perfil = normalized[perfilKey];

  // Phase 2: support plan-only responses when profile was pre-computed locally
  const isPlanOnlyResponse = !perfil && Array.isArray(normalized[planTransportKey]);
  let momentKeys = MEAL_MOMENT_KEYS;

  if (!isPlanOnlyResponse) {
    if (perfil && typeof perfil === 'object' && !Array.isArray(perfil)) {
      if (!perfil.id) {
        perfil.id = getExpectedProfileId(profilePrefix);
      }

      if (!perfil.nombre) {
        perfil.nombre = getExpectedProfileName(profilePrefix);
      }

      if (!Array.isArray(perfil.momentos) || perfil.momentos.length === 0) {
        const sourceMoments = resolveMomentSource(debugContext.payload, profilePrefix);
        if (sourceMoments.length) {
          perfil.momentos = sourceMoments;
        }
      }
    }

    momentKeys = validateProfileStructure(
      perfil,
      profilePrefix,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );

    if (!Array.isArray(normalized[supplementsKey])) {
      normalized[supplementsKey] = [];
    }

    validateSupplementsStructure(
      normalized[supplementsKey],
      supplementsKey,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  if (Array.isArray(normalized[planTransportKey])) {
    normalized[planKey] = buildPlanObjectFromSlots(
      normalized[planTransportKey],
      momentKeys,
      planTransportKey,
      true,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
    delete normalized[planTransportKey];
  } else {
    normalized[planKey] = validateLegacyPlanStructure(
      normalized[planKey],
      momentKeys,
      planKey,
      true,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  normalizePlanNutritionToProfile(
    normalized[planKey],
    normalized[perfilKey] || debugContext.payload?.precomputedProfile
  );

  return normalized;
}

function isPlanRevisionRequest(payload) {
  return payload?.requestMode === 'adjust' || payload?.requestMode === 'regenerate';
}

function estimateBase64Size(base64Value) {
  const sanitized = typeof base64Value === 'string' ? base64Value.replace(/\s/g, '') : '';
  if (!sanitized) return 0;

  const padding = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
  return Math.floor((sanitized.length * 3) / 4) - padding;
}

function validateAssessmentPdf(pdf) {
  if (!pdf) return { ok: true };
  if (typeof pdf !== 'object') {
    return { ok: false, status: 400, error: 'assessmentReportPdf invalido.' };
  }

  if (pdf.mimeType !== 'application/pdf') {
    return { ok: false, status: 400, error: 'El reporte corporal adjunto debe ser un PDF.' };
  }

  if (typeof pdf.dataBase64 !== 'string' || !pdf.dataBase64.trim()) {
    return { ok: false, status: 400, error: 'El PDF adjunto esta vacio o no se pudo leer.' };
  }

  if (estimateBase64Size(pdf.dataBase64) > MAX_ASSESSMENT_PDF_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `El reporte corporal adjunto supera el limite de ${MAX_ASSESSMENT_PDF_MB} MB.`,
    };
  }

  return { ok: true };
}

function validatePayloadAssessmentPdfs(payload) {
  const scopes = [payload, payload?.el, payload?.ella];

  for (const scope of scopes) {
    const result = validateAssessmentPdf(scope?.assessmentReportPdf);
    if (!result.ok) return result;
  }

  return { ok: true };
}

function truncatePromptText(value, maxLength = 240) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function compactPromptMoments(moments) {
  if (!Array.isArray(moments)) {
    return moments;
  }

  return moments
    .filter((moment) => moment && typeof moment === 'object')
    .map((moment) => ({
      key: moment.key,
      hora: moment.hora,
    }));
}

function compactPromptBodyMeasurements(bodyMeasurements) {
  if (!bodyMeasurements || typeof bodyMeasurements !== 'object' || Array.isArray(bodyMeasurements)) {
    return bodyMeasurements;
  }

  return Object.fromEntries(
    Object.entries(bodyMeasurements).filter(([, value]) => value !== '' && value != null)
  );
}

function compactPromptPlanConfig(planConfig) {
  if (!planConfig || typeof planConfig !== 'object' || Array.isArray(planConfig)) {
    return planConfig;
  }

  return {
    mealsPerDay: planConfig.mealsPerDay,
    selectedMoments: compactPromptMoments(planConfig.selectedMoments),
    manualPortions: planConfig.manualPortions,
    additionalNotes: truncatePromptText(planConfig.additionalNotes, 220),
  };
}

function compactPromptContextSection(section, maxLength = 220) {
  if (!section || typeof section !== 'object' || Array.isArray(section)) {
    return section;
  }

  return Object.fromEntries(
    Object.entries(section)
      .filter(([, value]) => value !== '' && value != null)
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? truncatePromptText(value, maxLength) : value,
      ])
  );
}

function sanitizePromptPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const nextPayload = {
    targetProfile: payload.targetProfile,
    profileToUpdate: payload.profileToUpdate,
    portionMode: payload.portionMode,
    requestMode: payload.requestMode,
    instruction: truncatePromptText(payload.instruction, 320),
    planConfig: compactPromptPlanConfig(payload.planConfig),
    age: payload.age,
    currentWeightKg: payload.currentWeightKg,
    heightCm: payload.heightCm,
    targetWeightKg: payload.targetWeightKg,
    objectives: payload.objectives,
    objectiveTimeline: payload.objectiveTimeline,
    objectiveTimelineWeeks: payload.objectiveTimelineWeeks,
    diagnostics: truncatePromptText(payload.diagnostics, 220),
    allergies: truncatePromptText(payload.allergies, 160),
    medications: truncatePromptText(payload.medications, 180),
    intolerances: truncatePromptText(payload.intolerances, 160),
    digestiveSymptoms: truncatePromptText(payload.digestiveSymptoms, 180),
    favoriteFoods: truncatePromptText(payload.favoriteFoods, 220),
    dislikedFoods: truncatePromptText(payload.dislikedFoods, 180),
    favoriteCuisineStyles: truncatePromptText(payload.favoriteCuisineStyles, 160),
    cookingTime: payload.cookingTime,
    activityLevel: payload.activityLevel,
    wakeTime: payload.wakeTime,
    sleepTime: payload.sleepTime,
    trainingFrequency: payload.trainingFrequency,
    bodyMeasurements: compactPromptBodyMeasurements(payload.bodyMeasurements),
    profileContext: compactPromptContextSection(payload.profileContext, 180),
    healthContext: compactPromptContextSection(payload.healthContext, 180),
    preferences: compactPromptContextSection(payload.preferences, 180),
    routine: compactPromptContextSection(payload.routine, 120),
  };

  if (payload.assessmentReportPdf) {
    nextPayload.assessmentReportPdf = {
      name: payload.assessmentReportPdf.name,
      mimeType: payload.assessmentReportPdf.mimeType,
    };
  }

  if (payload.companionPlan) {
    nextPayload.companionPlan = compactPlanForPrompt(payload.companionPlan);
  }

  return Object.fromEntries(
    Object.entries(nextPayload).filter(([, value]) => {
      if (value == null) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    })
  );
}

function compactMealOptionForPrompt(meal) {
  if (!meal || typeof meal !== 'object') return meal;

  return {
    nombre: truncatePromptText(meal.nombre, 80),
    porciones: truncatePromptText(meal.porciones, 120),
    detalle: truncatePromptText(meal.detalle, 180),
    super: Array.isArray(meal.super)
      ? meal.super.slice(0, 5).map((item) => truncatePromptText(item, 40))
      : [],
  };
}

function compactPlanForPrompt(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return plan;
  }

  const compactPlan = {};

  WEEK_DAYS.forEach((dayKey) => {
    const dayPlan = plan[dayKey];
    if (!dayPlan || typeof dayPlan !== 'object' || Array.isArray(dayPlan)) {
      return;
    }

    const compactDay = {};
    MEAL_MOMENT_KEYS.forEach((momentKey) => {
      const options = dayPlan[momentKey];
      if (!Array.isArray(options) || options.length === 0) {
        return;
      }

      compactDay[momentKey] = options.slice(0, 3).map(compactMealOptionForPrompt);
    });

    if (Object.keys(compactDay).length > 0) {
      compactPlan[dayKey] = compactDay;
    }
  });

  return compactPlan;
}

function compactProfileForPrompt(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return profile;
  }

  return {
    id: profile.id,
    nombre: profile.nombre,
    perfil: truncatePromptText(profile.perfil, 60),
    detallesPerfil: truncatePromptText(profile.detallesPerfil, 220),
    meta: truncatePromptText(profile.meta, 160),
    notaSalud: truncatePromptText(profile.notaSalud, 160),
    horariosTexto: truncatePromptText(profile.horariosTexto, 120),
  };
}

function compactSnapshotForPrompt(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return snapshot;
  }

  return {
    perfil: compactProfileForPrompt(snapshot.perfil),
    plan: compactPlanForPrompt(snapshot.plan),
  };
}

function getOptionalPdfParts(payload) {
  const pdf = payload?.assessmentReportPdf;
  if (!pdf?.dataBase64 || pdf?.mimeType !== 'application/pdf') {
    return [];
  }

  return [
    {
      text:
        'Archivo adjunto opcional: reporte corporal del usuario en PDF. Usalo como contexto complementario junto con el cuestionario.',
    },
    {
      inlineData: {
        mimeType: pdf.mimeType,
        data: pdf.dataBase64,
      },
    },
  ];
}

function buildSystemPrompt(prefix) {
  const lowerPrefix = prefix.toLowerCase();
  const profileLabel = prefix === 'EL' ? 'El' : 'Ella';
  const planTransportKey = `planSemanal${prefix}`;

  return `Eres un nutricionista clinico experto. Genera un plan semanal completo, realista y consistente con el cuestionario.

Debes responder con un unico objeto JSON valido. No uses markdown, comentarios, texto fuera del JSON ni claves adicionales.

Perfil objetivo:
- id fijo: "${lowerPrefix}"
- nombre fijo: "${profileLabel}"

El perfil completo (incluyendo objetivosPorMomento, distribucionDiaria, suplementos, descripcion, meta, etc.) ya esta pre-calculado por la app. TU SOLO DEBES GENERAR EL PLAN SEMANAL.

Clave raiz obligatoria:
- ${planTransportKey}

Reglas criticas:
- No cambies id ni nombre.
- Usa exactamente estos dias dentro del JSON: ${WEEK_DAYS.join(', ')}.
- Usa exactamente estos momentos dentro del JSON: ${MEAL_MOMENT_KEYS.join(', ')}.
- En la clave 'opciones', cada comida debe ser un OBJETO que incluya 'idRef' extraido del "mealsCatalog".
- Cada entrada de "mealsCatalog" incluye id, nombre, tags y momentos. Usa el nombre de la receta para redactar un "detalle" corto y claro.
- CRITICO: Debes respetar ESTRICTAMENTE todo lo pedido en el cuestionario: preferencias alimenticias (ej. vegano, mexicano, asiático), restricciones medicas, ingredientes excluidos, tiempos de cocina, etc. Selecciona unicamente IDs del catalogo que casen con estas preferencias e ignora los demas.
- ${planTransportKey} debe ser un arreglo plano de 35 slots.
- Cada slot debe tener exactamente estas claves: dia, momento, opciones.
- Debe haber exactamente un slot por cada combinacion de dia + momento.
- Ordena los slots primero por dia (${WEEK_DAYS.join(', ')}) y dentro de cada dia por momento (${MEAL_MOMENT_KEYS.join(', ')}).
- Cada slot debe devolver exactamente 3 objetos en 'opciones'.
- No anides momentos dentro de dias ni dias dentro de objetos complejos; usa solo el arreglo plano de slots.
- Las calorias y macros deben ser enteros realistas y consistentes con las porciones; prioriza coherencia de receta y porciones sobre hacer calculos perfectos.
- No devuelvas objetos vacios, arreglos vacios para comidas ni slots con opciones incompletas.
- Si targetProfile = "ambos" y recibes companionPlan, conserva la misma preparacion base por dia, momento e indice; cambia solo porciones y macros cuando haga falta.
- Rotacion semanal: si no aplica la regla anterior de companionPlan, alterna idRef entre dias para el mismo momento (no repitas el mismo plato principal los 7 dias en el mismo horario si el catalogo ofrece alternativas compatibles con porciones y restricciones).
- No devuelvas null, undefined, placeholders, alias de claves ni dias con acentos distintos a los pedidos.`;
}

function buildUserPrompt(payload, prefix) {
  const precomputed = payload.precomputedProfile;
  return JSON.stringify({
    profilePrefix: prefix,
    questionnaire: sanitizePromptPayload(payload),
    mealsCatalog: payload.mealsCatalog || [],
    precomputedProfile: precomputed ? {
      perfil: precomputed.perfil,
      metaCaloricaKcalDia: precomputed.metaCaloricaKcalDia,
      objetivosPorMomento: precomputed.objetivosPorMomento,
      distribucionDiaria: precomputed.distribucionDiaria,
      momentos: precomputed.momentos,
      suplementos: payload.precomputedSupplements || [],
    } : undefined,
    outputHints: {
      rootKeys: [`planSemanal${prefix}`],
      selectedMomentsSource: 'questionnaire.planConfig.selectedMoments',
      slotCount: WEEK_DAYS.length * MEAL_MOMENT_KEYS.length,
      mealOptionsPerMoment: 3,
      noteToAI: `El perfil, objetivosPorMomento, distribucionDiaria y suplementos YA ESTAN PRE-CALCULADOS en 'precomputedProfile'. TU SOLO DEBES GENERAR 'planSemanal${prefix}'. En 'opciones' regresa objetos usando SOLO 'idRef' válidos de 'mealsCatalog'. Usa el campo 'nombre' para redactar un 'detalle' corto. OBLIGATORIO: recalcula 'porciones' con gramos realistas. Mantén macros/calorias como enteros razonables. Si piden ignorar/añadir fuera de bd, usa '|MOD: cambio' en el idRef. Variedad: alterna idRef entre dias por momento.${resolveClinicalProtocols(extractDiagnosticsText(payload))}`,
    },
  });
}

function buildRevisionSystemPrompt(prefix, mode) {
  const lowerPrefix = prefix.toLowerCase();
  const planTransportKey = `planSemanal${prefix}`;
  if (mode === 'regenerate') {
    return `Eres un nutricionista clinico experto. Reconstruye el plan semanal seleccionando IDs del "mealsCatalog" basandote en el contexto y las nuevas instrucciones.

Debes responder con un unico objeto JSON valido. No uses markdown.

El perfil objetivo es "${lowerPrefix}". Nunca cambies su id ni su nombre.

Debes devolver el plan COMPLETO con el mismo contrato de una generacion normal:
- perfil${prefix}
- suplementos${prefix}
- ${planTransportKey}

Reglas criticas:
- Usa exactamente los dias ${WEEK_DAYS.join(', ')}.
- Usa exactamente los momentos ${MEAL_MOMENT_KEYS.join(', ')}.
- ${planTransportKey} debe ser un arreglo plano de 35 slots.
- Cada slot debe tener dia, momento y la clave 'opciones' que es un arreglo de 3 objetos hibridos.
- Cada objeto dentro de 'opciones' debe tener su 'idRef' (valido del mealsCatalog) y recalcular porciones y detalle de forma coherente usando el 'nombre' de la receta.
- CRITICO: Respeta ESTRICTAMENTE: preferencias, estilo de comida, exclusions y restricciones. NUNCA metas algo que el usuario dijo excluir.
- En caso de duda, prioriza la coherencia. No devuelvas summary ni profilePatch.`;
  }

  return `Eres un nutricionista clinico experto. Ajusta solo las partes necesarias del plan actual segun la solicitud del usuario, eligiendo nuevos IDs de comida del "mealsCatalog" provisto, sin reescribir secciones que no cambian.

Debes responder con un unico objeto JSON valido. No uses markdown.

El perfil objetivo es "${lowerPrefix}". Nunca cambies su id ni su nombre.

Contrato exacto de salida:
- summary: arreglo obligatorio de 1 a 2 lineas cortas
- noChangesReason: string opcional si no hace falta cambiar nada
- profilePatch: objeto opcional con solo campos cambiados del perfil
- suplementos: arreglo opcional si cambian suplementos
- planPatchSlots: arreglo opcional con solo slots modificados

Reglas criticas:
- summary siempre debe explicar lo que cambiaste o por que no cambiaste nada.
- Si devuelves profilePatch.objetivosPorMomento, usa el mismo formato de arreglo por momento.
- Si usas planPatchSlots, incluye SOLO las combinaciones de dia + momento modificadas.
- En 'planPatchSlots', cada slot modificado debe tener 'opciones' con 3 objetos hibridos.
- Cada objeto debe tener un 'idRef' (valido del mealsCatalog).
- OBLIGATORIO: Asegura match perfecto con alergias, estilo de dieta, preferencias y restricciones del usuario (cuestionarioContext / currentContext).
- Nunca devuelvas el plan completo en modo adjust.
- profilePatch y suplementos son opcionales; omitelos si no cambian.
- Si solo cambian comidas, omite las demas secciones.`;
}

function buildRevisionUserPrompt(prefix, payload, profilePayload) {
  const outputMode = payload.requestMode === 'regenerate' ? 'full_regeneration' : 'delta_patch';
  const isRegenerate = payload.requestMode === 'regenerate';
  const precomputed = profilePayload?.precomputedProfile;
  return JSON.stringify({
    profilePrefix: prefix,
    mode: payload.requestMode,
    userInstruction: payload.instruction,
    mealsCatalog: payload.mealsCatalog || [],
    supplementsCatalog: payload.supplementsCatalog || [],
    questionnaireContext: sanitizePromptPayload(payload.questionnaireContext),
    currentContext: compactSnapshotForPrompt(profilePayload.currentContext),
    originalContext:
      isRegenerate
        ? compactSnapshotForPrompt(profilePayload.originalContext)
        : undefined,
    companionContext: compactSnapshotForPrompt(profilePayload.companionContext),
    precomputedProfile: precomputed ? {
      perfil: precomputed.perfil,
      metaCaloricaKcalDia: precomputed.metaCaloricaKcalDia,
      objetivosPorMomento: precomputed.objetivosPorMomento,
      distribucionDiaria: precomputed.distribucionDiaria,
      momentos: precomputed.momentos,
      suplementos: profilePayload?.precomputedSupplements || [],
    } : undefined,
    outputMode,
    outputNotes: {
      planTransportKey: isRegenerate ? `planSemanal${prefix}` : 'planPatchSlots',
      returnOnlyChangedSections: !isRegenerate,
      mealOptionsPerMoment: 3,
      noteToAI: isRegenerate && precomputed
        ? `El perfil, objetivosPorMomento, distribucionDiaria y suplementos YA ESTAN PRE-CALCULADOS en 'precomputedProfile'. TU SOLO DEBES GENERAR 'planSemanal${prefix}'. En 'opciones' regresa objetos usando SOLO 'idRef' válidos de 'mealsCatalog'. Usa el 'nombre' para mantener 'detalle' alineado. OBLIGATORIO: recalcula 'porciones' con gramos realistas. Mantén macros/calorias como enteros razonables. Si piden ignorar/añadir, usa '|MOD: cambio' en el idRef. Variedad: alterna idRef entre dias por momento.${resolveClinicalProtocols(extractDiagnosticsText(payload))}`
        : `En 'opciones' regresa objetos usando SOLO 'idRef' válidos tomados de 'mealsCatalog'. Usa el 'nombre' de la receta para mantener 'detalle' alineado. OBLIGATORIO: recalcula 'porciones' con gramos realistas coherentes con la receta. Mantén macros/calorias como enteros razonables; el ajuste fino se resolverá en código local. Si piden ignorar/añadir, usa '|MOD: cambio' en el idRef. Si cambias suplementos, usa SOLO IDs válidos de 'supplementsCatalog'. Variedad: alterna idRef entre dias por momento salvo regla companionPlan/Ambos.${resolveClinicalProtocols(extractDiagnosticsText(payload))}`,
    },
  });
}

function buildRequestParts(prefix, payload) {
  return [
    { text: buildUserPrompt(payload, prefix) },
    ...getOptionalPdfParts(payload),
  ];
}

function buildRevisionRequestParts(prefix, payload, profilePayload) {
  return [
    { text: buildRevisionUserPrompt(prefix, payload, profilePayload) },
  ];
}

function sanitizeAiJson(text) {
  if (!text) return '';

  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}
function shouldRetryStatusCode(statusCode) {
  return [408, 429, 500, 502, 503, 504].includes(Number(statusCode));
}

function getRetryErrorMeta(error) {
  const statusCode = error?.statusCode || error?.aiDebugLog?.geminiResponse?.status;
  const rawMessage = error?.aiDebugLog?.error?.rawMessage || error?.message || '';
  const normalizedMessage = String(rawMessage).toLowerCase();
  const modelUnavailable =
    Number(statusCode) === 404 &&
    (normalizedMessage.includes('model') || normalizedMessage.includes('modelo')) &&
    (normalizedMessage.includes('not found') ||
      normalizedMessage.includes('no encontrado') ||
      normalizedMessage.includes('not supported') ||
      normalizedMessage.includes('no disponible'));

  return {
    statusCode,
    rawMessage,
    normalizedMessage,
    modelUnavailable,
  };
}

function shouldRetrySameModel(error) {
  const { statusCode, normalizedMessage, modelUnavailable } = getRetryErrorMeta(error);

  if (modelUnavailable) {
    return false;
  }

  if (Number(statusCode) === 429 || normalizedMessage.includes('tiempo limite') || normalizedMessage.includes('timed out')) {
    return false;
  }

  return (
    [429, 500, 502, 503, 504].includes(Number(statusCode)) ||
    normalizedMessage.includes('high demand') ||
    normalizedMessage.includes('resource exhausted') ||
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('quota exceeded') ||
    normalizedMessage.includes('deadline exceeded') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('internal error') ||
    normalizedMessage.includes('backend error') ||
    normalizedMessage.includes('unavailable')
  );
}

function shouldRetryWithDifferentModel(error) {
  const { statusCode, normalizedMessage, modelUnavailable } = getRetryErrorMeta(error);

  if (Number(statusCode) === 429 || normalizedMessage.includes('tiempo limite') || normalizedMessage.includes('timed out')) {
    return false;
  }

  return (
    shouldRetryStatusCode(statusCode) ||
    modelUnavailable ||
    normalizedMessage.includes('high demand') ||
    normalizedMessage.includes('resource exhausted') ||
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('quota exceeded') ||
    normalizedMessage.includes('deadline exceeded') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('internal error') ||
    normalizedMessage.includes('backend error') ||
    normalizedMessage.includes('unavailable') ||
    normalizedMessage.includes('max_tokens') ||
    normalizedMessage.includes('max tokens') ||
    normalizedMessage.includes('respuesta de ia incompleta') ||
    normalizedMessage.includes('faltan secciones') ||
    normalizedMessage.includes('no incluyo') ||
    normalizedMessage.includes('respuesta vacia')
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithGeminiWithFallback(
  parts,
  apiKey,
  modelCandidates,
  systemInstruction,
  responseSchema,
  debugContext
) {
  let lastError;
  const attempts = [];
  const maxAttemptsPerModel = 1;

  for (let index = 0; index < modelCandidates.length; index += 1) {
    const modelName = modelCandidates[index];

    for (let modelAttempt = 0; modelAttempt < maxAttemptsPerModel; modelAttempt += 1) {
      try {
        const data = await generateWithGemini(
          parts,
          apiKey,
          modelName,
          systemInstruction,
          responseSchema,
          {
            ...debugContext,
            selectedModel: modelName,
          }
        );

        return {
          data,
          modelUsed: modelName,
        };
      } catch (error) {
        lastError = error;
        const retrySameModel =
          modelAttempt < maxAttemptsPerModel - 1 && shouldRetrySameModel(error);
        const retryDifferentModel =
          index < modelCandidates.length - 1 && shouldRetryWithDifferentModel(error);
        const willRetry = retrySameModel || retryDifferentModel;
        attempts.push(
          buildAttemptLog(error, {
            order: attempts.length + 1,
            modelName,
            willRetry,
          })
        );

        if (retrySameModel) {
          await delay(750 * (modelAttempt + 1));
          continue;
        }

        if (!retryDifferentModel) {
          throw attachAttemptsToError(error, attempts, {
            ...debugContext,
            selectedModel: modelName,
          });
        }

        break;
      }
    }
  }

  throw attachAttemptsToError(lastError, attempts, {
    ...debugContext,
    selectedModel: modelCandidates[modelCandidates.length - 1],
  });
}

function buildScopedPayload(payload, profileData) {
  const { el, ella, ...basePayload } = payload || {};
  return {
    ...basePayload,
    ...(profileData || {}),
  };
}

function buildRevisionScopedPayload(payload, profileId) {
  const companionId = profileId === 'el' ? 'ella' : 'el';
  return {
    currentContext: payload.currentContext?.[profileId] || null,
    originalContext: payload.originalContext?.[profileId] || null,
    companionContext: payload.currentContext?.[companionId] || null,
  };
}

async function generateWithGemini(
  parts,
  apiKey,
  modelName,
  systemInstruction,
  responseSchema,
  debugContext
) {
  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseJsonSchema: responseSchema,
      maxOutputTokens: getMaxOutputTokens(modelName, debugContext.requestMode),
      ...(getThinkingConfig(modelName, debugContext)
        ? { thinkingConfig: getThinkingConfig(modelName, debugContext) }
        : {}),
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'generate-content',
        selectedModel: modelName,
      },
      {
        rawMessage: error?.message || `Fallo de red contactando ${modelName}.`,
        statusCode: 502,
        geminiRequest: body,
      }
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `Error ${response.status} llamando a Gemini`;

    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson?.error?.message || errorMessage;
    } catch {
      // Ignore parse errors for API failures.
    }

    if (response.status === 429 || errorMessage.toLowerCase().includes('quota exceeded')) {
      errorMessage = 'Limite de solicitudes rebasado (Error 429). Intenta de nuevo en 1 minuto.';
    }

    if (response.status === 404) {
      errorMessage = `Modelo '${modelName}' no encontrado o no disponible. ${errorMessage}`;
    }

    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'generate-content',
        selectedModel: modelName,
      },
      {
        rawMessage: errorMessage,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: safeParseJson(responseText),
        },
      }
    );
  }

  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch (error) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: `La respuesta 200 de Gemini no fue JSON valido: ${error?.message || String(error)}`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseText,
        },
      }
    );
  }

  const candidates = responseJson?.candidates;

  if (!Array.isArray(candidates) || !candidates.length) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: 'La IA no genero una respuesta valida. Intenta de nuevo.',
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  const responseParts = candidates[0]?.content?.parts;
  if (!Array.isArray(responseParts) || !responseParts.length) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: 'La IA devolvio una respuesta vacia. Intenta de nuevo.',
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  const generatedText = responseParts.map((part) => part?.text || '').join('\n').trim();
  if (!generatedText) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: 'La IA devolvio texto vacio. Intenta de nuevo con otro modelo.',
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  const finishReason = candidates[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: `La IA no pudo completar la respuesta (${finishReason}). Intenta de nuevo.`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  try {
    const parsedData = JSON.parse(sanitizeAiJson(generatedText));
    return validateAndNormalizeAiData(parsedData, debugContext, body, responseJson, modelName);
  } catch (error) {
    if (error?.aiDebugLog) {
      throw error;
    }

    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: `La IA devolvio JSON no parseable: ${error?.message || String(error)}`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }
}

async function generateWithDeepSeekWithFallback(
  parts,
  apiKey,
  modelCandidates,
  systemInstruction,
  responseSchema,
  debugContext
) {
  let lastError;
  const attempts = [];

  for (let index = 0; index < modelCandidates.length; index += 1) {
    const modelName = modelCandidates[index];

    try {
      const data = await generateWithDeepSeek(
        parts,
        apiKey,
        modelName,
        systemInstruction,
        responseSchema,
        {
          ...debugContext,
          selectedModel: modelName,
        }
      );

      return {
        data,
        modelUsed: modelName,
      };
    } catch (error) {
      lastError = error;
      const willRetry = index < modelCandidates.length - 1 && shouldRetryWithDifferentModel(error);
      attempts.push(
        buildAttemptLog(error, {
          order: attempts.length + 1,
          modelName,
          willRetry,
        })
      );

      if (!willRetry) {
        throw attachAttemptsToError(error, attempts, {
          ...debugContext,
          selectedModel: modelName,
        });
      }
    }
  }

  throw attachAttemptsToError(lastError, attempts, {
    ...debugContext,
    selectedModel: modelCandidates[modelCandidates.length - 1],
  });
}

async function generateWithDeepSeek(
  parts,
  apiKey,
  modelName,
  systemInstruction,
  responseSchema,
  debugContext
) {
  let result;

  try {
    result = await callDeepSeekChatCompletion({
      parts,
      apiKey,
      modelName,
      systemInstruction,
      requestMode: debugContext.requestMode,
      responseSchema,
    });
  } catch (error) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'generate-content',
        selectedModel: modelName,
      },
      {
        rawMessage: error?.message || `Fallo de red contactando ${modelName}.`,
        statusCode: 502,
      }
    );
  }

  const { body, response, responseText } = result;

  if (!response.ok) {
    const parsedError = safeParseJson(responseText);
    let errorMessage = `Error ${response.status} llamando a DeepSeek`;

    if (parsedError && typeof parsedError === 'object') {
      errorMessage = parsedError?.error?.message || parsedError?.message || errorMessage;
    }

    if (response.status === 429 || String(errorMessage).toLowerCase().includes('rate limit')) {
      errorMessage = 'Limite de solicitudes rebasado (Error 429). Intenta de nuevo en 1 minuto.';
    }

    if (response.status === 404) {
      errorMessage = `Modelo '${modelName}' no encontrado o no disponible. ${errorMessage}`;
    }

    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'generate-content',
        selectedModel: modelName,
      },
      {
        rawMessage: errorMessage,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: parsedError,
        },
      }
    );
  }

  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch (error) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: `La respuesta 200 de DeepSeek no fue JSON valido: ${error?.message || String(error)}`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseText,
        },
      }
    );
  }

  const choice = responseJson?.choices?.[0];
  const generatedText = String(choice?.message?.content || '').trim();

  if (!choice) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: 'DeepSeek no genero choices validos para esta solicitud.',
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  if (!generatedText) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: 'DeepSeek devolvio texto vacio.',
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  if (choice.finish_reason && choice.finish_reason !== 'stop') {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: `DeepSeek no pudo completar la respuesta (${choice.finish_reason}). Intenta de nuevo.`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  try {
    const parsedData = JSON.parse(sanitizeAiJson(generatedText));
    return validateAndNormalizeAiData(parsedData, debugContext, body, responseJson, modelName);
  } catch (error) {
    if (error?.aiDebugLog) {
      throw error;
    }

    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName,
      },
      {
        rawMessage: `DeepSeek devolvio JSON no parseable: ${error?.message || String(error)}`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }
}

export default async function handler(req, res) {
  const requestMeta = applyCorsHeaders(req, res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    if (!requestMeta.trustedRequest) {
      return res.status(403).end();
    }
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requestMeta.trustedRequest) {
    return res.status(403).json({
      error: 'Origen no permitido. Usa la app desde el mismo dominio para generar planes.',
    });
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'generate-plan',
    windowMs: 60 * 1000,
    maxRequests: 8,
  });

  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  if (!rateLimit.ok) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      error: `Demasiadas generaciones seguidas. Intenta de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
    });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({ error: 'Body no es JSON valido' });
      }
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Body vacio o invalido' });
    }

    const customApiKey = typeof payload.customApiKey === 'string' ? payload.customApiKey.trim() : '';
    delete payload.customApiKey;

    const pdfValidation = validatePayloadAssessmentPdfs(payload);
    if (!pdfValidation.ok) {
      return res.status(pdfValidation.status).json({ error: pdfValidation.error });
    }

    const aiProvider = normalizeAiProvider(process.env.AI_PROVIDER);
    const apiKey =
      aiProvider === AI_PROVIDER_GEMINI
        ? customApiKey || (process.env.GEMINI_API_KEY || '').trim()
        : (process.env.DEEPSEEK_API_KEY || '').trim();
    const preferredModel =
      aiProvider === AI_PROVIDER_GEMINI
        ? resolvePreferredGeminiModel(payload.preferredModel, process.env.GEMINI_MODEL)
        : resolvePreferredDeepSeekModel(process.env.DEEPSEEK_MODEL, payload.preferredModel);
    const requestMode = isPlanRevisionRequest(payload) ? payload.requestMode : 'generate';
    const flow = isPlanRevisionRequest(payload) ? 'plan-revision' : 'questionnaire-submit';

    if (!apiKey) {
      return res.status(500).json({
        error:
          aiProvider === AI_PROVIDER_GEMINI
            ? 'Falta configurar GEMINI_API_KEY en el entorno del servidor o una clave personalizada.'
            : 'Falta configurar DEEPSEEK_API_KEY en el entorno del servidor.',
      });
    }

    const target = payload?.targetProfile;
    if (!target || !['el', 'ella', 'ambos'].includes(target)) {
      return res.status(400).json({
        error: 'targetProfile invalido. Debe ser: el, ella, o ambos.',
      });
    }

    const debugBase = {
      flow,
      transport: 'serverless',
      stage: 'models-list',
      payload,
      targetProfile: target,
      requestMode,
      requestedModel: preferredModel,
      aiProvider,
      apiKeySource: aiProvider === AI_PROVIDER_GEMINI && customApiKey ? 'custom-server' : 'server-env',
    };

    const hardcodedModelNames =
      aiProvider === AI_PROVIDER_GEMINI
        ? [
            'gemini-3-flash-preview',
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-3.1-pro-preview',
          ]
        : DEEPSEEK_MODEL_OPTIONS;
    const orderedModels =
      aiProvider === AI_PROVIDER_GEMINI
        ? getOrderedGeminiModels(hardcodedModelNames, preferredModel)
        : getOrderedDeepSeekModels(hardcodedModelNames, preferredModel);
    const selectedModel = orderedModels[0];
    const modelCandidates = orderedModels.slice(0, 3);
    const generateWithProvider =
      aiProvider === AI_PROVIDER_GEMINI
        ? generateWithGeminiWithFallback
        : generateWithDeepSeekWithFallback;

    let elData = null;
    let ellaData = null;
    let elModelUsed = null;
    let ellaModelUsed = null;

    if (isPlanRevisionRequest(payload)) {
      if (target === 'ambos' && payload.requestMode === 'regenerate') {
        // Phase 3: Parallelize regenerate for ambos
        const revisionPayloadEl = buildRevisionScopedPayload(payload, 'el');
        const questionnaireEl = payload.questionnaireContext?.el || payload.questionnaireContext;
        const precomputedProfileEl = generateProfile(questionnaireEl, 'el');
        const precomputedSupplementsEl = generateSupplements(questionnaireEl, payload.supplementsCatalog || []);
        revisionPayloadEl.precomputedProfile = precomputedProfileEl;
        revisionPayloadEl.precomputedSupplements = precomputedSupplementsEl;
        const requestPartsEl = buildRevisionRequestParts('EL', payload, revisionPayloadEl);

        const revisionPayloadElla = buildRevisionScopedPayload(payload, 'ella');
        const questionnaireElla = payload.questionnaireContext?.ella || payload.questionnaireContext;
        const precomputedProfileElla = generateProfile(questionnaireElla, 'ella');
        const precomputedSupplementsElla = generateSupplements(questionnaireElla, payload.supplementsCatalog || []);
        revisionPayloadElla.precomputedProfile = precomputedProfileElla;
        revisionPayloadElla.precomputedSupplements = precomputedSupplementsElla;
        const requestPartsElla = buildRevisionRequestParts('ELLA', payload, revisionPayloadElla);

        const elResult = await generateWithProvider(
          requestPartsEl,
          apiKey,
          modelCandidates,
          buildRevisionSystemPrompt('EL', payload.requestMode),
          buildPlanOnlyResponseSchema('EL'),
          {
            ...debugBase,
            payload: revisionPayloadEl,
            stage: 'generate-content',
            selectedModel,
            profilePrefix: 'EL',
          }
        );

        await delay(GEMINI_SEQUENTIAL_REQUEST_DELAY_MS);

        const ellaResult = await generateWithProvider(
          requestPartsElla,
          apiKey,
          modelCandidates,
          buildRevisionSystemPrompt('ELLA', payload.requestMode),
          buildPlanOnlyResponseSchema('ELLA'),
          {
            ...debugBase,
            payload: revisionPayloadElla,
            stage: 'generate-content',
            selectedModel,
            profilePrefix: 'ELLA',
          }
        );

        elData = {
          perfilEL: precomputedProfileEl,
          suplementosEL: precomputedSupplementsEl,
          planEL: elResult.data?.planEL,
        };
        elModelUsed = elResult.modelUsed;
        ellaData = {
          perfilELLA: precomputedProfileElla,
          suplementosELLA: precomputedSupplementsElla,
          planELLA: ellaResult.data?.planELLA,
        };
        ellaModelUsed = ellaResult.modelUsed;
      } else {
        // Sequential for adjust mode or single profile
        if (target === 'el' || target === 'ambos') {
          const revisionPayloadEl = buildRevisionScopedPayload(payload, 'el');
          let schemaEl = buildAdjustResponseSchema();
          let requestPartsEl = buildRevisionRequestParts('EL', payload, revisionPayloadEl);
          if (payload.requestMode === 'regenerate') {
            const questionnaireEl = payload.questionnaireContext?.el || payload.questionnaireContext;
            const precomputedProfile = generateProfile(questionnaireEl, 'el');
            const precomputedSupplements = generateSupplements(questionnaireEl, payload.supplementsCatalog || []);
            revisionPayloadEl.precomputedProfile = precomputedProfile;
            revisionPayloadEl.precomputedSupplements = precomputedSupplements;
            requestPartsEl = buildRevisionRequestParts('EL', payload, revisionPayloadEl);
            schemaEl = buildPlanOnlyResponseSchema('EL');
          }
          const result = await generateWithProvider(
            requestPartsEl,
            apiKey,
            modelCandidates,
            buildRevisionSystemPrompt('EL', payload.requestMode),
            schemaEl,
            {
              ...debugBase,
              payload: revisionPayloadEl,
              stage: 'generate-content',
              selectedModel,
              profilePrefix: 'EL',
            }
          );
          if (payload.requestMode === 'regenerate') {
            elData = {
              perfilEL: revisionPayloadEl.precomputedProfile,
              suplementosEL: revisionPayloadEl.precomputedSupplements,
              planEL: result.data?.planEL,
            };
          } else {
            elData = result.data;
          }
          elModelUsed = result.modelUsed;
        }

        if (target === 'ella' || target === 'ambos') {
          const revisionPayloadElla = buildRevisionScopedPayload(payload, 'ella');
          let schemaElla = buildAdjustResponseSchema();
          let requestPartsElla = buildRevisionRequestParts('ELLA', payload, revisionPayloadElla);
          if (payload.requestMode === 'regenerate') {
            const questionnaireElla = payload.questionnaireContext?.ella || payload.questionnaireContext;
            const precomputedProfile = generateProfile(questionnaireElla, 'ella');
            const precomputedSupplements = generateSupplements(questionnaireElla, payload.supplementsCatalog || []);
            revisionPayloadElla.precomputedProfile = precomputedProfile;
            revisionPayloadElla.precomputedSupplements = precomputedSupplements;
            requestPartsElla = buildRevisionRequestParts('ELLA', payload, revisionPayloadElla);
            schemaElla = buildPlanOnlyResponseSchema('ELLA');
          }
          const result = await generateWithProvider(
            requestPartsElla,
            apiKey,
            modelCandidates,
            buildRevisionSystemPrompt('ELLA', payload.requestMode),
            schemaElla,
            {
              ...debugBase,
              payload: revisionPayloadElla,
              stage: 'generate-content',
              selectedModel,
              profilePrefix: 'ELLA',
            }
          );
          if (payload.requestMode === 'regenerate') {
            ellaData = {
              perfilELLA: revisionPayloadElla.precomputedProfile,
              suplementosELLA: revisionPayloadElla.precomputedSupplements,
              planELLA: result.data?.planELLA,
            };
          } else {
            ellaData = result.data;
          }
          ellaModelUsed = result.modelUsed;
        }
      }

      const modelUsed = Array.from(new Set([elModelUsed, ellaModelUsed].filter(Boolean))).join(', ');
      return res.status(200).json({
        responseMode: payload.requestMode,
        elData,
        ellaData,
        modelUsed,
      });
    }

    if (target === 'ambos') {
      // Phase 3: Parallelize both profile generations
      const payloadEl = buildScopedPayload(payload, payload.el);
      const precomputedProfileEl = generateProfile(payloadEl, 'el');
      const precomputedSupplementsEl = generateSupplements(payloadEl, payload.supplementsCatalog || []);
      payloadEl.precomputedProfile = precomputedProfileEl;
      payloadEl.precomputedSupplements = precomputedSupplementsEl;

      const payloadElla = buildScopedPayload(payload, payload.ella);
      const precomputedProfileElla = generateProfile(payloadElla, 'ella');
      const precomputedSupplementsElla = generateSupplements(payloadElla, payload.supplementsCatalog || []);
      payloadElla.precomputedProfile = precomputedProfileElla;
      payloadElla.precomputedSupplements = precomputedSupplementsElla;

      const elResult = await generateWithProvider(
        buildRequestParts('EL', payloadEl),
        apiKey,
        modelCandidates,
        buildSystemPrompt('EL'),
        buildPlanOnlyResponseSchema('EL'),
        {
          ...debugBase,
          payload: payloadEl,
          stage: 'generate-content',
          selectedModel,
          profilePrefix: 'EL',
        }
      );

      await delay(GEMINI_SEQUENTIAL_REQUEST_DELAY_MS);
      payloadElla.companionPlan = elResult.data?.planEL || null;

      const ellaResult = await generateWithProvider(
        buildRequestParts('ELLA', payloadElla),
        apiKey,
        modelCandidates,
        buildSystemPrompt('ELLA'),
        buildPlanOnlyResponseSchema('ELLA'),
        {
          ...debugBase,
          payload: payloadElla,
          stage: 'generate-content',
          selectedModel,
          profilePrefix: 'ELLA',
        }
      );

      elData = {
        perfilEL: precomputedProfileEl,
        suplementosEL: precomputedSupplementsEl,
        planEL: elResult.data?.planEL,
      };
      elModelUsed = elResult.modelUsed;
      ellaData = {
        perfilELLA: precomputedProfileElla,
        suplementosELLA: precomputedSupplementsElla,
        planELLA: ellaResult.data?.planELLA,
      };
      ellaModelUsed = ellaResult.modelUsed;
    } else if (target === 'el') {
      const precomputedProfile = generateProfile(payload, 'el');
      const precomputedSupplements = generateSupplements(payload, payload.supplementsCatalog || []);
      payload.precomputedProfile = precomputedProfile;
      payload.precomputedSupplements = precomputedSupplements;
      const result = await generateWithProvider(
        buildRequestParts('EL', payload),
        apiKey,
        modelCandidates,
        buildSystemPrompt('EL'),
        buildPlanOnlyResponseSchema('EL'),
        {
          ...debugBase,
          payload,
          stage: 'generate-content',
          selectedModel,
          profilePrefix: 'EL',
        }
      );
      elData = {
        perfilEL: precomputedProfile,
        suplementosEL: precomputedSupplements,
        planEL: result.data?.planEL,
      };
      elModelUsed = result.modelUsed;
    } else if (target === 'ella') {
      const precomputedProfile = generateProfile(payload, 'ella');
      const precomputedSupplements = generateSupplements(payload, payload.supplementsCatalog || []);
      payload.precomputedProfile = precomputedProfile;
      payload.precomputedSupplements = precomputedSupplements;
      const result = await generateWithProvider(
        buildRequestParts('ELLA', payload),
        apiKey,
        modelCandidates,
        buildSystemPrompt('ELLA'),
        buildPlanOnlyResponseSchema('ELLA'),
        {
          ...debugBase,
          payload,
          stage: 'generate-content',
          selectedModel,
          profilePrefix: 'ELLA',
        }
      );
      ellaData = {
        perfilELLA: precomputedProfile,
        suplementosELLA: precomputedSupplements,
        planELLA: result.data?.planELLA,
      };
      ellaModelUsed = result.modelUsed;
    }

    const modelUsed = Array.from(new Set([elModelUsed, ellaModelUsed].filter(Boolean))).join(', ');
    return res.status(200).json({ elData, ellaData, modelUsed });
  } catch (error) {
    console.error('Error en handler:', error);
    if (error?.aiDebugLog) {
      return res.status(error?.statusCode || 500).json({
        error: error?.userMessage || AI_GENERIC_ERROR_MESSAGE,
        aiDebugLog: error.aiDebugLog,
      });
    }

    return res.status(500).json({
      error: error?.message || 'No se pudo generar el plan con IA.',
    });
  }
}
