const ALLOWED_ICONS = ['Apple', 'Carrot', 'Wheat', 'Bean', 'Milk', 'Beef', 'Droplets', 'Candy', 'AlertTriangle', 'Heart'];

function buildSystemPrompt(prefix) {
  const lowerPrefix = prefix.toLowerCase();
  return `Eres un nutricionista clínico experto. Genera un plan semanal COMPLETO y VARIADO con comidas reales.

ESTRUCTURA REQUERIDA - DEBES SEGUIR ESTA ESTRUCTURA EXACTA:

1. perfil${prefix}: {
    id: "${lowerPrefix}",
    nombre: "${prefix === 'VO' ? 'El' : 'Ella'}",
  perfil: string (peso, altura, IMC calculado - SOLO incluir edad si se proporcionó en los datos),
    meta: string (usa los datos reales: peso meta si se proporcionó, objetivos del usuario, tiempo objetivo si se proporcionó),
    descripcion: string,
    edad: number | null (SOLO si se proporcionó en questionnaire.profileContext, de lo contrario null),
    horariosTexto: string,
    momentos: [{ key: "desayuno", label: "Desayuno", hora: "8:00 am" }, { key: "colacion_am", label: "Colación mañana", hora: "..." }, { key: "comida", label: "Comida", hora: "..." }, { key: "colacion_pm", label: "Colación tarde", hora: "..." }, { key: "cena", label: "Cena", hora: "..." }],
    objetivosPorMomento: {
      desayuno: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      colacion_am: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      comida: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      colacion_pm: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      cena: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number }
    },
    distribucionDiaria: [
      { grupo: "Frutas", total: number, detalle: "ej: 1 en desayuno + 1 en colación" },
      { grupo: "Verduras", total: number, detalle: "ej: 2 desayuno + 2 comida" },
      { grupo: "Cereales", total: number, detalle: "ej: 1 desayuno + 1 comida" },
      { grupo: "Proteína", total: number, detalle: "ej: 3 desayuno + 4 comida" },
      { grupo: "Grasas", total: number, detalle: "ej: 2 desayuno + 2 col. AM" },
      { grupo: "Lácteos", total: number, detalle: "ej: 1 en cena" },
      { grupo: "Leguminosas", total: number, detalle: "ej: 3 veces por semana" }
    ],
    resumenPersonal: string[] (5-7 puntos clave específicos del plan),
    notaSalud: string (nota sobre salud específica, requerida)
  }

2. equivalencias${prefix}: array con MINIMO 6-7 objetos, cada uno con:
    { titulo: string, icon: enum[${ALLOWED_ICONS.join(', ')}], items: string[] (5-10 items detallados con cantidad y gramos, formato: "1 manzana mediana (150g)", "1 taza de brócoli cocido (150g)", "30g de pechuga de pollo cocida") }
   
   Categorías requeridas: Frutas, Verduras, Cereales, Proteínas, Grasas, Leguminosas, Lácteos, y opcionalmente "Alimentos libres", "Antojos saludables", "Notas especiales"
   
   EJEMPLO de items para Frutas: ["1 manzana mediana (150g)", "1 pera mediana (150g)", "1 taza de fresas (150g)", "1 naranja mediana (180g)", "1 plátano pequeño (100g)"]
   EJEMPLO de items para Verduras: ["1 taza de brócoli cocido (150g)", "1 taza de espinacas crudas (30g)", "1 tomate grande (180g)", "1/2 pimiento morrón (100g)", "1 taza de pepino rallado (150g)"]

3. plan${prefix}: objeto con 7 días (Lunes-Domingo), cada día con 5 momentos (desayuno, colacion_am, comida, colacion_pm, cena)

REGLAS CRÍTICAS:
- OBLIGATORIO: id debe ser "${lowerPrefix}" y nombre debe ser "${prefix === 'VO' ? 'El' : 'Ella'}" - NO usar otros nombres
- OBLIGATORIO: objetivosPorMomento debe incluir TODOS los grupos: frutas, verduras, cereales, leguminosas, leche (usar key 'leche' internamente pero mostrar como Lácteos en distribucionDiaria), proteina, grasas
- OBLIGATORIO: distribucionDiaria debe calcular los totales correctamente sumando objetivosPorMomento
- OBLIGATORIO: equivalencias debe tener MINIMO 6-7 categorías diferentes con items detallados
- CRÍTICO: El perfil y meta deben reflejar los datos REALES del usuario. Si el usuario quiere "Perder grasa", NO describir su IMC como "bajo peso severo" - contextualiza correctamente basado en sus objetivos.
- CRÍTICO: El peso meta debe ser razonable según el contexto. Si el usuario quiere ganar masa, el peso meta debe ser MAYOR que el actual. Si quiere perder grasa, debe ser MENOR o mantenerse.
- Cada momento debe tener 3 opciones de comidas REALES y variadas
- Cada comida debe tener: nombre (específico), porciones (cantidad real), detalle (descripción), tags (array), super (ingredientes para comprar)
- Responde SOLO con JSON válido, sin markdown \`\`\`json`;

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

function normalizeModelName(modelName) {
  if (!modelName) return '';
  return modelName.replace(/^models\//, '').trim();
}

function modelSupportsGenerateContent(model) {
  const methods = model?.supportedGenerationMethods || [];
  return methods.includes('generateContent');
}

async function listAvailableModels(apiKey) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'No fue posible listar modelos disponibles de Gemini.');
  }
  return (json?.models || []).filter(modelSupportsGenerateContent);
}

function pickBestModel(models, preferredModelRaw) {
  const preferred = normalizeModelName(preferredModelRaw);
  if (!models.length) throw new Error('No hay modelos compatibles con generateContent en tu cuenta/API key.');

  const names = models.map((m) => normalizeModelName(m.name));

  if (preferred && names.includes(preferred)) {
    return preferred;
  }

  const priorityMatchers = [
    /^gemini-2\.5-flash/i,
    /^gemini-2\.0-flash/i,
    /^gemini-1\.5-flash/i,
    /^gemini-flash-latest/i,
    /^gemini-2\.5-pro/i,
    /^gemini-2\.0-pro/i,
    /^gemini-1\.5-pro/i,
  ];

  for (const matcher of priorityMatchers) {
    const found = names.find((n) => matcher.test(n));
    if (found) return found;
  }

  return names[0];
}

async function generateWithGemini(payload, prefix, apiKey, modelName) {
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const responseText = await res.text();

  if (!res.ok) {
    // Intentar parsear error para dar mensaje claro
    let errorMsg = `Error ${res.status} llamando a Gemini`;
    try {
      const errorJson = JSON.parse(responseText);
      errorMsg = errorJson?.error?.message || errorMsg;
    } catch {}
    
    // Tratamiento especial para 429 Quota Exceeded / Rate Limit
    if (res.status === 429 || errorMsg.toLowerCase().includes('quota exceeded')) {
      errorMsg = `Límite de solicitudes rebasado (Error 429). Intenta de nuevo en 1 minuto.`;
    }
    
    // Error 404 - Modelo no encontrado
    if (res.status === 404) {
      errorMsg = `Modelo '${modelName}' no encontrado o no disponible. ${errorMsg}`;
    }
    
    throw new Error(errorMsg);
  }

  // Parsear JSON exitoso
  let json;
  try {
    json = JSON.parse(responseText);
  } catch (parseErr) {
    throw new Error(`Error parseando respuesta JSON: ${parseErr.message}`);
  }

  // Validación robusta de la respuesta
  const candidates = json?.candidates;
  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    console.error('Respuesta Gemini sin candidates:', JSON.stringify(json, null, 2));
    throw new Error('La IA no generó una respuesta válida. Intenta de nuevo o usa otro modelo.');
  }

  const parts = candidates[0]?.content?.parts;
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    console.error('Respuesta Gemini sin parts:', JSON.stringify(json, null, 2));
    throw new Error('La IA devolvió una respuesta vacía. Intenta de nuevo.');
  }

  const text = parts.map((p) => p.text || '').join('\n').trim();
  if (!text) {
    throw new Error('La IA devolvió texto vacío. Intenta de nuevo con otro modelo.');
  }

  // Manejar caso donde la IA indica que no puede completar
  const finishReason = candidates[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`La IA no pudo completar la respuesta (${finishReason}). Intenta de nuevo.`);
  }

  const sanitized = sanitizeAiJson(text);
  if (!sanitized || sanitized.trim() === '') {
    throw new Error('El texto sanitizado está vacío. Intenta de nuevo.');
  }

  // Intentar parsear con mejor manejo de errores
  let parsed;
  try {
    parsed = JSON.parse(sanitized);
  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr.message);
    console.error('Raw text:', text);
    console.error('Sanitized:', sanitized);
    throw new Error(`Error al parsear el plan generado: ${parseErr.message}. Intenta de nuevo.`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('El JSON parseado no es un objeto válido.');
  }

  return parsed;
}

export default async function handler(req, res) {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parsear body si es string, usar directo si ya es objeto
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ error: 'Body no es JSON válido' });
      }
    }
    
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Body vacío o inválido' });
    }

    const apiKey = payload.customApiKey || process.env.GEMINI_API_KEY;
    const preferredModel = payload.preferredModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return res.status(500).json({ error: 'Falta configurar tu GEMINI API KEY. Ve al panel de Administración y configúrala.' });
    }

    const target = payload?.targetProfile;

    if (!target || !['vo', 'va', 'ambos'].includes(target)) {
      return res.status(400).json({ error: 'targetProfile inválido. Debe ser: vo, va, o ambos.' });
    }

    const models = await listAvailableModels(apiKey);
    const selectedModel = pickBestModel(models, preferredModel);

    let voData = null;
    let vaData = null;

    if (target === 'vo' || target === 'ambos') {
      const payloadVO = target === 'ambos' && payload.vo ? { ...payload, ...payload.vo } : payload;
      voData = await generateWithGemini(payloadVO, 'VO', apiKey, selectedModel);
    }

    if (target === 'va' || target === 'ambos') {
      if (target === 'ambos') {
        // Delay preventivo para no golpear el límite de peticiones (Rate Limit) de la API simultáneamente
        await new Promise(r => setTimeout(r, 4500));
      }
      const payloadVA = target === 'ambos' && payload.va ? { ...payload, ...payload.va } : payload;
      vaData = await generateWithGemini(payloadVA, 'VA', apiKey, selectedModel);
    }

    return res.status(200).json({ voData, vaData, modelUsed: selectedModel });
  } catch (error) {
    console.error('Error en handler:', error);
    return res.status(500).json({ error: error?.message || 'No se pudo generar el plan con IA.' });
  }
}
