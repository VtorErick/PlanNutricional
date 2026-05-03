import { generateProfile, generateSupplements } from '../api/profileGenerator.js';
import { buildOptimizedMealsCatalog } from '../src/utils/mealCatalogBuilder.ts';
import { mealsDatabase } from '../src/data/mealsDB.ts';
import { buildQuestionnaireSupplementsCatalog } from '../src/data/supplementsDB.ts';

const API_KEY = 'sk-19bd40aa43fb457a8799d377e9bb6419';

function buildPayload() {
  const base = {
    targetProfile: 'ambos',
    profileToUpdate: 'ambos',
    portionMode: 'auto',
    planConfig: {
      mealsPerDay: '5',
      selectedMoments: [
        { key: 'desayuno', label: 'Desayuno', hora: '08:00' },
        { key: 'colacion_am', label: 'Colación AM', hora: '11:00' },
        { key: 'comida', label: 'Comida', hora: '14:00' },
        { key: 'colacion_pm', label: 'Colación PM', hora: '17:00' },
        { key: 'cena', label: 'Cena', hora: '20:00' },
      ],
      manualPortions: {},
      additionalNotes: '',
    },
  };

  const elPerson = {
    age: '30',
    currentWeightKg: '80',
    heightCm: '175',
    targetWeightKg: '75',
    objectives: ['Perder grasa', 'Ganar músculo'],
    objectiveTimeline: '12 sem',
    diagnostics: '',
    allergies: '',
    medications: '',
    intolerances: '',
    digestiveSymptoms: '',
    favoriteFoods: '',
    dislikedFoods: '',
    favoriteCuisineStyles: '',
    cookingTime: '',
    activityLevel: 'Moderado',
    wakeTime: '07:00',
    sleepTime: '22:30',
    trainingFrequency: '',
    bodyMeasurements: {
      waistCm: '', hipCm: '', neckCm: '', chestCm: '', armCm: '', thighCm: '',
    },
  };

  const ellaPerson = {
    age: '28',
    currentWeightKg: '60',
    heightCm: '162',
    targetWeightKg: '55',
    objectives: ['Perder grasa', 'Mejorar salud'],
    objectiveTimeline: '12 sem',
    diagnostics: '',
    allergies: '',
    medications: '',
    intolerances: '',
    digestiveSymptoms: '',
    favoriteFoods: '',
    dislikedFoods: '',
    favoriteCuisineStyles: '',
    cookingTime: '',
    activityLevel: 'Moderado',
    wakeTime: '07:00',
    sleepTime: '22:30',
    trainingFrequency: '',
    bodyMeasurements: {
      waistCm: '', hipCm: '', neckCm: '', chestCm: '', armCm: '', thighCm: '',
    },
  };

  const buildPP = (p: any) => ({
    profileContext: {
      age: p.age,
      currentWeightKg: p.currentWeightKg,
      heightCm: p.heightCm,
      targetWeightKg: p.targetWeightKg,
      objectives: p.objectives,
      objectiveTimelineWeeks: p.objectiveTimeline,
    },
    healthContext: {
      diagnostics: p.diagnostics,
      allergies: p.allergies,
      medications: p.medications,
      intolerances: p.intolerances,
      digestiveSymptoms: p.digestiveSymptoms,
    },
    preferences: {
      favoriteFoods: p.favoriteFoods,
      dislikedFoods: p.dislikedFoods,
      favoriteCuisineStyles: p.favoriteCuisineStyles,
      cookingTime: p.cookingTime,
    },
    routine: {
      activityLevel: p.activityLevel,
      wakeTime: p.wakeTime,
      sleepTime: p.sleepTime,
      trainingFrequency: p.trainingFrequency,
    },
    bodyMeasurements: p.bodyMeasurements,
  });

  return {
    ...base,
    el: buildPP(elPerson),
    ella: buildPP(ellaPerson),
  };
}

async function callDeepseek(model: string, systemPrompt: string, userPrompt: string, timeoutMs = 600_000) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 32768,
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' },
        stream: false,
      }),
      signal: controller.signal,
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    return { status: res.status, text, elapsed };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const payload = buildPayload();

  // Build catalogs
  const elCatalog = await buildOptimizedMealsCatalog(mealsDatabase, payload.el, {
    useRotation: true,
    targetProfile: 'el',
    allowFallback: true,
  });
  const ellaCatalog = await buildOptimizedMealsCatalog(mealsDatabase, payload.ella, {
    useRotation: true,
    targetProfile: 'ella',
    allowFallback: true,
  });

  const supplementsCatalog = buildQuestionnaireSupplementsCatalog(payload);

  const precomputedProfileEl = generateProfile(payload.el, 'el');
  const precomputedSupplementsEl = generateSupplements(payload.el, supplementsCatalog);
  const precomputedProfileElla = generateProfile(payload.ella, 'ella');
  const precomputedSupplementsElla = generateSupplements(payload.ella, supplementsCatalog);

  // Build prompts exactly like the app does
  const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const MEAL_MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];

  function buildSystemPrompt(prefix: string) {
    const lowerPrefix = prefix.toLowerCase();
    const profileLabel = prefix === 'EL' ? 'El' : 'Ella';
    const planTransportKey = `planSemanal${prefix}`;
    return `Eres un nutricionista clinico experto. Genera un plan semanal completo, realista y consistente con el cuestionario.

Debes responder con un unico objeto JSON valido. No uses markdown, comentarios, texto fuera del JSON ni claves adicionales.

Perfil objetivo:
- id fijo: "${lowerPrefix}"
- nombre fijo: "${profileLabel}"

El perfil completo (incluyendo objetivosPorMomento, distribucionDiaria, suplementos, descripcion, meta, etc.) ya esta pre-calculado por la app. TU SOLO DEBES GENERAR EL PLAN SEMANAL.

Clave raiz obligatoria:
- ${planTransportKey}

Reglas criticas:
- No cambies id ni nombre.
- Usa exactamente estos dias dentro del JSON: ${WEEK_DAYS.join(', ')}.
- Usa exactamente estos momentos dentro del JSON: ${MEAL_MOMENT_KEYS.join(', ')}.
- En la clave 'opciones', cada comida debe ser un OBJETO que incluya 'idRef' extraido del "mealsCatalog".
- Cada entrada de "mealsCatalog" incluye id, nombre, tags, momentos y macroEstimate cuando existe. Usa el nombre de la receta para redactar un "detalle" corto y claro.
- CRITICO: Debes respetar ESTRICTAMENTE todo lo pedido en el cuestionario: preferencias alimenticias (ej. vegano, mexicano, asiático), restricciones medicas, ingredientes excluidos, tiempos de cocina, etc. Selecciona unicamente IDs del catalogo que casen con estas preferencias e ignora los demas.
- ${planTransportKey} debe ser un arreglo plano de 35 slots.
- Cada slot debe tener exactamente estas claves: dia, momento, opciones.
- Debe haber exactamente un slot por cada combinacion de dia + momento.
- Ordena los slots primero por dia (${WEEK_DAYS.join(', ')}) y dentro de cada dia por momento (${MEAL_MOMENT_KEYS.join(', ')}).
- Cada slot debe devolver exactamente 3 objetos en 'opciones'.
- No anides momentos dentro de dias ni dias dentro de objetos complejos; usa solo el arreglo plano de slots.
- Las calorias y macros deben cerrar entre si: kcal ≈ proteinaG*4 + carbohidratosG*4 + grasasG*9. Si las kcal requieren carbohidratos altos, las porciones deben mostrar la fuente real (tortillas, arroz, pasta, fruta, leguminosa, etc.); si no hay fuente suficiente, baja las kcal.
- No devuelvas objetos vacios, arreglos vacios para comidas ni slots con opciones incompletas.
- Si targetProfile = "ambos" y recibes companionPlan, conserva la misma preparacion base por dia, momento e indice; cambia solo porciones y macros cuando haga falta.
- Rotacion semanal: si no aplica la regla anterior de companionPlan, alterna idRef entre dias para el mismo momento (no repitas el mismo plato principal los 7 dias en el mismo horario si el catalogo ofrece alternativas compatibles con porciones y restricciones).
- No devuelvas null, undefined, placeholders, alias de claves ni dias con acentos distintos a los pedidos.`;
  }

  function buildUserPrompt(prefix: string, profilePayload: any, catalog: any[], precomputedProfile: any, precomputedSupplements: any[]) {
    return JSON.stringify({
      profilePrefix: prefix,
      questionnaire: profilePayload,
      mealsCatalog: catalog,
      precomputedProfile: precomputedProfile ? {
        perfil: precomputedProfile.perfil,
        metaCaloricaKcalDia: precomputedProfile.metaCaloricaKcalDia,
        objetivosPorMomento: precomputedProfile.objetivosPorMomento,
        distribucionDiaria: precomputedProfile.distribucionDiaria,
        momentos: precomputedProfile.momentos,
        suplementos: precomputedSupplements || [],
      } : undefined,
      outputHints: {
        rootKeys: [`planSemanal${prefix}`],
        selectedMomentsSource: 'questionnaire.planConfig.selectedMoments',
        slotCount: WEEK_DAYS.length * MEAL_MOMENT_KEYS.length,
        mealOptionsPerMoment: 3,
        noteToAI: `El perfil, objetivosPorMomento, distribucionDiaria y suplementos YA ESTAN PRE-CALCULADOS en 'precomputedProfile'. TU SOLO DEBES GENERAR 'planSemanal${prefix}'. En 'opciones' regresa objetos usando SOLO 'idRef' válidos de 'mealsCatalog'. Usa el campo 'nombre' para redactar un 'detalle' corto. OBLIGATORIO: recalcula 'porciones' con gramos realistas y fuentes visibles para proteina, carbohidratos y grasa. Mantén kcal/macros como enteros y deben cerrar: kcal ≈ proteinaG*4 + carbohidratosG*4 + grasasG*9. Si piden ignorar/añadir fuera de bd, usa '|MOD: cambio' en el idRef. Variedad: alterna idRef entre dias por momento.`,
      },
    });
  }

  const models = ['deepseek-v4-flash', 'deepseek-v4-pro'];

  for (const model of models) {
    console.log(`\n=== Probando modelo: ${model} ===`);

    // El
    const elSystem = buildSystemPrompt('EL');
    const elUser = buildUserPrompt('EL', payload.el, elCatalog.catalog, precomputedProfileEl, precomputedSupplementsEl);

    console.log('Llamando Deepseek para El...');
    const elRes = await callDeepseek(model, elSystem, elUser);
    console.log(`El status: ${elRes.status}, tiempo: ${elRes.elapsed}ms`);

    // Ella
    const ellaSystem = buildSystemPrompt('ELLA');
    const ellaUser = buildUserPrompt('ELLA', payload.ella, ellaCatalog.catalog, precomputedProfileElla, precomputedSupplementsElla);

    console.log('Llamando Deepseek para Ella...');
    const ellaRes = await callDeepseek(model, ellaSystem, ellaUser);
    console.log(`Ella status: ${ellaRes.status}, tiempo: ${ellaRes.elapsed}ms`);

    // Save responses
    const fs = await import('fs');
    const dir = `scripts/results-${model}`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/el.json`, elRes.text);
    fs.writeFileSync(`${dir}/ella.json`, ellaRes.text);
    fs.writeFileSync(`${dir}/timing.json`, JSON.stringify({ model, elMs: elRes.elapsed, ellaMs: ellaRes.elapsed, totalMs: elRes.elapsed + ellaRes.elapsed }, null, 2));

    // Parse and validate basic structure
    try {
      const elJson = JSON.parse(elRes.text);
      const ellaJson = JSON.parse(ellaRes.text);
      const elChoice = elJson.choices?.[0];
      const ellaChoice = ellaJson.choices?.[0];
      const elPlan = JSON.parse(elChoice?.message?.content || '{}');
      const ellaPlan = JSON.parse(ellaChoice?.message?.content || '{}');

      fs.writeFileSync(`${dir}/el-plan-parsed.json`, JSON.stringify(elPlan, null, 2));
      fs.writeFileSync(`${dir}/ella-plan-parsed.json`, JSON.stringify(ellaPlan, null, 2));

      // Validate slot counts
      const elSlots = elPlan.planSemanalEL || [];
      const ellaSlots = ellaPlan.planSemanalELLA || [];
      console.log(`El slots: ${elSlots.length}, Ella slots: ${ellaSlots.length}`);

      // Check for completeness
      const expectedSlots = WEEK_DAYS.length * MEAL_MOMENT_KEYS.length;
      if (elSlots.length !== expectedSlots) console.warn(`  WARNING: El tiene ${elSlots.length} slots, esperados ${expectedSlots}`);
      if (ellaSlots.length !== expectedSlots) console.warn(`  WARNING: Ella tiene ${ellaSlots.length} slots, esperados ${expectedSlots}`);

      // Save precomputed profiles for reference
      fs.writeFileSync(`${dir}/precomputed-el.json`, JSON.stringify(precomputedProfileEl, null, 2));
      fs.writeFileSync(`${dir}/precomputed-ella.json`, JSON.stringify(precomputedProfileElla, null, 2));

    } catch (e: any) {
      console.error(`Error parseando respuesta para ${model}:`, e.message);
    }
  }

  console.log('\n=== Pruebas completadas ===');
}

main().catch(console.error);
