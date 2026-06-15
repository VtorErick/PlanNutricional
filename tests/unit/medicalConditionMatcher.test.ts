import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findMatchingCondition,
  findMatchingMedication,
  parseMedicalConditions,
  parseMedications,
  hasMedicalContraindicationConflict,
  MEDICAL_CONDITION_ALIASES,
  MEDICATION_ALIASES,
} from '../../src/utils/medicalConditionMatcher';

test('findMatchingCondition encuentra SOP con variaciones', () => {
  const variations = [
    'sop',
    'sindrome de ovario poliquistico',
    'ovaio poliquistico',
    'sindrom ovario polikistico',
    'pcos',
    'poliquistosis ovarica',
    'síndrome del ovaio poliquístico',
  ];

  for (const variation of variations) {
    const result = findMatchingCondition(variation);
    assert.strictEqual(result, 'sindrome de ovario poliquistico', `Debe encontrar SOP para: ${variation}`);
  }
});

test('findMatchingCondition encuentra diabetes con errores ortográficos', () => {
  const variations = [
    'diabetes',
    'diabetis',
    'diavetes',
    'dm2',
    'diabetes tipo 2',
    'azucar alta en sangre',
    'resistencia insulina',
    'glucosa alta',
  ];

  for (const variation of variations) {
    const result = findMatchingCondition(variation);
    assert.ok(result?.includes('diabetes'), `Debe encontrar diabetes para: ${variation}`);
  }
});

test('findMatchingCondition encuentra hipertensión con variaciones', () => {
  const variations = [
    'hipertension',
    'presion alta',
    'tension alta',
    'ta elevada',
    'hta',
    'presion arterial elevada',
  ];

  for (const variation of variations) {
    const result = findMatchingCondition(variation);
    assert.ok(result?.includes('hipertension'), `Debe encontrar hipertensión para: ${variation}`);
  }
});

test('findMatchingCondition retorna null para texto desconocido', () => {
  const result = findMatchingCondition('xyz123desconocido');
  assert.strictEqual(result, null);
});

test('findMatchingMedication encuentra metformina con variantes', () => {
  const variations = [
    'metformina',
    'metformin',
    'glucophage',
    'glifage',
    'metfogamma',
    'biguanida',
  ];

  for (const variation of variations) {
    const result = findMatchingMedication(variation);
    assert.strictEqual(result, 'metformina', `Debe encontrar metformina para: ${variation}`);
  }
});

test('findMatchingMedication encuentra levotiroxina', () => {
  const result = findMatchingMedication('eutirox');
  assert.strictEqual(result, 'levotiroxina');
});

test('parseMedicalConditions maneja texto libre con múltiples condiciones', () => {
  const input = 'tengo sop, diabetes tipo 2, y presion alta';
  const result = parseMedicalConditions(input);

  assert.ok(result.matched.includes('sindrome de ovario poliquistico'));
  assert.ok(result.matched.includes('diabetes'));
  assert.ok(result.matched.includes('hipertension'));
  assert.strictEqual(result.matched.length, 3);
});

test('parseMedicalConditions maneja separadores variados', () => {
  const inputs = [
    'sop, diabetes; reflujo',
    'sop|diabetes|reflujo',
    'sop y diabetes e reflujo',
  ];

  for (const input of inputs) {
    const result = parseMedicalConditions(input);
    assert.ok(result.matched.length >= 2, `Debe parsear: ${input}`);
  }
});

test('parseMedicalConditions incluye detalles de confianza', () => {
  const input = 'sop, condicion desconocida xyz';
  const result = parseMedicalConditions(input);

  const sopDetail = result.details.find(d => d.original === 'sop');
  assert.ok(sopDetail);
  assert.ok(['high', 'medium', 'low'].includes(sopDetail!.confidence));

  const unknownDetail = result.details.find(d => d.original === 'condicion desconocida xyz');
  assert.ok(unknownDetail);
  assert.strictEqual(unknownDetail!.matched, null);
});

test('parseMedications maneja múltiples medicamentos', () => {
  const input = 'metformina, eutirox y omeprazol';
  const result = parseMedications(input);

  assert.ok(result.matched.includes('metformina'));
  assert.ok(result.matched.includes('levotiroxina'));
  assert.ok(result.matched.includes('omeprazol'));
});

test('hasMedicalContraindicationConflict detecta conflictos exactos', () => {
  const userConditions = ['diabetes', 'hipertension'];
  const mealContraindications = ['diabetes descontrolada', 'hipertension severa'];

  const result = hasMedicalContraindicationConflict(userConditions, mealContraindications);

  assert.strictEqual(result.hasConflict, true);
  assert.ok(result.matchedConditions.length > 0);
  assert.ok(result.confidence > 0);
});

test('hasMedicalContraindicationConflict detecta conflictos fuzzy', () => {
  const userConditions = ['diabetis']; // error ortográfico
  const mealContraindications = ['diabetes descontrolada'];

  const result = hasMedicalContraindicationConflict(userConditions, mealContraindications, { fuzzyMatch: true });

  assert.strictEqual(result.hasConflict, true);
});

test('hasMedicalContraindicationConflict no detecta falsos positivos', () => {
  const userConditions = ['diabetes'];
  const mealContraindications = ['calculos renales', 'gota'];

  const result = hasMedicalContraindicationConflict(userConditions, mealContraindications);

  assert.strictEqual(result.hasConflict, false);
  assert.strictEqual(result.matchedConditions.length, 0);
});

test('SOP maneja múltiples variaciones de escritura', () => {
  const variations = [
    'sop',
    'ovaio poliquistico',
    'sindrom ovario polikistico',
    'poliquistosis ovarica',
    'sindrome del ovaio poliquistico',
    'pcos',
  ];

  for (const variation of variations) {
    const canonical = findMatchingCondition(variation);
    assert.strictEqual(canonical, 'sindrome de ovario poliquistico',
      `Debe normalizar "${variation}" a SOP`);
  }
});

test('Reflujo maneja variaciones y sinónimos', () => {
  const variations = [
    'reflujo',
    'gerd',
    'acidez estomacal',
    'ardor de estomago',
    'gastritis',
    'pirosis',
  ];

  for (const variation of variations) {
    const canonical = findMatchingCondition(variation);
    assert.ok(canonical?.includes('reflujo'),
      `Debe encontrar reflujo para: ${variation}`);
  }
});

test('Intolerancias alimentarias', () => {
  const gluten = findMatchingCondition('gluten');
  assert.ok(gluten?.includes('gluten'));

  const lactosa = findMatchingCondition('lactosa');
  assert.ok(lactosa?.includes('lactosa'));
});

test('Cálculos renales con variantes', () => {
  const variations = [
    'calculos renales',
    'piedras en los riñones',
    'litiasis renal',
    'kidney stones',
    'nefrolitiasis',
  ];

  for (const variation of variations) {
    const canonical = findMatchingCondition(variation);
    assert.ok(canonical?.includes('calculos renales'),
      `Debe encontrar cálculos renales para: ${variation}`);
  }
});

test('Medicamentos antihipertensivos', () => {
  const meds = [
    { input: 'amlodipino', expected: 'amlodipino' },
    { input: 'losartan', expected: 'losartan' },
    { input: 'atenolol', expected: 'atenolol' },
    { input: 'enalapril', expected: 'enalapril' },
  ];

  for (const { input, expected } of meds) {
    const result = findMatchingMedication(input);
    assert.strictEqual(result, expected, `Debe encontrar ${expected}`);
  }
});

test('Insulina con tipos variados', () => {
  const variations = [
    'insulina',
    'nph',
    'glargina',
    'rapida',
    'aspart',
    'lispro',
  ];

  for (const variation of variations) {
    const result = findMatchingMedication(variation);
    assert.strictEqual(result, 'insulina', `Debe encontrar insulina para: ${variation}`);
  }
});

test('Embarazo y lactancia', () => {
  const variations = [
    'embarazo',
    'embarazada',
    'gestacion',
    'prenatal',
    'pregnancy',
  ];

  for (const variation of variations) {
    const result = findMatchingCondition(variation);
    assert.strictEqual(result, 'embarazo', `Debe encontrar embarazo para: ${variation}`);
  }
});

test('Síndrome metabólico', () => {
  const result = findMatchingCondition('sindrome metabolico');
  assert.strictEqual(result, 'sindrome metabolico');

  const result2 = findMatchingCondition('sindrom x');
  assert.strictEqual(result2, 'sindrome metabolico');
});

test('Anemia con tipos', () => {
  const variations = [
    'anemia',
    'deficiencia hierro',
    'ferritina baja',
    'hemoglobina baja',
  ];

  for (const variation of variations) {
    const result = findMatchingCondition(variation);
    assert.ok(result?.includes('anemia'), `Debe encontrar anemia para: ${variation}`);
  }
});

test('Empty y null inputs', () => {
  const emptyResult = parseMedicalConditions('');
  assert.strictEqual(emptyResult.matched.length, 0);
  assert.strictEqual(emptyResult.unmatched.length, 0);

  const nullResult = parseMedicalConditions('   ');
  assert.strictEqual(nullResult.matched.length, 0);
});
