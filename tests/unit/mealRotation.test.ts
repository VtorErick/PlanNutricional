import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectMealsForWeek,
  validateVariety,
  generateVarietySuggestions,
  improveVariety,
  type RotationConfig,
  type RotationResult,
} from '../../src/utils/mealRotation';
import type { CatalogMealItem } from '../../src/data/mealsDB';

// Catálogo de prueba con variedad de estilos
const testCatalog: CatalogMealItem[] = [
  // Desayunos
  { id: 'des_mex_01', momentos: ['desayuno'], nombre: 'Huevos rancheros', tags: ['mexicano'], super: ['huevo', 'salsa', 'tortilla'], cuisineStyles: ['Mexicana'], prepTimeMinutes: 15, difficulty: 'facil', macroEstimate: { calories: 350, protein: 18, carbs: 32, fat: 16 } },
  { id: 'des_mex_02', momentos: ['desayuno'], nombre: 'Chilaquiles', tags: ['mexicano'], super: ['tortilla', 'salsa', 'queso'], cuisineStyles: ['Mexicana'], prepTimeMinutes: 20, difficulty: 'media', macroEstimate: { calories: 400, protein: 15, carbs: 55, fat: 14 } },
  { id: 'des_ita_01', momentos: ['desayuno'], nombre: 'Frittata', tags: ['italiano'], super: ['huevo', 'espinaca', 'queso'], cuisineStyles: ['Italiana'], prepTimeMinutes: 25, difficulty: 'media', macroEstimate: { calories: 320, protein: 20, carbs: 8, fat: 22 } },
  { id: 'des_asi_01', momentos: ['desayuno'], nombre: 'Congee', tags: ['chino'], super: ['arroz', 'jengibre', 'pollo'], cuisineStyles: ['Asiática'], prepTimeMinutes: 40, difficulty: 'media', macroEstimate: { calories: 280, protein: 16, carbs: 42, fat: 5 } },
  { id: 'des_med_01', momentos: ['desayuno'], nombre: 'Shakshuka', tags: ['mediterraneo'], super: ['huevo', 'tomate', 'pimenton'], cuisineStyles: ['Mediterránea'], prepTimeMinutes: 30, difficulty: 'media', macroEstimate: { calories: 340, protein: 16, carbs: 28, fat: 18 } },

  // Colaciones
  { id: 'col_01', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Fruta', tags: ['fruta'], super: ['manzana'], cuisineStyles: ['Casera'], prepTimeMinutes: 5, difficulty: 'facil', macroEstimate: { calories: 80, protein: 0, carbs: 20, fat: 0 } },
  { id: 'col_02', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Yogurt', tags: ['lacteo'], super: ['yogurt', 'nueces'], cuisineStyles: ['Casera'], prepTimeMinutes: 5, difficulty: 'facil', macroEstimate: { calories: 150, protein: 12, carbs: 15, fat: 6 } },
  { id: 'col_03', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Hummus', tags: ['snack'], super: ['garbanzo', 'tahini'], cuisineStyles: ['Mediterránea'], prepTimeMinutes: 10, difficulty: 'facil', macroEstimate: { calories: 180, protein: 8, carbs: 20, fat: 8 } },

  // Comidas
  { id: 'com_mex_01', momentos: ['comida'], nombre: 'Pollo con mole', tags: ['mexicano'], super: ['pollo', 'mole', 'arroz'], cuisineStyles: ['Mexicana'], prepTimeMinutes: 50, difficulty: 'dificil', macroEstimate: { calories: 500, protein: 35, carbs: 45, fat: 20 } },
  { id: 'com_mex_02', momentos: ['comida'], nombre: 'Tacos al pastor', tags: ['mexicano'], super: ['cerdo', 'tortilla', 'piña'], cuisineStyles: ['Mexicana'], prepTimeMinutes: 45, difficulty: 'dificil', macroEstimate: { calories: 380, protein: 28, carbs: 42, fat: 12 } },
  { id: 'com_ita_01', momentos: ['comida'], nombre: 'Pasta al pesto', tags: ['italiano'], super: ['pasta', 'albahaca', 'queso'], cuisineStyles: ['Italiana'], prepTimeMinutes: 25, difficulty: 'media', macroEstimate: { calories: 450, protein: 18, carbs: 65, fat: 14 } },
  { id: 'com_asi_01', momentos: ['comida'], nombre: 'Teriyaki', tags: ['japones'], super: ['pollo', 'arroz', 'salsa teriyaki'], cuisineStyles: ['Asiática'], prepTimeMinutes: 30, difficulty: 'media', macroEstimate: { calories: 420, protein: 32, carbs: 48, fat: 10 } },
  { id: 'com_med_01', momentos: ['comida'], nombre: 'Moussaka', tags: ['griego'], super: ['berenjena', 'carne', 'queso'], cuisineStyles: ['Mediterránea'], prepTimeMinutes: 60, difficulty: 'dificil', macroEstimate: { calories: 380, protein: 26, carbs: 22, fat: 18 } },

  // Cenas
  { id: 'cen_01', momentos: ['cena'], nombre: 'Sopa de pollo', tags: ['sopa'], super: ['pollo', 'caldo', 'verduras'], cuisineStyles: ['Casera'], prepTimeMinutes: 30, difficulty: 'facil', macroEstimate: { calories: 220, protein: 24, carbs: 15, fat: 8 } },
  { id: 'cen_02', momentos: ['cena'], nombre: 'Ensalada', tags: ['ligero'], super: ['lechuga', 'tomate', 'pollo'], cuisineStyles: ['Mediterránea'], prepTimeMinutes: 15, difficulty: 'facil', macroEstimate: { calories: 200, protein: 22, carbs: 10, fat: 8 } },
  { id: 'cen_03', momentos: ['cena'], nombre: 'Pescado', tags: ['mariscos'], super: ['pescado', 'limon', 'espinacas'], cuisineStyles: ['Mediterránea'], prepTimeMinutes: 20, difficulty: 'media', macroEstimate: { calories: 280, protein: 32, carbs: 5, fat: 14 } },
];

const defaultObjectives: Record<string, Record<string, number>> = {
  desayuno: { proteina: 2, cereales: 2, frutas: 1, grasas: 1 },
  colacion_am: { frutas: 1, lacteos: 1 },
  comida: { proteina: 3, cereales: 3, verduras: 2, grasas: 1 },
  colacion_pm: { proteina: 1, frutas: 1 },
  cena: { proteina: 3, verduras: 2, grasas: 1 },
};

test('selectMealsForWeek genera plan completo de 7 días', () => {
  const config: RotationConfig = {
    availableMeals: testCatalog,
    objectives: defaultObjectives,
    history: [],
    varietyWindow: 14,
    targetProfile: 'el',
  };

  const result = selectMealsForWeek(config);

  // Debe tener 5 momentos
  assert.ok(result.selected.desayuno, 'Debe tener desayunos');
  assert.ok(result.selected.comida, 'Debe tener comidas');
  assert.ok(result.selected.cena, 'Debe tener cenas');

  // Cada momento debe tener 7 comidas (una por día)
  assert.strictEqual(result.selected.desayuno.length, 7, 'Debe tener 7 desayunos');
  assert.strictEqual(result.selected.comida.length, 7, 'Debe tener 7 comidas');
  assert.strictEqual(result.selected.cena.length, 7, 'Debe tener 7 cenas');
  assert.strictEqual(result.selected.colacion_am.length, 7, 'Debe tener 7 colaciones AM');
  assert.strictEqual(result.selected.colacion_pm.length, 7, 'Debe tener 7 colaciones PM');
});

test('selectMealsForWeek evita repetir comidas del historial', () => {
  const config: RotationConfig = {
    availableMeals: testCatalog,
    objectives: defaultObjectives,
    history: ['des_mex_01', 'des_mex_02'], // Estos desayunos están en historial
    varietyWindow: 14,
    targetProfile: 'el',
  };

  const result = selectMealsForWeek(config);

  // Los desayunos seleccionados no deben ser los del historial (si hay alternativas)
  const selectedDesayunos = result.selected.desayuno;
  assert.ok(!selectedDesayunos.includes('des_mex_01'), 'No debe repetir des_mex_01');
  assert.ok(!selectedDesayunos.includes('des_mex_02'), 'No debe repetir des_mex_02');
});

test('selectMealsForWeek alterna estilos de cocina', () => {
  const config: RotationConfig = {
    availableMeals: testCatalog,
    objectives: defaultObjectives,
    history: [],
    varietyWindow: 14,
    targetProfile: 'el',
  };

  const result = selectMealsForWeek(config);

  // Debe haber variedad de estilos
  const desayunos = result.selected.desayuno.map(id =>
    testCatalog.find(m => m.id === id)
  ).filter(Boolean);

  const styles = new Set(desayunos.flatMap(m => m?.cuisineStyles || []));
  assert.ok(styles.size >= 2, 'Debe haber al menos 2 estilos de cocina en desayunos');
});

test('selectMealsForWeek calcula métricas de variedad', () => {
  const config: RotationConfig = {
    availableMeals: testCatalog,
    objectives: defaultObjectives,
    history: [],
    varietyWindow: 14,
    targetProfile: 'el',
  };

  const result = selectMealsForWeek(config);

  assert.ok(result.variety.uniqueCount > 0, 'Debe tener comidas únicas');
  assert.ok(result.variety.uniqueCount <= 35, 'No puede tener más de 35 comidas únicas');
  assert.ok(typeof result.variety.styleDistribution === 'object', 'Debe tener distribución de estilos');
  assert.ok(typeof result.coverage === 'object', 'Debe tener cobertura de objetivos');
});

test('validateVariety detecta planes con variedad insuficiente', () => {
  const lowVarietyResult: RotationResult = {
    selected: {
      desayuno: Array(7).fill('same_id'),
      colacion_am: Array(7).fill('col_01'),
      comida: Array(7).fill('com_mex_01'),
      colacion_pm: Array(7).fill('col_02'),
      cena: Array(7).fill('cen_01'),
    },
    coverage: {
      desayuno: 40,
      colacion_am: 80,
      comida: 30,
      colacion_pm: 80,
      cena: 90,
    },
    variety: {
      uniqueCount: 5,
      styleDistribution: {},
      historyOverlap: 10,
    },
    warnings: [],
  };

  const validation = validateVariety(lowVarietyResult);

  assert.ok(!validation.isValid, 'Debe detectar variedad insuficiente');
  assert.ok(validation.issues.length > 0, 'Debe reportar issues');
});

test('validateVariety acepta planes con buena variedad', () => {
  const goodResult: RotationResult = {
    selected: {
      desayuno: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'],
      colacion_am: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
      comida: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'],
      colacion_pm: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
      cena: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'],
    },
    coverage: {
      desayuno: 80,
      colacion_am: 85,
      comida: 75,
      colacion_pm: 80,
      cena: 90,
    },
    variety: {
      uniqueCount: 30,
      styleDistribution: { Mexicana: 10, Italiana: 8, Asiática: 6, Mediterránea: 6 },
      historyOverlap: 2,
    },
    warnings: [],
  };

  const validation = validateVariety(goodResult);

  assert.ok(validation.isValid, 'Debe aceptar plan con buena variedad');
  assert.strictEqual(validation.issues.length, 0, 'No debe tener issues');
});

test('generateVarietySuggestions genera sugerencias útiles', () => {
  const result: RotationResult = {
    selected: {
      desayuno: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'],
      colacion_am: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
      comida: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'],
      colacion_pm: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
      cena: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'],
    },
    coverage: { desayuno: 70, colacion_am: 80, comida: 60, colacion_pm: 75, cena: 85 },
    variety: {
      uniqueCount: 20,
      styleDistribution: { Mexicana: 15, Italiana: 2 }, // Desbalanceado
      historyOverlap: 3,
    },
    warnings: [],
  };

  const suggestions = generateVarietySuggestions(result, testCatalog);

  assert.ok(suggestions.length > 0, 'Debe generar sugerencias');
  assert.ok(suggestions.some(s => s.toLowerCase().includes('italiana')), 'Debe sugerir más variedad italiana');
});

test('improveVariety genera un nuevo plan con mejor variedad', () => {
  const config: RotationConfig = {
    availableMeals: testCatalog,
    objectives: defaultObjectives,
    history: [],
    varietyWindow: 14,
    targetProfile: 'el',
  };

  // Generar plan inicial
  const firstPlan = selectMealsForWeek(config);

  // Mejorar variedad
  const improvedPlan = improveVariety(firstPlan, testCatalog, config);

  // El plan mejorado debe tener el primer plan en su historial
  assert.ok(improvedPlan.variety.historyOverlap >= firstPlan.variety.uniqueCount,
    'El plan mejorado debe considerar el plan anterior como historial');
});

test('selectMealsForWeek maneja historial vacío', () => {
  const config: RotationConfig = {
    availableMeals: testCatalog,
    objectives: defaultObjectives,
    history: [],
    varietyWindow: 14,
    targetProfile: 'el',
  };

  const result = selectMealsForWeek(config);

  assert.strictEqual(result.variety.historyOverlap, 0, 'No debe haber overlap con historial vacío');
});

test('selectMealsForWeek genera warnings cuando es necesario', () => {
  // Catálogo muy pequeño - solo 1 comida para desayuno
  const tinyCatalog: CatalogMealItem[] = [
    { id: 'only_desayuno', momentos: ['desayuno'], nombre: 'Unico desayuno', tags: [], super: ['huevo'], cuisineStyles: ['Casera'], prepTimeMinutes: 10, difficulty: 'facil', macroEstimate: { calories: 300, protein: 15, carbs: 20, fat: 10 } },
    { id: 'only_comida', momentos: ['comida'], nombre: 'Unica comida', tags: [], super: ['pollo'], cuisineStyles: ['Casera'], prepTimeMinutes: 30, difficulty: 'media', macroEstimate: { calories: 400, protein: 30, carbs: 40, fat: 12 } },
  ];

  const config: RotationConfig = {
    availableMeals: tinyCatalog,
    objectives: defaultObjectives,
    history: [],
    varietyWindow: 14,
    targetProfile: 'el',
  };

  const result = selectMealsForWeek(config);

  // Con catálogo tan pequeño (faltan colaciones, cenas), debe haber warnings
  assert.ok(result.warnings.length > 0, 'Debe generar warnings con catálogo incompleto');
});
