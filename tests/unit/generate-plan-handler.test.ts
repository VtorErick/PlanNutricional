import test from 'node:test';
import assert from 'node:assert/strict';

import handler from '../../api/generate-plan.js';
import { buildExportData } from '../../src/dataManager.ts';
import { buildQuestionnaireMealsCatalog, mealsDatabase } from '../../src/data/mealsDB.ts';
import { buildQuestionnaireSupplementsCatalog } from '../../src/data/supplementsDB.ts';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MOMENTS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'] as const;

function buildQuestionnairePayload() {
  const payload = {
    targetProfile: 'ella',
    profileToUpdate: 'ella',
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
    profileContext: {
      age: '32',
      currentWeightKg: '81.3',
      heightCm: '160',
      targetWeightKg: '70',
      objectives: ['Ganar músculo', 'Perder grasa', 'Mejorar salud', 'Control glucémico'],
      objectiveTimelineWeeks: '12 sem',
      clinicalPortionsGrid: {
        desayuno: { verduras: 1, frutas: 1, lacteos: 1, proteina: 8, grasas: 1, cereales: 1, leguminosas: 0 },
        colacion_am: { verduras: 1, frutas: 1, lacteos: 0, proteina: 1, grasas: 1, cereales: 0, leguminosas: 0 },
        comida: { verduras: 1, frutas: 0, lacteos: 0, proteina: 8, grasas: 0, cereales: 1, leguminosas: 0 },
        colacion_pm: { verduras: 1, frutas: 0, lacteos: 0, proteina: 1, grasas: 0, cereales: 0, leguminosas: 0 },
        cena: { verduras: 0, frutas: 0, lacteos: 0, proteina: 8, grasas: 0, cereales: 0, leguminosas: 0 },
      },
    },
    healthContext: {
      diagnostics: 'Hipotiroidismo, resistencia a la insulina, ovario poliquistico, diabetes',
      allergies: 'penicilina',
      medications: 'metformina, semaglutida',
      intolerances: '',
      digestiveSymptoms: 'Distensión, Estreñimiento',
    },
    preferences: {
      favoriteFoods: 'Pollo, atun, comida mexicana, dulces',
      dislikedFoods: 'queso manchego, queso cottage, yogurt',
      favoriteCuisineStyles: 'Mexicana',
      cookingTime: '45 min',
    },
    routine: {
      activityLevel: 'Moderado',
      wakeTime: '',
      sleepTime: '',
      trainingFrequency: '3-4 días',
    },
    bodyMeasurements: {
      waistCm: '97',
      hipCm: '110',
      neckCm: '33',
      chestCm: '103',
      armCm: '33',
      thighCm: '56',
    },
    preferredModel: 'gemini-3.1-pro-preview',
  };

  return {
    ...payload,
    mealsCatalog: buildQuestionnaireMealsCatalog(mealsDatabase, payload),
    supplementsCatalog: buildQuestionnaireSupplementsCatalog(payload),
  };
}

function buildMomentOptions(payload: ReturnType<typeof buildQuestionnairePayload>, moment: typeof MOMENTS[number]) {
  const catalog = payload.mealsCatalog.filter((item) => item.momentos.includes(moment)).slice(0, 3);
  assert.equal(catalog.length, 3, `Se esperaban 3 opciones para ${moment}`);

  return catalog.map((item, index) => ({
    idRef: item.id,
    porciones:
      moment === 'desayuno'
        ? '8 prot, 1 verd, 1 frut, 1 lact, 1 gras, 1 cer'
        : moment === 'colacion_am'
          ? '1 prot, 1 verd, 1 frut, 1 gras'
          : moment === 'comida'
            ? '8 prot, 1 verd, 1 cer'
            : moment === 'colacion_pm'
              ? '1 prot, 1 verd'
              : '8 prot',
    detalle:
      moment === 'desayuno' && index === 0
        ? 'Huevos con machaca, pico de gallo, aguacate, tortilla y fruta.'
        : `${item.nombre}.`,
    caloriasKcal: moment === 'cena' ? 0 : 420 + index * 15,
    proteinaG: moment === 'cena' ? 0 : 30 + index * 3,
    grasasG: moment === 'cena' ? 0 : 14 + index * 2,
  }));
}

function buildMockAiData(payload: ReturnType<typeof buildQuestionnairePayload>) {
  // Phase 2: AI now only returns planSemanal; profile and supplements are pre-computed locally
  return {
    planSemanalELLA: WEEK_DAYS.flatMap((dia) =>
      MOMENTS.map((moment) => ({
        dia,
        momento: moment,
        opciones: buildMomentOptions(payload, moment).map((option) => ({
          ...option,
          detalle:
            dia === 'Lunes' && moment === 'desayuno' && option.idRef === buildMomentOptions(payload, moment)[0].idRef
              ? 'Detalle redactado distinto a la receta base pero con idRef válido.'
              : option.detalle,
        })),
      }))
    ),
  };
}

function createMockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as any,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('handler pre-computa perfil localmente y solo pide planSemanal a la IA', async () => {
  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = 'test-key';
  const payload = buildQuestionnairePayload();
  const aiData = buildMockAiData(payload);
  const capturedBodies: any[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url.includes(':generateContent')) {
      const parsedBody = JSON.parse(options.body);
      capturedBodies.push(parsedBody);
      return createMockResponse(200, {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(aiData) }],
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
        modelVersion: 'gemini-2.5-pro',
      }) as any;
    }
    if (/\/models(?:\?|$)/.test(url)) {
      return createMockResponse(200, {
        models: [{ name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] }],
      }) as any;
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as any;

  try {
    const req = {
      method: 'POST',
      body: payload,
      headers: { origin: 'http://localhost:5173', host: 'localhost:5173' },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const res = createMockRes();
    await handler(req, res as any);
    assert.equal(res.statusCode, 200);

    // Verify AI was asked for plan-only schema
    assert.equal(capturedBodies.length, 1);
    const userPromptJson = JSON.parse(capturedBodies[0].contents[0].parts[0].text);
    assert.ok(userPromptJson.precomputedProfile, 'Should include precomputedProfile in prompt');
    assert.match(userPromptJson.precomputedProfile.perfil, /81 kg \| 1\.60 m \| 32/);
    assert.ok(userPromptJson.precomputedProfile.metaCaloricaKcalDia, 'Precomputed profile should have calories');
    assert.equal(userPromptJson.supplementsCatalog, undefined, 'Supplement catalog is not needed for plan-only generation');

    // Verify response contains merged data
    assert.ok(res.body?.ellaData?.perfilELLA, 'Response should include precomputed perfilELLA');
    assert.equal(res.body.ellaData.perfilELLA.edad, 32);
    assert.match(res.body.ellaData.perfilELLA.perfil, /81 kg \| 1\.60 m \| 32/);
    assert.ok(res.body?.ellaData?.suplementosELLA, 'Response should include precomputed suplementosELLA');
    assert.ok(res.body?.ellaData?.planELLA, 'Response should include AI planELLA');

    const desayuno = res.body?.ellaData?.perfilELLA?.objetivosPorMomento?.desayuno;
    assert.ok(desayuno?.verduras !== undefined, 'Precomputed profile should have proper food group keys');
    assert.ok(desayuno?.frutas !== undefined, 'Precomputed profile should have proper food group keys');
    assert.equal(res.body?.ellaData?.perfilELLA?.momentos?.[0]?.hora, '08:00');
    assert.ok(
      res.body?.ellaData?.perfilELLA?.objetivosPorMomento?.cena?.proteina > 0,
      'Dinner should keep protein portions in the precomputed table'
    );

    const grupos = new Set(
      (res.body?.ellaData?.perfilELLA?.distribucionDiaria || []).map((d: { grupo: string }) => d.grupo)
    );
    assert.ok(grupos.has('Frutas'));
    assert.ok(grupos.has('Verduras'));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AI_PROVIDER;
  }
});

test('handler genera y la app rehidrata correctamente un plan de cuestionario de ella', async () => {
  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = 'test-key';
  const payload = buildQuestionnairePayload();
  const aiData = buildMockAiData(payload);
  const capturedBodies: any[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url.includes(':generateContent')) {
      const parsedBody = JSON.parse(options.body);
      capturedBodies.push(parsedBody);

      return createMockResponse(200, {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(aiData) }],
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 2000,
          totalTokenCount: 3000,
        },
        modelVersion: 'gemini-2.5-pro',
      }) as any;
    }

    if (/\/models(?:\?|$)/.test(url)) {
      return createMockResponse(200, {
        models: [
          { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
        ],
      }) as any;
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  }) as any;

  try {
    const req = {
      method: 'POST',
      body: payload,
      headers: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const res = createMockRes();

    await handler(req, res as any);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body?.ellaData);
    assert.equal(res.body?.modelUsed, 'gemini-3-flash-preview');

    assert.equal(capturedBodies.length, 1);
    const userPromptJson = JSON.parse(capturedBodies[0].contents[0].parts[0].text);
    assert.ok(Array.isArray(userPromptJson.mealsCatalog));
    assert.ok(userPromptJson.mealsCatalog.length < 60);
    assert.equal(userPromptJson.supplementsCatalog, undefined);

    const exported = buildExportData(res.body.ellaData, 'ELLA');
    const breakfast = exported.planELLA.Lunes.desayuno[0];
    const dinner = exported.planELLA.Lunes.cena[0];

    assert.ok(
      breakfast.detalle.includes('Ingredientes base') || breakfast.detalle.includes(breakfast.nombre),
      'El detalle debe contener ingredientes base o el nombre de la receta (rehidratado)'
    );
    assert.ok(breakfast.caloriasKcal > 0);
    assert.doesNotMatch(breakfast.porciones, /ajustad|kcal para este perfil/i);
    assert.ok(dinner.caloriasKcal > 0);
    assert.doesNotMatch(dinner.porciones, /ajustad|kcal para este perfil/i);
    assert.equal(dinner.caloriasKcal, Math.round((dinner.proteinaG * 4) + (dinner.carbohidratosG * 4) + (dinner.grasasG * 9)));
    assert.ok(dinner.proteinaG > 0);
    const mondayMeals = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena']
      .map((moment) => exported.planELLA.Lunes[moment][0]);
    const mondayCalories = mondayMeals.reduce((sum, meal) => sum + meal.caloriasKcal, 0);
    const targetCalories = exported.perfilELLA.metaCaloricaKcalDia;
    assert.ok(
      mondayMeals.every((meal) => (
        Math.abs(
          meal.caloriasKcal -
          Math.round((meal.proteinaG * 4) + (meal.carbohidratosG * 4) + (meal.grasasG * 9))
        ) / Math.max(meal.caloriasKcal, 1) <= 0.12
      )),
      'Every selected meal should keep calories supported by macros'
    );
    assert.ok(
      Math.abs(mondayCalories - targetCalories) / targetCalories <= 0.25,
      `Monday calories should stay reasonably near target without inventing unsupported kcal. Got ${mondayCalories}, target ${targetCalories}`
    );
    assert.ok(Array.isArray(exported.suplementosELLA));
    assert.ok(exported.suplementosELLA.length >= 1, 'Debe haber al menos 1 suplemento pre-computado');
    assert.ok(exported.suplementosELLA.every((item: any) => item.name && item.notes));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AI_PROVIDER;
  }
});

test('handler usa DeepSeek por defecto cuando AI_PROVIDER no existe', async () => {
  delete process.env.AI_PROVIDER;
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  const payload = buildQuestionnairePayload();
  const aiData = buildMockAiData(payload);
  const capturedBodies: any[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url === 'https://api.deepseek.com/chat/completions') {
      const parsedBody = JSON.parse(options.body);
      capturedBodies.push({ body: parsedBody, headers: options.headers });
      return createMockResponse(200, {
        id: 'chatcmpl-test',
        model: 'deepseek-v4-flash',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: JSON.stringify(aiData),
            },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }) as any;
    }

    throw new Error(`Unexpected fetch URL in DeepSeek test: ${url}`);
  }) as any;

  try {
    const req = {
      method: 'POST',
      body: payload,
      headers: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const res = createMockRes();

    await handler(req, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.modelUsed, 'deepseek-v4-flash');
    assert.equal(capturedBodies.length, 1);
    assert.equal(capturedBodies[0].body.model, 'deepseek-v4-flash');
    assert.equal(capturedBodies[0].body.thinking.type, 'disabled');
    assert.match(capturedBodies[0].headers.Authorization, /^Bearer /);
    const userPromptJson = JSON.parse(capturedBodies[0].body.messages[1].content);
    assert.ok(userPromptJson.precomputedProfile, 'Should include precomputedProfile in DeepSeek prompt');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.DEEPSEEK_API_KEY;
  }
});

test('handler genera ambos con una sola llamada DeepSeek y escala Ella deterministicamente', async () => {
  process.env.AI_PROVIDER = 'deepseek';
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  const basePayload = buildQuestionnairePayload();
  const profileBundle = {
    profileContext: basePayload.profileContext,
    healthContext: basePayload.healthContext,
    preferences: basePayload.preferences,
    routine: basePayload.routine,
    bodyMeasurements: basePayload.bodyMeasurements,
  };
  const payload = {
    ...basePayload,
    targetProfile: 'ambos' as const,
    profileToUpdate: 'ambos' as const,
    el: profileBundle,
    ella: profileBundle,
  };
  const aiData = {
    planSemanalEL: buildMockAiData(basePayload).planSemanalELLA.map((slot) => ({
      ...slot,
      opciones: slot.opciones.map((option) => ({ idRef: option.idRef })),
    })),
  };
  const capturedBodies: any[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url === 'https://api.deepseek.com/chat/completions') {
      const parsedBody = JSON.parse(options.body);
      capturedBodies.push({ body: parsedBody, headers: options.headers });
      return createMockResponse(200, {
        id: 'chatcmpl-test',
        model: 'deepseek-v4-flash',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: JSON.stringify(aiData),
            },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }) as any;
    }

    throw new Error(`Unexpected fetch URL in DeepSeek ambos test: ${url}`);
  }) as any;

  try {
    const req = {
      method: 'POST',
      body: payload,
      headers: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const res = createMockRes();

    await handler(req, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedBodies.length, 1);
    assert.ok(res.body?.elData?.planEL);
    assert.ok(res.body?.ellaData?.planELLA);
    assert.match(res.body?.modelUsed, /deterministic-scaling/);
    const firstEl = res.body.elData.planEL.Lunes.desayuno[0];
    const firstElla = res.body.ellaData.planELLA.Lunes.desayuno[0];
    assert.equal(firstEl.nombre, firstElla.nombre);
    assert.notEqual(firstEl.caloriasKcal, firstElla.caloriasKcal);
    assert.equal(
      firstElla.caloriasKcal,
      Math.round((firstElla.proteinaG * 4) + (firstElla.carbohidratosG * 4) + (firstElla.grasasG * 9))
    );
    const userPromptJson = JSON.parse(capturedBodies[0].body.messages[1].content);
    assert.deepEqual(userPromptJson.outputHints.doNotReturnFields.includes('caloriasKcal'), true);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AI_PROVIDER;
    delete process.env.DEEPSEEK_API_KEY;
  }
});

test('handler cae a DeepSeek Flash si AI_PROVIDER y DEEPSEEK_MODEL son invalidos', async () => {
  process.env.AI_PROVIDER = 'proveedor-invalido';
  process.env.DEEPSEEK_MODEL = 'modelo-invalido';
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  const payload = buildQuestionnairePayload();
  const aiData = buildMockAiData(payload);
  const capturedBodies: any[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url === 'https://api.deepseek.com/chat/completions') {
      const parsedBody = JSON.parse(options.body);
      capturedBodies.push({ body: parsedBody, headers: options.headers });
      return createMockResponse(200, {
        id: 'chatcmpl-test',
        model: 'deepseek-v4-flash',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: JSON.stringify(aiData),
            },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }) as any;
    }

    throw new Error(`Unexpected fetch URL in DeepSeek fallback test: ${url}`);
  }) as any;

  try {
    const req = {
      method: 'POST',
      body: payload,
      headers: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const res = createMockRes();

    await handler(req, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.modelUsed, 'deepseek-v4-flash');
    assert.equal(capturedBodies[0].body.model, 'deepseek-v4-flash');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AI_PROVIDER;
    delete process.env.DEEPSEEK_MODEL;
    delete process.env.DEEPSEEK_API_KEY;
  }
});

test('handler cae a Gemini Flash si GEMINI_MODEL y preferredModel son invalidos', async () => {
  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_MODEL = 'modelo-invalido';
  const payload = { ...buildQuestionnairePayload(), preferredModel: 'otro-modelo-invalido' };
  const aiData = buildMockAiData(payload as ReturnType<typeof buildQuestionnairePayload>);
  const capturedUrls: string[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    capturedUrls.push(url);
    if (url.includes(':generateContent')) {
      return createMockResponse(200, {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(aiData) }],
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
        modelVersion: 'gemini-3-flash-preview',
      }) as any;
    }
    if (/\/models(?:\?|$)/.test(url)) {
      return createMockResponse(200, {
        models: [{ name: 'models/gemini-3-flash-preview', supportedGenerationMethods: ['generateContent'] }],
      }) as any;
    }

    throw new Error(`Unexpected fetch URL in Gemini fallback test: ${url}`);
  }) as any;

  try {
    const req = {
      method: 'POST',
      body: payload,
      headers: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;
    const res = createMockRes();

    await handler(req, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.modelUsed, 'gemini-3-flash-preview');
    assert.ok(capturedUrls.some((url) => url.includes('/models/gemini-3-flash-preview:generateContent')));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  }
});
