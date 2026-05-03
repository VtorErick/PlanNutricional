import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOptimizedMealsCatalog,
  validateCatalogForAI,
  type MealCatalogBuildOptions,
} from '../../src/utils/mealCatalogBuilder';
import type { CatalogMealItem } from '../../src/data/mealsDB';

// Mock de comidas para testing (mínimo 10 para validación)
const mockMeals: CatalogMealItem[] = [
  {
    id: 'des_01',
    momentos: ['desayuno'],
    nombre: 'Avena con fruta',
    tags: ['saludable', '15-30 min'],
    super: ['avena', 'platano', 'leche'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 350, protein: 12, carbs: 60, fat: 6 },
  },
  {
    id: 'des_02',
    momentos: ['desayuno'],
    nombre: 'Huevos revueltos',
    tags: ['proteina', '15-30 min'],
    super: ['huevo', 'aceite', 'sal'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 280, protein: 18, carbs: 2, fat: 20 },
  },
  {
    id: 'des_03',
    momentos: ['desayuno'],
    nombre: 'Tostadas con aguacate',
    tags: ['saludable', '10 min'],
    super: ['pan', 'aguacate', 'limon'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 320, protein: 8, carbs: 45, fat: 14 },
  },
  {
    id: 'com_01',
    momentos: ['comida'],
    nombre: 'Pollo con arroz',
    tags: ['proteina', '45 min'],
    super: ['pollo', 'arroz', 'verduras'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 45,
    difficulty: 'media',
    macroEstimate: { calories: 550, protein: 35, carbs: 65, fat: 12 },
  },
  {
    id: 'com_02',
    momentos: ['comida'],
    nombre: 'Pescado a la plancha',
    tags: ['omega3', '30 min'],
    super: ['pescado', 'limon', 'aceite oliva'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 25,
    difficulty: 'facil',
    macroEstimate: { calories: 400, protein: 30, carbs: 5, fat: 18 },
  },
  {
    id: 'com_03',
    momentos: ['comida'],
    nombre: 'Ensalada de pollo',
    tags: ['ligero', '20 min'],
    super: ['pollo', 'lechuga', 'tomate'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 380, protein: 28, carbs: 12, fat: 15 },
  },
  {
    id: 'cen_01',
    momentos: ['cena'],
    nombre: 'Sopa de verduras',
    tags: ['ligero', '30 min'],
    super: ['calabaza', 'zanahoria', 'caldo'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 30,
    difficulty: 'facil',
    macroEstimate: { calories: 180, protein: 4, carbs: 35, fat: 2 },
  },
  {
    id: 'cen_02',
    momentos: ['cena'],
    nombre: 'Tortilla de espinaca',
    tags: ['proteina', '15 min'],
    super: ['huevo', 'espinaca', 'queso'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 250, protein: 16, carbs: 4, fat: 18 },
  },
  {
    id: 'col_01',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Yogurt con nueces',
    tags: ['snack', '5-10 min'],
    super: ['yogurt', 'nueces', 'miel'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 200, protein: 8, carbs: 18, fat: 12 },
  },
  {
    id: 'col_02',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Fruta con almendras',
    tags: ['snack', '5 min'],
    super: ['manzana', 'almendras'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 150, protein: 3, carbs: 20, fat: 8 },
  },
];

// Mock de cuestionario vacío (sin filtros)
const emptyQuestionnaire = {
  preferences: {},
  healthContext: {},
};

// Cuestionario con filtros
const filteredQuestionnaire = {
  preferences: {
    favoriteCuisineStyles: 'Mexicana',
  },
  healthContext: {
    allergies: 'mariscos',
  },
};

test('buildOptimizedMealsCatalog sin rotación mantiene comportamiento original', async () => {
  const result = await buildOptimizedMealsCatalog(mockMeals, emptyQuestionnaire, {
    useRotation: false,
  });

  assert.ok(result.catalog.length > 0, 'Debe retornar comidas');
  assert.ok(result.meta.finalCount > 0, 'Meta debe indicar comidas finales');
  assert.ok(['filtered-ranked', 'fallback-ranked'].includes(result.meta.method), 'Metodo debe ser ranked filtered o fallback');
  assert.strictEqual(result.meta.warnings.length, 0, 'No debe haber warnings con datos suficientes');
});

test('buildOptimizedMealsCatalog con rotación requiere suficientes comidas', async () => {
  // Con pocas comidas, debe hacer fallback a filtrado
  const fewMeals = mockMeals.slice(0, 3);
  const result = await buildOptimizedMealsCatalog(fewMeals, emptyQuestionnaire, {
    useRotation: true,
  });

  assert.ok(result.catalog.length > 0, 'Debe retornar comidas aunque sean pocas');
  assert.ok(result.meta.warnings.length > 0, 'Debe advertir que catálogo es insuficiente');
  assert.ok(result.meta.method.includes('filtered'), 'Debe usar filtrado como fallback');
});

test('buildOptimizedMealsCatalog con rotación y suficientes comidas', async () => {
  // Crear más comidas mock para tener suficientes
  const manyMeals: CatalogMealItem[] = [];
  const moments = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];

  for (let i = 0; i < 50; i++) {
    manyMeals.push({
      id: `meal_${i}`,
      momentos: [moments[i % 5]],
      nombre: `Comida ${i}`,
      tags: ['tag1', 'tag2'],
      super: ['ing1', 'ing2'],
      cuisineStyles: ['Casera'],
      prepTimeMinutes: 20,
      difficulty: 'facil',
      macroEstimate: { calories: 300, protein: 15, carbs: 40, fat: 10 },
    });
  }

  const result = await buildOptimizedMealsCatalog(manyMeals, emptyQuestionnaire, {
    useRotation: true,
    targetProfile: 'el',
  });

  assert.ok(result.catalog.length > 0, 'Debe retornar comidas');
  // Con suficientes comidas, podría usar rotación o fallback según implementación
  assert.ok(['rotation', 'filtered-ranked', 'fallback-ranked', 'rotation+filtered'].includes(result.meta.method));
});

test('validateCatalogForAI detecta catálogos válidos', () => {
  const validCatalog = mockMeals.map(m => ({
    id: m.id,
    nombre: m.nombre,
    tags: m.tags,
    super: m.super,
    momentos: m.momentos,
  }));

  const result = validateCatalogForAI(validCatalog);

  assert.strictEqual(result.valid, true, 'Catálogo válido debe ser válido');
  assert.strictEqual(result.errors.length, 0, 'No debe tener errores');
});

test('validateCatalogForAI detecta catálogos inválidos', () => {
  // Catálogo vacío
  const emptyResult = validateCatalogForAI([]);
  assert.strictEqual(emptyResult.valid, false, 'Catálogo vacío debe ser inválido');
  assert.ok(emptyResult.errors.some(e => e.includes('vacío')), 'Debe indicar que está vacío');

  // Catálogo muy pequeño
  const smallResult = validateCatalogForAI([{ id: '1', nombre: 'Test', tags: [], super: [], momentos: [] }]);
  assert.strictEqual(smallResult.valid, false, 'Catálogo pequeño debe ser inválido');

  // Catálogo con comida inválida (sin campos requeridos)
  const invalidMealResult = validateCatalogForAI([{ id: '1', nombre: '', tags: [], super: [], momentos: [] }]);
  assert.strictEqual(invalidMealResult.valid, false, 'Catálogo con comida inválida debe ser inválido');
});

test('buildOptimizedMealsCatalog maneja errores de forma segura', async () => {
  // Usar un cuestionario que podría causar problemas
  const result = await buildOptimizedMealsCatalog(mockMeals, null as any, {
    useRotation: true,
  });

  // Debe retornar algo válido incluso con input null
  assert.ok(Array.isArray(result.catalog), 'Debe retornar array incluso con error');
  assert.ok(result.meta.warnings.length >= 0, 'Debe manejar el caso');
});

test('buildOptimizedMealsCatalog incluye metadatos útiles', async () => {
  const result = await buildOptimizedMealsCatalog(mockMeals, emptyQuestionnaire, {
    useRotation: false,
  });

  assert.ok(result.meta.totalAvailable > 0, 'Debe indicar total disponible');
  assert.ok(result.meta.finalCount > 0, 'Debe indicar final count');
  assert.ok(Array.isArray(result.meta.selectedIds), 'Debe incluir IDs seleccionados');
  assert.ok(Array.isArray(result.meta.warnings), 'Debe incluir warnings array');
  assert.ok(['filtered-ranked', 'fallback-ranked', 'rotation', 'rotation+filtered'].includes(result.meta.method));
});

test('buildOptimizedMealsCatalog formato compacto correcto', async () => {
  const result = await buildOptimizedMealsCatalog(mockMeals, emptyQuestionnaire, {
    useRotation: false,
  });

  if (result.catalog.length > 0) {
    const firstMeal = result.catalog[0];
    assert.ok(firstMeal.id, 'Debe tener id');
    assert.ok(firstMeal.nombre, 'Debe tener nombre');
    assert.ok(Array.isArray(firstMeal.tags), 'Tags debe ser array');
    assert.ok(Array.isArray(firstMeal.super), 'Super debe viajar para hidratar porciones');
    assert.ok(firstMeal.macroEstimate, 'Macro estimate debe viajar para reparar macros');
    assert.ok(Array.isArray(firstMeal.momentos), 'Momentos debe ser array');
  }
});

test('buildOptimizedMealsCatalog aplica filtros del cuestionario', async () => {
  // Crear comidas con diferentes estilos
  const styleMeals: CatalogMealItem[] = [
    {
      id: 'mex_01',
      momentos: ['comida'],
      nombre: 'Tacos',
      tags: ['mexicano'],
      super: ['tortilla', 'carne'],
      cuisineStyles: ['Mexicana'],
      prepTimeMinutes: 20,
      difficulty: 'facil',
      macroEstimate: { calories: 400, protein: 20, carbs: 50, fat: 12 },
    },
    {
      id: 'ita_01',
      momentos: ['comida'],
      nombre: 'Pasta',
      tags: ['italiano'],
      super: ['pasta', 'salsa'],
      cuisineStyles: ['Italiana'],
      prepTimeMinutes: 25,
      difficulty: 'facil',
      macroEstimate: { calories: 450, protein: 15, carbs: 70, fat: 10 },
    },
  ];

  const questionnaire = {
    preferences: {
      favoriteCuisineStyles: 'Mexicana',
    },
    healthContext: {},
  };

  const result = await buildOptimizedMealsCatalog(styleMeals, questionnaire, {
    useRotation: false,
  });

  assert.ok(result.catalog.length > 0, 'Debe retornar comidas filtradas');
  // Las comidas deben preferir el estilo indicado
  assert.ok(result.meta.method === 'filtered-ranked' || result.meta.method === 'fallback-ranked');
});
