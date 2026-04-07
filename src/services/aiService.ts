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

function buildRequestParts(prefix: string, payload: any): GeminiPart[] {
  return [
    { text: buildSystemPrompt(prefix) },
    { text: buildUserPrompt(payload, prefix) },
    ...getOptionalPdfPart(payload),
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

export async function callGeminiDirectly(payload: any, apiKey: string, modelName: string) {
  const generateForProfile = async (prefix: 'EL' | 'ELLA', profilePayload: any) => {
    const body = {
      contents: [
        {
          role: 'user',
          parts: buildRequestParts(prefix, profilePayload),
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
  };

  const target = payload?.targetProfile || 'ambos';
  let elData = null;
  let ellaData = null;

  if (target === 'el' || target === 'ambos') {
    const elPayload = target === 'ambos' ? buildScopedPayload(payload, payload?.el) : payload;
    elData = await generateForProfile('EL', elPayload);
  }

  if (target === 'ella' || target === 'ambos') {
    const ellaPayload =
      target === 'ambos' ? buildScopedPayload(payload, payload?.ella) : payload;

    if (target === 'ambos' && elData?.planEL) {
      ellaPayload.companionPlan = elData.planEL;
    }

    ellaData = await generateForProfile('ELLA', ellaPayload);
  }

  return { elData, ellaData };
}
