import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWHtR,
  calculateWHR,
  estimateBodyFatNavy,
  getMacroStrategyByBodyComposition,
  adjustPortionsByBodyComposition,
  calculateCalorieTargetByComposition,
  generateBodyCompositionReport,
  type BodyMeasurements,
} from '../../src/utils/bodyCompositionAdjustments';

// Medidas de prueba - persona con composición saludable
const healthyMeasurements: BodyMeasurements = {
  waistCm: 80,
  hipCm: 95,
  heightCm: 170,
  weightKg: 70,
  neckCm: 38,
};

// Medidas de prueba - persona con grasa abdominal (WHtR alto)
const highRiskMeasurements: BodyMeasurements = {
  waistCm: 105,
  hipCm: 110,
  heightCm: 170,
  weightKg: 85,
  neckCm: 42,
};

// Medidas de prueba - riesgo moderado
const moderateRiskMeasurements: BodyMeasurements = {
  waistCm: 90,
  hipCm: 100,
  heightCm: 170,
  weightKg: 75,
  neckCm: 40,
};

test('calculateWHtR calcula ratio correctamente', () => {
  const whtr = calculateWHtR(85, 170);
  assert.strictEqual(whtr, 0.5, 'WHtR de 85cm/170cm debe ser 0.5');

  const whtr2 = calculateWHtR(100, 170);
  assert.strictEqual(whtr2, 0.588, 'WHtR debe redondear a 3 decimales');
});

test('calculateWHR calcula relación cintura-cadera', () => {
  const whr = calculateWHR(80, 95);
  assert.strictEqual(whr, 0.842, 'WHR de 80/95 debe ser ~0.842');

  const whr2 = calculateWHR(90, 100);
  assert.strictEqual(whr2, 0.9, 'WHR de 90/100 debe ser 0.9');
});

test('estimateBodyFatNavy estima grasa corporal para hombres', () => {
  const maleMeasurements: BodyMeasurements = {
    waistCm: 85,
    neckCm: 38,
    heightCm: 175,
    weightKg: 75,
    hipCm: 95,
  };

  const bodyFat = estimateBodyFatNavy(maleMeasurements, true);
  assert.ok(bodyFat !== null, 'Debe retornar valor para hombre');
  assert.ok(bodyFat! > 5 && bodyFat! < 35, 'Grasa corporal debe ser razonable (5-35%)');
});

test('estimateBodyFatNavy estima grasa corporal para mujeres', () => {
  const femaleMeasurements: BodyMeasurements = {
    waistCm: 75,
    hipCm: 100,
    neckCm: 32,
    heightCm: 165,
    weightKg: 60,
  };

  const bodyFat = estimateBodyFatNavy(femaleMeasurements, false);
  assert.ok(bodyFat !== null, 'Debe retornar valor para mujer');
  assert.ok(bodyFat! > 15 && bodyFat! < 40, 'Grasa corporal femenina debe ser razonable (15-40%)');
});

test('estimateBodyFatNavy retorna null sin medidas necesarias', () => {
  const incompleteMeasurements: BodyMeasurements = {
    waistCm: 80,
    hipCm: 95,
    heightCm: 170,
    weightKg: 70,
    // neckCm intencionalmente omitido
  };

  const bodyFat = estimateBodyFatNavy(incompleteMeasurements, true);
  assert.strictEqual(bodyFat, null, 'Debe retornar null sin medidas de cuello');
});

test('getMacroStrategyByBodyComposition retorna estrategia balanceada para WHtR óptimo', () => {
  const strategy = getMacroStrategyByBodyComposition(healthyMeasurements, true);

  assert.strictEqual(strategy.name, 'balanceada');
  assert.strictEqual(strategy.carbPercentage, 40);
  assert.strictEqual(strategy.proteinPercentage, 30);
  assert.strictEqual(strategy.fatPercentage, 30);
});

test('getMacroStrategyByBodyComposition retorna estrategia bajo carb para WHtR alto', () => {
  const strategy = getMacroStrategyByBodyComposition(highRiskMeasurements, true);

  assert.strictEqual(strategy.name, 'bajo_carb_estricto');
  assert.ok(strategy.carbPercentage < 30, 'Carbohidratos deben ser <30%');
  assert.ok(strategy.proteinPercentage > 40, 'Proteína debe ser >40%');
});

test('getMacroStrategyByBodyComposition detecta forma androide', () => {
  // WHR alto indica distribución androide (grasa abdominal)
  const appleShape: BodyMeasurements = {
    waistCm: 95,
    hipCm: 100,
    heightCm: 170,
    weightKg: 80,
    neckCm: 40,
  };

  const strategy = getMacroStrategyByBodyComposition(appleShape, true);
  assert.ok(strategy.name.includes('bajo_carb'), 'Debe sugerir bajo carb para forma androide');
});

test('adjustPortionsByBodyComposition ajusta porciones SMAE', () => {
  const basePortions = {
    verduras: 3,
    frutas: 3,
    lacteos: 2,
    cereales: 4,
    proteina: 4,
    grasas: 3,
    leguminosas: 1,
  };

  const result = adjustPortionsByBodyComposition(
    basePortions,
    highRiskMeasurements,
    true,
    ['perder grasa']
  );

  assert.ok(result.adjusted.cereales < basePortions.cereales, 'Debe reducir cereales');
  assert.ok(result.adjusted.proteina > basePortions.proteina, 'Debe aumentar proteína');
  assert.ok(result.reasoning.length > 0, 'Debe incluir razonamiento');
  assert.ok(result.strategy.name.includes('bajo_carb'), 'Debe usar estrategia bajo carb');
});

test('adjustPortionsByBodyComposition mantiene porciones para WHtR óptimo', () => {
  const basePortions = {
    verduras: 3,
    frutas: 3,
    lacteos: 2,
    cereales: 4,
    proteina: 4,
    grasas: 3,
    leguminosas: 1,
  };

  const result = adjustPortionsByBodyComposition(
    basePortions,
    healthyMeasurements,
    true,
    ['mantener']
  );

  // Para composición óptima, cambios deben ser mínimos
  assert.ok(Math.abs(result.adjusted.cereales - basePortions.cereales) <= 1, 'Cambios en cereales deben ser mínimos');
  assert.strictEqual(result.strategy.name, 'balanceada');
});

test('adjustPortionsByBodyComposition ajusta para ganancia muscular', () => {
  const basePortions = {
    verduras: 3,
    frutas: 3,
    cereales: 4,
    proteina: 4,
    grasas: 3,
  };

  const result = adjustPortionsByBodyComposition(
    basePortions,
    healthyMeasurements,
    true,
    ['ganar masa muscular']
  );

  assert.ok(result.adjusted.proteina >= basePortions.proteina, 'Debe mantener o aumentar proteína');
});

test('calculateCalorieTargetByComposition calcula rango apropiado', () => {
  const target = calculateCalorieTargetByComposition(
    healthyMeasurements,
    true,
    'moderado',
    ['mantener peso']
  );

  assert.ok(target.min > 0, 'Mínimo debe ser positivo');
  assert.ok(target.max > target.min, 'Máximo debe ser mayor que mínimo');
  assert.ok(target.reasoning.length > 0, 'Debe incluir razonamiento');
});

test('calculateCalorieTargetByComposition ajusta para pérdida de grasa', () => {
  const target = calculateCalorieTargetByComposition(
    moderateRiskMeasurements,
    true,
    'moderado',
    ['perder grasa']
  );

  // Para pérdida de grasa con WHtR moderado, debe haber déficit
  assert.ok(target.reasoning.some(r => r.includes('Déficit')), 'Debe mencionar déficit');
});

test('calculateCalorieTargetByComposition respeta mínimos de seguridad', () => {
  const target = calculateCalorieTargetByComposition(
    healthyMeasurements,
    false, // Mujer
    'ligero',
    ['perder grasa']
  );

  // Mínimo seguro para mujeres: 1200 kcal
  assert.ok(target.min >= 1200, 'Mínimo para mujer debe ser >= 1200 kcal');
});

test('generateBodyCompositionReport genera reporte completo', () => {
  const report = generateBodyCompositionReport(
    moderateRiskMeasurements,
    true,
    ['perder grasa']
  );

  assert.ok(report.whtr > 0, 'Debe incluir WHtR');
  assert.ok(report.whtrStatus, 'Debe incluir status de WHtR');
  assert.ok(report.whr > 0, 'Debe incluir WHR');
  assert.ok(report.whrStatus, 'Debe incluir status de WHR');
  assert.ok(report.estimatedBodyFat !== undefined, 'Debe incluir grasa estimada');
  assert.ok(report.strategy, 'Debe incluir estrategia');
  assert.ok(report.recommendations.length > 0, 'Debe incluir recomendaciones');
});

test('generateBodyCompositionReport detecta riesgo alto', () => {
  const report = generateBodyCompositionReport(
    highRiskMeasurements,
    true,
    ['perder grasa']
  );

  assert.strictEqual(report.whtrStatus, 'Alto riesgo');
  assert.ok(report.recommendations.some(r => r.includes('fuerza')), 'Debe recomendar ejercicio');
});

test('generateBodyCompositionReport detecta composición óptima', () => {
  const report = generateBodyCompositionReport(
    healthyMeasurements,
    true,
    ['mantener']
  );

  assert.strictEqual(report.whtrStatus, 'Óptimo');
  assert.strictEqual(report.strategy.name, 'balanceada');
});
