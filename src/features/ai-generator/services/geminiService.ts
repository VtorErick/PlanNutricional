import type { QuestionnairePayload } from '../../../components/NutritionQuestionnaire';

interface GeneratePlanResponse {
  elData?: unknown;
  ellaData?: unknown;
}

// Función auxiliar para llamar directamente a Gemini API
async function callGeminiDirectly(
  payload: QuestionnairePayload,
  apiKey: string,
  modelName: string
): Promise<GeneratePlanResponse> {
  const buildSystemPrompt = (prefix: string) => {
    const lowerPrefix = prefix.toLowerCase();
    return `Eres un nutricionista clínico experto. Genera un plan semanal COMPLETO y VARIADO con comidas reales.

ESTRUCTURA REQUERIDA - DEBES SEGUIR ESTA ESTRUCTURA EXACTA:

1. perfil${prefix}: {
    id: "${lowerPrefix}",
    nombre: "${prefix === 'EL' ? 'El' : 'Ella'}",
    perfil: string (edad, peso, altura, IMC),
    meta: string,
    descripcion: string,
    edad: number,
    horariosTexto: string,
    momentos: [{ key: "desayuno", label: "Desayuno", hora: "8:00 am" }, { key: "colacion_am", label: "Colación mañana", hora: "..." }, { key: "comida", label: "Comida", hora: "..." }, { key: "colacion_pm", label: "Colación tarde", hora: "..." }, { key: "cena", label: "Cena", hora: "..." }],
    objetivosPorMomento: {
      desayuno: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      colacion_am: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      comida: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      colacion_pm: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      cena: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number }
    },
    distribucionDiaria: [
      { grupo: "Frutas", total: number, detalle: "ej: 1 en desayuno + 1 en colación" },
      { grupo: "Verduras", total: number, detalle: "ej: 2 desayuno + 2 comida" },
      { grupo: "Cereales", total: number, detalle: "ej: 1 desayuno + 1 comida" },
      { grupo: "Proteína", total: number, detalle: "ej: 3 desayuno + 4 comida" },
      { grupo: "Grasas", total: number, detalle: "ej: 2 desayuno + 2 col. AM" },
      { grupo: "lacteos", total: number, detalle: "ej: 1 en cena" },
      { grupo: "Leguminosas", total: number, detalle: "ej: 3 veces por semana" }
    ],
    resumenPersonal: string[] (5-7 puntos clave específicos del plan),
    notaSalud: string (nota sobre salud específica, requerida)
  }

2. equivalencias${prefix}: array con MINIMO 6-7 objetos...

3. plan${prefix}: objeto con 7 días (Lunes-Domingo), cada día con 5 momentos...

Responde SOLO con JSON válido, sin markdown \`\`\`json`;
  };

  const buildUserPrompt = (p: QuestionnairePayload, prefix: string) => {
    return JSON.stringify({
      profilePrefix: prefix,
      questionnaire: p,
      outputContract: {
        rootKeys: [`perfil${prefix}`, `equivalencias${prefix}`, `plan${prefix}`],
        fixedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        momentsSource: 'questionnaire.planConfig.selectedMoments',
        mealsRequiredKeys: ['nombre', 'porciones', 'detalle', 'tags', 'super']
      }
    });
  };

  const generateForProfile = async (prefix: string, profilePayload: QuestionnairePayload) => {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildSystemPrompt(prefix) },
            { text: buildUserPrompt(profilePayload, prefix) }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json'
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    if (!res.ok) {
      let errorMsg = `Error ${res.status}`;
      try {
        const errJson = JSON.parse(text);
        errorMsg = errJson?.error?.message || errorMsg;
      } catch {}
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    const json = JSON.parse(text);
    const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Sanitizar y parsear
    const cleaned = generatedText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1) {
      throw new Error('Respuesta de IA no contiene JSON válido');
    }
    const sanitized = cleaned.slice(first, last + 1);

    return JSON.parse(sanitized);
  };

  const target = payload?.targetProfile || 'ambos';
  let elData = null;
  let ellaData = null;

  // Preparar payloads por perfil
  const buildProfilePayload = (profileData: unknown) => ({
    ...payload,
    profileContext: (profileData as Record<string, unknown>)?.profileContext,
    healthContext: (profileData as Record<string, unknown>)?.healthContext,
    preferences: (profileData as Record<string, unknown>)?.preferences,
    routine: (profileData as Record<string, unknown>)?.routine,
  });

  if (target === 'el' || target === 'ambos') {
    const elPayload = target === 'ambos' && payload.el ? buildProfilePayload(payload.el) : payload;
    elData = await generateForProfile('EL', elPayload as QuestionnairePayload);
  }

  if (target === 'ella' || target === 'ambos') {
    // Delay para evitar rate limit
    if (target === 'ambos') {
      await new Promise(r => setTimeout(r, 4500));
    }
    const ellaPayload = target === 'ambos' && payload.ella ? buildProfilePayload(payload.ella) : payload;
    ellaData = await generateForProfile('ELLA', ellaPayload as QuestionnairePayload);
  }

  return { elData, ellaData };
}

export async function generatePlan(
  payload: QuestionnairePayload,
  apiKey: string,
  modelName: string
): Promise<GeneratePlanResponse> {
  const payloadWithKey = { ...payload, customApiKey: apiKey, preferredModel: modelName };

  let json: GeneratePlanResponse;

  // Intentar llamar al endpoint /api primero
  try {
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithKey),
    });

    const responseText = await res.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('SERVER_UNAVAILABLE');
    }

    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('SERVER_UNAVAILABLE');
    }

    try {
      json = JSON.parse(responseText);
    } catch {
      throw new Error('SERVER_UNAVAILABLE');
    }

    if (!res.ok) {
      throw new Error((json as { error?: string })?.error || `Error ${res.status}`);
    }
  } catch (serverErr: unknown) {
    const errorMessage = serverErr instanceof Error ? serverErr.message : String(serverErr);
    
    const isServerUnavailable = 
      errorMessage === 'SERVER_UNAVAILABLE' ||
      errorMessage?.includes('fetch') ||
      errorMessage?.includes('Failed to fetch') ||
      errorMessage?.includes('NetworkError');

    if (isServerUnavailable) {
      const envApiKey = (import.meta as unknown as { env?: { GEMINI_API_KEY?: string } }).env?.GEMINI_API_KEY || '';

      if (!envApiKey && !apiKey) {
        throw new Error('En desarrollo local, configura tu GEMINI_API_KEY en el archivo .env o en el panel de Administración (Ajustes IA) para generar planes con IA.');
      }

      const keyToUse = apiKey || envApiKey;
      json = await callGeminiDirectly(payloadWithKey, keyToUse, modelName);
    } else {
      throw serverErr;
    }
  }

  if (!json.elData && !json.ellaData) {
    throw new Error('La respuesta no contiene datos del plan. Intenta de nuevo.');
  }

  return json;
}
