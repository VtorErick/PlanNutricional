const ALLOWED_ICONS = ['Apple', 'Carrot', 'Wheat', 'Bean', 'Milk', 'Beef', 'Droplets', 'Candy', 'AlertTriangle', 'Heart'];

function buildSystemPrompt(prefix) {
  return `Eres un nutricionista clínico experto. Devuelve SOLO JSON válido, sin markdown, sin comentarios.\n\nGenera un plan semanal nutricional personalizado para el perfil ${prefix}.\n\nReglas estrictas:\n1) Usa llaves exactas: perfil${prefix}, equivalencias${prefix}, plan${prefix}.\n2) Incluye días exactos: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.\n3) Usa exactamente los momentos (key, label, hora) dados por usuario.\n4) En plan${prefix}, cada día debe contener todos los momentos elegidos por usuario.\n5) Cada comida debe incluir: nombre, porciones, detalle, tags (array), super (array).\n6) equivalencias${prefix} debe estar completo y no vacío, usa icon de este set: ${ALLOWED_ICONS.join(', ')}.\n7) Respeta alergias, intolerancias, aversiones, objetivo y modo de porciones.\n8) Si porciones es manual, sigue sus indicaciones. Si es auto, calcúlalo inteligentemente.\n9) Evita recomendaciones médicas peligrosas.\n10) Salida final: JSON puro.`;
}

function buildUserPrompt(payload, prefix) {
  return JSON.stringify({
    profilePrefix: prefix,
    questionnaire: payload,
    outputContract: {
      rootKeys: [`perfil${prefix}`, `equivalencias${prefix}`, `plan${prefix}`],
      fixedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      momentsSource: 'questionnaire.planConfig.selectedMoments',
      mealsRequiredKeys: ['nombre', 'porciones', 'detalle', 'tags', 'super']
    }
  });
}

function sanitizeAiJson(text) {
  if (!text) return '';
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return cleaned;
  return cleaned.slice(first, last + 1);
}

async function generateWithGemini(payload, prefix, apiKey, model) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: buildSystemPrompt(prefix) },
          { text: buildUserPrompt(payload, prefix) }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.5,
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || 'Error llamando Gemini';
    throw new Error(msg);
  }

  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
  const parsed = JSON.parse(sanitizeAiJson(text));

  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' });
  }

  try {
    const payload = req.body || {};
    const target = payload?.targetProfile;

    if (!target || !['vo', 'va', 'ambos'].includes(target)) {
      return res.status(400).json({ error: 'targetProfile inválido.' });
    }

    let voData = null;
    let vaData = null;

    if (target === 'vo' || target === 'ambos') {
      voData = await generateWithGemini(payload, 'VO', apiKey, model);
    }

    if (target === 'va' || target === 'ambos') {
      vaData = await generateWithGemini(payload, 'VA', apiKey, model);
    }

    return res.status(200).json({ voData, vaData });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'No se pudo generar el plan con IA.' });
  }
}
