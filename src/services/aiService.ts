import type { MealItem, SupplementRecommendation } from '../types';

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
}

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
        icon: {
          type: 'string',
          enum: ALLOWED_ICONS,
        },
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

function buildPlanDaySchema(requireAllMoments: boolean) {
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

function buildPlanSchema(requireAllDays: boolean, requireAllMoments: boolean) {
  return {
    type: 'object',
    additionalProperties: false,
    required: requireAllDays ? WEEK_DAYS : [],
    properties: Object.fromEntries(
      WEEK_DAYS.map((dayKey) => [dayKey, buildPlanDaySchema(requireAllMoments)])
    ),
  };
}

function buildFullResponseSchema(prefix: string) {
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

function buildGenerationOutputContract(prefix: string) {
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

function isPlanRevisionRequest(payload: any): payload is PlanRevisionRequest {
  return payload?.requestMode === 'adjust' || payload?.requestMode === 'regenerate';
}


function pruneUnsupportedSchemaKeywords(value: any): any {
  if (Array.isArray(value)) {
    return value.map(pruneUnsupportedSchemaKeywords);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const nextValue: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === 'additionalProperties') continue;
    nextValue[key] = pruneUnsupportedSchemaKeywords(nestedValue);
  }

  return nextValue;
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

function buildUserPrompt(payload: any, prefix: string) {
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

function buildRevisionSystemPrompt(prefix: string, mode: PlanRevisionMode) {
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
- profilePatch, equivalencias y suplementos son opcionales; omitelo si no cambian.
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
  responseSchema: Record<string, unknown>
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
  const requestGemini = async (includeSchema: boolean) => {
    const generationConfig: Record<string, unknown> = {
      temperature: 0.2,
      responseMimeType: 'application/json',
    };

    if (includeSchema) {
      generationConfig.responseSchema = pruneUnsupportedSchemaKeywords(responseSchema);
    }

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
      generationConfig,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    return { response, responseText };
  };

  let { response, responseText } = await requestGemini(true);

  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;

    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson?.error?.message || errorMessage;
    } catch {
      // Ignore JSON parse errors for API failures.
    }

    const statesConstraintError =
      errorMessage.toLowerCase().includes('too many states for serving');

    if (statesConstraintError) {
      ({ response, responseText } = await requestGemini(false));
      if (!response.ok) {
        let fallbackErrorMessage = `Error ${response.status}`;
        try {
          const fallbackErrorJson = JSON.parse(responseText);
          fallbackErrorMessage = fallbackErrorJson?.error?.message || fallbackErrorMessage;
        } catch {
          // Ignore JSON parse errors for API failures.
        }
        throw new Error(`Gemini API Error: ${fallbackErrorMessage}`);
      }
    } else {
      throw new Error(`Gemini API Error: ${errorMessage}`);
    }
  }

  const responseJson = JSON.parse(responseText);
  const candidates = responseJson?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('La IA no genero candidatos validos para esta solicitud.');
  }

  const finishReason = candidates[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`La IA no pudo completar la respuesta (${finishReason}).`);
  }

  const generatedText =
    candidates[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('\n')
      .trim() || '';

  if (!generatedText) {
    throw new Error('La IA devolvio una respuesta vacia.');
  }

  return JSON.parse(sanitizeAiJson(generatedText));
}

export async function callGeminiDirectly(
  payload: any,
  apiKey: string,
  modelName: string
): Promise<any> {
  const target = payload?.targetProfile || 'ambos';
  let elData = null;
  let ellaData = null;

  if (isPlanRevisionRequest(payload)) {
    if (target === 'el' || target === 'ambos') {
      const elPayload = buildRevisionScopedPayload(payload, 'el');
      elData = await generateContent(
        buildRevisionRequestParts('EL', payload, elPayload),
        apiKey,
        modelName,
        buildRevisionSystemPrompt('EL', payload.requestMode),
        payload.requestMode === 'regenerate'
          ? buildFullResponseSchema('EL')
          : buildAdjustResponseSchema()
      );
    }

    if (target === 'ella' || target === 'ambos') {
      const ellaPayload = buildRevisionScopedPayload(payload, 'ella');
      ellaData = await generateContent(
        buildRevisionRequestParts('ELLA', payload, ellaPayload),
        apiKey,
        modelName,
        buildRevisionSystemPrompt('ELLA', payload.requestMode),
        payload.requestMode === 'regenerate'
          ? buildFullResponseSchema('ELLA')
          : buildAdjustResponseSchema()
      );
    }

    return {
      responseMode: payload.requestMode,
      elData,
      ellaData,
    } satisfies PlanRevisionResponse;
  }

  if (target === 'el' || target === 'ambos') {
    const elPayload = target === 'ambos' ? buildScopedPayload(payload, payload?.el) : payload;
    elData = await generateContent(
      buildRequestParts('EL', elPayload),
      apiKey,
      modelName,
      buildSystemPrompt('EL'),
      buildFullResponseSchema('EL')
    );
  }

  if (target === 'ella' || target === 'ambos') {
    const ellaPayload =
      target === 'ambos' ? buildScopedPayload(payload, payload?.ella) : payload;

    if (target === 'ambos' && elData?.planEL) {
      ellaPayload.companionPlan = elData.planEL;
    }

    ellaData = await generateContent(
      buildRequestParts('ELLA', ellaPayload),
      apiKey,
      modelName,
      buildSystemPrompt('ELLA'),
      buildFullResponseSchema('ELLA')
    );
  }

  return { elData, ellaData };
}
