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

  return `Eres un nutricionista clinico experto. Genera un plan semanal completo, realista y consistente con el cuestionario.

Debes responder SOLO con JSON valido y seguir exactamente esta estructura:

1. perfil${prefix}: {
  id: "${lowerPrefix}",
  nombre: "${prefix === 'EL' ? 'El' : 'Ella'}",
  perfil: string,
  detallesPerfil: string,
  meta: string,
  metaCaloricaKcalDia: number,
  descripcion: string,
  edad: number,
  horariosTexto: string,
  notaSalud: string,
  momentos: [{ key, label, hora }],
  objetivosPorMomento: {
    desayuno: { frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas },
    colacion_am: { frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas },
    comida: { frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas },
    colacion_pm: { frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas },
    cena: { frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas }
  },
  distribucionDiaria: [{ grupo, total, detalle }],
  resumenPersonal: string[],
}

2. equivalencias${prefix}: [
  { titulo: string, icon: enum[${ALLOWED_ICONS.join(', ')}], items: string[] }
]

3. suplementos${prefix}: [
  {
    name: string,
    goalSupport: string,
    whyItMayHelp: string,
    howToUse: string,
    timing: string,
    notes: string,
    caution: string
  }
]

4. plan${prefix}: {
  Lunes: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Martes: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Miercoles: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Jueves: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Viernes: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Sabado: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Domingo: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] }
}

Reglas criticas:
- No cambies id ni nombre.
- "perfil" debe ser SIEMPRE un resumen compacto en una sola linea con este formato: "<peso> kg | <altura> m | <edad> anos | IMC <valor>". Ejemplo valido: "67 kg | 1.60 m | 32 anos | IMC 26.2".
- No pongas parrafos, explicaciones clinicas ni texto narrativo dentro de "perfil".
- Usa "detallesPerfil" para guardar el analisis narrativo completo del caso, incluyendo contexto corporal, actividad, hallazgos del PDF, riesgos y consideraciones relevantes.
- Cada comida debe incluir: nombre, porciones, detalle, tags, super, caloriasKcal, proteinaG, grasasG.
- Las calorias y macros deben ser enteros realistas.
- Las equivalencias deben alinearse con los ingredientes usados en el plan.
- Los suplementos deben ser EXTRA opcional. Nunca deben ser necesarios para cumplir calorias, macros o el objetivo.
- No pongas suplementos dentro de plan${prefix}. El plan debe usar alimentos reales.
- Si el usuario adjunto PDF o medidas corporales, usalos como contexto complementario.
- Si hay conflicto entre el PDF y las respuestas manuales, prioriza las respuestas manuales del cuestionario.
- Si targetProfile = "ambos" y recibes companionPlan, conserva las mismas preparaciones base por dia, momento e indice, ajustando solo porciones y macros.
- Responde solo con JSON, sin markdown ni texto adicional.`;
}

function buildUserPrompt(payload: any, prefix: string) {
  return JSON.stringify({
    profilePrefix: prefix,
    questionnaire: sanitizePromptPayload(payload),
    outputContract: {
      rootKeys: [
        `perfil${prefix}`,
        `equivalencias${prefix}`,
        `suplementos${prefix}`,
        `plan${prefix}`,
      ],
      fixedDays: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'],
      momentsSource: 'questionnaire.planConfig.selectedMoments',
      profileRequiredKeys: [
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
      ],
      profileFormat: {
        perfil: '<peso> kg | <altura> m | <edad> anos | IMC <valor>',
        detallesPerfil: 'Resumen narrativo del caso y contexto clinico.',
      },
      mealsRequiredKeys: [
        'nombre',
        'porciones',
        'detalle',
        'tags',
        'super',
        'caloriasKcal',
        'proteinaG',
        'grasasG',
      ],
      supplementRequiredKeys: [
        'name',
        'goalSupport',
        'whyItMayHelp',
        'howToUse',
        'timing',
        'notes',
        'caution',
      ],
    },
  });
}

function buildRevisionSystemPrompt(prefix: string, mode: PlanRevisionMode) {
  const lowerPrefix = prefix.toLowerCase();
  const baseGoal =
    mode === 'regenerate'
      ? 'Reconstruye el plan semanal completo desde cero usando el contexto disponible y las nuevas instrucciones del usuario.'
      : 'Ajusta solo las partes necesarias del plan actual segun la solicitud del usuario, sin reescribir secciones que no cambian.';

  return `Eres un nutricionista clinico experto. ${baseGoal}

Debes responder SOLO con JSON valido.

El perfil objetivo es "${lowerPrefix}". Nunca cambies su id ni su nombre.

Contrato exacto de salida:
{
  "summary": string[],
  "noChangesReason"?: string,
  "profilePatch"?: {
    "perfil"?: string,
    "detallesPerfil"?: string,
    "meta"?: string,
    "metaCaloricaKcalDia"?: number,
    "descripcion"?: string,
    "edad"?: number,
    "horariosTexto"?: string,
    "notaSalud"?: string,
    "momentos"?: [{ key, label, hora }],
    "objetivosPorMomento"?: object,
    "distribucionDiaria"?: [{ grupo, total, detalle }],
    "resumenPersonal"?: string[]
  },
  "equivalencias"?: [
    { "titulo": string, "icon": enum[${ALLOWED_ICONS.join(', ')}], "items": string[] }
  ],
  "suplementos"?: [
    {
      "name": string,
      "goalSupport": string,
      "whyItMayHelp": string,
      "howToUse": string,
      "timing": string,
      "notes": string,
      "caution": string
    }
  ],
  "planPatch"?: {
    "Lunes"?: {
      "desayuno"?: [MealItem, MealItem, MealItem],
      "colacion_am"?: [MealItem, MealItem, MealItem],
      "comida"?: [MealItem, MealItem, MealItem],
      "colacion_pm"?: [MealItem, MealItem, MealItem],
      "cena"?: [MealItem, MealItem, MealItem]
    },
    "Martes"?: object,
    "Miercoles"?: object,
    "Jueves"?: object,
    "Viernes"?: object,
    "Sabado"?: object,
    "Domingo"?: object
  }
}

Reglas criticas:
- summary siempre debe incluir entre 1 y 4 lineas cortas explicando lo que cambiaste.
- Si realmente no hace falta modificar nada, responde con summary y noChangesReason. No inventes cambios.
- Si usas planPatch, incluye SOLO los dias y momentos modificados.
- Cada momento incluido en planPatch debe regresar el arreglo completo de opciones para ese momento, no cambios parciales dentro de una sola comida.
- Nunca devuelvas el plan completo si el usuario no pidio recrearlo desde cero.
- Cada MealItem debe incluir: nombre, porciones, detalle, tags, super, caloriasKcal, proteinaG, grasasG.
- Las calorias y macros deben ser enteros realistas.
- profilePatch, equivalencias y suplementos son opcionales; incluyelos solo si tu respuesta necesita cambiar esas secciones.
- Mantente consistente con el contexto del cuestionario, el plan actual, las ediciones manuales y las restricciones pedidas por el usuario.
- Si el usuario pide recrear desde cero y aun asi conservas algo del plan actual, debe ser por conveniencia nutricional, no por copiarlo automaticamente.
- Responde solo con JSON, sin markdown ni texto adicional.`;
}

function buildRevisionUserPrompt(prefix: string, payload: PlanRevisionRequest, profilePayload: any) {
  return JSON.stringify({
    profilePrefix: prefix,
    mode: payload.requestMode,
    userInstruction: payload.instruction,
    questionnaireContext: sanitizePromptPayload(payload.questionnaireContext),
    currentContext: profilePayload.currentContext,
    originalContext: profilePayload.originalContext,
    companionContext: profilePayload.companionContext,
    outputNotes: {
      returnOnlyChangedSections: payload.requestMode === 'adjust',
      preserveUntouchedMoments: payload.requestMode === 'adjust',
      mealItemRequiredKeys: [
        'nombre',
        'porciones',
        'detalle',
        'tags',
        'super',
        'caloriasKcal',
        'proteinaG',
        'grasasG',
      ],
    },
  });
}

function buildRequestParts(prefix: string, payload: any): GeminiPart[] {
  return [
    { text: buildSystemPrompt(prefix) },
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
    { text: buildRevisionSystemPrompt(prefix, payload.requestMode) },
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
  modelName: string
) {
  const body = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.35,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
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

    throw new Error(`Gemini API Error: ${errorMessage}`);
  }

  const responseJson = JSON.parse(responseText);
  const generatedText =
    responseJson?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('\n') || '';

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
        modelName
      );
    }

    if (target === 'ella' || target === 'ambos') {
      const ellaPayload = buildRevisionScopedPayload(payload, 'ella');
      ellaData = await generateContent(
        buildRevisionRequestParts('ELLA', payload, ellaPayload),
        apiKey,
        modelName
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
    elData = await generateContent(buildRequestParts('EL', elPayload), apiKey, modelName);
  }

  if (target === 'ella' || target === 'ambos') {
    const ellaPayload =
      target === 'ambos' ? buildScopedPayload(payload, payload?.ella) : payload;

    if (target === 'ambos' && elData?.planEL) {
      ellaPayload.companionPlan = elData.planEL;
    }

    ellaData = await generateContent(buildRequestParts('ELLA', ellaPayload), apiKey, modelName);
  }

  return { elData, ellaData };
}
