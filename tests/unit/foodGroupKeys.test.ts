import test from 'node:test';
import assert from 'node:assert/strict';

import {
  coerceFoodGroupInt,
  remapFoodGroupRow,
  resolveFoodGroupKey,
} from '../../src/utils/foodGroupKeys.ts';

test('resolveFoodGroupKey normaliza alias comunes de la IA', () => {
  assert.equal(resolveFoodGroupKey('verd'), 'verduras');
  assert.equal(resolveFoodGroupKey('VERDURAS'), 'verduras');
  assert.equal(resolveFoodGroupKey('frut'), 'frutas');
  assert.equal(resolveFoodGroupKey('legumbres'), 'leguminosas');
  assert.equal(resolveFoodGroupKey('lacteo'), 'lacteos');
  assert.equal(resolveFoodGroupKey('proteínas'), 'proteina');
  assert.equal(resolveFoodGroupKey('grasa'), 'grasas');
  assert.equal(resolveFoodGroupKey('cereal'), 'cereales');
});

test('remapFoodGroupRow fusiona alias y respeta la clave canónica si hay duplicado', () => {
  const row = {
    momento: 'desayuno',
    verd: 2,
    frutas: 1,
    frut: 9,
  };
  const out = remapFoodGroupRow(row);
  assert.equal(out.verduras, 2);
  assert.equal(out.frutas, 1);
});

test('coerceFoodGroupInt acepta string numerico', () => {
  assert.equal(coerceFoodGroupInt('3'), 3);
  assert.equal(coerceFoodGroupInt('1,5'), 2);
});
