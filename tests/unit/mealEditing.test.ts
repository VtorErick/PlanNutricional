import test from 'node:test';
import assert from 'node:assert/strict';
import type { Profile } from '../../src/types';
import {
  createMealEditorDraftFromRecommendation,
  getRecommendedCatalogMealsForSlot,
} from '../../src/utils/mealEditing';

const profile: Profile = {
  id: 'el',
  nombre: 'Perfil prueba',
  edad: 34,
  descripcion: '',
  perfil: '',
  meta: '',
  horariosTexto: '',
  momentos: [
    { key: 'desayuno', label: 'Desayuno', hora: '08:00' },
    { key: 'cena', label: 'Cena', hora: '20:00' },
  ],
  objetivosPorMomento: {
    desayuno: {
      frutas: 1,
      verduras: 1,
      cereales: 2,
      proteina: 2,
      grasas: 1,
    },
    cena: {
      verduras: 2,
      proteina: 2,
      grasas: 1,
    },
  },
  distribucionDiaria: [],
  resumenPersonal: [],
  plan: {},
};

test('getRecommendedCatalogMealsForSlot devuelve comidas locales con porciones del perfil', () => {
  const recommendations = getRecommendedCatalogMealsForSlot(
    profile,
    'el',
    'desayuno',
    {
      preferences: {
        favoriteFoods: 'huevo, aguacate',
        dislikedFoods: 'cottage',
        cookingTime: '30',
      },
      profileContext: {
        objectives: ['Perder grasa'],
      },
    },
    'des_01',
    5
  );

  assert.ok(recommendations.length > 0);
  assert.ok(recommendations.length <= 5);
  assert.ok(!recommendations.some((meal) => meal.id === 'des_01'));
  assert.ok(!recommendations.some((meal) => meal.nombre.toLowerCase().includes('cottage')));
  assert.match(recommendations[0].porciones, /1 frutas/);
  assert.match(recommendations[0].porciones, /2 cereales/);
  assert.ok(recommendations[0].caloriasKcal > 0);
  assert.ok(recommendations[0].proteinaG >= 0);
});

test('createMealEditorDraftFromRecommendation conserva datos calculados localmente', () => {
  const [recommendation] = getRecommendedCatalogMealsForSlot(
    profile,
    'el',
    'cena',
    {
      preferences: {
        favoriteFoods: 'pollo',
      },
    },
    undefined,
    1
  );

  const draft = createMealEditorDraftFromRecommendation(recommendation);

  assert.strictEqual(draft.nombre, recommendation.nombre);
  assert.strictEqual(draft.porciones, recommendation.porciones);
  assert.strictEqual(draft.caloriasKcal, String(recommendation.caloriasKcal));
  assert.ok(draft.detalle.includes(recommendation.nombre));
});
