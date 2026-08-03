import assert from 'node:assert/strict';
import test from 'node:test';

import { perfilesData } from '../../src/data';
import type { MealItem } from '../../src/types';
import { deduplicateMealOptions } from '../../src/utils/mealPlan';

function meal(nombre: string, caloriasKcal: number): MealItem {
  return {
    nombre,
    porciones: '1 porcion',
    detalle: 'Opcion de prueba',
    tags: [],
    super: [],
    caloriasKcal,
  };
}

test('deduplicateMealOptions conserva una sola opcion por nombre', () => {
  const result = deduplicateMealOptions([
    meal('Comida Libre de Restricciones', 700),
    meal(' comida   libre de restricciones ', 750),
    meal('Ensalada de pollo', 350),
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].caloriasKcal, 700);
  assert.equal(result[1].nombre, 'Ensalada de pollo');
});

test('los planes por defecto no exponen opciones duplicadas en comida libre', () => {
  for (const profileId of ['el', 'ella'] as const) {
    const freeMealOptions = perfilesData[profileId].plan.Domingo.comida;

    assert.equal(freeMealOptions.length, 1);
    assert.equal(freeMealOptions[0].nombre, 'Comida Libre de Restricciones');
  }
});
