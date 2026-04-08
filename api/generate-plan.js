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
    additionalProperties: false,
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
      [`perfil${prefix}`]: buildProfileSchema(false),
      [`equivalencias${prefix}`]: buildEquivalenciasSchema(),
      [`suplementos${prefix}`]: buildSuplementosSchema(),
      [`plan${prefix}`]: buildPlanSchema(true, true),
    },
  };
}

function buildAdjustResponseSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary'],
    propertyOrdering: ['summary', 'noChangesReason', 'profilePatch', 'equivalencias', 'suplementos', 'planPatch'],
    properties: {
      summary: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: { type: 'string' },
      },
      noChangesReason: { type: 'string' },
      profilePatch: buildProfileSchema(true),
      equivalencias: buildEquivalenciasSchema(),
      suplementos: buildSuplementosSchema(),
      planPatch: buildPlanSchema(false, false),
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

async function listAvailableModels(apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || 'No fue posible listar modelos disponibles de Gemini.');
  }

  return (json?.models || []).filter(modelSupportsGenerateContent);
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
    /^gemini-2\.5-pro/i,
    /^gemini-2\.5-flash/i,
    /^gemini-2\.0-flash/i,
    /^gemini-2\.5-flash-lite/i,
    /^gemini-2\.0-flash-lite/i,
    /^gemini-1\.5-pro/i,
    /^gemini-1\.5-flash/i,
    /^gemini-flash-latest/i,
    /^gemini-2\.0-pro/i,
  ];

  for (const matcher of priorityMatchers) {
    const match = modelNames.find((name) => matcher.test(name));
    if (match) return match;
  }

  return modelNames[0];
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

async function generateWithGemini(parts, apiKey, modelName, systemInstruction, responseSchema) {
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
      responseSchema,
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

    throw new Error(errorMessage);
  }

  const responseJson = JSON.parse(responseText);
  const candidates = responseJson?.candidates;

  if (!Array.isArray(candidates) || !candidates.length) {
    throw new Error('La IA no genero una respuesta valida. Intenta de nuevo.');
  }

  const responseParts = candidates[0]?.content?.parts;
  if (!Array.isArray(responseParts) || !responseParts.length) {
    throw new Error('La IA devolvio una respuesta vacia. Intenta de nuevo.');
  }

  const generatedText = responseParts.map((part) => part?.text || '').join('\n').trim();
  if (!generatedText) {
    throw new Error('La IA devolvio texto vacio. Intenta de nuevo con otro modelo.');
  }

  const finishReason = candidates[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`La IA no pudo completar la respuesta (${finishReason}). Intenta de nuevo.`);
  }

  return JSON.parse(sanitizeAiJson(generatedText));
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
      payload.preferredModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

    const models = await listAvailableModels(apiKey);
    const selectedModel = pickBestModel(models, preferredModel);

    let elData = null;
    let ellaData = null;

    if (isPlanRevisionRequest(payload)) {
      if (target === 'el' || target === 'ambos') {
        elData = await generateWithGemini(
          buildRevisionRequestParts('EL', payload, buildRevisionScopedPayload(payload, 'el')),
          apiKey,
          selectedModel,
          buildRevisionSystemPrompt('EL', payload.requestMode),
          payload.requestMode === 'regenerate'
            ? buildFullResponseSchema('EL')
            : buildAdjustResponseSchema()
        );
      }

      if (target === 'ella' || target === 'ambos') {
        ellaData = await generateWithGemini(
          buildRevisionRequestParts('ELLA', payload, buildRevisionScopedPayload(payload, 'ella')),
          apiKey,
          selectedModel,
          buildRevisionSystemPrompt('ELLA', payload.requestMode),
          payload.requestMode === 'regenerate'
            ? buildFullResponseSchema('ELLA')
            : buildAdjustResponseSchema()
        );
      }

      return res.status(200).json({
        responseMode: payload.requestMode,
        elData,
        ellaData,
        modelUsed: selectedModel,
      });
    }

    if (target === 'el' || target === 'ambos') {
      const payloadEl = target === 'ambos' ? buildScopedPayload(payload, payload.el) : payload;
      elData = await generateWithGemini(
        buildRequestParts('EL', payloadEl),
        apiKey,
        selectedModel,
        buildSystemPrompt('EL'),
        buildFullResponseSchema('EL')
      );
    }

    if (target === 'ella' || target === 'ambos') {
      const payloadElla = target === 'ambos' ? buildScopedPayload(payload, payload.ella) : payload;
      if (target === 'ambos' && elData?.planEL) {
        payloadElla.companionPlan = elData.planEL;
      }

      ellaData = await generateWithGemini(
        buildRequestParts('ELLA', payloadElla),
        apiKey,
        selectedModel,
        buildSystemPrompt('ELLA'),
        buildFullResponseSchema('ELLA')
      );
    }

    return res.status(200).json({ elData, ellaData, modelUsed: selectedModel });
  } catch (error) {
    console.error('Error en handler:', error);
    return res.status(500).json({
      error: error?.message || 'No se pudo generar el plan con IA.',
    });
  }
}
