import { applyCorsHeaders, enforceRateLimit } from './_requestGuard.js';

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
    required: FOOD_GROUP_KEYS,
    properties: Object.fromEntries(
      FOOD_GROUP_KEYS.map((groupKey) => [groupKey, { type: 'integer' }])
    ),
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
        minItems: 1,
        items: buildMomentTimeSchema(),
      },
      objetivosPorMomento: {
        type: 'object',
        additionalProperties: false,
        required: partial ? [] : MEAL_MOMENT_KEYS,
        properties: Object.fromEntries(
          MEAL_MOMENT_KEYS.map((momentKey) => [momentKey, buildMomentDistributionSchema()])
        ),
      },
      distribucionDiaria: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['grupo', 'total', 'detalle'],
          properties: {
            grupo: { type: 'string' },
            total: { type: 'integer' },
            detalle: { type: 'string' },
          },
        },
      },
      resumenPersonal: {
        type: 'array',
        minItems: 1,
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
        items: {
          type: 'array',
          minItems: 1,
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

function buildPlanDaySchema(requireAllMoments) {
  return {
    type: 'object',
    additionalProperties: false,
    required: requireAllMoments ? MEAL_MOMENT_KEYS : [],
    properties: Object.fromEntries(
      MEAL_MOMENT_KEYS.map((momentKey) => [
        momentKey,
        {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: buildMealItemSchema(),
        },
      ])
    ),
  };
}

function buildPlanSchema(requireAllDays, requireAllMoments) {
  return {
    type: 'object',
    additionalProperties: false,
    required: requireAllDays ? WEEK_DAYS : [],
    properties: Object.fromEntries(
      WEEK_DAYS.map((dayKey) => [dayKey, buildPlanDaySchema(requireAllMoments)])
    ),
  };
}

function buildFullResponseSchema(prefix) {
  return {
    type: 'object',
    required: [
      `perfil${prefix}`,
      `equivalencias${prefix}`,
      `suplementos${prefix}`,
      `plan${prefix}`,
    ],
    propertyOrdering: [
      `perfil${prefix}`,
      `equivalencias${prefix}`,
      `suplementos${prefix}`,
      `plan${prefix}`,
    ],
    properties: {
      [`perfil${prefix}`]: { type: 'object' },
      [`equivalencias${prefix}`]: {
        type: 'array',
        items: { type: 'object' },
      },
      [`suplementos${prefix}`]: {
        type: 'array',
        items: { type: 'object' },
      },
      [`plan${prefix}`]: { type: 'object' },
    },
  };
}

function buildAdjustResponseSchema() {
  return {
    type: 'object',
    required: ['summary'],
    propertyOrdering: ['summary', 'noChangesReason', 'profilePatch', 'equivalencias', 'suplementos', 'planPatch'],
    properties: {
      summary: {
        type: 'array',
        items: { type: 'string' },
      },
      noChangesReason: { type: 'string' },
      profilePatch: { type: 'object' },
      equivalencias: {
        type: 'array',
        items: { type: 'object' },
      },
      suplementos: {
        type: 'array',
        items: { type: 'object' },
      },
      planPatch: { type: 'object' },
    },
  };
}

function buildGenerationOutputContract(prefix) {
  return {
    rootKeys: [
      `perfil${prefix}`,
      `equivalencias${prefix}`,
      `suplementos${prefix}`,
      `plan${prefix}`,
    ],
    fixedDays: WEEK_DAYS,
    fixedMoments: MEAL_MOMENT_KEYS,
    fixedFoodGroups: FOOD_GROUP_KEYS,
    profileRequiredKeys: PROFILE_REQUIRED_KEYS,
    mealsRequiredKeys: MEAL_ITEM_REQUIRED_KEYS,
    supplementRequiredKeys: SUPPLEMENT_REQUIRED_KEYS,
  };
}

function cloneSerializableData(value) {
  return JSON.parse(JSON.stringify(value));
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

    if (data.planPatch && typeof data.planPatch === 'object') {
      for (const [dayKey, dayValue] of Object.entries(data.planPatch)) {
        if (!dayValue || typeof dayValue !== 'object' || Array.isArray(dayValue)) {
          throw createInvalidStructureError(
            debugContext,
            `Respuesta de IA incompleta: planPatch.${dayKey} no tiene un formato valido.`,
            geminiRequest,
            geminiResponseBody,
            modelName
          );
        }

        for (const [momentKey, meals] of Object.entries(dayValue)) {
          if (!Array.isArray(meals) || meals.length === 0) {
            throw createInvalidStructureError(
              debugContext,
              `Respuesta de IA incompleta: planPatch.${dayKey}.${momentKey} esta vacio.`,
              geminiRequest,
              geminiResponseBody,
              modelName
            );
          }
        }
      }
    }

    return data;
  }

  const normalized = cloneSerializableData(data || {});
  const perfilKey = `perfil${profilePrefix}`;
  const equivKey = `equivalencias${profilePrefix}`;
  const supplementsKey = `suplementos${profilePrefix}`;
  const planKey = `plan${profilePrefix}`;
  const perfil = normalized[perfilKey];

  if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: falta ${perfilKey}.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

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

  if (!Array.isArray(perfil.momentos) || perfil.momentos.length === 0) {
    throw createInvalidStructureError(
      debugContext,
      'Respuesta de IA incompleta: el perfil no incluyo momentos.',
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  if (!Array.isArray(normalized[equivKey]) || normalized[equivKey].length === 0) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: ${equivKey} esta vacio.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

  if (!Array.isArray(normalized[supplementsKey])) {
    normalized[supplementsKey] = [];
  }

  const plan = normalized[planKey];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    throw createInvalidStructureError(
      debugContext,
      `Respuesta de IA incompleta: falta ${planKey}.`,
      geminiRequest,
      geminiResponseBody,
      modelName
    );
  }

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

  const missingSlots = [];
  for (const dayKey of WEEK_DAYS) {
    if (!plan[dayKey] || typeof plan[dayKey] !== 'object' || Array.isArray(plan[dayKey])) {
      missingSlots.push(dayKey);
      continue;
    }

    for (const momentKey of momentKeys) {
      if (!Array.isArray(plan[dayKey][momentKey]) || plan[dayKey][momentKey].length === 0) {
        missingSlots.push(`${dayKey}.${momentKey}`);
      }
    }
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

  return `Eres un nutricionista clinico experto. Genera un plan semanal completo, realista y consistente con el cuestionario.

Debes responder con un unico objeto JSON valido. No uses markdown, comentarios, texto fuera del JSON ni claves adicionales.

Perfil objetivo:
- id fijo: "${lowerPrefix}"
- nombre fijo: "${profileLabel}"

Claves raiz obligatorias:
- perfil${prefix}
- equivalencias${prefix}
- suplementos${prefix}
- plan${prefix}

Reglas criticas:
- No cambies id ni nombre.
- Usa exactamente estos dias dentro del JSON: ${WEEK_DAYS.join(', ')}.
- Usa exactamente estos momentos: ${MEAL_MOMENT_KEYS.join(', ')}.
- "perfil" debe ser SIEMPRE una sola linea con este formato: "<peso> kg | <altura> m | <edad> anos | IMC <valor>".
- No pongas narrativa dentro de "perfil"; usa "detallesPerfil" para el analisis completo.
- Cada comida debe incluir exactamente estas claves: ${MEAL_ITEM_REQUIRED_KEYS.join(', ')}.
- Cada momento del plan debe devolver exactamente 3 opciones de comida.
- Las calorias y macros deben ser enteros realistas.
- Las equivalencias deben alinearse con los ingredientes del plan y usar solo iconos permitidos: ${ALLOWED_ICONS.join(', ')}.
- Los suplementos son opcionales y nunca deben ser necesarios para cumplir calorias, macros u objetivo.
- No pongas suplementos dentro del plan.
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
      momentsSource: 'questionnaire.planConfig.selectedMoments',
      profileFormat: {
        perfil: '<peso> kg | <altura> m | <edad> anos | IMC <valor>',
        detallesPerfil: 'Resumen narrativo del caso y contexto clinico.',
      },
      mealOptionsPerMoment: 3,
    },
  });
}

function buildRevisionSystemPrompt(prefix, mode) {
  const lowerPrefix = prefix.toLowerCase();
  if (mode === 'regenerate') {
    return `Eres un nutricionista clinico experto. Reconstruye el plan semanal completo desde cero usando el contexto disponible y las nuevas instrucciones del usuario.

Debes responder con un unico objeto JSON valido. No uses markdown, comentarios ni texto fuera del JSON.

El perfil objetivo es "${lowerPrefix}". Nunca cambies su id ni su nombre.

Debes devolver el plan COMPLETO con el mismo contrato de una generacion normal:
- perfil${prefix}
- equivalencias${prefix}
- suplementos${prefix}
- plan${prefix}

Reglas criticas:
- Usa exactamente los dias ${WEEK_DAYS.join(', ')}.
- Usa exactamente los momentos ${MEAL_MOMENT_KEYS.join(', ')}.
- Cada momento debe regresar exactamente 3 opciones completas.
- Cada comida debe incluir exactamente estas claves: ${MEAL_ITEM_REQUIRED_KEYS.join(', ')}.
- Mantente consistente con el cuestionario, la instruccion nueva y las restricciones activas.
- Si reutilizas ideas del plan actual, hazlo solo cuando siga siendo conveniente, no por copiarlo ciegamente.
- No devuelvas summary, profilePatch ni planPatch en modo regenerate. Devuelve el objeto completo listo para parsearse.`;
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
- planPatch: objeto opcional con solo dias y momentos modificados

Reglas criticas:
- summary siempre debe explicar lo que cambiaste o por que no cambiaste nada.
- Si realmente no hace falta modificar nada, responde con summary y noChangesReason. No inventes cambios.
- Si usas planPatch, incluye SOLO los dias y momentos modificados.
- Cada momento incluido en planPatch debe regresar el arreglo completo de 3 opciones para ese momento.
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

function normalizeModelName(modelName) {
  if (!modelName) return '';
  return modelName.replace(/^models\//, '').trim();
}

function modelSupportsGenerateContent(model) {
  return (model?.supportedGenerationMethods || []).includes('generateContent');
}

function isTextGenerationModel(modelName) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  const allowedPatterns = [
    /^gemini-2\.5-flash$/,
    /^gemini-2\.5-flash-lite$/,
    /^gemini-2\.5-pro$/,
    /^gemini-2\.0-flash(?:-001)?$/,
    /^gemini-2\.0-flash-lite(?:-001)?$/,
    /^gemini-1\.5-flash$/,
    /^gemini-1\.5-pro$/,
    /^gemini-flash-latest$/,
    /^gemini-flash-lite-latest$/,
    /^gemini-pro-latest$/,
  ];

  return allowedPatterns.some((pattern) => pattern.test(normalized));
}

async function listAvailableModels(apiKey, debugContext) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const responseText = await response.text();
  const parsedBody = safeParseJson(responseText);

  if (!response.ok) {
    const rawMessage =
      parsedBody?.error?.message || 'No fue posible listar modelos disponibles de Gemini.';
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'models-list',
      },
      {
        rawMessage,
        statusCode: response.status,
        geminiRequest: {
          method: 'GET',
          url: 'https://generativelanguage.googleapis.com/v1beta/models',
        },
        geminiResponse: {
          status: response.status,
          body: parsedBody,
        },
      }
    );
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    throw createLoggedAiError(
      {
        ...debugContext,
        stage: 'models-list',
      },
      {
        rawMessage: 'La respuesta de modelos de Gemini no fue JSON valido.',
        statusCode: response.status,
        geminiRequest: {
          method: 'GET',
          url: 'https://generativelanguage.googleapis.com/v1beta/models',
        },
        geminiResponse: {
          status: response.status,
          body: responseText,
        },
      }
    );
  }

  return (parsedBody?.models || []).filter(
    (model) => modelSupportsGenerateContent(model) && isTextGenerationModel(model?.name)
  );
}

function pickBestModel(models, preferredModelRaw) {
  const preferredModel = normalizeModelName(preferredModelRaw);
  if (!models.length) {
    throw new Error('No hay modelos compatibles con generateContent en tu cuenta/API key.');
  }

  const modelNames = models.map((model) => normalizeModelName(model.name));

  if (preferredModel && modelNames.includes(preferredModel)) {
    return preferredModel;
  }

  const priorityMatchers = [
    /^gemini-2\.0-flash/i,
    /^gemini-2\.5-flash/i,
    /^gemini-flash-latest/i,
    /^gemini-flash-lite-latest/i,
    /^gemini-2\.5-flash-lite/i,
    /^gemini-2\.0-flash-lite/i,
    /^gemini-1\.5-flash/i,
    /^gemini-1\.5-pro/i,
    /^gemini-2\.5-pro/i,
    /^gemini-pro-latest/i,
    /^gemini-2\.0-pro/i,
  ];

  for (const matcher of priorityMatchers) {
    const match = modelNames.find((name) => matcher.test(name));
    if (match) return match;
  }

  return modelNames[0];
}

function getFallbackModels(models, primaryModel) {
  const modelNames = models.map((model) => normalizeModelName(model.name));
  const seen = new Set([primaryModel]);
  const fallbacks = [];
  const priorityMatchers = [
    /^gemini-2\.0-flash/i,
    /^gemini-2\.5-flash/i,
    /^gemini-flash-latest/i,
    /^gemini-flash-lite-latest/i,
    /^gemini-2\.5-flash-lite/i,
    /^gemini-2\.0-flash-lite/i,
    /^gemini-1\.5-flash/i,
  ];

  for (const matcher of priorityMatchers) {
    const match = modelNames.find((name) => matcher.test(name) && !seen.has(name));
    if (match) {
      seen.add(match);
      fallbacks.push(match);
    }
  }

  return fallbacks;
}

function shouldRetryWithDifferentModel(error) {
  const statusCode = error?.statusCode || error?.aiDebugLog?.geminiResponse?.status;
  const rawMessage = error?.aiDebugLog?.error?.rawMessage || error?.message || '';
  const normalizedMessage = String(rawMessage).toLowerCase();

  return (
    statusCode === 503 ||
    normalizedMessage.includes('high demand') ||
    normalizedMessage.includes('unavailable') ||
    normalizedMessage.includes('max_tokens') ||
    normalizedMessage.includes('respuesta de ia incompleta') ||
    normalizedMessage.includes('faltan secciones') ||
    normalizedMessage.includes('no incluyo')
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

      if (index === modelCandidates.length - 1 || !shouldRetryWithDifferentModel(error)) {
        throw error;
      }
    }
  }

  throw lastError;
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
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseJsonSchema: responseSchema,
      maxOutputTokens: getMaxOutputTokens(modelName, debugContext.requestMode),
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

    const customApiKey =
      typeof payload.customApiKey === 'string' ? payload.customApiKey.trim() : '';
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    const preferredModel =
      payload.preferredModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const requestMode = isPlanRevisionRequest(payload) ? payload.requestMode : 'generate';
    const flow = isPlanRevisionRequest(payload) ? 'plan-revision' : 'questionnaire-submit';

    if (!apiKey) {
      return res.status(500).json({
        error:
          'Falta configurar tu GEMINI API KEY. Ve al panel de Administracion y configúrala.',
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
      apiKeySource: customApiKey ? 'custom-server' : 'server-env',
    };

    const models = await listAvailableModels(apiKey, debugBase);
    const selectedModel = normalizeModelName(preferredModel) || pickBestModel(models, preferredModel);
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
