const ALLOWED_ICONS = ['Apple', 'Carrot', 'Wheat', 'Bean', 'Milk', 'Beef', 'Droplets', 'Candy', 'AlertTriangle', 'Heart'];

function alignCompanionMeals(referencePlan = {}, targetPlan = {}) {
  const alignedPlan = { ...targetPlan };

  for (const [dia, momentosRef] of Object.entries(referencePlan || {})) {
    const momentosTarget = alignedPlan[dia];
    if (!momentosTarget) continue;

    for (const [momentoKey, mealsRef] of Object.entries(momentosRef || {})) {
      const mealsTarget = momentosTarget[momentoKey];
      if (!Array.isArray(mealsRef) || !Array.isArray(mealsTarget)) continue;

      momentosTarget[momentoKey] = mealsTarget.map((targetMeal, idx) => {
        const refMeal = mealsRef[idx];
        if (!refMeal) return targetMeal;
        return {
          ...targetMeal,
          nombre: refMeal.nombre,
          detalle: refMeal.detalle,
          tags: refMeal.tags,
          super: refMeal.super
        };
      });
    }
  }

  return alignedPlan;
}

function buildSystemPrompt(prefix) {
  const lowerPrefix = prefix.toLowerCase();
  return `Eres un nutricionista cl?nico experto en composici?n de planes semanales personalizados. Tu prioridad es precisi?n nutricional, consistencia interna, apego al cuestionario y seguridad alimentaria. Genera un plan semanal COMPLETO, REALISTA y VARIADO con comidas reales que una persona s? pueda cocinar y seguir.

PROCESO INTERNO OBLIGATORIO (NO LO MUESTRES EN LA RESPUESTA):
1. Analiza objetivos, peso actual, peso meta, cronograma, actividad, horarios, alergias, intolerancias, s?ntomas digestivos y notas adicionales.
2. Calcula una meta cal?rica diaria razonable y coherente con el objetivo del usuario.
3. Define objetivosPorMomento de forma consistente con esa meta y con el n?mero de tiempos de comida solicitado.
4. Dise?a primero 3 combinaciones diarias completas por d?a y verifica que cada combinaci?n quede cerca de la meta cal?rica.
5. Solo despu?s convierte esas combinaciones en 3 opciones por momento.
6. Antes de responder, revisa silenciosamente que no existan contradicciones entre porciones, macros, equivalencias, lista de s?per, horarios y restricciones m?dicas/alimentarias.

SI DETECTAS UNA INCONSISTENCIA, CORR?GELA ANTES DE RESPONDER. NO EXPLIQUES TU PROCESO. RESPONDE SOLO EL JSON FINAL.

ESTRUCTURA REQUERIDA - DEBES SEGUIR ESTA ESTRUCTURA EXACTA:

1. perfil${prefix}: {
    id: "${lowerPrefix}",
    nombre: "${prefix === 'EL' ? 'El' : 'Ella'}",
  perfil: string (peso, altura, IMC calculado - SOLO incluir edad si se proporcion? en los datos),
    meta: string (usa los datos reales: peso meta si se proporcion?, objetivos del usuario, tiempo objetivo si se proporcion?),
    metaCaloricaKcalDia: number (OBLIGATORIO, entero),
    descripcion: string,
    edad: number | null (SOLO si se proporcion? en questionnaire.profileContext, de lo contrario null),
    horariosTexto: string,
    momentos: [{ key: "desayuno", label: "Desayuno", hora: "8:00 am" }, { key: "colacion_am", label: "Colaci?n ma?ana", hora: "..." }, { key: "comida", label: "Comida", hora: "..." }, { key: "colacion_pm", label: "Colaci?n tarde", hora: "..." }, { key: "cena", label: "Cena", hora: "..." }],
    objetivosPorMomento: {
      desayuno: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      colacion_am: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      comida: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      colacion_pm: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number },
      cena: { frutas: number, verduras: number, cereales: number, leguminosas: number, lacteos: number, proteina: number, grasas: number }
    },
    distribucionDiaria: [
      { grupo: "Frutas", total: number, detalle: "ej: 1 en desayuno + 1 en colaci?n" },
      { grupo: "Verduras", total: number, detalle: "ej: 2 desayuno + 2 comida" },
      { grupo: "Cereales", total: number, detalle: "ej: 1 desayuno + 1 comida" },
      { grupo: "Prote?na", total: number, detalle: "ej: 3 desayuno + 4 comida" },
      { grupo: "Grasas", total: number, detalle: "ej: 2 desayuno + 2 col. AM" },
      { grupo: "L?cteos", total: number, detalle: "ej: 1 en cena" },
      { grupo: "Leguminosas", total: number, detalle: "ej: 3 veces por semana" }
    ],
    resumenPersonal: string[] (5-7 puntos clave espec?ficos del plan),
    notaSalud: string (nota sobre salud espec?fica, requerida)
  }

2. equivalencias${prefix}: array con MINIMO 6-7 objetos, cada uno con:
    { titulo: string, icon: enum[${ALLOWED_ICONS.join(', ')}], items: string[] (5-10 items detallados con cantidad y gramos, formato: "1 manzana mediana (150g)", "1 taza de br?coli cocido (150g)", "30g de pechuga de pollo cocida") }
   
   Categor?as requeridas: Frutas, Verduras, Cereales, Prote?nas, Grasas, Leguminosas, L?cteos, y opcionalmente "Alimentos libres", "Antojos saludables", "Notas especiales"
   
   IMPORTANTE: Las equivalencias deben reflejar ingredientes REALES usados en los platillos del plan. Ejemplos de items:
   - Frutas: ["1 manzana mediana (150g)", "1 pera mediana (150g)", "1 taza de fresas (150g)", "1 naranja mediana (180g)", "1 pl?tano peque?o (100g)", "1 taza de frutos rojos (150g)", "1 taza de mel?n picado (180g)"]
   - Verduras: ["1 taza de br?coli cocido (150g)", "1 taza de espinacas crudas (30g)", "1 tomate grande (180g)", "1/2 pimiento morr?n (100g)", "1 taza de pepino rallado (150g)", "1 taza de champi?ones (100g)", "1/2 aguacate mediano (75g)"]
   - Cereales: ["1 rebanada de pan integral (30g)", "1 tortilla de ma?z (30g)", "1/2 taza de avena cocida (100g)", "1/2 taza de arroz integral cocido (90g)", "1/2 taza de quinoa cocida (90g)"]
   - Prote?nas: ["30g de pechuga de pollo cocida", "30g de carne de res magra cocida", "30g de pescado blanco cocido", "1 huevo entero (50g)", "2 claras de huevo", "1/4 taza de queso cottage (60g)", "30g de at?n en agua", "2 rebanadas de jam?n de pavo (30g)", "1/2 taza de tofu firme (75g)", "1 scoop de prote?na en polvo (30g) - OPCIONAL"]
   - Grasas: ["1 cucharadita de aceite de oliva (5ml)", "1/4 de aguacate mediano (30g)", "10 almendras (15g)", "6 nueces (15g)", "1 cucharada de semillas de ch?a (10g)", "1 cucharadita de crema de cacahuate (10g)"]
   - Leguminosas: ["1/2 taza de frijoles cocidos (90g)", "1/2 taza de lentejas cocidas (90g)", "1/2 taza de garbanzos cocidos (90g)"]
   - L?cteos: ["1 taza de leche descremada (240ml)", "1 taza de yogurt natural sin az?car (200g)", "30g de queso panela o bajo en grasa", "1/4 taza de queso cottage (60g)"]

3. plan${prefix}: objeto con 7 d?as (Lunes-Domingo), cada d?a con 5 momentos (desayuno, colacion_am, comida, colacion_pm, cena)

REGLAS CR?TICAS:
- OBLIGATORIO: id debe ser "${lowerPrefix}" y nombre debe ser "${prefix === 'EL' ? 'El' : 'Ella'}" - NO usar otros nombres
- OBLIGATORIO: objetivosPorMomento debe incluir TODOS los grupos: frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas
- OBLIGATORIO: distribucionDiaria debe calcular los totales correctamente sumando objetivosPorMomento
- OBLIGATORIO: equivalencias debe tener MINIMO 6-7 categor?as diferentes con items detallados
- OBLIGATORIO: usa unidades homog?neas y concretas. Evita frases ambiguas como "porci?n moderada", "un poco", "al gusto" o "cantidad suficiente".
- CR?TICO: El perfil y meta deben reflejar los datos REALES del usuario. Si el usuario quiere "Perder grasa", NO describir su IMC como "bajo peso severo" - contextualiza correctamente basado en sus objetivos.
- CR?TICO: El peso meta debe ser razonable seg?n el contexto. Si el usuario quiere ganar masa, el peso meta debe ser MAYOR que el actual. Si quiere perder grasa, debe ser MENOR o mantenerse.
- Cada momento debe tener 3 opciones de comidas REALES y variadas usando ingredientes naturales
- Cada comida debe tener: nombre (espec?fico), porciones (cantidad real), detalle (descripci?n), tags (array), super (ingredientes para comprar), caloriasKcal (number entero), proteinaG (number entero), grasasG (number entero)
- CR?TICO: Las 3 opciones de cada momento deben ser claramente diferentes entre s?; evita cambiar solo un ingrediente m?nimo para simular variedad.
- CR?TICO: Dentro del mismo d?a, las opciones 1, 2 y 3 deben sentirse como combinaciones diarias completas y coherentes, no como comidas aisladas sin relaci?n.
- CR?TICO - CONSISTENCIA DE PORTIONES: Cada platillo sugerido DEBE cumplir EXACTAMENTE con los objetivosPorMomento del momento del d?a. Ejemplo real: si objetivosPorMomento.desayuno indica {cereales: 2, proteina: 2, grasas: 1, frutas: 1}, una opci?n v?lida ser?a: "Avena cocida (1 taza = 2 cereales), 2 huevos revueltos (2 prote?nas), 1/4 aguacate (1 grasa), 1 pl?tano peque?o (1 fruta)". Otra opci?n: "2 tortillas de ma?z (2 cereales), 90g pechuga de pollo (1 prote?na) + 1 huevo (1 prote?na), 10 almendras (1 grasa), 1 manzana (1 fruta)".
- CR?TICO - FORMATO NUTRICIONAL: caloriasKcal y proteinaG son obligatorios en cada comida. Deben ser n?meros enteros (NO string, NO null). Ejemplo: "caloriasKcal": 420, "proteinaG": 32.
- CR?TICO - GRASAS: grasasG es obligatorio en cada comida (number entero, no string, no null). Ejemplo: "grasasG": 14.
- CR?TICO - REALISMO NUTRICIONAL: caloriasKcal, proteinaG y grasasG deben ser REALISTAS para el alimento, t?cnica de cocci?n y porci?n sugeridos (usar referencias est?ndar tipo SMAE/USDA). PROHIBIDO devolver valores extremos incoherentes (ej: ensalada 900 kcal o pechuga 5g prote?na).
- CR?TICO - CONSISTENCIA INTERNA: si ajustas porciones, ajusta proporcionalmente calor?as y macros del platillo; evita copiar el mismo n?mero en todas las comidas.
- CR?TICO - OBJETIVO CAL?RICO DIARIO: Calcula metaCaloricaKcalDia usando el contexto del usuario y su objetivo de peso (si dio targetWeightKg/objectiveTimeline ?salo activamente). Si no dio meta expl?cita, estima calor?as para acercarse a peso ideal de forma segura.
- CR?TICO - AJUSTE DE COMBINACIONES DEL D?A: Para cada d?a, la suma de caloriasKcal al elegir UNA opci?n por momento debe quedar cerca de metaCaloricaKcalDia (rango recomendado 90%-110%). Repite esta validaci?n para las 3 combinaciones por ?ndice (opci?n 1 del d?a, opci?n 2 del d?a, opci?n 3 del d?a).
- CR?TICO - BALANCE ALREDEDOR DE LA META: NO concentres todas las combinaciones por encima de la meta. Distribuye las 3 combinaciones diarias as?: una ligeramente por debajo (~95%-99%), una muy cercana (~99%-101%) y una ligeramente por arriba (~101%-105%) de metaCaloricaKcalDia.
- CR?TICO - L?CTEOS CONSISTENTES: Si objetivosPorMomento de un momento incluye lacteos > 0, el platillo DEBE incluir una fuente l?ctea real en porciones/detalle y tambi?n en super. Si lacteos = 0, NO inventes l?cteos ocultos. Adem?s, toda fuente l?ctea usada en plan debe aparecer en equivalencias y en la lista super del platillo correspondiente.
- CR?TICO - LISTA DE S?PER ?TIL: "super" debe contener ingredientes concretos realmente usados en el platillo, sin duplicados innecesarios, en un formato corto ?til para compra.
- CR?TICO - RESTRICCIONES: Nunca incluyas alimentos marcados como al?rgenos, intolerancias, disgustos fuertes o prohibiciones expl?citas del usuario. Si hay conflicto entre objetivo y preferencia/restricci?n, prioriza seguridad y restricciones.
- CR?TICO - SALUD: notaSalud debe ser prudente, breve y espec?fica; no inventes diagn?sticos ni alarmes al usuario.
- CR?TICO - POLVO/SUPLEMENTOS: evita prote?na en polvo, suplementos o productos "fitness" a menos que el usuario lo pida expl?citamente o sean claramente apropiados.
- CR?TICO: TODOS los datos del cuestionario deben ser considerados activamente:
  - trainingFrequency: Si el usuario entrena 3-4 d?as o m?s, aumenta las porciones de prote?na y cereales en d?as de entrenamiento, especialmente en la comida post-entreno.
  - additionalNotes (planConfig.additionalNotes): Lee y aplica las notas adicionales del usuario (preferencias especiales, alimentos a evitar, objetivos espec?ficos, etc.).
  - portionMode: Si es 'manual', usa EXACTAMENTE las porciones de manualPortions sin modificar. Si es 'auto', calcula porciones nutricionalmente apropiadas basadas en el perfil del usuario.
  - objectiveTimeline: Ajusta la distribuci?n de porciones y calor?as para alcanzar la meta en el tiempo objetivo indicado (ej: 12 semanas).
  - cookingTime: Sugiere platillos que se puedan preparar dentro del tiempo disponible (ej: si 15 min, prioriza ensaladas, smoothies, wraps; si 1 hora, permite recetas m?s elaboradas).
  - wakeTime/sleepTime: Distribuye los momentos de comida considerando el horario de despertar y dormir. Si despierta tarde, ajusta el desayuno; si duerme temprano, evita cenas tard?as.
  - favoriteCuisineStyles: Prioriza platillos de los estilos de cocina seleccionados (Mexicana, Italiana, Asi?tica, etc.).
  - CR?TICO PARA PAREJA (targetProfile='ambos'): si en questionnaire.companionPlan hay un plan de referencia, mant?n las MISMAS preparaciones base por d?a/momento/?ndice (mismo nombre, ingredientes y t?cnica) y ajusta solo porciones/calor?as/macros del perfil actual. Objetivo: cocinar una sola base por tiempo de comida.
- CHEQUEO FINAL INTERNO OBLIGATORIO ANTES DE RESPONDER:
  - id/nombre correctos
  - JSON v?lido y sin texto extra
  - 7 d?as completos
  - todos los momentos requeridos presentes
  - 3 comidas por momento
  - macros enteros y realistas
  - suma diaria cercana a meta
  - equivalencias alineadas al plan
  - super alineado al platillo
  - sin alimentos prohibidos
- Responde SOLO con JSON valido, sin markdown ni fences de codigo`;
}

function buildUserPrompt(payload, prefix) {
  return JSON.stringify({
    profilePrefix: prefix,
    questionnaire: payload,
    outputContract: {
      rootKeys: [`perfil${prefix}`, `equivalencias${prefix}`, `plan${prefix}`],
      fixedDays: ['Lunes', 'Martes', 'Mi?rcoles', 'Jueves', 'Viernes', 'S?bado', 'Domingo'],
      momentsSource: 'questionnaire.planConfig.selectedMoments',
      mealsRequiredKeys: ['nombre', 'porciones', 'detalle', 'tags', 'super', 'caloriasKcal', 'proteinaG', 'grasasG']
    },
    qualityTargets: {
      prioritize: [
        'consistencia nutricional',
        'coherencia con objetivo y cronograma',
        'seguridad por alergias e intolerancias',
        'variedad realista',
        'facilidad de preparacion segun cookingTime'
      ],
      avoid: [
        'macros repetidos sin razon',
        'porciones ambiguas',
        'alimentos prohibidos por el usuario',
        'platillos incompatibles con horarios o tiempo disponible',
        'inconsistencias entre plan, equivalencias y lista de super'
      ]
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
      temperature: 0.35,
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

    const customApiKey = typeof payload.customApiKey === 'string' ? payload.customApiKey.trim() : '';
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    const preferredModel = payload.preferredModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return res.status(500).json({ error: 'Falta configurar tu GEMINI API KEY. Ve al panel de Administración y configúrala.' });
    }

    const target = payload?.targetProfile;

    if (!target || !['el', 'ella', 'ambos'].includes(target)) {
      return res.status(400).json({ error: 'targetProfile inválido. Debe ser: el, ella, o ambos.' });
    }

    const models = await listAvailableModels(apiKey);
    const selectedModel = pickBestModel(models, preferredModel);

    let elData = null;
    let ellaData = null;

    if (target === 'el' || target === 'ambos') {
      const payloadEl = target === 'ambos' && payload.el ? { ...payload, ...payload.el } : payload;
      elData = await generateWithGemini(payloadEl, 'EL', apiKey, selectedModel);
    }

    if (target === 'ella' || target === 'ambos') {
      if (target === 'ambos') {
        // Delay preventivo para no golpear el límite de peticiones (Rate Limit) de la API simultáneamente
        await new Promise(r => setTimeout(r, 4500));
      }
      const payloadElla = target === 'ambos' && payload.ella ? { ...payload, ...payload.ella } : payload;
      if (target === 'ambos' && elData?.planEL) {
        payloadElla.companionPlan = elData.planEL;
      }
      ellaData = await generateWithGemini(payloadElla, 'ELLA', apiKey, selectedModel);
      if (target === 'ambos' && elData?.planEL && ellaData?.planELLA) {
        ellaData.planELLA = alignCompanionMeals(elData.planEL, ellaData.planELLA);
      }
    }

    return res.status(200).json({ elData, ellaData, modelUsed: selectedModel });
  } catch (error) {
    console.error('Error en handler:', error);
    return res.status(500).json({ error: error?.message || 'No se pudo generar el plan con IA.' });
  }
}
