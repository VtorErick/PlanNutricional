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
  'caloriasKcal',
  'proteinaG',
  'grasasG',
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
  const desired = requestMode === 'adjust' ? 8192 : 32768;
  return Math.min(desired, hardLimit);
}

function getThinkingConfig(modelName) {
  void modelName;
  return undefined;
}

function buildMealItemSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: MEAL_ITEM_REQUIRED_KEYS,
    properties: {
      nombre: { type: 'string' },
      porciones: { type: 'string' },
      detalle: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      super: { type: 'array', items: { type: 'string' } },
      caloriasKcal: { type: 'integer' },
      proteinaG: { type: 'integer' },
      grasasG: { type: 'integer' },
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
        items: { type: 'array', items: { type: 'string' } },
      },
    },
  };
}

function buildSuplementosSchema() {
  return {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: SUPPLEMENT_REQUIRED_KEYS,
      properties: {
        name: { type: 'string' },
        goalSupport: { type: 'string' },
        whyItMayHelp: { type: 'string' },
        howToUse: { type: 'string' },
        timing: { type: 'string' },
        notes: { type: 'string' },
        caution: { type: 'string' },
      },
    },
  };
}

function buildPlanSlotSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: PLAN_SLOT_REQUIRED_KEYS,
    properties: {
      dia: { type: 'string' },
      momento: { type: 'string' },
      opciones: { type: 'array', items: buildMealItemSchema() },
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
  const equivalenciasKey = `equivalencias${prefix}`;
  const suplementosKey = `suplementos${prefix}`;
  const planTransportKey = `planSemanal${prefix}`;
  return {
    type: 'object',
    additionalProperties: false,
    required: [profileKey, equivalenciasKey, suplementosKey, planTransportKey],
    propertyOrdering: [profileKey, equivalenciasKey, suplementosKey, planTransportKey],
    properties: {
      [profileKey]: buildProfileSchema(false),
      [equivalenciasKey]: buildEquivalenciasSchema(),
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
    propertyOrdering: ['summary', 'noChangesReason', 'profilePatch', 'equivalencias', 'suplementos', 'planPatchSlots'],
    properties: {
      summary: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' },
      },
      noChangesReason: { type: 'string' },
      profilePatch: buildProfileSchema(true),
      equivalencias: buildEquivalenciasSchema(),
      suplementos: buildSuplementosSchema(),
      planPatchSlots: buildPlanSlotsSchema(false),
    },
  };
}

function buildGenerationOutputContract(prefix) {
  return {
    rootKeys: [
      `perfil${prefix}`,
      `equivalencias${prefix}`,
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

  options.forEach((mealItem, index) => {
    validateMealItemStructure(
      mealItem,
      `${location}[${index}]`,
      debugContext,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
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
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createInvalidStructureError(
        debugContext,
        `Respuesta de IA incompleta: ${location}[${index}] no es un objeto valido.`,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    SUPPLEMENT_REQUIRED_KEYS.forEach((fieldName) => {
      validateRequiredStringField(
        item,
        fieldName,
        `${location}[${index}]`,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    });
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

  if (!Array.isArray(perfil.resumenPersonal) || perfil.resumenPersonal.length === 0 || perfil.resumenPersonal.some((entry) => !isNonEmptyString(entry))) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: perfil${profilePrefix}.resumenPersonal esta vacio o invalido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

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

    if (data.equivalencias !== undefined) {
      validateEquivalenciasStructure(
        data.equivalencias,
        'equivalencias',
        debugContext,
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

    if (!data.planPatch && !data.noChangesReason && !data.profilePatch && !data.equivalencias && !data.suplementos) {
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
  const equivKey = `equivalencias${profilePrefix}`;
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

  validateEquivalenciasStructure(
    normalized[equivKey],
    equivKey,
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

function sanitizePromptPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const nextPayload = { ...payload };
  if (nextPayload.assessmentReportPdf) {
    nextPayload.assessmentReportPdf = {
      name: nextPayload.assessmentReportPdf.name,
      mimeType: nextPayload.assessmentReportPdf.mimeType,
    };
  }

  return nextPayload;
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
- equivalencias${prefix}
- suplementos${prefix}
- ${planTransportKey}

Reglas criticas:
- No cambies id ni nombre.
- Usa exactamente estos dias dentro del JSON: ${WEEK_DAYS.join(', ')}.
- Usa exactamente estos momentos dentro del JSON: ${MEAL_MOMENT_KEYS.join(', ')}.
- "perfil" debe ser SIEMPRE una sola linea con este formato: "<peso> kg | <altura> m | <edad> anos | IMC <valor>".
- No pongas narrativa dentro de "perfil"; usa "detallesPerfil" para el analisis completo.
- perfil${prefix}.objetivosPorMomento debe ser un arreglo de 5 objetos, uno por cada momento, y cada objeto debe incluir: momento, frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas.
- perfil${prefix}.distribucionDiaria debe ser un arreglo de 7 objetos, uno por cada grupo: ${FOOD_GROUP_KEYS.join(', ')}.
- Cada item de perfil${prefix}.distribucionDiaria debe incluir exactamente: grupo, total, detalle.
- No devuelvas perfil${prefix}.distribucionDiaria vacio ni con grupos repetidos o faltantes.
- Cada comida debe incluir exactamente estas claves: ${MEAL_ITEM_REQUIRED_KEYS.join(', ')}.
- ${planTransportKey} debe ser un arreglo plano de 35 slots.
- Cada slot debe tener exactamente estas claves: dia, momento, opciones.
- Debe haber exactamente un slot por cada combinacion de dia + momento.
- Ordena los slots primero por dia (${WEEK_DAYS.join(', ')}) y dentro de cada dia por momento (${MEAL_MOMENT_KEYS.join(', ')}).
- Cada slot debe devolver exactamente 3 opciones de comida.
- No anides momentos dentro de dias ni dias dentro de objetos complejos; usa solo el arreglo plano de slots.
- Las calorias y macros deben ser enteros realistas.
- Las equivalencias deben alinearse con los ingredientes del plan y usar solo iconos permitidos: ${ALLOWED_ICONS.join(', ')}.
- Los suplementos son opcionales y nunca deben ser necesarios para cumplir calorias, macros u objetivo.
- No pongas suplementos dentro del plan.
- No devuelvas objetos vacios, arreglos vacios para comidas ni slots con opciones incompletas.
- Si el usuario adjunto PDF o medidas corporales, usalos como contexto complementario.
- Si hay conflicto entre PDF y cuestionario, prioriza el cuestionario.
- Si targetProfile = "ambos" y recibes companionPlan, conserva la misma preparacion base por dia, momento e indice; cambia solo porciones y macros cuando haga falta.
- No devuelvas null, undefined, placeholders, alias de claves ni dias con acentos distintos a los pedidos.`;
}

function buildUserPrompt(payload, prefix) {
  return JSON.stringify({
    profilePrefix: prefix,
    questionnaire: sanitizePromptPayload(payload),
    outputContract: {
      ...buildGenerationOutputContract(prefix),
      planTransportKey: `planSemanal${prefix}`,
      planTransportFormat: {
        type: 'flat_slots',
        slotKeys: ['dia', 'momento', 'opciones'],
        requiredSlotCount: WEEK_DAYS.length * MEAL_MOMENT_KEYS.length,
      },
      momentsSource: 'questionnaire.planConfig.selectedMoments',
      profileFormat: {
        perfil: '<peso> kg | <altura> m | <edad> anos | IMC <valor>',
        detallesPerfil: 'Resumen narrativo del caso y contexto clinico.',
      },
      objetivosPorMomentoFormat: {
        type: 'array',
        itemKeys: ['momento', ...FOOD_GROUP_KEYS],
      },
      mealOptionsPerMoment: 3,
    },
  });
}

function buildRevisionSystemPrompt(prefix, mode) {
  const lowerPrefix = prefix.toLowerCase();
  const planTransportKey = `planSemanal${prefix}`;
  if (mode === 'regenerate') {
    return `Eres un nutricionista clinico experto. Reconstruye el plan semanal completo desde cero usando el contexto disponible y las nuevas instrucciones del usuario.

Debes responder con un unico objeto JSON valido. No uses markdown, comentarios ni texto fuera del JSON.

El perfil objetivo es "${lowerPrefix}". Nunca cambies su id ni su nombre.

Debes devolver el plan COMPLETO con el mismo contrato de una generacion normal:
- perfil${prefix}
- equivalencias${prefix}
- suplementos${prefix}
- ${planTransportKey}

Reglas criticas:
- Usa exactamente los dias ${WEEK_DAYS.join(', ')}.
- Usa exactamente los momentos ${MEAL_MOMENT_KEYS.join(', ')}.
- perfil${prefix}.objetivosPorMomento debe venir como arreglo de objetos con las claves: momento, frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas.
- ${planTransportKey} debe ser un arreglo plano de 35 slots.
- Cada slot debe tener dia, momento y opciones.
- Debe haber exactamente un slot por cada combinacion de dia + momento.
- Ordena los slots por dia y luego por momento.
- Cada slot debe regresar exactamente 3 opciones completas.
- Cada comida debe incluir exactamente estas claves: ${MEAL_ITEM_REQUIRED_KEYS.join(', ')}.
- Mantente consistente con el cuestionario, la instruccion nueva y las restricciones activas.
- Si reutilizas ideas del plan actual, hazlo solo cuando siga siendo conveniente, no por copiarlo ciegamente.
- No devuelvas summary, profilePatch ni planPatchSlots en modo regenerate. Devuelve el objeto completo listo para parsearse.`;
  }

  return `Eres un nutricionista clinico experto. Ajusta solo las partes necesarias del plan actual segun la solicitud del usuario, sin reescribir secciones que no cambian.

Debes responder con un unico objeto JSON valido. No uses markdown, comentarios, texto fuera del JSON ni claves adicionales.

El perfil objetivo es "${lowerPrefix}". Nunca cambies su id ni su nombre.

Contrato exacto de salida:
- summary: arreglo obligatorio de 1 a 4 lineas cortas
- noChangesReason: string opcional si no hace falta cambiar nada
- profilePatch: objeto opcional con solo campos cambiados del perfil
- equivalencias: arreglo opcional si cambian equivalencias
- suplementos: arreglo opcional si cambian suplementos
- planPatchSlots: arreglo opcional con solo slots modificados

Reglas criticas:
- summary siempre debe explicar lo que cambiaste o por que no cambiaste nada.
- Si realmente no hace falta modificar nada, responde con summary y noChangesReason. No inventes cambios.
- Si devuelves profilePatch.objetivosPorMomento, usa el mismo formato de arreglo por momento.
- Si usas planPatchSlots, incluye SOLO las combinaciones de dia + momento modificadas.
- Si devuelves varios slots, ordénalos por dia y luego por momento.
- Cada slot incluido en planPatchSlots debe regresar el arreglo completo de 3 opciones para ese slot.
- Nunca devuelvas el plan completo en modo adjust.
- Cada MealItem debe incluir exactamente estas claves: ${MEAL_ITEM_REQUIRED_KEYS.join(', ')}.
- profilePatch, equivalencias y suplementos son opcionales; omitelos si no cambian.
- Mantente consistente con el cuestionario, el plan actual, las ediciones manuales y las restricciones del usuario.`;
}

function buildRevisionUserPrompt(prefix, payload, profilePayload) {
  const outputMode = payload.requestMode === 'regenerate' ? 'full_regeneration' : 'delta_patch';
  return JSON.stringify({
    profilePrefix: prefix,
    mode: payload.requestMode,
    userInstruction: payload.instruction,
    questionnaireContext: sanitizePromptPayload(payload.questionnaireContext),
    currentContext: profilePayload.currentContext,
    originalContext: profilePayload.originalContext,
    companionContext: profilePayload.companionContext,
    outputMode,
    outputNotes: {
      fixedDays: WEEK_DAYS,
      fixedMoments: MEAL_MOMENT_KEYS,
      fixedFoodGroups: FOOD_GROUP_KEYS,
      planTransportKey: payload.requestMode === 'adjust' ? 'planPatchSlots' : `planSemanal${prefix}`,
      planTransportFormat: 'flat_slots',
      returnOnlyChangedSections: payload.requestMode === 'adjust',
      preserveUntouchedMoments: payload.requestMode === 'adjust',
      mealOptionsPerMoment: 3,
      mealItemRequiredKeys: MEAL_ITEM_REQUIRED_KEYS,
      fullOutputRootKeys: buildGenerationOutputContract(prefix).rootKeys,
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

function shouldRetryWithDifferentModel(error) {
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

  for (let index = 0; index < modelCandidates.length; index += 1) {
    const modelName = modelCandidates[index];

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
      const willRetry =
        index < modelCandidates.length - 1 && shouldRetryWithDifferentModel(error);
      attempts.push(
        buildAttemptLog(error, {
          order: index + 1,
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

  throw attachAttemptsToError(lastError, attempts, debugContext);
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
      ...(getThinkingConfig(modelName)
        ? { thinkingConfig: getThinkingConfig(modelName) }
        : {}),
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

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

