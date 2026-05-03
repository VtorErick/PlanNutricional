import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExportData } from '../../src/dataManager.ts';
import { ensureMealNutrition, estimateMealNutritionFromPortions } from '../../src/utils/nutrition.ts';
import { sanitizeMealPortionsText } from '../../src/utils/mealPortions.ts';

function buildMinimalEllaPayload() {
  return {
    perfilELLA: {
      id: 'ella',
      nombre: 'Ella',
      perfil: '81.3 kg | 1.60 m | 32 anos | IMC 31.7',
      detallesPerfil: 'Paciente con control glucemico.',
      meta: 'Reducir peso.',
      metaCaloricaKcalDia: 1600,
      descripcion: 'Plan base.',
      edad: 32,
      horariosTexto: 'Desayuno 08:00, Colacion AM 11:00, Comida 14:00, Colacion PM 17:00, Cena 20:00',
      notaSalud: 'Sin observaciones.',
      momentos: [
        { key: 'desayuno', label: 'Desayuno', hora: '08:00' },
        { key: 'colacion_am', label: 'Colacion AM', hora: '11:00' },
        { key: 'comida', label: 'Comida', hora: '14:00' },
        { key: 'colacion_pm', label: 'Colacion PM', hora: '17:00' },
        { key: 'cena', label: 'Cena', hora: '20:00' },
      ],
      objetivosPorMomento: {
        desayuno: { frutas: 1, verduras: 1, cereales: 1, leguminosas: 0, lacteos: 1, proteina: 8, grasas: 1 },
        colacion_am: { frutas: 1, verduras: 1, cereales: 0, leguminosas: 0, lacteos: 0, proteina: 1, grasas: 1 },
        comida: { frutas: 0, verduras: 1, cereales: 1, leguminosas: 0, lacteos: 0, proteina: 8, grasas: 0 },
        colacion_pm: { frutas: 0, verduras: 1, cereales: 0, leguminosas: 0, lacteos: 0, proteina: 1, grasas: 0 },
        cena: { frutas: 0, verduras: 0, cereales: 0, leguminosas: 0, lacteos: 0, proteina: 8, grasas: 0 },
      },
      distribucionDiaria: [
        { grupo: 'frutas', total: 2, detalle: '2 porciones al dia' },
        { grupo: 'verduras', total: 4, detalle: '4 porciones al dia' },
        { grupo: 'cereales', total: 2, detalle: '2 porciones al dia' },
        { grupo: 'leguminosas', total: 0, detalle: '0 porciones al dia' },
        { grupo: 'lacteos', total: 1, detalle: '1 porcion al dia' },
        { grupo: 'proteina', total: 18, detalle: '18 porciones al dia' },
        { grupo: 'grasas', total: 2, detalle: '2 porciones al dia' },
      ],
      resumenPersonal: ['Resumen.'],
    },
    equivalenciasELLA: [{ titulo: 'Base', icon: 'Heart', items: ['ok'] }],
    planELLA: {
      Lunes: {
        desayuno: [
          {
            idRef: 'des_01',
            porciones: '8 prot, 1 verd, 1 frut, 1 lact, 1 gras, 1 cer',
            detalle: 'Huevos a la mexicana con pollo deshebrado, tortilla, aguacate, leche deslactosada y fruta.',
            caloriasKcal: 0,
            proteinaG: 0,
            grasasG: 0,
          },
        ],
        colacion_am: [
          {
            idRef: 'col_03',
            porciones: '1 prot, 1 verd, 1 frut, 1 gras',
            detalle: 'Rollitos de jamon de pavo con pepino, nueces y fresas.',
            caloriasKcal: 0,
            proteinaG: 0,
            grasasG: 0,
          },
        ],
        comida: [
          {
            idRef: 'com_01',
            porciones: '8 prot, 1 verd, 1 cer',
            detalle: 'Pechuga de pollo asada con ensalada verde y arroz integral.',
            caloriasKcal: 0,
            proteinaG: 0,
            grasasG: 0,
          },
        ],
        colacion_pm: [
          {
            idRef: 'col_16',
            porciones: '1 prot, 1 verd',
            detalle: 'Pechuga de pavo en rollitos con tiras de pimiento morron.',
            caloriasKcal: 0,
            proteinaG: 0,
            grasasG: 0,
          },
        ],
        cena: [
          {
            idRef: 'cen_08',
            porciones: '8 prot',
            detalle: '240g de pechuga de pollo a la plancha.',
            caloriasKcal: 0,
            proteinaG: 0,
            grasasG: 0,
          },
        ],
      },
    },
    suplementosELLA: ['sup_omega3', { id: 'sup_magnesio' }, { name: 'Incompleto' }],
  };
}

test('estimateMealNutritionFromPortions soporta aliases abreviados', () => {
  const result = estimateMealNutritionFromPortions('8 prot, 1 verd, 1 frut, 1 lact, 1 gras, 1 cer');
  assert.equal(result.caloriasKcal, 735);
  assert.equal(result.proteinaG, 67);
  assert.equal(result.carbohidratosG, 46);
  assert.equal(result.grasasG, 33);
});

test('estimateMealNutritionFromPortions soporta orden inverso y separador pipe', () => {
  const result = estimateMealNutritionFromPortions('proteina 8 | verduras 1 | frutas 1');
  assert.equal(result.caloriasKcal, 525);
  assert.equal(result.proteinaG, 58);
  assert.equal(result.carbohidratosG, 19);
  assert.equal(result.grasasG, 24);
});

test('ensureMealNutrition recalcula placeholders en cero', () => {
  const result = ensureMealNutrition({
    nombre: 'Demo',
    porciones: '1 prot, 1 gras',
    detalle: 'Demo',
    tags: [],
    super: [],
    caloriasKcal: 0,
    proteinaG: 0,
    grasasG: 0,
  });

  assert.equal(result.caloriasKcal, 100);
  assert.equal(result.proteinaG, 7);
  assert.equal(result.carbohidratosG, 0);
  assert.equal(result.grasasG, 8);
});

test('ensureMealNutrition conserva macros validos ya calculados', () => {
  const result = ensureMealNutrition({
    nombre: 'Demo',
    porciones: '1 prot, 1 gras',
    detalle: 'Demo',
    tags: [],
    super: [],
    caloriasKcal: 321,
    proteinaG: 22,
    carbohidratosG: 34,
    grasasG: 11,
  });

  assert.equal(result.caloriasKcal, 321);
  assert.equal(result.proteinaG, 22);
  assert.equal(result.carbohidratosG, 34);
  assert.equal(result.grasasG, 11);
});

test('ensureMealNutrition reconcilia kcal infladas cuando macros no las sostienen', () => {
  const result = ensureMealNutrition({
    nombre: 'Tacos de carne molida magra',
    porciones: '120g carne molida magra, 3 tortillas de maiz, 1/2 taza de verduras',
    detalle: 'Tacos con carne molida magra y verduras.',
    tags: [],
    super: [],
    caloriasKcal: 610,
    proteinaG: 38,
    carbohidratosG: 50,
    grasasG: 15,
  });

  assert.equal(result.caloriasKcal, 487);
  assert.equal(result.proteinaG, 38);
  assert.equal(result.carbohidratosG, 50);
  assert.equal(result.grasasG, 15);
});

test('sanitizeMealPortionsText remueve notas tecnicas de ajuste calórico', () => {
  const result = sanitizeMealPortionsText(
    '2 huevos, 2 tortillas de maiz (porcion ajustada a ~430 kcal para este perfil)'
  );

  assert.equal(result, '2 huevos, 2 tortillas de maiz');
});

test('ensureMealNutrition sanea porciones legacy sin mezclar kcal objetivo', () => {
  const result = ensureMealNutrition({
    nombre: 'Demo',
    porciones: '1 prot, 1 gras (porcion ajustada a ~480 kcal para este perfil)',
    detalle: 'Demo',
    tags: [],
    super: [],
    caloriasKcal: 480,
    proteinaG: 7,
    grasasG: 8,
  });

  assert.equal(result.porciones, '1 prot, 1 gras');
  assert.equal(result.caloriasKcal, 100);
});

test('buildExportData enriquece macros y sanea suplementos y detalle incoherente', () => {
  const exported = buildExportData(buildMinimalEllaPayload(), 'ELLA');
  const breakfast = exported.planELLA.Lunes.desayuno[0];
  const snack = exported.planELLA.Lunes.colacion_am[0];
  const supplements = exported.suplementosELLA;

  assert.ok(breakfast.caloriasKcal > 0);
  assert.ok(breakfast.proteinaG > 0);
  assert.notEqual(snack.detalle, 'Rollitos de jamon de pavo con pepino, nueces y fresas.');
  assert.match(snack.detalle, /Ingredientes base/i);
  assert.equal(supplements.length, 2);
  assert.ok(supplements.every((item: any) => item.notes && item.name));
});

test('buildExportData no conserva notas de ajuste calorico en porciones rehidratadas', () => {
  const payload = buildMinimalEllaPayload();
  payload.planELLA.Lunes.desayuno[0].porciones =
    '8 prot, 1 verd, 1 frut, 1 lact, 1 gras, 1 cer (porcion ajustada a ~430 kcal para este perfil)';

  const exported = buildExportData(payload, 'ELLA');
  const breakfast = exported.planELLA.Lunes.desayuno[0];

  assert.equal(breakfast.porciones, '8 prot, 1 verd, 1 frut, 1 lact, 1 gras, 1 cer');
  assert.doesNotMatch(breakfast.porciones, /ajustad|kcal para este perfil/i);
});
