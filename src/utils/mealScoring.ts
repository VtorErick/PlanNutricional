/**
 * Utilidades para filtrado y puntuación de comidas según preferencias del usuario.
 * Permite seleccionar comidas apropiadas antes de enviar a la IA, reduciendo tokens.
 *
 * Fuentes: USDA FoodData Central, BEDCA, etiquetas comerciales mexicanas
 */

import type { CatalogMealItem } from '../data/mealsDB';
import { hasMedicalContraindicationConflict, parseMedicalConditions } from './medicalConditionMatcher';

export interface MealScoreConfig {
  // Preferencias positivas
  favoriteFoods: string[];        // ej: ['pollo', 'aguacate', 'pasta']
  favoriteCuisineStyles: string[];  // ej: ['Mexicana', 'Italiana']

  // Preferencias negativas
  dislikedFoods: string[];          // ej: ['hígado', 'brócoli']
  allergies: string[];              // ej: ['gluten', 'lactosa', 'mariscos']
  intolerances: string[];           // ej: ['fructosa', 'sorbitol']

  // Condiciones médicas del usuario (texto libre)
  // La comida se excluye si tiene medicalContraindications coincidentes
  medicalConditions: string[];      // ej: ['reflujo', 'diabetes', 'cálculos renales']

  // Restricciones prácticas
  cookingTimeMax: number;           // minutos máximos (0 = sin límite)
  difficultyMax?: 'facil' | 'media' | 'dificil';  // dificultad máxima permitida

  // Objetivo nutricional
  objective: 'perder' | 'ganar' | 'mantener' | 'salud';

  // Filtros dietéticos
  isVegetarian: boolean;
  isVegan: boolean;
}

const DIFFICULTY_ORDER = { facil: 1, media: 2, dificil: 3 };
const PRACTICAL_TAGS = ['rapido', 'portatil', 'meal-prep', 'economico', 'facil', 'sencillo'];
const QUALITY_TAGS = ['saciante', 'fibra', 'omega3', 'anti-inflamatorio', 'volumen', 'digestivo', 'proteina', 'alto-proteina'];
const GLUCOSE_RISK_TAGS = ['dulce', 'postre', 'alto-carb', 'carbohidrato-rapido', 'miel', 'pan dulce', 'galleta'];

/**
 * Normaliza texto para comparación (minúsculas, sin acentos)
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica si alguna palabra clave está presente en el texto
 */
function containsAny(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeText(text);
  return keywords.some(kw => normalizedText.includes(normalizeText(kw)));
}

function splitTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => splitTextList(entry)).filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  return value
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const key = normalizeText(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });

  return result;
}

function collectQuestionnaireSections(questionnaire: any) {
  const sources = [
    questionnaire,
    questionnaire?.el,
    questionnaire?.ella,
    questionnaire?.questionnaireContext,
    questionnaire?.questionnaireContext?.el,
    questionnaire?.questionnaireContext?.ella,
  ].filter(Boolean);

  return sources.map((source) => ({
    profile: source?.profileContext || source,
    health: source?.healthContext || source,
    preferences: source?.preferences || source,
    routine: source?.routine || source,
  }));
}

function resolveObjective(values: string[]): MealScoreConfig['objective'] {
  const joined = normalizeText(values.join(' '));
  if (/(perder|bajar|grasa|definicion|definir)/.test(joined)) return 'perder';
  if (/(ganar|musculo|masa|fuerza|aumentar)/.test(joined)) return 'ganar';
  if (/(mantener|mantenimiento)/.test(joined)) return 'mantener';
  return 'salud';
}

function resolveCookingTimeMax(values: string[]) {
  const parsed = values
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  return parsed.length > 0 ? Math.min(...parsed) : 0;
}

/**
 * Verifica si hay coincidencia entre condiciones médicas del usuario
 * y contraindicaciones de la comida
 */
function hasMedicalConflict(
  meal: CatalogMealItem,
  userConditions: string[]
): boolean {
  if (!meal.medicalContraindications || meal.medicalContraindications.length === 0) {
    return false;
  }

  // Usar el matcher inteligente con soporte para errores ortográficos y variaciones
  const result = hasMedicalContraindicationConflict(
    userConditions,
    meal.medicalContraindications,
    { fuzzyMatch: true, threshold: 0.8 }
  );

  return result.hasConflict;
}

/**
 * Verifica si la comida contiene ingredientes no deseados
 */
function containsForbiddenIngredients(
  meal: CatalogMealItem,
  forbiddenList: string[]
): boolean {
  const searchSpace = [
    meal.nombre,
    ...meal.super,
    ...meal.tags,
  ].join(' ');

  return forbiddenList.some(forbidden => containsAny(searchSpace, [forbidden]));
}

/**
 * Puntúa una comida según las preferencias del usuario.
 * Retorna un número; mayor puntaje = mejor match.
 */
export function scoreMeal(meal: CatalogMealItem, config: MealScoreConfig): number {
  let score = 0;
  const searchSpace = [meal.nombre, ...meal.super, ...meal.tags, ...(meal.cuisineStyles || [])].join(' ');
  const normalizedSearch = normalizeText(searchSpace);

  // 1. Coincidencia con estilos de cocina favoritos (+10 cada uno)
  if (meal.cuisineStyles && config.favoriteCuisineStyles.length > 0) {
    for (const style of config.favoriteCuisineStyles) {
      if (meal.cuisineStyles.some(s => normalizeText(s) === normalizeText(style))) {
        score += 14;
      } else if (containsAny(searchSpace, [style])) {
        score += 8;
      }
    }
  }

  // 2. Coincidencia con alimentos favoritos (+5 cada uno)
  if (config.favoriteFoods.length > 0) {
    for (const food of config.favoriteFoods) {
      if (containsAny(searchSpace, [food])) {
        score += 7;
      }
    }
  }

  // 3. Penalización por alimentos no deseados (-20 cada uno)
  if (config.dislikedFoods.length > 0) {
    for (const food of config.dislikedFoods) {
      if (containsAny(searchSpace, [food])) {
        score -= 35;
      }
    }
  }

  // 4. Ajuste según objetivo nutricional (basado en tags y macros)
  if (meal.macroEstimate) {
    const { calories, protein, carbs } = meal.macroEstimate;

    switch (config.objective) {
      case 'perder':
        // Favorecer comidas altas en proteína, bajas en carbos
        if (protein > 20 && carbs < 30) score += 8;
        if (protein >= 15) score += 3;
        if (calories < 350) score += 4;
        if (carbs > 55) score -= 5;
        break;
      case 'ganar':
        // Favorecer comidas calóricas con proteína
        if (calories > 350) score += 4;
        if (protein > 25) score += 7;
        break;
      case 'mantener':
        // Balance
        if (protein > 15 && calories > 250 && calories < 500) score += 4;
        break;
      case 'salud':
        // Favorecer comidas con tags saludables
        if (meal.tags.some(t => normalizeText(t).includes('omega3'))) score += 4;
        if (meal.tags.some(t => normalizeText(t).includes('fibra'))) score += 4;
        break;
    }
  }

  // 5. Bonus por dificultad fácil (si no hay restricción de dificultad)
  if (config.medicalConditions.some((condition) => /(diabetes|insulina|sop|poliquistico|gluc)/.test(normalizeText(condition)))) {
    if (QUALITY_TAGS.some((tag) => normalizedSearch.includes(tag))) score += 6;
    if (GLUCOSE_RISK_TAGS.some((tag) => normalizedSearch.includes(tag))) score -= 12;
  }

  if (config.medicalConditions.some((condition) => /(reflujo|gastritis|colitis|distension)/.test(normalizeText(condition)))) {
    if (/(caldo|sopa|digestivo|suave|ligero|pollo|calabaza)/.test(normalizedSearch)) score += 5;
    if (/(chipotle|chile|salsa roja|frito|cremoso)/.test(normalizedSearch)) score -= 6;
  }

  if (PRACTICAL_TAGS.some((tag) => normalizedSearch.includes(tag))) score += 2;
  if (QUALITY_TAGS.some((tag) => normalizedSearch.includes(tag))) score += 2;

  if (meal.difficulty === 'facil') {
    score += 2;
  }

  // 6. Bonus por tiempo rápido
  if (meal.prepTimeMinutes && meal.prepTimeMinutes <= 15) {
    score += 3;
  }

  return score;
}

/**
 * Filtra comidas según las restricciones del usuario.
 * Excluye comidas con alergias, intolerancias, condiciones médicas, tiempo excesivo.
 */
export function filterMealsForUser(
  meals: CatalogMealItem[],
  config: MealScoreConfig
): CatalogMealItem[] {
  return meals.filter(meal => {
    // 1. Excluir por condiciones médicas
    if (config.medicalConditions.length > 0) {
      if (hasMedicalConflict(meal, config.medicalConditions)) {
        return false;
      }
    }

    // 2. Excluir por alergias
    if (config.allergies.length > 0) {
      if (containsForbiddenIngredients(meal, config.allergies)) {
        return false;
      }
    }

    // 3. Excluir por intolerancias
    if (config.intolerances.length > 0) {
      if (containsForbiddenIngredients(meal, config.intolerances)) {
        return false;
      }
    }

    // 4. Excluir por tiempo de preparación
    if (config.cookingTimeMax > 0 && meal.prepTimeMinutes) {
      if (meal.prepTimeMinutes > config.cookingTimeMax) {
        return false;
      }
    }

    // 5. Excluir por dificultad
    if (config.difficultyMax && meal.difficulty) {
      if (DIFFICULTY_ORDER[meal.difficulty] > DIFFICULTY_ORDER[config.difficultyMax]) {
        return false;
      }
    }

    // 6. Excluir si no es vegetariana/vegana cuando se requiere
    if (config.isVegan) {
      const isVeganMeal = meal.cuisineStyles?.includes('Vegetariana') ||
        meal.tags.some(t => normalizeText(t).includes('vegano'));
      if (!isVeganMeal) {
        return false;
      }
    } else if (config.isVegetarian) {
      const isVegetarianMeal = meal.cuisineStyles?.includes('Vegetariana') ||
        meal.tags.some(t =>
          normalizeText(t).includes('vegetariano') ||
          normalizeText(t).includes('vegano')
        );
      if (!isVegetarianMeal) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Obtiene comidas filtradas y ordenadas por puntaje.
 * Retorna las mejores opciones para el usuario.
 */
export function getRankedMealsForUser(
  meals: CatalogMealItem[],
  config: MealScoreConfig,
  limit?: number
): Array<{ meal: CatalogMealItem; score: number }> {
  // Primero filtrar
  const filtered = filterMealsForUser(meals, config);

  // Luego puntuar y ordenar
  const scored = filtered.map(meal => ({
    meal,
    score: scoreMeal(meal, config),
  }));

  scored.sort((a, b) => b.score - a.score);

  if (limit && limit > 0) {
    return scored.slice(0, limit);
  }

  return scored;
}

/**
 * Obtiene comidas por estilo de cocina específico.
 */
export function getMealsByCuisineStyle(
  meals: CatalogMealItem[],
  style: string
): CatalogMealItem[] {
  const normalizedStyle = normalizeText(style);

  return meals.filter(meal =>
    meal.cuisineStyles?.some(s => normalizeText(s) === normalizedStyle)
  );
}

/**
 * Obtiene comidas que coinciden con el tiempo de preparación máximo.
 */
export function getMealsByMaxPrepTime(
  meals: CatalogMealItem[],
  maxMinutes: number
): CatalogMealItem[] {
  return meals.filter(meal =>
    !meal.prepTimeMinutes || meal.prepTimeMinutes <= maxMinutes
  );
}

/**
 * Crea configuración de scoring desde el cuestionario del usuario.
 * Extrae preferencias del objeto questionnaire.
 */
export function buildConfigFromQuestionnaire(questionnaire: any): MealScoreConfig {
  const sections = collectQuestionnaireSections(questionnaire);
  const favoriteFoods = uniqueList(sections.flatMap(({ preferences }) => splitTextList(preferences?.favoriteFoods)));
  const favoriteCuisineStyles = uniqueList(sections.flatMap(({ preferences }) => splitTextList(preferences?.favoriteCuisineStyles)));
  const dislikedFoods = uniqueList(sections.flatMap(({ preferences }) => splitTextList(preferences?.dislikedFoods)));
  const allergies = uniqueList(sections.flatMap(({ health }) => splitTextList(health?.allergies)));
  const intolerances = uniqueList(sections.flatMap(({ health }) => splitTextList(health?.intolerances)));
  const cookingTimes = sections.flatMap(({ preferences }) => splitTextList(preferences?.cookingTime));
  const objectives = uniqueList(sections.flatMap(({ profile }) => splitTextList(profile?.objectives)));

  // Extraer condiciones médicas de múltiples campos usando el matcher inteligente
  const rawMedicalInput = sections.flatMap(({ health }) => [
    health?.diagnostics || '',
    health?.additionalConditions || '',
    health?.digestiveSymptoms || '',
  ]).join(', ');

  // Usar parseMedicalConditions para manejar texto libre con errores ortográficos
  const parsedConditions = parseMedicalConditions(rawMedicalInput);
  const medicalConditions = parsedConditions.matched;
  const dietSignals = normalizeText([...favoriteCuisineStyles, ...favoriteFoods, ...objectives].join(' '));

  return {
    favoriteFoods,
    favoriteCuisineStyles,
    dislikedFoods,
    allergies,
    intolerances,
    medicalConditions,
    cookingTimeMax: resolveCookingTimeMax(cookingTimes),
    difficultyMax: undefined,
    objective: resolveObjective(objectives),
    isVegetarian: dietSignals.includes('vegetariana') || dietSignals.includes('vegetariano'),
    isVegan: dietSignals.includes('vegan'),
  };
}

/**
 * Calcula estadísticas de un conjunto de comidas filtradas.
 * Útil para mostrar al usuario qué tan restrictivo es su filtro.
 */
export function getFilterStats(
  allMeals: CatalogMealItem[],
  filteredMeals: CatalogMealItem[]
): {
  total: number;
  afterFilter: number;
  percentage: number;
  byMoment: Record<string, number>;
} {
  const byMoment: Record<string, number> = {};

  for (const meal of filteredMeals) {
    for (const momento of meal.momentos) {
      byMoment[momento] = (byMoment[momento] || 0) + 1;
    }
  }

  return {
    total: allMeals.length,
    afterFilter: filteredMeals.length,
    percentage: Math.round((filteredMeals.length / allMeals.length) * 100),
    byMoment,
  };
}
