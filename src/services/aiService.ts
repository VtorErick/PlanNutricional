import type { MealItem, SupplementRecommendation } from '../types';
import { parseObjectToData } from '../dataManager';
import { equivalenciasEL } from '../data/perfil-el';
import { equivalenciasELLA } from '../data/perfil-ella';
import {
  AI_GENERIC_ERROR_MESSAGE,
  type AiDebugAttempt,
  type AiDebugLog,
  type AiErrorWithLog,
} from '../utils/aiDiagnostics';

export type PlanRevisionMode = 'adjust' | 'regenerate';

export interface SerializableEquivalencia {
  titulo: string;
  icon: string;
  items: string[];
}

export interface SerializableProfileSnapshot {
  perfil: Record<string, unknown>;
  equivalencias: SerializableEquivalencia[];
  suplementos: SupplementRecommendation[];
  plan: Record<string, Record<string, MealItem[]>>;
}

export interface PlanRevisionRequest {
  requestMode: PlanRevisionMode;
  targetProfile: 'el' | 'ella' | 'ambos';
  instruction: string;
  questionnaireContext?: Record<string, unknown> | null;
  currentContext: Partial<Record<'el' | 'ella', SerializableProfileSnapshot>>;
  originalContext: Partial<Record<'el' | 'ella', SerializableProfileSnapshot>>;
}

export interface PlanRevisionProfilePatch {
  summary?: string[];
  noChangesReason?: string;
  profilePatch?: Record<string, unknown>;
  equivalencias?: SerializableEquivalencia[];
  suplementos?: SupplementRecommendation[];
  planPatch?: Record<string, Record<string, MealItem[]>>;
  planPatchSlots?: Array<{
    dia: string;
    momento: string;
    opciones: MealItem[];
  }>;
}

const DEFAULT_DIRECT_MODEL = 'gemini-2.5-flash';
const MAX_MODEL_CANDIDATES = 6;

export interface PlanRevisionResponse {
  responseMode: PlanRevisionMode;
  elData: Record<string, unknown> | PlanRevisionProfilePatch | null;
  ellaData: Record<string, unknown> | PlanRevisionProfilePatch | null;
  modelUsed?: string;
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

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
const TEXT_GENERATION_MODEL_PATTERNS = [
  /^gemini-2\.5-flash$/i,
  /^gemini-3-flash-preview$/i,
  /^gemini-2\.5-flash-lite$/i,
  /^gemini-3\.1-flash-lite-preview$/i,
  /^gemini-2\.5-pro$/i,
  /^gemini-3\.1-pro-preview(?:-customtools)?$/i,
  /^gemini-2\.0-flash(?:-001)?$/i,
  /^gemini-2\.0-flash-lite(?:-001)?$/i,
  /^gemini-flash-latest$/i,
  /^gemini-flash-lite-latest$/i,
  /^gemini-pro-latest$/i,
];
const PRIMARY_MODEL_PRIORITY_MATCHERS = [
  /^gemini-2\.5-flash$/i,
  /^gemini-3-flash-preview$/i,
  /^gemini-2\.5-flash-lite$/i,
  /^gemini-3\.1-flash-lite-preview$/i,
  /^gemini-2\.0-flash(?:-001)?$/i,
  /^gemini-2\.0-flash-lite(?:-001)?$/i,
  /^gemini-flash-latest$/i,
  /^gemini-flash-lite-latest$/i,
  /^gemini-2\.5-pro$/i,
  /^gemini-3\.1-pro-preview(?:-customtools)?$/i,
  /^gemini-pro-latest$/i,
];
const AUTO_FALLBACK_PRIORITY_MATCHERS = [
  /^gemini-2\.5-flash$/i,
  /^gemini-3-flash-preview$/i,
  /^gemini-2\.5-flash-lite$/i,
  /^gemini-3\.1-flash-lite-preview$/i,
  /^gemini-2\.0-flash(?:-001)?$/i,
  /^gemini-2\.0-flash-lite(?:-001)?$/i,
  /^gemini-flash-latest$/i,
  /^gemini-flash-lite-latest$/i,
];

type GeminiDebugContext = {
  flow: AiDebugLog['flow'];
  transport: AiDebugLog['transport'];
  stage: AiDebugLog['stage'];
  payload: unknown;
  targetProfile: 'el' | 'ella' | 'ambos';
  profilePrefix?: 'EL' | 'ELLA';
  requestMode: 'generate' | PlanRevisionMode;
  requestedModel: string;
  selectedModel?: string;
  apiKeySource: AiDebugLog['apiKeySource'];
};

function createDebugLogId(flow: AiDebugLog['flow']) {
  return `${flow}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeAttemptLogs(attempts?: AiDebugAttempt[]) {
  if (!attempts?.length) return undefined;

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

function buildAttemptLog(
  error: unknown,
  input: {
    order: number;
    modelName?: string;
    stage?: AiDebugLog['stage'];
    statusCode?: number;
    rawMessage?: string;
    willRetry?: boolean;
    geminiRequest?: unknown;
    geminiResponse?: { status?: number; body?: unknown };
  }
): AiDebugAttempt {
  const candidate = error as AiErrorWithLog | undefined;
  const debugLog = candidate?.aiDebugLog;
  const response = input.geminiResponse || debugLog?.geminiResponse;

  return {
    order: input.order,
    model: normalizeModelName(debugLog?.selectedModel || input.modelName || ''),
    stage: debugLog?.stage || input.stage || 'generate-content',
    statusCode: input.statusCode ?? candidate?.statusCode ?? response?.status,
    rawMessage:
      input.rawMessage ||
      debugLog?.error?.rawMessage ||
      candidate?.message ||
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

function attachAttemptsToError(
  error: unknown,
  attempts: AiDebugAttempt[],
  debugContext: GeminiDebugContext
) {
  if (error && typeof error === 'object' && 'aiDebugLog' in error) {
    const candidate = error as AiErrorWithLog;
    if (candidate.aiDebugLog) {
      candidate.aiDebugLog = {
        ...candidate.aiDebugLog,
        attempts: sanitizeAttemptLogs(attempts),
      };
      return candidate;
    }
  }

  const fallbackError = createLoggedAiError(debugContext, {
    rawMessage:
      error instanceof Error ? error.message : 'No se pudo completar la solicitud con IA.',
    attempts,
  });
  return fallbackError;
}

function maskApiKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '[redacted]';
  if (trimmed.length <= 8) return '[redacted]';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function estimateBase64Size(base64Value: string) {
  const sanitized = base64Value.replace(/\s/g, '');
  if (!sanitized) return 0;

  const padding = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
  return Math.floor((sanitized.length * 3) / 4) - padding;
}

function sanitizeDebugValue(value: unknown, path: string[] = []): unknown {
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

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeModelName(modelName: string) {
  if (!modelName) return '';
  return modelName.replace(/^models\//, '').trim();
}

function cloneSerializableData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getExpectedProfileId(prefix: 'EL' | 'ELLA') {
  return prefix === 'EL' ? 'el' : 'ella';
}

function getExpectedProfileName(prefix: 'EL' | 'ELLA') {
  return prefix === 'EL' ? 'El' : 'Ella';
}

function createLoggedAiError(
  debugContext: GeminiDebugContext,
  options: {
    rawMessage: string;
    statusCode?: number;
    geminiRequest?: unknown;
    geminiResponse?: { status?: number; body?: unknown };
    stage?: AiDebugLog['stage'];
    attempts?: AiDebugAttempt[];
  }
) {
  const error = new Error(AI_GENERIC_ERROR_MESSAGE) as AiErrorWithLog;
  error.userMessage = AI_GENERIC_ERROR_MESSAGE;
  error.statusCode = options.statusCode && options.statusCode >= 400 ? options.statusCode : 502;
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

function getMaxOutputTokens(modelName: string, requestMode: GeminiDebugContext['requestMode']) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  const hardLimit = normalized.includes('gemini-2.0') || normalized.includes('gemma') ? 8192 : 65536;
  const desired = requestMode === 'adjust' ? 8192 : 32768;
  return Math.min(desired, hardLimit);
}

function getThinkingConfig(modelName: string) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  if (normalized.startsWith('gemini-2.5-')) {
    return { thinkingBudget: 0 };
  }
  return undefined;
}

function modelSupportsGenerateContent(model: any) {
  return (model?.supportedGenerationMethods || []).includes('generateContent');
}

function isTextGenerationModel(modelName: string) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  return TEXT_GENERATION_MODEL_PATTERNS.some((pattern) => pattern.test(normalized));
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

function orderModelNamesByPriority(
  modelNames: string[],
  priorityMatchers: RegExp[],
  preferredModelRaw?: string
) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const remaining = getUniqueModelNames(modelNames, preferredModelRaw);
  const ordered: string[] = [];

  if (preferredModel && remaining.includes(preferredModel)) {
    ordered.push(preferredModel);
  }

  priorityMatchers.forEach((matcher) => {
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

  return ordered;
}

function pickBestModel(models: Array<{ name?: string }>, preferredModelRaw?: string) {
  if (!models.length) {
    throw new Error('No hay modelos compatibles con generateContent en tu cuenta/API key.');
  }

  const modelNames = models.map((model) => normalizeModelName(model.name || ''));
  return orderModelNamesByPriority(
    modelNames,
    PRIMARY_MODEL_PRIORITY_MATCHERS,
    preferredModelRaw
  )[0];
}

function getFallbackModels(models: Array<{ name?: string }>, primaryModel: string) {
  const modelNames = models.map((model) => normalizeModelName(model.name || ''));
  return orderModelNamesByPriority(modelNames, AUTO_FALLBACK_PRIORITY_MATCHERS, primaryModel)
    .filter((name) => name && name !== primaryModel)
    .slice(0, Math.max(MAX_MODEL_CANDIDATES - 1, 0));
}

async function listAvailableModelsDirect(apiKey: string, debugContext: GeminiDebugContext) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const responseText = await response.text();
  const parsedBody = safeParseJson(responseText);

  if (!response.ok) {
    const rawMessage =
      (parsedBody as any)?.error?.message ||
      'No fue posible listar modelos disponibles de Gemini.';
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

  return (((parsedBody as any)?.models || []) as Array<{ name?: string }>)
    .filter((model) => modelSupportsGenerateContent(model) && isTextGenerationModel(model?.name || ''));
}

function shouldRetryStatusCode(statusCode: unknown) {
  return [408, 429, 500, 502, 503, 504].includes(Number(statusCode));
}

function shouldRetryWithDifferentModel(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as AiErrorWithLog;
  const statusCode = candidate.statusCode || candidate.aiDebugLog?.geminiResponse?.status;
  const rawMessage = candidate.aiDebugLog?.error?.rawMessage || candidate.message || '';
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

function sanitizeMomentArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry: any) => ({
      key: typeof entry.key === 'string' ? entry.key : '',
      label: typeof entry.label === 'string' ? entry.label : '',
      hora: typeof entry.hora === 'string' ? entry.hora : '',
    }))
    .filter((entry) => entry.key && entry.label);
}

function resolveMomentSource(payload: any, prefix: 'EL' | 'ELLA') {
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

function createInvalidStructureError(
  debugContext: GeminiDebugContext,
  rawMessage: string,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIntegerValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function validateRequiredStringField(
  container: any,
  fieldName: string,
  location: string,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
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

function validateRequiredIntegerField(
  container: any,
  fieldName: string,
  location: string,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
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

function validateMealItemStructure(
  item: any,
  location: string,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} no es un objeto de comida valido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  // Accept idRef-based format from server (compact: {idRef, porciones, detalle})
  // which will be rehydrated later by parseObjectToData/rehydratePlanRecord.
  if (isNonEmptyString(item.idRef)) {
    validateRequiredStringField(item, 'porciones', location, debugContext, geminiRequest, geminiResponseBody, modelName);
    validateRequiredStringField(item, 'detalle', location, debugContext, geminiRequest, geminiResponseBody, modelName);
    return;
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

function validateMealOptionsArray(
  options: any,
  location: string,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
  if (!Array.isArray(options) || options.length !== 3) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} debe incluir exactamente 3 opciones.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  options.forEach((mealItem: any, index: number) => {
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

function validateEquivalenciasStructure(
  equivalencias: any,
  location: string,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
  if (!Array.isArray(equivalencias) || equivalencias.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  equivalencias.forEach((item: any, index: number) => {
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

    if (
      !Array.isArray(item.items) ||
      item.items.length === 0 ||
      item.items.some((entry: unknown) => !isNonEmptyString(entry))
    ) {
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

function validateSupplementsStructure(
  supplements: any,
  location: string,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
  if (!Array.isArray(supplements)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} debe ser un arreglo.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  supplements.forEach((item: any, index: number) => {
    // Accept string IDs from server (compact format: supplement ID strings)
    // which will be rehydrated later by parseObjectToData.
    if (typeof item === 'string') {
      return;
    }

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

function validateProfileStructure(
  perfil: any,
  profilePrefix: 'EL' | 'ELLA',
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
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

  perfil.momentos.forEach((momento: any, index: number) => {
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

  const momentKeys = perfil.momentos.map((moment: any) => moment?.key).filter(Boolean);
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
    const normalizedGoals: Record<string, Record<string, number>> = {};
    const seenGoalMoments = new Set<string>();

    perfil.objetivosPorMomento.forEach((distribution: any, index: number) => {
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
      ) as Record<string, number>;
      seenGoalMoments.add(momentKey);
    });

    perfil.objetivosPorMomento = normalizedGoals;
  }

  if (
    !perfil.objetivosPorMomento ||
    typeof perfil.objetivosPorMomento !== 'object' ||
    Array.isArray(perfil.objetivosPorMomento)
  ) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: perfil${profilePrefix}.objetivosPorMomento es invalido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  momentKeys.forEach((momentKey: string) => {
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

  const seenDistributionGroups = new Set<string>();
  perfil.distribucionDiaria.forEach((item: any, index: number) => {
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

  if (
    !Array.isArray(perfil.resumenPersonal) ||
    perfil.resumenPersonal.length === 0 ||
    perfil.resumenPersonal.some((entry: unknown) => !isNonEmptyString(entry))
  ) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: perfil${profilePrefix}.resumenPersonal esta vacio o invalido.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  return momentKeys as string[];
}

function normalizeDayName(day: unknown) {
  if (typeof day !== 'string') return '';
  return day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (match) => match.toUpperCase());
}

function buildPlanObjectFromSlots(
  slots: any,
  expectedMomentKeys: string[],
  location: string,
  requireAllSlots: boolean,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${location} esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  const plan: Record<string, Record<string, MealItem[]>> = {};
  const seenSlots = new Set<string>();

  slots.forEach((slot: any, index: number) => {
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

  const missingSlots: string[] = [];
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

function validateLegacyPlanStructure(
  plan: any,
  expectedMomentKeys: string[],
  location: string,
  requireAllSlots: boolean,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
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

  const missingSlots: string[] = [];

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
      const options = (dayValue as Record<string, unknown>)[momentKey];
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

export function validateAndNormalizeDirectAiData(
  data: unknown,
  debugContext: GeminiDebugContext,
  geminiRequest: unknown,
  geminiResponseBody: unknown,
  modelName: string
) {
  const profilePrefix = debugContext.profilePrefix;
  const requestMode = debugContext.requestMode;
  if (!profilePrefix) return data;

  if (requestMode === 'adjust') {
    const patch = cloneSerializableData((data || {}) as PlanRevisionProfilePatch);
    if (!Array.isArray(patch?.summary) || patch.summary.length === 0) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: el ajuste no incluyo summary.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (
      patch.profilePatch !== undefined &&
      (typeof patch.profilePatch !== 'object' ||
        patch.profilePatch === null ||
        Array.isArray(patch.profilePatch))
    ) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: profilePatch no tiene un formato valido.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (patch.equivalencias !== undefined) {
      validateEquivalenciasStructure(
        patch.equivalencias,
        'equivalencias',
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (patch.suplementos !== undefined) {
      validateSupplementsStructure(
        patch.suplementos,
        'suplementos',
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (Array.isArray(patch.planPatchSlots) && patch.planPatchSlots.length > 0) {
      patch.planPatch = buildPlanObjectFromSlots(
        patch.planPatchSlots,
        MEAL_MOMENT_KEYS,
        'planPatchSlots',
        false,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      );
      delete patch.planPatchSlots;
    } else if (patch.planPatch !== undefined) {
      patch.planPatch = validateLegacyPlanStructure(
        patch.planPatch,
        MEAL_MOMENT_KEYS,
        'planPatch',
        false,
        debugContext,
        geminiRequest,
        geminiResponseBody,
        modelName
      ) as Record<string, Record<string, MealItem[]>>;
    }

    if (
      !patch.planPatch &&
      !patch.noChangesReason &&
      !patch.profilePatch &&
      !patch.equivalencias &&
      !patch.suplementos
    ) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: el ajuste no incluyo cambios ni noChangesReason.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (patch.noChangesReason !== undefined && !isNonEmptyString(patch.noChangesReason)) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: noChangesReason esta vacio.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    if (patch.summary.some((entry) => !isNonEmptyString(entry))) {
      throw createInvalidStructureError(
        debugContext,
        'Respuesta de IA incompleta: summary contiene lineas vacias.',
        geminiRequest,
        geminiResponseBody,
        modelName
      );
    }

    return patch;
  }

  const normalized = cloneSerializableData((data || {}) as Record<string, unknown>);
  const perfilKey = `perfil${profilePrefix}`;
  const equivKey = `equivalencias${profilePrefix}`;
  const supplementsKey = `suplementos${profilePrefix}`;
  const planKey = `plan${profilePrefix}`;
  const planTransportKey = `planSemanal${profilePrefix}`;
  const perfil = normalized[perfilKey] as Record<string, unknown> | undefined;

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

  if (!normalized[equivKey] || (Array.isArray(normalized[equivKey]) && normalized[equivKey].length === 0)) {
    normalized[equivKey] = profilePrefix === 'EL' ? equivalenciasEL : equivalenciasELLA;
  }

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

  try {
    return parseObjectToData(normalized, profilePrefix);
  } catch (error) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${error instanceof Error ? error.message : String(error)}`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }
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
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      super: {
        type: 'array',
        items: { type: 'string' },
      },
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
        icon: {
          type: 'string',
          enum: ALLOWED_ICONS,
        },
        items: {
          type: 'array',
          items: { type: 'string' },
        },
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

function buildPlanSlotsSchema(requireAllSlots: boolean) {
  return {
    type: 'array',
    items: buildPlanSlotSchema(),
  };
}

function buildFullResponseSchema(prefix: string) {
  const profileKey = `perfil${prefix}`;
  const equivalenciasKey = `equivalencias${prefix}`;
  const suplementosKey = `suplementos${prefix}`;
  const planTransportKey = `planSemanal${prefix}`;
  return {
    type: 'object',
    additionalProperties: false,
    required: [profileKey, equivalenciasKey, suplementosKey, planTransportKey],
    propertyOrdering: [
      profileKey,
      equivalenciasKey,
      suplementosKey,
      planTransportKey,
    ],
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

function buildGenerationOutputContract(prefix: string) {
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

function isPlanRevisionRequest(payload: any): payload is PlanRevisionRequest {
  return payload?.requestMode === 'adjust' || payload?.requestMode === 'regenerate';
}

function sanitizePromptPayload(payload: any) {
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

function getOptionalPdfPart(payload: any): GeminiPart[] {
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

function buildSystemPrompt(prefix: string) {
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

function buildUserPrompt(payload: any, prefix: string) {
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

function buildRevisionSystemPrompt(prefix: string, mode: PlanRevisionMode) {
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
- Si devuelves varios slots, ordenalos por dia y luego por momento.
- Cada slot incluido en planPatchSlots debe regresar el arreglo completo de 3 opciones para ese slot.
- Nunca devuelvas el plan completo en modo adjust.
- Cada MealItem debe incluir exactamente estas claves: ${MEAL_ITEM_REQUIRED_KEYS.join(', ')}.
- profilePatch, equivalencias y suplementos son opcionales; omitelos si no cambian.
- Mantente consistente con el cuestionario, el plan actual, las ediciones manuales y las restricciones del usuario.`;
}

function buildRevisionUserPrompt(prefix: string, payload: PlanRevisionRequest, profilePayload: any) {
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

function buildRequestParts(prefix: string, payload: any): GeminiPart[] {
  return [
    { text: buildUserPrompt(payload, prefix) },
    ...getOptionalPdfPart(payload),
  ];
}

function buildRevisionRequestParts(
  prefix: string,
  payload: PlanRevisionRequest,
  profilePayload: any
): GeminiPart[] {
  return [
    { text: buildRevisionUserPrompt(prefix, payload, profilePayload) },
  ];
}

function sanitizeAiJson(text: string) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Respuesta de IA no contiene JSON valido.');
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function buildScopedPayload(payload: any, profileData?: any) {
  const { el, ella, ...basePayload } = payload || {};
  return {
    ...basePayload,
    ...(profileData || {}),
  };
}

function buildRevisionScopedPayload(
  payload: PlanRevisionRequest,
  profileId: 'el' | 'ella'
) {
  const companionId = profileId === 'el' ? 'ella' : 'el';
  return {
    currentContext: payload.currentContext?.[profileId] || null,
    originalContext: payload.originalContext?.[profileId] || null,
    companionContext: payload.currentContext?.[companionId] || null,
  };
}

async function generateContent(
  parts: GeminiPart[],
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
  debugContext: GeminiDebugContext
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
      maxOutputTokens: getMaxOutputTokens(modelName || DEFAULT_DIRECT_MODEL, debugContext.requestMode),
      ...(getThinkingConfig(modelName || DEFAULT_DIRECT_MODEL)
        ? { thinkingConfig: getThinkingConfig(modelName || DEFAULT_DIRECT_MODEL) }
        : {}),
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || DEFAULT_DIRECT_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;

    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson?.error?.message || errorMessage;
    } catch {
      // Ignore JSON parse errors for API failures.
    }

    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'generate-content',
        selectedModel: modelName || DEFAULT_DIRECT_MODEL,
      },
      {
        rawMessage: `Gemini API Error: ${errorMessage}`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: safeParseJson(responseText),
        },
      }
    );
  }

  let responseJson: any;
  try {
    responseJson = JSON.parse(responseText);
  } catch (error) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName || DEFAULT_DIRECT_MODEL,
      },
      {
        rawMessage: `La respuesta 200 de Gemini no fue JSON valido: ${error instanceof Error ? error.message : String(error)}`,
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
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName || DEFAULT_DIRECT_MODEL,
      },
      {
        rawMessage: 'La IA no genero candidatos validos para esta solicitud.',
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
        selectedModel: modelName || DEFAULT_DIRECT_MODEL,
      },
      {
        rawMessage: `La IA no pudo completar la respuesta (${finishReason}).`,
        statusCode: response.status,
        geminiRequest: body,
        geminiResponse: {
          status: response.status,
          body: responseJson,
        },
      }
    );
  }

  const generatedText =
    candidates[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('\n')
      .trim() || '';

  if (!generatedText) {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName || DEFAULT_DIRECT_MODEL,
      },
      {
        rawMessage: 'La IA devolvio una respuesta vacia.',
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
    return validateAndNormalizeDirectAiData(
      parsedData,
      debugContext,
      body,
      responseJson,
      modelName || DEFAULT_DIRECT_MODEL
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'aiDebugLog' in error) {
      throw error;
    }

    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'response-parse',
        selectedModel: modelName || DEFAULT_DIRECT_MODEL,
      },
      {
        rawMessage: `La IA devolvio JSON no parseable: ${error instanceof Error ? error.message : String(error)}`,
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

async function generateContentWithFallback(
  parts: GeminiPart[],
  apiKey: string,
  modelCandidates: string[],
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
  debugContext: GeminiDebugContext
) {
  let lastError: unknown;
  const attempts: AiDebugAttempt[] = [];

  for (let index = 0; index < modelCandidates.length; index += 1) {
    const modelName = modelCandidates[index];

    try {
      const data = await generateContent(
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

export async function callGeminiDirectly(
  payload: any,
  apiKey: string,
  modelName: string
): Promise<any> {
  void payload;
  void apiKey;
  void modelName;

  throw new Error(
    'La llamada directa a Gemini desde el navegador esta deshabilitada. Usa el backend con GEMINI_API_KEY del servidor.'
  );
}
