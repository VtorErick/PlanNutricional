import { applyCorsHeaders, enforceRateLimit } from './_requestGuard.js';
import {
  DEFAULT_GEMINI_MODEL,
  getGeminiFallbackModels,
  getOrderedGeminiModels,
  isSupportedGeminiTextModel,
  modelSupportsGenerateContent,
  normalizeModelName,
} from './_geminiModels.js';

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
const FOOD_GROUP_KEYS = [
  'frutas',
  'verduras',
  'cereales',
  'leguminosas',
  'lacteos',
  'proteina',
  'grasas',
];
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
const AI_GENERIC_ERROR_MESSAGE =
  'No se pudo completar la solicitud con IA. Descarga los logs para revisar el detalle.';

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

function createDebugLogId(flow) {
  return `${flow}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeAttemptLogs(attempts) {
  if (!Array.isArray(attempts) || attempts.length === 0) return undefined;

  return attempts.map((attempt) => ({
    ...attempt,
    model: attempt.model ? normalizeModelName(attempt.model) : attempt.model,
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
    apiKeySource: debugContext.apiKeySource,
    requestPayload: sanitizeDebugValue(debugContext.payload),
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

function getGeminiRequestTimeoutMs(debugContext) {
  if (debugContext.requestMode === 'adjust') {
    return 60_000;
  }

  if (debugContext.targetProfile === 'ambos') {
    return 120_000;
  }

  if (debugContext.requestMode === 'regenerate') {
    return 120_000;
  }

  return 150_000;
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
    additionalProperties: false,
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
    minItems: FOOD_GROUP_KEYS.length,
    maxItems: FOOD_GROUP_KEYS.length,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['grupo', 'total', 'detalle'],
      properties: {
        grupo: { type: 'string', enum: FOOD_GROUP_KEYS },
        total: { type: 'integer' },
        detalle: { type: 'string' },
      },
    },
  };
}

function buildMomentTimeSchema() {
  return {
    type: 'object',
    additionalProperties: false,
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
    additionalProperties: false,
    required: partial ? [] : PROFILE_REQUIRED_KEYS,
    properties: {
      id: { type: 'string' },
      nombre: { type: 'string' },
      perfil: { type: 'string', maxLength: 48 },
      detallesPerfil: { type: 'string', maxLength: 360 },
      meta: { type: 'string', maxLength: 180 },
      metaCaloricaKcalDia: { type: 'integer' },
      descripcion: { type: 'string', maxLength: 240 },
      edad: { type: 'integer' },
      horariosTexto: { type: 'string', maxLength: 140 },
      notaSalud: { type: 'string', maxLength: 220 },
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
    minItems: 1,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['titulo', 'icon', 'items'],
      properties: {
        titulo: { type: 'string' },
        icon: { type: 'string', enum: ALLOWED_ICONS },
        items: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 120 } },
      },
    },
  };
}

function buildSuplementosSchema() {
  return {
    type: 'array',
    maxItems: 5,
    items: { type: 'string', maxLength: 40 },
  };
}

function buildPlanSlotSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['dia', 'momento', 'opciones'],
    properties: {
      dia: { type: 'string' },
      momento: { type: 'string' },
      opciones: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['idRef', 'porciones', 'detalle', 'caloriasKcal', 'proteinaG', 'grasasG'],
          properties: {
            idRef: { type: 'string', maxLength: 100 },
            porciones: { type: 'string', maxLength: 200 },
            detalle: { type: 'string', maxLength: 400 },
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
    additionalProperties: false,
    required: [profileKey, suplementosKey, planTransportKey],
    propertyOrdering: [profileKey, suplementosKey, planTransportKey],
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
    additionalProperties: false,
    required: ['summary'],
    propertyOrdering: ['summary', 'noChangesReason', 'profilePatch', 'suplementos', 'planPatchSlots'],
    properties: {
      summary: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: { type: 'string', maxLength: 140 },
      },
      noChangesReason: { type: 'string' },
      profilePatch: buildProfileSchema(true),
      suplementos: buildSuplementosSchema(),
      planPatchSlots: buildPlanSlotsSchema(false),
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

    validateRequiredStringField(meal, 'porciones', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(meal, 'detalle', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(meal, 'caloriasKcal', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(meal, 'proteinaG', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredIntegerField(meal, 'grasasG', `${location}[${index}]`, debugContext, geminiRequest, geminiResponseBody, modelName);

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

    if (
      hasRecognizablePortions(meal.porciones) &&
      Number(meal.caloriasKcal) <= 0 &&
      Number(meal.proteinaG) <= 0 &&
      Number(meal.grasasG) <= 0
    ) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] devolvio macros placeholder en cero.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (
      !String(meal.idRef).includes('|MOD:') &&
      shouldReplaceMealDetail(meal.detalle, catalogMeal.nombre, catalogMeal.super)
    ) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}].detalle no coincide con la receta base indicada por idRef.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
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

      FOOD_GROUP_KEYS.forEach((groupKey) => {
        if (!isIntegerValue(distribution[groupKey])) {
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
        FOOD_GROUP_KEYS.map((groupKey) => [groupKey, distribution[groupKey]])
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

    FOOD_GROUP_KEYS.forEach((groupKey) => {
      if (!isIntegerValue(distribution[groupKey])) {
        throw createInvalidStructureError(
          debugContext,
          `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento.${momentKey}.${groupKey} no es entero.`,
          geminiRequest,
          geminiResponseBody,
          modelName
        );
      }
    });
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

    const groupKey = item.grupo.trim();
    if (!FOOD_GROUP_KEYS.includes(groupKey)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: perfil${profilePrefix}.distribucionDiaria[${index}].grupo no es valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

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

  const momentKeys = validateProfileStructure(
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

Claves raiz obligatorias:
- perfil${prefix}
- suplementos${prefix}
- ${planTransportKey}

Reglas criticas:
- No cambies id ni nombre.
- Usa exactamente estos dias dentro del JSON: ${WEEK_DAYS.join(', ')}.
- Usa exactamente estos momentos dentro del JSON: ${MEAL_MOMENT_KEYS.join(', ')}.
- "perfil" debe ser SIEMPRE una sola linea con este formato: "<peso> kg | <altura> m | <edad> anos | IMC <valor>".
- No pongas narrativa dentro de "perfil"; usa "detallesPerfil" para el analisis completo.
- Mantén todo el texto muy conciso para evitar respuestas largas.
- detallesPerfil, descripcion y notaSalud deben ser breves.
- perfil${prefix}.objetivosPorMomento debe ser un arreglo de 5 objetos, uno por cada momento, y cada objeto debe incluir: momento, frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas.
- Si el contexto del perfil del paciente provee 'clinicalPortionsGrid', estas porciones son LA LEY CLINICA. DEBES COPIARLAS de manera EXACTA en 'objetivosPorMomento' para cada momento del dia, sin desviarte ni intentar balancearlas. Usa estas porciones OBLIGATORIAMENTE para buscar en la base de datos las recetas ideales. Si ignoras las 'clinicalPortionsGrid', el paciente corre riesgo de salud.
- perfil${prefix}.distribucionDiaria debe ser un arreglo de 7 objetos, uno por cada grupo: ${FOOD_GROUP_KEYS.join(', ')}.
- Cada item de perfil${prefix}.distribucionDiaria debe incluir exactamente: grupo, total, detalle.
- No devuelvas perfil${prefix}.distribucionDiaria vacio ni con grupos repetidos o faltantes.
- En la clave 'opciones', cada comida debe ser un OBJETO que incluya 'idRef' extraido del "mealsCatalog".
- CRITICO: Debes respetar ESTRICTAMENTE todo lo pedido en el cuestionario: preferencias alimenticias (ej. vegano, mexicano, asiático), restricciones medicas, ingredientes excluidos, tiempos de cocina, etc. Selecciona unicamente IDs del catalogo que casen con estas preferencias e ignora los demas.
- ${planTransportKey} debe ser un arreglo plano de 35 slots.
- Cada slot debe tener exactamente estas claves: dia, momento, opciones.
- Debe haber exactamente un slot por cada combinacion de dia + momento.
- Ordena los slots primero por dia (${WEEK_DAYS.join(', ')}) y dentro de cada dia por momento (${MEAL_MOMENT_KEYS.join(', ')}).
- Cada slot debe devolver exactamente 3 objetos en 'opciones'.
- No anides momentos dentro de dias ni dias dentro de objetos complejos; usa solo el arreglo plano de slots.
- Las calorias y macros deben ser enteros realistas y consistentes con las porciones; prioriza coherencia de receta y porciones sobre hacer calculos perfectos.
- Los suplementos son opcionales. Debe ser UN ARREGLO DE STRINGS (IDs) validados de supplementsCatalog. Si no aportan valor, devuelve []. NUNCA inventes IDs.
- No pongas suplementos dentro del plan ni como objetos.
- No devuelvas objetos vacios, arreglos vacios para comidas ni slots con opciones incompletas.
- Si targetProfile = "ambos" y recibes companionPlan, conserva la misma preparacion base por dia, momento e indice; cambia solo porciones y macros cuando haga falta.
- No devuelvas null, undefined, placeholders, alias de claves ni dias con acentos distintos a los pedidos.`;
}

function buildUserPrompt(payload, prefix) {
  return JSON.stringify({
    profilePrefix: prefix,
    questionnaire: sanitizePromptPayload(payload),
    mealsCatalog: payload.mealsCatalog || [],
    outputHints: {
      rootKeys: buildGenerationOutputContract(prefix).rootKeys,
      selectedMomentsSource: 'questionnaire.planConfig.selectedMoments',
      slotCount: WEEK_DAYS.length * MEAL_MOMENT_KEYS.length,
      mealOptionsPerMoment: 3,
      noteToAI: `En 'opciones' regresa objetos usando SOLO 'idRef' válidos tomados de 'mealsCatalog'. OBLIGATORIO: recalcula 'porciones' y 'detalle' con gramos realistas y coherentes con la receta base. Mantén macros/calorias como enteros razonables; el ajuste fino se resolverá en código local. Si piden ignorar o añadir algo fuera de bd, usa '|MOD: cambio' en el idRef.${resolveClinicalProtocols(payload.diagnostics)}`,
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
- Cada objeto dentro de 'opciones' debe tener su 'idRef' (valido del mealsCatalog) y recalcular porciones y detalle de forma coherente con la receta base.
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
  return JSON.stringify({
    profilePrefix: prefix,
    mode: payload.requestMode,
    userInstruction: payload.instruction,
    mealsCatalog: payload.mealsCatalog || [],
    questionnaireContext: sanitizePromptPayload(payload.questionnaireContext),
    currentContext: compactSnapshotForPrompt(profilePayload.currentContext),
    originalContext:
      payload.requestMode === 'regenerate'
        ? compactSnapshotForPrompt(profilePayload.originalContext)
        : undefined,
    companionContext: compactSnapshotForPrompt(profilePayload.companionContext),
    outputMode,
    outputNotes: {
      planTransportKey: payload.requestMode === 'adjust' ? 'planPatchSlots' : `planSemanal${prefix}`,
      returnOnlyChangedSections: payload.requestMode === 'adjust',
      mealOptionsPerMoment: 3,
      noteToAI: `En 'opciones' regresa objetos usando SOLO 'idRef' válidos tomados de 'mealsCatalog'. OBLIGATORIO: recalcula 'porciones' y 'detalle' con gramos realistas y coherentes con la receta base. Mantén macros/calorias como enteros razonables; el ajuste fino se resolverá en código local. Si piden ignorar/añadir, usa '|MOD: cambio' en el idRef.${resolveClinicalProtocols(payload.questionnaireContext?.diagnostics)}`,
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

async function listAvailableModels(apiKey, debugContext) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: {
      'x-goog-api-key': apiKey,
    },
  });
  const responseText = await response.text();
  const parsedBody = safeParseJson(responseText);

  if (!response.ok) {
    const rawMessage =
      parsedBody?.error?.message || 'No fue posible listar modelos disponibles de Gemini.';
    const geminiRequest = {
      method: 'GET',
      url: 'https://generativelanguage.googleapis.com/v1beta/models',
    };
    const geminiResponse = {
      status: response.status,
      body: parsedBody,
    };
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'models-list',
      },
      {
        rawMessage,
        statusCode: response.status,
        geminiRequest,
        geminiResponse,
        attempts: [
          buildAttemptLog(null, {
            order: 1,
            modelName: debugContext.requestedModel,
            stage: 'models-list',
            statusCode: response.status,
            rawMessage,
            willRetry: false,
            geminiRequest,
            geminiResponse,
          }),
        ],
      }
    );
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    const rawMessage = 'La respuesta de modelos de Gemini no fue JSON valido.';
    const geminiRequest = {
      method: 'GET',
      url: 'https://generativelanguage.googleapis.com/v1beta/models',
    };
    const geminiResponse = {
      status: response.status,
      body: responseText,
    };
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'models-list',
      },
      {
        rawMessage,
        statusCode: response.status,
        geminiRequest,
        geminiResponse,
        attempts: [
          buildAttemptLog(null, {
            order: 1,
            modelName: debugContext.requestedModel,
            stage: 'models-list',
            statusCode: response.status,
            rawMessage,
            willRetry: false,
            geminiRequest,
            geminiResponse,
          }),
        ],
      }
    );
  }

  return (parsedBody?.models || []).filter(
    (model) => modelSupportsGenerateContent(model) && isSupportedGeminiTextModel(model?.name)
  );
}

function pickBestModel(models, preferredModelRaw) {
  if (!models.length) {
    throw new Error('No hay modelos compatibles con generateContent en tu cuenta/API key.');
  }

  const modelNames = models.map((model) => normalizeModelName(model.name));
  return getOrderedGeminiModels(modelNames, preferredModelRaw)[0];
}

function getFallbackModels(models, primaryModel) {
  const modelNames = models.map((model) => normalizeModelName(model.name));
  return getGeminiFallbackModels(modelNames, primaryModel);
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
  const maxAttemptsPerModel = debugContext?.targetProfile === 'ambos' ? 2 : 1;

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
  const timeoutMs = getGeminiRequestTimeoutMs(debugContext);
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      throw createLoggedAiError(
        {
          ...debugContext,
          stage: 'generate-content',
          selectedModel: modelName,
        },
        {
          rawMessage: `El modelo ${modelName} supero el tiempo limite de ${Math.round(timeoutMs / 1000)}s antes de responder.`,
          statusCode: 504,
          geminiRequest: body,
        }
      );
    }

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
  } finally {
    clearTimeout(timeoutId);
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

    const pdfValidation = validatePayloadAssessmentPdfs(payload);
    if (!pdfValidation.ok) {
      return res.status(pdfValidation.status).json({ error: pdfValidation.error });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const preferredModel =
      normalizeModelName(payload.preferredModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL) ||
      DEFAULT_GEMINI_MODEL;
    const requestMode = isPlanRevisionRequest(payload) ? payload.requestMode : 'generate';
    const flow = isPlanRevisionRequest(payload) ? 'plan-revision' : 'questionnaire-submit';

    if (!apiKey) {
      return res.status(500).json({
        error: 'Falta configurar GEMINI_API_KEY en el entorno del servidor.',
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
      apiKeySource: 'server-env',
    };

    const models = await listAvailableModels(apiKey, debugBase);
    const selectedModel = pickBestModel(models, preferredModel);
    const modelCandidates = [selectedModel, ...getFallbackModels(models, selectedModel)];

    let elData = null;
    let ellaData = null;
    let elModelUsed = null;
    let ellaModelUsed = null;

    if (isPlanRevisionRequest(payload)) {
      if (target === 'el' || target === 'ambos') {
        const result = await generateWithGeminiWithFallback(
          buildRevisionRequestParts('EL', payload, buildRevisionScopedPayload(payload, 'el')),
          apiKey,
          modelCandidates,
          buildRevisionSystemPrompt('EL', payload.requestMode),
          payload.requestMode === 'regenerate'
            ? buildFullResponseSchema('EL')
            : buildAdjustResponseSchema(),
          {
            ...debugBase,
            stage: 'generate-content',
            selectedModel,
            profilePrefix: 'EL',
          }
        );
        elData = result.data;
        elModelUsed = result.modelUsed;
      }

      if (target === 'ella' || target === 'ambos') {
        const result = await generateWithGeminiWithFallback(
          buildRevisionRequestParts('ELLA', payload, buildRevisionScopedPayload(payload, 'ella')),
          apiKey,
          modelCandidates,
          buildRevisionSystemPrompt('ELLA', payload.requestMode),
          payload.requestMode === 'regenerate'
            ? buildFullResponseSchema('ELLA')
            : buildAdjustResponseSchema(),
          {
            ...debugBase,
            stage: 'generate-content',
            selectedModel,
            profilePrefix: 'ELLA',
          }
        );
        ellaData = result.data;
        ellaModelUsed = result.modelUsed;
      }

      const modelUsed = Array.from(new Set([elModelUsed, ellaModelUsed].filter(Boolean))).join(', ');
      return res.status(200).json({
        responseMode: payload.requestMode,
        elData,
        ellaData,
        modelUsed,
      });
    }

    if (target === 'el' || target === 'ambos') {
      const payloadEl = target === 'ambos' ? buildScopedPayload(payload, payload.el) : payload;
      const result = await generateWithGeminiWithFallback(
        buildRequestParts('EL', payloadEl),
        apiKey,
        modelCandidates,
        buildSystemPrompt('EL'),
        buildFullResponseSchema('EL'),
        {
          ...debugBase,
          stage: 'generate-content',
          selectedModel,
          profilePrefix: 'EL',
        }
      );
      elData = result.data;
      elModelUsed = result.modelUsed;
    }

    if (target === 'ella' || target === 'ambos') {
      const payloadElla = target === 'ambos' ? buildScopedPayload(payload, payload.ella) : payload;
      if (target === 'ambos' && elData?.planEL) {
        payloadElla.companionPlan = elData.planEL;
      }

      const result = await generateWithGeminiWithFallback(
        buildRequestParts('ELLA', payloadElla),
        apiKey,
        modelCandidates,
        buildSystemPrompt('ELLA'),
        buildFullResponseSchema('ELLA'),
        {
          ...debugBase,
          stage: 'generate-content',
          selectedModel,
          profilePrefix: 'ELLA',
        }
      );
      ellaData = result.data;
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

