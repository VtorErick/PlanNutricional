import test from 'node:test';
import assert from 'node:assert/strict';

import handler from '../../api/generate-plan.js';
import { buildExportData } from '../../src/dataManager.ts';
import { buildQuestionnaireMealsCatalog, mealsDatabase } from '../../src/data/mealsDB.ts';
import { buildQuestionnaireSupplementsCatalog } from '../../src/data/supplementsDB.ts';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
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

    const grupos = new Set(
      (res.body?.ellaData?.perfilELLA?.distribucionDiaria || []).map((d: { grupo: string }) => d.grupo)
    );
    assert.ok(grupos.has('Frutas'));
    assert.ok(grupos.has('Verduras'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('handler genera y la app rehidrata correctamente un plan de cuestionario de ella', async () => {
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
    assert.ok(dinner.caloriasKcal > 0);
    assert.ok(dinner.proteinaG > 0);
    assert.ok(Array.isArray(exported.suplementosELLA));
    assert.ok(exported.suplementosELLA.length >= 1, 'Debe haber al menos 1 suplemento pre-computado');
    assert.ok(exported.suplementosELLA.every((item: any) => item.name && item.notes));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
