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

function alignCompanionMeals(
  referencePlan: Record<string, Record<string, any[]>> = {},
  targetPlan: Record<string, Record<string, any[]>> = {}
) {
  const alignedPlan: Record<string, Record<string, any[]>> = { ...targetPlan };

  for (const [day, referenceMoments] of Object.entries(referencePlan)) {
    const targetMoments = alignedPlan[day];
    if (!targetMoments) continue;

    for (const [momentKey, referenceMeals] of Object.entries(referenceMoments || {})) {
      const targetMeals = targetMoments[momentKey];
      if (!Array.isArray(referenceMeals) || !Array.isArray(targetMeals)) continue;

      targetMoments[momentKey] = targetMeals.map((targetMeal, index) => {
        const referenceMeal = referenceMeals[index];
        if (!referenceMeal) return targetMeal;

        return {
          ...targetMeal,
          nombre: referenceMeal.nombre,
          detalle: referenceMeal.detalle,
          tags: referenceMeal.tags,
          super: referenceMeal.super,
        };
      });
    }
  }

  return alignedPlan;
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
        'Archivo adjunto opcional: reporte corporal del usuario en PDF. Úsalo como contexto complementario junto con el cuestionario.',
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

  return `Eres un nutricionista clínico experto. Genera un plan semanal completo, realista y consistente con el cuestionario.

Debes responder SOLO con JSON válido y seguir exactamente esta estructura:

1. perfil${prefix}: {
  id: "${lowerPrefix}",
  nombre: "${prefix === 'EL' ? 'El' : 'Ella'}",
  perfil: string,
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
  Miércoles: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Jueves: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Viernes: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Sábado: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Domingo: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] }
}

Reglas críticas:
- No cambies id ni nombre.
- Cada comida debe incluir: nombre, porciones, detalle, tags, super, caloriasKcal, proteinaG, grasasG.
- Las calorías y macros deben ser enteros realistas.
- Las equivalencias deben alinearse con los ingredientes usados en el plan.
- Los suplementos deben ser EXTRA opcional. Nunca deben ser necesarios para cumplir calorías, macros o el objetivo.
- No pongas suplementos dentro de plan${prefix}. El plan debe usar alimentos reales.
- Si el usuario adjuntó PDF o medidas corporales, úsalos como contexto complementario.
- Si hay conflicto entre el PDF y las respuestas manuales, prioriza las respuestas manuales del cuestionario.
- Si targetProfile = "ambos" y recibes companionPlan, conserva las mismas preparaciones base por día, momento e índice, ajustando solo porciones y macros.
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
      fixedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      momentsSource: 'questionnaire.planConfig.selectedMoments',
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
    throw new Error('Respuesta de IA no contiene JSON válido.');
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
      responseJson?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('\n') ||
      '';

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
    if (target === 'ambos') {
      await new Promise((resolve) => setTimeout(resolve, 4500));
    }

    const ellaPayload = target === 'ambos' ? buildScopedPayload(payload, payload?.ella) : payload;

    if (target === 'ambos' && elData?.planEL) {
      ellaPayload.companionPlan = elData.planEL;
    }

    ellaData = await generateForProfile('ELLA', ellaPayload);

    if (target === 'ambos' && elData?.planEL && ellaData?.planELLA) {
      ellaData.planELLA = alignCompanionMeals(elData.planEL, ellaData.planELLA);
    }
  }

  return { elData, ellaData };
}
