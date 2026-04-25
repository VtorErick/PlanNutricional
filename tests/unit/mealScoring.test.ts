import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreMeal,
  filterMealsForUser,
  getRankedMealsForUser,
  getMealsByCuisineStyle,
  buildConfigFromQuestionnaire,
  getFilterStats,
  type MealScoreConfig,
} from '../../src/utils/mealScoring';
import type { CatalogMealItem } from '../../src/data/mealsDB';

// Datos de prueba
const testMeals: CatalogMealItem[] = [
  {
    id: 'test_01',
    momentos: ['desayuno'],
    nombre: 'Huevos revueltos con espinaca',
    tags: ['mexicano', 'proteina', 'rapido'],
    super: ['huevo', 'espinaca', 'aceite de oliva'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 220, protein: 16, carbs: 4, fat: 14 },
    medicalContraindications: ['cálculos renales'],
  },
  {
    id: 'test_02',
    momentos: ['comida'],
    nombre: 'Pollo a la parmesana',
    tags: ['italiano', 'proteina', 'horneado'],
    super: ['pollo', 'queso mozzarella', 'pan molido', 'salsa de tomate'],
    cuisineStyles: ['Italiana'],
    prepTimeMinutes: 40,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 42, carbs: 22, fat: 14 },
  },
  {
    id: 'test_03',
    momentos: ['cena'],
    nombre: 'Sopa de miso con tofu',
    tags: ['japones', 'vegano', 'sopa'],
    super: ['tofu', 'pasta de miso', 'alga wakame', 'cebolla verde'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 120, protein: 10, carbs: 8, fat: 5 },
    medicalContraindications: ['hipertensión'],
  },
  {
    id: 'test_04',
    momentos: ['desayuno'],
    nombre: 'Hotcakes de avena',
    tags: ['dulce', 'carbohidratos', 'desayuno'],
    super: ['avena', 'huevo', 'leche', 'plátano'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 20,
    difficulty: 'media',
    macroEstimate: { calories: 350, protein: 12, carbs: 55, fat: 8 },
  },
  {
    id: 'test_05',
    momentos: ['colacion_am'],
    nombre: 'Yogurt con frutos rojos',
    tags: ['probioticos', 'dulce', 'fresco'],
    super: ['yogurt griego', 'fresas', 'arándanos', 'miel'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 180, protein: 15, carbs: 22, fat: 4 },
  },
];

const defaultConfig: MealScoreConfig = {
  favoriteFoods: [],
  favoriteCuisineStyles: [],
  dislikedFoods: [],
  allergies: [],
  intolerances: [],
  medicalConditions: [],
  cookingTimeMax: 0,
  objective: 'salud',
  isVegetarian: false,
  isVegan: false,
};

test('scoreMeal puntúa comidas según estilos de cocina favoritos', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    favoriteCuisineStyles: ['Mexicana'],
  };

  const mexicanMeal = testMeals[0]; // Huevos revueltos - Mexicana
  const italianMeal = testMeals[1]; // Pollo parmesana - Italiana

  const mexicanScore = scoreMeal(mexicanMeal, config);
  const italianScore = scoreMeal(italianMeal, config);

  assert.ok(mexicanScore > italianScore, 'Comida mexicana debe tener mayor puntaje');
  assert.ok(mexicanScore >= 10, 'Debe tener al menos +10 por coincidir con estilo favorito');
});

test('buildConfigFromQuestionnaire combina senales anidadas del flujo ambos', () => {
  const config = buildConfigFromQuestionnaire({
    el: {
      preferences: {
        favoriteFoods: 'pollo, aguacate',
        favoriteCuisineStyles: 'Mexicana',
        cookingTime: '20',
      },
      profileContext: {
        objectives: ['Ganar masa muscular'],
      },
    },
    ella: {
      preferences: {
        favoriteFoods: 'salmon',
        dislikedFoods: 'cottage',
        cookingTime: '15',
      },
      healthContext: {
        diagnostics: 'resistencia a la insulina',
        intolerances: 'lactosa',
      },
    },
  });

  assert.deepStrictEqual(config.favoriteFoods, ['pollo', 'aguacate', 'salmon']);
  assert.deepStrictEqual(config.favoriteCuisineStyles, ['Mexicana']);
  assert.deepStrictEqual(config.dislikedFoods, ['cottage']);
  assert.deepStrictEqual(config.intolerances, ['lactosa']);
  assert.ok(config.medicalConditions.length > 0);
  assert.strictEqual(config.cookingTimeMax, 15);
  assert.strictEqual(config.objective, 'ganar');
});

test('scoreMeal penaliza opciones dulces en contexto de glucosa', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    medicalConditions: ['resistencia a la insulina'],
  };

  const sweetScore = scoreMeal(testMeals[4], config);
  const proteinScore = scoreMeal(testMeals[0], config);

  assert.ok(proteinScore > sweetScore, 'Debe preferir opcion proteica sobre dulce con riesgo de glucosa');
});

test('scoreMeal puntúa comidas según alimentos favoritos', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    favoriteFoods: ['pollo', 'espinaca'],
  };

  const chickenMeal = testMeals[1]; // Pollo a la parmesana
  const spinachMeal = testMeals[0]; // Huevos con espinaca
  const otherMeal = testMeals[3]; // Hotcakes

  const chickenScore = scoreMeal(chickenMeal, config);
  const spinachScore = scoreMeal(spinachMeal, config);
  const otherScore = scoreMeal(otherMeal, config);

  assert.ok(chickenScore > otherScore, 'Comida con pollo debe tener mayor puntaje');
  assert.ok(spinachScore > otherScore, 'Comida con espinaca debe tener mayor puntaje');
});

test('scoreMeal penaliza alimentos no deseados', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    dislikedFoods: ['pollo'],
  };

  const chickenMeal = testMeals[1]; // Pollo a la parmesana
  const otherMeal = testMeals[0]; // Huevos con espinaca

  const chickenScore = scoreMeal(chickenMeal, config);
  const otherScore = scoreMeal(otherMeal, config);

  assert.ok(chickenScore < otherScore, 'Comida con pollo debe tener menor puntaje cuando es no deseado');
  assert.ok(chickenScore < 0, 'Debe tener penalización significativa');
});

test('scoreMeal favorece comidas según objetivo nutricional', () => {
  const lossConfig: MealScoreConfig = { ...defaultConfig, objective: 'perder' };
  const gainConfig: MealScoreConfig = { ...defaultConfig, objective: 'ganar' };

  const highProteinMeal = testMeals[1]; // Pollo parmesana - alta proteína
  const highCarbMeal = testMeals[3]; // Hotcakes - alta en carbs

  const lossScore = scoreMeal(highProteinMeal, lossConfig);
  const gainScore = scoreMeal(highProteinMeal, gainConfig);

  // Para perder peso, comidas altas en proteína y bajas en carbs deben tener bonus
  assert.ok(lossScore > 0, 'Comida alta en proteína debe tener puntaje positivo para pérdida');
});

test('filterMealsForUser excluye por condiciones médicas', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    medicalConditions: ['cálculos renales'],
  };

  const filtered = filterMealsForUser(testMeals, config);
  const ids = filtered.map(m => m.id);

  assert.ok(!ids.includes('test_01'), 'Debe excluir comida con contraindicación de cálculos renales');
  assert.ok(ids.includes('test_02'), 'Debe incluir comida sin contraindicaciones');
});

test('filterMealsForUser excluye por alergias', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    allergies: ['huevo'],
  };

  const filtered = filterMealsForUser(testMeals, config);
  const ids = filtered.map(m => m.id);

  assert.ok(!ids.includes('test_01'), 'Debe excluir comida con huevo');
  assert.ok(!ids.includes('test_04'), 'Debe excluir hotcakes con huevo');
  assert.ok(ids.includes('test_02'), 'Debe incluir pollo parmesana sin huevo');
});

test('filterMealsForUser excluye por tiempo de preparación', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    cookingTimeMax: 15,
  };

  const filtered = filterMealsForUser(testMeals, config);
  const ids = filtered.map(m => m.id);

  assert.ok(ids.includes('test_01'), 'Debe incluir comida de 10 min');
  assert.ok(ids.includes('test_03'), 'Debe incluir comida de 15 min');
  assert.ok(!ids.includes('test_02'), 'Debe excluir comida de 40 min');
});

test('filterMealsForUser excluye por dificultad', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    difficultyMax: 'facil',
  };

  const filtered = filterMealsForUser(testMeals, config);
  const ids = filtered.map(m => m.id);

  assert.ok(ids.includes('test_01'), 'Debe incluir comida fácil');
  assert.ok(!ids.includes('test_02'), 'Debe excluir comida de dificultad media');
});

test('filterMealsForUser filtra por dieta vegetariana', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    isVegetarian: true,
  };

  const filtered = filterMealsForUser(testMeals, config);
  const ids = filtered.map(m => m.id);

  assert.ok(!ids.includes('test_01'), 'Debe excluir comida con huevo si es estricto');
  assert.ok(ids.includes('test_03'), 'Debe incluir comida vegetariana etiquetada');
});

test('getRankedMealsForUser retorna comidas ordenadas por puntaje', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    favoriteCuisineStyles: ['Mexicana'],
    cookingTimeMax: 30,
  };

  const ranked = getRankedMealsForUser(testMeals, config);

  assert.ok(ranked.length > 0, 'Debe retornar comidas');
  assert.ok(ranked[0].score >= ranked[ranked.length - 1].score, 'Debe estar ordenado descendente');
});

test('getRankedMealsForUser respeta el límite', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    cookingTimeMax: 100,
  };

  const ranked = getRankedMealsForUser(testMeals, config, 3);

  assert.strictEqual(ranked.length, 3, 'Debe retornar máximo 3 comidas');
});

test('getMealsByCuisineStyle filtra por estilo correctamente', () => {
  const mexicanMeals = getMealsByCuisineStyle(testMeals, 'Mexicana');
  const italianMeals = getMealsByCuisineStyle(testMeals, 'Italiana');

  assert.strictEqual(mexicanMeals.length, 1, 'Debe encontrar 1 comida mexicana');
  assert.strictEqual(mexicanMeals[0].id, 'test_01');
  assert.strictEqual(italianMeals.length, 1, 'Debe encontrar 1 comida italiana');
  assert.strictEqual(italianMeals[0].id, 'test_02');
});

test('getFilterStats calcula estadísticas correctamente', () => {
  const config: MealScoreConfig = {
    ...defaultConfig,
    cookingTimeMax: 20,
  };

  const filtered = filterMealsForUser(testMeals, config);
  const stats = getFilterStats(testMeals, filtered);

  assert.strictEqual(stats.total, 5, 'Total debe ser 5');
  assert.ok(stats.afterFilter <= stats.total, 'Filtradas no puede ser mayor que total');
  assert.ok(stats.percentage >= 0 && stats.percentage <= 100, 'Porcentaje debe ser válido');
  assert.ok(typeof stats.byMoment === 'object', 'Debe tener estadísticas por momento');
});

test('buildConfigFromQuestionnaire extrae configuración correctamente', () => {
  const questionnaire = {
    preferences: {
      favoriteFoods: 'pollo, atún',
      favoriteCuisineStyles: 'Mexicana, Italiana',
      dislikedFoods: 'hígado',
      cookingTime: '30',
    },
    healthContext: {
      allergies: 'mariscos',
      intolerances: 'lactosa',
      diagnostics: 'diabetes',
      additionalConditions: 'hipertensión',
    },
    profileContext: {
      objectives: ['Perder grasa'],
    },
  };

  const config = buildConfigFromQuestionnaire(questionnaire);

  assert.deepStrictEqual(config.favoriteFoods, ['pollo', 'atún']);
  assert.deepStrictEqual(config.favoriteCuisineStyles, ['Mexicana', 'Italiana']);
  assert.deepStrictEqual(config.dislikedFoods, ['hígado']);
  assert.deepStrictEqual(config.allergies, ['mariscos']);
  assert.deepStrictEqual(config.intolerances, ['lactosa']);
  assert.ok(config.medicalConditions.includes('diabetes'));
  assert.ok(config.medicalConditions.includes('hipertension')); // forma canónica sin acento
  assert.strictEqual(config.cookingTimeMax, 30);
  assert.strictEqual(config.objective, 'perder');
});

test('scoreMeal bonus por tiempo rápido', () => {
  const quickMeal = testMeals[0]; // 10 minutos
  const slowMeal = testMeals[1]; // 40 minutos

  const quickScore = scoreMeal(quickMeal, defaultConfig);
  const slowScore = scoreMeal(slowMeal, defaultConfig);

  assert.ok(quickScore > slowScore, 'Comida rápida debe tener mayor puntaje base');
});

test('scoreMeal bonus por dificultad fácil', () => {
  const easyMeal = testMeals[0]; // facil
  const mediumMeal = testMeals[1]; // media

  const easyScore = scoreMeal(easyMeal, defaultConfig);
  const mediumScore = scoreMeal(mediumMeal, defaultConfig);

  assert.ok(easyScore > mediumScore, 'Comida fácil debe tener mayor puntaje base');
});
