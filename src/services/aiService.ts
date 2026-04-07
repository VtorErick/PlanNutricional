// Función auxiliar para llamar directamente a Gemini API en desarrollo local
export async function callGeminiDirectly(payload: any, apiKey: string, modelName: string) {
  const alignCompanionMeals = (
    referencePlan: Record<string, Record<string, any[]>> = {},
    targetPlan: Record<string, Record<string, any[]>> = {}
  ) => {
    const alignedPlan: Record<string, Record<string, any[]>> = { ...targetPlan };

    for (const [dia, momentosRef] of Object.entries(referencePlan)) {
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
            super: refMeal.super,
          };
        });
      }
    }

    return alignedPlan;
  };

  const buildSystemPrompt = (prefix: string) => {
    const lowerPrefix = prefix.toLowerCase();
    return `Eres un nutricionista clínico experto. Genera un plan semanal COMPLETO y VARIADO con comidas reales.

ESTRUCTURA REQUERIDA - DEBES SEGUIR ESTA ESTRUCTURA EXACTA:

1. perfil${prefix}: {
    id: "${lowerPrefix}",
    nombre: "${prefix === 'EL' ? 'El' : 'Ella'}",
    perfil: "[PESO] kg • [ALTURA] m • [EDAD] años • IMC [VALOR]" (FORMATO EXACTO OBLIGATORIO: usa bullet point "•" como separador, peso en kg con número entero, altura en metros con 2 decimales, edad en años, IMC con 1 decimal. Ejemplo: "90 kg • 1.70 m • 32 años • IMC 31.1"),
    meta: string,
    metaCaloricaKcalDia: number (OBLIGATORIO, entero),
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

2. equivalencias${prefix}: array con MINIMO 6-7 objetos, cada uno con:
    { titulo: string, icon: enum[Carrot, Apple, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart], items: string[] (5-10 items detallados con cantidad y gramos, formato: "1 manzana mediana (150g)", "1 taza de brócoli cocido (150g)", "30g de pechuga de pollo cocida") }
   
   Categorías requeridas: Frutas, Verduras, Cereales, Proteínas, Grasas, Leguminosas, Lácteos, y opcionalmente "Alimentos libres", "Antojos saludables", "Notas especiales"
   
   IMPORTANTE: Las equivalencias deben reflejar ingredientes REALES usados en los platillos del plan. Ejemplos de items:
   - Frutas: ["1 manzana mediana (150g)", "1 pera mediana (150g)", "1 taza de fresas (150g)", "1 naranja mediana (180g)", "1 plátano pequeño (100g)", "1 taza de frutos rojos (150g)", "1 taza de melón picado (180g)"]
   - Verduras: ["1 taza de brócoli cocido (150g)", "1 taza de espinacas crudas (30g)", "1 tomate grande (180g)", "1/2 pimiento morrón (100g)", "1 taza de pepino rallado (150g)", "1 taza de champiñones (100g)", "1/2 aguacate mediano (75g)"]
   - Cereales: ["1 rebanada de pan integral (30g)", "1 tortilla de maíz (30g)", "1/2 taza de avena cocida (100g)", "1/2 taza de arroz integral cocido (90g)", "1/2 taza de quinoa cocida (90g)"]
   - Proteínas: ["30g de pechuga de pollo cocida", "30g de carne de res magra cocida", "30g de pescado blanco cocido", "1 huevo entero (50g)", "2 claras de huevo", "1/4 taza de queso cottage (60g)", "30g de atún en agua", "2 rebanadas de jamón de pavo (30g)", "1/2 taza de tofu firme (75g)", "1 scoop de proteína en polvo (30g) - OPCIONAL"]
   - Grasas: ["1 cucharadita de aceite de oliva (5ml)", "1/4 de aguacate mediano (30g)", "10 almendras (15g)", "6 nueces (15g)", "1 cucharada de semillas de chía (10g)", "1 cucharadita de crema de cacahuate (10g)"]
   - Leguminosas: ["1/2 taza de frijoles cocidos (90g)", "1/2 taza de lentejas cocidas (90g)", "1/2 taza de garbanzos cocidos (90g)"]
   - Lácteos: ["1 taza de leche descremada (240ml)", "1 taza de yogurt natural sin azúcar (200g)", "30g de queso panela o bajo en grasa", "1/4 taza de queso cottage (60g)"]

3. plan${prefix}: objeto con EXACTAMENTE 7 días: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo. Cada día DEBE tener 5 momentos: desayuno, colacion_am, comida, colacion_pm, cena. Cada momento DEBE ser un array con EXACTAMENTE 3 comidas (NO vacío, NO null, NO undefined).

REGLAS CRÍTICAS:
- OBLIGATORIO: id debe ser "${lowerPrefix}" y nombre debe ser "${prefix === 'EL' ? 'El' : 'Ella'}" - NO usar otros nombres
- **CRÍTICO - ESTRUCTURA DEL PLAN: El objeto plan${prefix} DEBE contener TODOS los días de la semana (Lunes a Domingo). NINGÚN día puede faltar. NINGÚN momento puede estar vacío. Cada momento DEBE tener EXACTAMENTE 3 opciones de comida.**
- **CRÍTICO - VALIDACIÓN INTERNA: Antes de responder, verifica que cada día (Lunes-Martes-Miércoles-Jueves-Viernes-Sábado-Domingo) exista en plan${prefix} y que cada momento tenga un array con 3 comidas. Si falta algún día o momento, regénralo completamente.**
- OBLIGATORIO: objetivosPorMomento debe incluir TODOS los grupos: frutas, verduras, cereales, leguminosas, lacteos, proteina, grasas
- OBLIGATORIO: distribucionDiaria debe calcular los totales correctamente sumando objetivosPorMomento
- OBLIGATORIO: equivalencias debe tener MINIMO 6-7 categorías diferentes con items detallados
- CRÍTICO: El perfil y meta deben reflejar los datos REALES del usuario. Si el usuario quiere "Perder grasa", NO describir su IMC como "bajo peso severo" - contextualiza correctamente basado en sus objetivos.
- CRÍTICO: El peso meta debe ser razonable según el contexto. Si el usuario quiere ganar masa, el peso meta debe ser MAYOR que el actual. Si quiere perder grasa, debe ser MENOR o mantenerse.
- Cada momento debe tener 3 opciones de comidas REALES y variadas usando ingredientes naturales
- **PROHIBIDO: NO usar suplementos ni proteína en polvo en las comidas del plan. Usar solo alimentos reales como huevos, pollo, res, pescado, queso cottage, tofu, legumbres.**
- La proteína en polvo solo puede aparecer en la sección de equivalencias como alternativa opcional, NUNCA en los platillos sugeridos.
- Cada comida debe tener: nombre (específico), porciones (cantidad real), detalle (descripción), tags (array), super (ingredientes para comprar), caloriasKcal (number entero), proteinaG (number entero), grasasG (number entero)
- **EJEMPLO DE ESTRUCTURA CORRECTA DEL PLAN:**
  plan${prefix}: {
    "Lunes": { "desayuno": [{nombre, porciones, detalle, tags, super, caloriasKcal, proteinaG, grasasG}, {nombre...}, {nombre...}], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] },
    "Martes": { "desayuno": [3 comidas], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] },
    "Miércoles": { "desayuno": [3 comidas], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] },
    "Jueves": { "desayuno": [3 comidas], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] },
    "Viernes": { "desayuno": [3 comidas], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] },
    "Sábado": { "desayuno": [3 comidas], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] },
    "Domingo": { "desayuno": [3 comidas], "colacion_am": [3 comidas], "comida": [3 comidas], "colacion_pm": [3 comidas], "cena": [3 comidas] }
  }
- **CRÍTICO - CONSISTENCIA DE PORTIONES:** Cada platillo sugerido DEBE cumplir EXACTAMENTE con los objetivosPorMomento del momento del día. Ejemplo real: si objetivosPorMomento.desayuno indica {cereales: 2, proteina: 2, grasas: 1, frutas: 1}, una opción válida sería: "Avena cocida (1 taza = 2 cereales), 2 huevos revueltos (2 proteínas), 1/4 aguacate (1 grasa), 1 plátano pequeño (1 fruta)". Otra opción: "2 tortillas de maíz (2 cereales), 90g pechuga de pollo (1 proteína) + 1 huevo (1 proteína), 10 almendras (1 grasa), 1 manzana (1 fruta)".**
- **CRÍTICO - FORMATO NUTRICIONAL:** caloriasKcal y proteinaG son obligatorios en cada comida. Deben ser números enteros (NO string, NO null). Ejemplo: "caloriasKcal": 420, "proteinaG": 32.
- **CRÍTICO - GRASAS:** grasasG es obligatorio en cada comida (number entero, no string, no null). Ejemplo: "grasasG": 14.
- **CRÍTICO - REALISMO NUTRICIONAL:** caloriasKcal, proteinaG y grasasG deben ser REALISTAS para el alimento, técnica de cocción y porción sugeridos (usar referencias estándar tipo SMAE/USDA). PROHIBIDO devolver valores extremos incoherentes (ej: ensalada 900 kcal o pechuga 5g proteína).
- **CRÍTICO - CONSISTENCIA INTERNA:** si ajustas porciones, ajusta proporcionalmente calorías y macros del platillo; evita copiar el mismo número en todas las comidas.
- **CRÍTICO - OBJETIVO CALÓRICO DIARIO:** Calcula metaCaloricaKcalDia usando el contexto del usuario y su objetivo de peso (si dio targetWeightKg/objectiveTimeline úsalo activamente). Si no dio meta explícita, estima calorías para acercarse a peso ideal de forma segura.
- **CRÍTICO - AJUSTE DE COMBINACIONES DEL DÍA:** Para cada día, la suma de caloriasKcal al elegir UNA opción por momento debe quedar cerca de metaCaloricaKcalDia (rango recomendado 90%-110%). Repite esta validación para las 3 combinaciones por índice (opción 1 del día, opción 2 del día, opción 3 del día).
- **CRÍTICO: TODOS los datos del cuestionario deben ser considerados activamente:**
  - **trainingFrequency**: Si el usuario entrena 3-4 días o más, aumenta las porciones de proteína y cereales en días de entrenamiento, especialmente en la comida post-entreno.
  - **additionalNotes (planConfig.additionalNotes)**: Lee y aplica las notas adicionales del usuario (preferencias especiales, alimentos a evitar, objetivos específicos, etc.).
  - **portionMode**: Si es 'manual', usa EXACTAMENTE las porciones de manualPortions sin modificar. Si es 'auto', calcula porciones nutricionalmente apropiadas basadas en el perfil del usuario.
  - **objectiveTimeline**: Ajusta la distribución de porciones y calorías para alcanzar la meta en el tiempo objetivo indicado (ej: 12 semanas).
  - **cookingTime**: Sugiere platillos que se puedan preparar dentro del tiempo disponible (ej: si 15 min, prioriza ensaladas, smoothies, wraps; si 1 hora, permite recetas más elaboradas).
  - **wakeTime/sleepTime**: Distribuye los momentos de comida considerando el horario de despertar y dormir. Si despierta tarde, ajusta el desayuno; si duerme temprano, evita cenas tardías.
  - **favoriteCuisineStyles**: Prioriza platillos de los estilos de cocina seleccionados (Mexicana, Italiana, Asiática, etc.).
- **CRÍTICO PARA PAREJA (targetProfile='ambos'): si en questionnaire.companionPlan hay un plan de referencia, mantén las MISMAS preparaciones base por día/momento/índice (mismo nombre, ingredientes y técnica) y ajusta solo porciones/calorías/macros del perfil actual. Objetivo: cocinar una sola base por tiempo de comida.**
- Responde SOLO con JSON válido, omitiendo el markdown block de json.`;
  };

  const buildUserPrompt = (p: any, prefix: string) => {
    return JSON.stringify({
      profilePrefix: prefix,
      questionnaire: p,
      outputContract: {
        rootKeys: [`perfil${prefix}`, `equivalencias${prefix}`, `plan${prefix}`],
        fixedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        momentsSource: 'questionnaire.planConfig.selectedMoments',
        mealsRequiredKeys: ['nombre', 'porciones', 'detalle', 'tags', 'super', 'caloriasKcal', 'proteinaG', 'grasasG']
      }
    });
  };

  const generateForProfile = async (prefix: string, profilePayload: any) => {
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
  const buildProfilePayload = (profileData: any) => ({
    ...payload,
    profileContext: profileData?.profileContext,
    healthContext: profileData?.healthContext,
    preferences: profileData?.preferences,
    routine: profileData?.routine,
  });

  if (target === 'el' || target === 'ambos') {
    const elPayload = target === 'ambos' && payload.el ? buildProfilePayload(payload.el) : payload;
    elData = await generateForProfile('EL', elPayload);
  }

  if (target === 'ella' || target === 'ambos') {
    // Delay para evitar rate limit
    if (target === 'ambos') {
      await new Promise(r => setTimeout(r, 4500));
    }
    const ellaPayload = target === 'ambos' && payload.ella ? buildProfilePayload(payload.ella) : payload;
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
