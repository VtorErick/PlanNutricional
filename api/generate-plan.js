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
const MAX_ASSESSMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSESSMENT_PDF_MB = Math.round(MAX_ASSESSMENT_PDF_BYTES / (1024 * 1024));

function estimateBase64Size(base64Value) {
  const sanitized = typeof base64Value === 'string' ? base64Value.replace(/\s/g, '') : '';
  if (!sanitized) return 0;

  const padding = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
  return Math.floor((sanitized.length * 3) / 4) - padding;
}

function validateAssessmentPdf(pdf) {
  if (!pdf) return { ok: true };
  if (typeof pdf !== 'object') {
    return { ok: false, status: 400, error: 'assessmentReportPdf inválido.' };
  }

  if (pdf.mimeType !== 'application/pdf') {
    return { ok: false, status: 400, error: 'El reporte corporal adjunto debe ser un PDF.' };
  }

  if (typeof pdf.dataBase64 !== 'string' || !pdf.dataBase64.trim()) {
    return { ok: false, status: 400, error: 'El PDF adjunto está vacío o no se pudo leer.' };
  }

  if (estimateBase64Size(pdf.dataBase64) > MAX_ASSESSMENT_PDF_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `El reporte corporal adjunto supera el límite de ${MAX_ASSESSMENT_PDF_MB} MB.`,
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

function buildSystemPrompt(prefix) {
  const lowerPrefix = prefix.toLowerCase();

  return `Eres un nutricionista clínico experto. Genera un plan semanal completo, realista y consistente con el cuestionario.

Debes responder SOLO con JSON válido y seguir exactamente esta estructura:

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
  Miércoles: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Jueves: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Viernes: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Sábado: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] },
  Domingo: { desayuno: [3 comidas], colacion_am: [3 comidas], comida: [3 comidas], colacion_pm: [3 comidas], cena: [3 comidas] }
}

Reglas críticas:
- No cambies id ni nombre.
- "perfil" debe ser SIEMPRE un resumen compacto en una sola linea con este formato: "<peso> kg • <altura> m • <edad> años • IMC <valor>". Ejemplo valido: "67 kg • 1.60 m • 32 años • IMC 26.2".
- No pongas parrafos, explicaciones clinicas ni texto narrativo dentro de "perfil".
- Usa "detallesPerfil" para guardar el analisis narrativo completo del caso, incluyendo contexto corporal, actividad, hallazgos del PDF, riesgos y consideraciones relevantes.
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

function buildUserPrompt(payload, prefix) {
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
        perfil: '<peso> kg • <altura> m • <edad> años • IMC <valor>',
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

function buildRequestParts(prefix, payload) {
  return [
    { text: buildSystemPrompt(prefix) },
    { text: buildUserPrompt(payload, prefix) },
    ...getOptionalPdfParts(payload),
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

async function generateWithGemini(payload, prefix, apiKey, modelName) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: buildRequestParts(prefix, payload),
      },
    ],
    generationConfig: {
      temperature: 0.35,
      responseMimeType: 'application/json',
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
      errorMessage = 'Límite de solicitudes rebasado (Error 429). Intenta de nuevo en 1 minuto.';
    }

    if (response.status === 404) {
      errorMessage = `Modelo '${modelName}' no encontrado o no disponible. ${errorMessage}`;
    }

    throw new Error(errorMessage);
  }

  const responseJson = JSON.parse(responseText);
  const candidates = responseJson?.candidates;

  if (!Array.isArray(candidates) || !candidates.length) {
    throw new Error('La IA no generó una respuesta válida. Intenta de nuevo.');
  }

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts) || !parts.length) {
    throw new Error('La IA devolvió una respuesta vacía. Intenta de nuevo.');
  }

  const generatedText = parts.map((part) => part?.text || '').join('\n').trim();
  if (!generatedText) {
    throw new Error('La IA devolvió texto vacío. Intenta de nuevo con otro modelo.');
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
        return res.status(400).json({ error: 'Body no es JSON válido' });
      }
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Body vacío o inválido' });
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
          'Falta configurar tu GEMINI API KEY. Ve al panel de Administración y configúrala.',
      });
    }

    const target = payload?.targetProfile;
    if (!target || !['el', 'ella', 'ambos'].includes(target)) {
      return res.status(400).json({
        error: 'targetProfile inválido. Debe ser: el, ella, o ambos.',
      });
    }

    const models = await listAvailableModels(apiKey);
    const selectedModel = pickBestModel(models, preferredModel);

    let elData = null;
    let ellaData = null;

    if (target === 'el' || target === 'ambos') {
      const payloadEl = target === 'ambos' ? buildScopedPayload(payload, payload.el) : payload;
      elData = await generateWithGemini(payloadEl, 'EL', apiKey, selectedModel);
    }

    if (target === 'ella' || target === 'ambos') {
      const payloadElla = target === 'ambos' ? buildScopedPayload(payload, payload.ella) : payload;
      if (target === 'ambos' && elData?.planEL) {
        payloadElla.companionPlan = elData.planEL;
      }

      ellaData = await generateWithGemini(payloadElla, 'ELLA', apiKey, selectedModel);
    }

    return res.status(200).json({ elData, ellaData, modelUsed: selectedModel });
  } catch (error) {
    console.error('Error en handler:', error);
    return res.status(500).json({
      error: error?.message || 'No se pudo generar el plan con IA.',
    });
  }
}
