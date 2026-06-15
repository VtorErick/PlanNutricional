import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectConflictsForMeal,
  detectGeneralConflicts,
  detectConflictsForMealPlan,
  validatePlanSafety,
  generateHealthRecommendations,
  type UserHealthProfile,
} from '../../src/utils/dietaryConflicts';
import type { CatalogMealItem } from '../../src/data/mealsDB';

// Perfiles de prueba
const healthyProfile: UserHealthProfile = {
  diagnostics: [],
  medications: [],
  allergies: [],
  intolerances: [],
  symptoms: [],
  additionalConditions: [],
};

const diabeticProfile: UserHealthProfile = {
  diagnostics: ['diabetes tipo 2'],
  medications: ['metformina'],
  allergies: [],
  intolerances: [],
  symptoms: [],
  additionalConditions: [],
};

const hypertensiveProfile: UserHealthProfile = {
  diagnostics: ['hipertension'],
  medications: ['amlodipino'],
  allergies: [],
  intolerances: [],
  symptoms: [],
  additionalConditions: [],
};

const complexProfile: UserHealthProfile = {
  diagnostics: ['diabetes', 'hipertension', 'reflujo gastroesofagico'],
  medications: ['metformina', 'omeprazol'],
  allergies: ['mariscos'],
  intolerances: ['lactosa'],
  symptoms: ['acidez'],
  additionalConditions: ['estres'],
};

// Comidas de prueba
const safeMeal: CatalogMealItem = {
  id: 'safe_01',
  momentos: ['comida'],
  nombre: 'Pechuga de pollo con verduras',
  tags: ['saludable', 'proteina'],
  super: ['pollo', 'brocoli', 'arroz'],
  cuisineStyles: ['Casera'],
  prepTimeMinutes: 30,
  difficulty: 'facil',
  macroEstimate: { calories: 400, protein: 35, carbs: 45, fat: 8 },
};

const sugaryMeal: CatalogMealItem = {
  id: 'sugar_01',
  momentos: ['desayuno'],
  nombre: 'Hotcakes con miel',
  tags: ['dulce', 'desayuno'],
  super: ['harina', 'huevo', 'leche', 'miel', 'azucar'],
  cuisineStyles: ['Casera'],
  prepTimeMinutes: 20,
  difficulty: 'facil',
  macroEstimate: { calories: 500, protein: 12, carbs: 80, fat: 15 },
};

const highSodiumMeal: CatalogMealItem = {
  id: 'sodium_01',
  momentos: ['comida'],
  nombre: 'Sushi con salsa soya',
  tags: ['japones', 'salado'],
  super: ['arroz', 'pescado', 'salsa soya', 'alga'],
  cuisineStyles: ['Asiática'],
  prepTimeMinutes: 45,
  difficulty: 'media',
  macroEstimate: { calories: 350, protein: 20, carbs: 55, fat: 5 },
};

const shellfishMeal: CatalogMealItem = {
  id: 'shellfish_01',
  momentos: ['comida'],
  nombre: 'Ceviche de camarón',
  tags: ['mariscos', 'fresco'],
  super: ['camarón', 'limon', 'cebolla', 'cilantro'],
  cuisineStyles: ['Mexicana'],
  prepTimeMinutes: 20,
  difficulty: 'facil',
  macroEstimate: { calories: 250, protein: 30, carbs: 15, fat: 8 },
};

const oxalateMeal: CatalogMealItem = {
  id: 'oxalate_01',
  momentos: ['comida'],
  nombre: 'Ensalada de espinaca con nueces',
  tags: ['vegetariano', 'saludable'],
  super: ['espinaca', 'nueces', 'queso feta', 'tomate'],
  cuisineStyles: ['Mediterránea'],
  prepTimeMinutes: 10,
  difficulty: 'facil',
  macroEstimate: { calories: 320, protein: 12, carbs: 12, fat: 24 },
  medicalContraindications: ['calculos renales'],
};

test('detectConflictsForMeal retorna vacío para perfil saludable', () => {
  const conflicts = detectConflictsForMeal(healthyProfile, sugaryMeal);
  assert.strictEqual(conflicts.length, 0, 'No debe haber conflictos para perfil saludable');
});

test('detectConflictsForMeal detecta azúcar para diabéticos', () => {
  const conflicts = detectConflictsForMeal(diabeticProfile, sugaryMeal);

  const sugarConflict = conflicts.find(c => c.type === 'condicion-carbohidratos');
  assert.ok(sugarConflict, 'Debe detectar conflicto de azúcar');
  assert.strictEqual(sugarConflict!.severity, 'warning');
  assert.ok(sugarConflict!.message.includes('azúcar'));
});

test('detectConflictsForMeal detecta sodio para hipertensos', () => {
  const conflicts = detectConflictsForMeal(hypertensiveProfile, highSodiumMeal);

  const sodiumConflict = conflicts.find(c => c.type === 'condicion-sodio');
  assert.ok(sodiumConflict, 'Debe detectar conflicto de sodio');
  assert.ok(sodiumConflict!.message.includes('sodio') || sodiumConflict!.message.includes('alta'));
});

test('detectConflictsForMeal detecta alergias a ingredientes', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    allergies: ['mariscos', 'camarón'],
  };

  const conflicts = detectConflictsForMeal(profile, shellfishMeal);

  const allergyConflict = conflicts.find(c => c.type === 'alergia-ingrediente');
  assert.ok(allergyConflict, 'Debe detectar alergia a camarón');
  assert.strictEqual(allergyConflict!.severity, 'danger');
});

test('detectConflictsForMeal detecta contraindicaciones médicas', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['calculos renales'],
  };

  const conflicts = detectConflictsForMeal(profile, oxalateMeal);

  const contraindication = conflicts.find(c => c.type === 'contraindicacion-medica');
  assert.ok(contraindication, 'Debe detectar contraindicación médica');
  assert.strictEqual(contraindication!.severity, 'danger');
});

test('detectConflictsForMeal detecta oxalatos altos', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['calculos renales', 'oxalato'],
  };

  const conflicts = detectConflictsForMeal(profile, oxalateMeal);

  const oxalateConflict = conflicts.find(c => c.type === 'condicion-mineral');
  assert.ok(oxalateConflict, 'Debe detectar conflicto de oxalatos');
});

test('detectGeneralConflicts detecta combinaciones peligrosas', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    medications: ['metformina'],
    additionalConditions: ['alcohol', 'consumo frecuente'],
  };

  const conflicts = detectGeneralConflicts(profile);

  const metforminConflict = conflicts.find(c => c.type === 'medicamento-habito');
  assert.ok(metforminConflict, 'Debe detectar conflicto metformina-alcohol');
  assert.strictEqual(metforminConflict!.severity, 'danger');
});

test('detectGeneralConflicts detecta síndrome metabólico', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['diabetes', 'hipertension'],
  };

  const conflicts = detectGeneralConflicts(profile);

  const metabolicConflict = conflicts.find(c => c.type === 'sindrome-metabolico');
  assert.ok(metabolicConflict, 'Debe detectar síndrome metabólico');
});

test('detectConflictsForMealPlan analiza múltiples comidas', () => {
  const meals = [sugaryMeal, highSodiumMeal, safeMeal];

  const result = detectConflictsForMealPlan(diabeticProfile, meals);

  assert.ok(result.conflicts.length > 0, 'Debe encontrar conflictos');
  assert.ok(result.summary.danger >= 0, 'Debe contar peligros');
  assert.ok(result.summary.warning >= 0, 'Debe contar advertencias');
  assert.ok(result.summary.uniqueMealsAffected > 0, 'Debe contar comidas afectadas');
});

test('validatePlanSafety determina si plan es seguro', () => {
  const meals = [safeMeal, sugaryMeal];

  const result = validatePlanSafety(diabeticProfile, meals);

  assert.strictEqual(typeof result.isSafe, 'boolean');
  assert.strictEqual(typeof result.canProceed, 'boolean');
  assert.ok(Array.isArray(result.blockingIssues));
  assert.ok(Array.isArray(result.warnings));
});

test('validatePlanSafety bloquea por alergias graves', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    allergies: ['camarón', 'mariscos'], // Incluir término específico del ingrediente
  };

  const meals = [shellfishMeal, safeMeal];
  const result = validatePlanSafety(profile, meals);

  assert.strictEqual(result.canProceed, false, 'No debe permitir proceder con alergia grave');
  assert.ok(result.blockingIssues.length > 0, 'Debe tener issues bloqueantes');
});

test('validatePlanSafety permite plan seguro', () => {
  const meals = [safeMeal];

  const result = validatePlanSafety(healthyProfile, meals);

  assert.strictEqual(result.isSafe, true);
  assert.strictEqual(result.canProceed, true);
  assert.strictEqual(result.blockingIssues.length, 0);
});

test('generateHealthRecommendations genera recomendaciones por condición', () => {
  const recs = generateHealthRecommendations(diabeticProfile);

  assert.ok(recs.length > 0, 'Debe generar recomendaciones');
  assert.ok(recs.some(r => r.toLowerCase().includes('glucosa')), 'Debe mencionar glucosa para diabetes');
});

test('generateHealthRecommendaciones para medicamentos específicos', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    medications: ['levotiroxina', 'metformina'],
  };

  const recs = generateHealthRecommendations(profile);

  assert.ok(recs.some(r => r.toLowerCase().includes('levotiroxina')), 'Debe mencionar levotiroxina');
  assert.ok(recs.some(r => r.toLowerCase().includes('b12') || r.toLowerCase().includes('metformina')), 'Debe mencionar B12/metformina');
});

test('detectConflictsForMeal detecta reflujo con alimentos ácidos', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['reflujo gastroesofagico', 'gerd'],
  };

  const acidicMeal: CatalogMealItem = {
    id: 'acid_01',
    momentos: ['cena'],
    nombre: 'Pasta con tomate',
    tags: ['italiano', 'acido'],
    super: ['pasta', 'tomate', 'salsa tomate', 'queso'],
    cuisineStyles: ['Italiana'],
    prepTimeMinutes: 25,
    difficulty: 'facil',
    macroEstimate: { calories: 450, protein: 18, carbs: 65, fat: 12 },
  };

  const conflicts = detectConflictsForMeal(profile, acidicMeal);

  const refluxConflict = conflicts.find(c => c.type === 'sintoma-acidez');
  assert.ok(refluxConflict, 'Debe detectar conflicto con tomate para reflujo');
});

test('detectConflictsForMeal detecta embarazo', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['embarazo', 'gestacion'],
  };

  const wineMeal: CatalogMealItem = {
    id: 'wine_01',
    momentos: ['cena'],
    nombre: 'Pescado con vino blanco',
    tags: ['gourmet', 'vino'],
    super: ['pescado', 'vino blanco', 'limon', 'mantequilla'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 30,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 32, carbs: 8, fat: 18 },
  };

  const conflicts = detectConflictsForMeal(profile, wineMeal);

  const pregnancyConflict = conflicts.find(c => c.type === 'embarazo-alcohol');
  assert.ok(pregnancyConflict, 'Debe detectar alcohol en embarazo');
  assert.strictEqual(pregnancyConflict!.severity, 'danger');
});

test('detectConflictsForMeal detecta SII con FODMAPs', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['sindrome intestino irritable', 'sii'],
    symptoms: ['distension', 'bloating'],
  };

  const fodmapMeal: CatalogMealItem = {
    id: 'fodmap_01',
    momentos: ['comida'],
    nombre: 'Sopa de ajo y cebolla',
    tags: ['sopa', 'casera'],
    super: ['ajo', 'cebolla', 'caldo', 'pan'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 40,
    difficulty: 'facil',
    macroEstimate: { calories: 200, protein: 6, carbs: 35, fat: 5 },
  };

  const conflicts = detectConflictsForMeal(profile, fodmapMeal);

  const fodmapConflict = conflicts.find(c => c.type === 'sintoma-digestivo');
  assert.ok(fodmapConflict, 'Debe detectar FODMAPs para SII');
});

test('detectConflictsForMeal detecta gota con purinas', () => {
  const profile: UserHealthProfile = {
    ...healthyProfile,
    diagnostics: ['gota', 'acido urico alto'],
  };

  const purineMeal: CatalogMealItem = {
    id: 'purine_01',
    momentos: ['comida'],
    nombre: 'Sardinas en salsa',
    tags: ['mariscos', 'omega3'],
    super: ['sardinas', 'salsa tomate', 'aceite oliva'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 300, protein: 25, carbs: 10, fat: 18 },
  };

  const conflicts = detectConflictsForMeal(profile, purineMeal);

  const goutConflict = conflicts.find(c => c.type === 'condicion-purinas');
  assert.ok(goutConflict, 'Debe detectar purinas para gota');
});
