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
  const grid = payload.profileContext.clinicalPortionsGrid;
  const momentLabels = new Map(payload.planConfig.selectedMoments.map((entry) => [entry.key, entry.label]));
  const momentHours = new Map(payload.planConfig.selectedMoments.map((entry) => [entry.key, entry.hora]));

  return {
    perfilELLA: {
      id: 'ella',
      nombre: 'Ella',
      perfil: '81.3 kg | 1.6 m | 32 anos | IMC 31.8',
      detallesPerfil: 'Paciente con SOP, diabetes, resistencia a la insulina e hipotiroidismo.',
      meta: 'Perdida de grasa con mejor control glucemico y masa muscular.',
      metaCaloricaKcalDia: 1750,
      descripcion: 'Plan alto en proteina y fibra con cocina mexicana.',
      edad: 32,
      horariosTexto: 'Desayuno (08:00), Colación AM (11:00), Comida (14:00), Colación PM (17:00), Cena (20:00).',
      notaSalud: 'Priorizar hidratacion, fibra y elecciones de bajo indice glucemico.',
      momentos: payload.planConfig.selectedMoments,
      objetivosPorMomento: MOMENTS.map((moment) => ({
        momento: moment,
        ...grid[moment],
      })),
      distribucionDiaria: [
        { grupo: 'frutas', total: 2, detalle: '1 en desayuno, 1 en colación AM' },
        { grupo: 'verduras', total: 4, detalle: '1 en desayuno, 1 en colación AM, 1 en comida, 1 en colación PM' },
        { grupo: 'cereales', total: 2, detalle: '1 en desayuno, 1 en comida' },
        { grupo: 'leguminosas', total: 0, detalle: 'Ninguna' },
        { grupo: 'lacteos', total: 1, detalle: '1 en desayuno' },
        { grupo: 'proteina', total: 26, detalle: '8 en desayuno, 1 en colación AM, 8 en comida, 1 en colación PM, 8 en cena' },
        { grupo: 'grasas', total: 2, detalle: '1 en desayuno, 1 en colación AM' },
      ],
      resumenPersonal: [
        'Plan enfocado en control glucémico con alta proteína.',
        'Se priorizan comidas mexicanas y soporte digestivo.',
      ],
    },
    suplementosELLA: payload.supplementsCatalog.slice(0, 3).map((item) => item.id),
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

test('handler acepta alias de grupos (verd, frut) en objetivos y distribucionDiaria', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  const payload = buildQuestionnairePayload();
  const aiData = buildMockAiData(payload);

  const grid = payload.profileContext.clinicalPortionsGrid;
  aiData.perfilELLA.objetivosPorMomento = MOMENTS.map((moment) => {
    const g = grid[moment];
    return {
      momento: moment,
      frut: g.frutas,
      verd: g.verduras,
      cer: g.cereales,
      leg: g.leguminosas,
      lact: g.lacteos,
      prot: g.proteina,
      gras: g.grasas,
    };
  });

  aiData.perfilELLA.distribucionDiaria = [
    { grupo: 'frut', total: 2, detalle: 'test' },
    { grupo: 'verd', total: 4, detalle: 'test' },
    { grupo: 'cereal', total: 2, detalle: 'test' },
    { grupo: 'legumbre', total: 0, detalle: 'test' },
    { grupo: 'lacteo', total: 1, detalle: 'test' },
    { grupo: 'proteinas', total: 26, detalle: 'test' },
    { grupo: 'grasa', total: 2, detalle: 'test' },
  ];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
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
    const desayuno = res.body?.ellaData?.perfilELLA?.objetivosPorMomento?.desayuno;
    assert.equal(desayuno?.verduras, grid.desayuno.verduras);
    assert.equal(desayuno?.frutas, grid.desayuno.frutas);
    const grupos = new Set(
      (res.body?.ellaData?.perfilELLA?.distribucionDiaria || []).map((d: { grupo: string }) => d.grupo)
    );
    assert.ok(grupos.has('verduras'));
    assert.ok(grupos.has('frutas'));
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
    assert.equal(res.body?.modelUsed, 'gemini-2.5-pro');

    assert.equal(capturedBodies.length, 1);
    const userPromptJson = JSON.parse(capturedBodies[0].contents[0].parts[0].text);
    assert.ok(Array.isArray(userPromptJson.mealsCatalog));
    assert.ok(userPromptJson.mealsCatalog.length < 60);
    assert.ok(Array.isArray(userPromptJson.supplementsCatalog));
    assert.ok(userPromptJson.supplementsCatalog.length > 0);

    const exported = buildExportData(res.body.ellaData, 'ELLA');
    const breakfast = exported.planELLA.Lunes.desayuno[0];
    const dinner = exported.planELLA.Lunes.cena[0];

    assert.ok(breakfast.detalle.includes('Ingredientes base'));
    assert.ok(breakfast.caloriasKcal > 0);
    assert.ok(dinner.caloriasKcal > 0);
    assert.ok(dinner.proteinaG > 0);
    assert.ok(Array.isArray(exported.suplementosELLA));
    assert.equal(exported.suplementosELLA.length, 3);
    assert.ok(exported.suplementosELLA.every((item: any) => item.name && item.notes));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
