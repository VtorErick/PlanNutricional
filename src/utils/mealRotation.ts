/**
 * Utilidades para selección rotativa de comidas por variedad.
 * Evita repetir comidas, alterna estilos de cocina y cumple objetivos de porciones SMAE.
 */

import type { CatalogMealItem } from '../data/mealsDB';

export interface RotationConfig {
  // Comidas disponibles para seleccionar
  availableMeals: CatalogMealItem[];

  // Objetivos de porciones SMAE por grupo y momento
  // Ej: { desayuno: { verduras: 2, frutas: 1, proteina: 2, ... } }
  objectives: Record<string, Record<string, number>>;

  // IDs de comidas usadas recientemente (a evitar)
  history: string[];

  // Ventana de días para evitar repetición (default: 14)
  varietyWindow: number;

  // Perfil objetivo
  targetProfile: 'el' | 'ella' | 'ambos';

  // Preferencias de estilos de cocina (para alternar)
  preferredStyles?: string[];

  // Máximo de intentos antes de fallback
  maxAttempts?: number;
}

export interface RotationResult {
  selected: Record<string, string[]>; // momento -> array de IDs seleccionados
  coverage: Record<string, number>;     // momento -> porcentaje de cobertura de objetivos
  variety: {
    uniqueCount: number;
    styleDistribution: Record<string, number>;
    historyOverlap: number; // cuántas de history se repiten
  };
  warnings: string[];
}

const DEFAULT_CONFIG = {
  varietyWindow: 14,
  maxAttempts: 1000,
};

// Mapeo de momentos a orden fijo
const MOMENT_ORDER = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];

/**
 * Normaliza texto para comparación
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica si un ID está en el historial reciente
 */
function isInHistory(id: string, history: string[], window: number): boolean {
  // Solo considerar los últimos N items del historial
  const recentHistory = history.slice(-window);
  return recentHistory.includes(id);
}

/**
 * Calcula la puntuación de variedad para una comida
 */
function calculateVarietyScore(
  meal: CatalogMealItem,
  selectedSoFar: CatalogMealItem[],
  config: RotationConfig
): number {
  let score = 0;

  // 1. Penalizar si está en historial
  if (isInHistory(meal.id, config.history, config.varietyWindow)) {
    score -= 50;
  }

  // 2. Penalizar si ya está seleccionada en este plan
  const alreadySelected = selectedSoFar.find(m => m.id === meal.id);
  if (alreadySelected) {
    score -= 100;
  }

  // 3. Bonus por alternar estilos de cocina
  if (meal.cuisineStyles && selectedSoFar.length > 0) {
    const lastMeal = selectedSoFar[selectedSoFar.length - 1];
    const lastStyles = lastMeal.cuisineStyles || [];
    const currentStyles = meal.cuisineStyles;

    // Verificar si hay estilos diferentes
    const hasDifferentStyle = currentStyles.some(cs =>
      !lastStyles.some(ls => normalizeText(ls) === normalizeText(cs))
    );

    if (hasDifferentStyle) {
      score += 10;
    } else {
      score -= 5; // Penalización leve por mismo estilo
    }
  }

  // 4. Bonus por tiempo de preparación variado
  if (meal.prepTimeMinutes && selectedSoFar.length > 0) {
    const avgPrepTime = selectedSoFar.reduce((acc, m) =>
      acc + (m.prepTimeMinutes || 30), 0) / selectedSoFar.length;

    if (Math.abs((meal.prepTimeMinutes || 30) - avgPrepTime) > 10) {
      score += 5; // Variedad en tiempos
    }
  }

  // 5. Bonus por dificultad variada (no todo fácil o difícil)
  if (meal.difficulty && selectedSoFar.length > 0) {
    const difficultyCounts: Record<string, number> = { facil: 0, media: 0, dificil: 0 };
    selectedSoFar.forEach(m => {
      if (m.difficulty) difficultyCounts[m.difficulty]++;
    });

    const currentCount = difficultyCounts[meal.difficulty] || 0;
    if (currentCount < selectedSoFar.length * 0.4) {
      score += 3; // Favorecer dificultades menos representadas
    }
  }

  return score;
}

/**
 * Estima qué tan bien una comida cumple los objetivos de porciones
 */
function estimateObjectiveCoverage(
  meal: CatalogMealItem,
  objectives: Record<string, number>
): { coverage: number; matchedGroups: string[] } {
  if (!meal.macroEstimate) {
    return { coverage: 0, matchedGroups: [] };
  }

  const { calories, protein, carbs, fat } = meal.macroEstimate;
  const matchedGroups: string[] = [];
  let coverage = 0;

  // Mapeo aproximado de macros a grupos SMAE
  if (protein > 15 && objectives['proteina']) {
    coverage += Math.min(protein / 20, objectives['proteina']);
    matchedGroups.push('proteina');
  }

  if (carbs > 30 && objectives['cereales']) {
    coverage += Math.min(carbs / 45, objectives['cereales']);
    matchedGroups.push('cereales');
  }

  if (carbs > 10 && carbs <= 30 && objectives['frutas']) {
    coverage += Math.min(carbs / 15, objectives['frutas']);
    matchedGroups.push('frutas');
  }

  if (fat > 10 && objectives['grasas']) {
    coverage += Math.min(fat / 15, objectives['grasas']);
    matchedGroups.push('grasas');
  }

  if (protein > 5 && protein <= 15 && objectives['lacteos']) {
    coverage += Math.min(protein / 10, objectives['lacteos']);
    matchedGroups.push('lacteos');
  }

  return { coverage, matchedGroups };
}

/**
 * Selecciona la mejor comida para un momento específico
 */
function selectBestMealForMoment(
  available: CatalogMealItem[],
  moment: string,
  selectedSoFar: CatalogMealItem[],
  objectives: Record<string, number>,
  config: RotationConfig,
  strictNoHistory: boolean = true
): { meal: CatalogMealItem | null; isFromHistory: boolean } {
  // Filtrar por momento
  let momentMeals = available.filter(m => m.momentos.includes(moment));

  if (momentMeals.length === 0) {
    return { meal: null, isFromHistory: false };
  }

  // Si strictNoHistory, excluir completamente comidas del historial
  const nonHistoryMeals = strictNoHistory
    ? momentMeals.filter(m => !isInHistory(m.id, config.history, config.varietyWindow))
    : momentMeals;

  const mealsToScore = nonHistoryMeals.length > 0 ? nonHistoryMeals : momentMeals;
  const willUseHistory = nonHistoryMeals.length === 0 && momentMeals.length > 0;

  // Calcular puntuaciones
  const scored = mealsToScore.map(meal => {
    const varietyScore = calculateVarietyScore(meal, selectedSoFar, config);
    const objectiveData = estimateObjectiveCoverage(meal, objectives);

    // Combinar puntuaciones (prioridad al cumplimiento de objetivos)
    const totalScore = (objectiveData.coverage * 10) + varietyScore;

    return {
      meal,
      score: totalScore,
      coverage: objectiveData.coverage,
      matchedGroups: objectiveData.matchedGroups,
    };
  });

  // Ordenar por puntuación
  scored.sort((a, b) => b.score - a.score);

  return {
    meal: scored[0]?.meal || null,
    isFromHistory: willUseHistory,
  };
}

/**
 * Selecciona comidas para la semana con variedad y cumplimiento de objetivos
 */
export function selectMealsForWeek(config: RotationConfig): RotationResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const selected: Record<string, string[]> = {};
  const selectedMeals: CatalogMealItem[] = [];
  const warnings: string[] = [];

  // Inicializar estructuras
  MOMENT_ORDER.forEach(m => selected[m] = []);

  // Para cada día de la semana (7 días)
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  for (const day of days) {
    const dayMeals: CatalogMealItem[] = [];

    for (const momento of MOMENT_ORDER) {
      const objectives = config.objectives[momento] || {};

      // Intentar seleccionar la mejor comida (evitando historial)
      let { meal, isFromHistory } = selectBestMealForMoment(
        config.availableMeals,
        momento,
        [...selectedMeals, ...dayMeals],
        objectives,
        fullConfig,
        true // strictNoHistory
      );

      // Si no se encontró nada fuera del historial, intentar con fallback
      if (!meal) {
        // Fallback: cualquier comida del momento disponible (sin historial)
        const fallbackMeals = config.availableMeals.filter(m =>
          m.momentos.includes(momento) && !isInHistory(m.id, config.history, 7)
        );

        if (fallbackMeals.length > 0) {
          meal = fallbackMeals[Math.floor(Math.random() * fallbackMeals.length)];
          warnings.push(`${day} ${momento}: Usando fallback por falta de opciones óptimas`);
        } else {
          // Último recurso: repetir comida del historial
          const lastResort = config.availableMeals.filter(m => m.momentos.includes(momento));
          if (lastResort.length > 0) {
            meal = lastResort[0];
            isFromHistory = true;
            warnings.push(`${day} ${momento}: Repitiendo comida del historial por falta de opciones`);
          }
        }
      }

      if (meal) {
        dayMeals.push(meal);
        selected[momento].push(meal.id);
        if (isFromHistory) {
          warnings.push(`${day} ${momento}: ${meal.nombre} - seleccionada del historial`);
        }
      } else {
        warnings.push(`${day} ${momento}: NO HAY COMIDAS DISPONIBLES EN EL CATÁLOGO`);
      }
    }

    selectedMeals.push(...dayMeals);
  }

  // Calcular métricas de variedad
  const uniqueIds = new Set(selectedMeals.map(m => m.id));
  const styleDistribution: Record<string, number> = {};

  selectedMeals.forEach(meal => {
    if (meal.cuisineStyles) {
      meal.cuisineStyles.forEach(style => {
        styleDistribution[style] = (styleDistribution[style] || 0) + 1;
      });
    }
  });

  // Calcular cobertura de objetivos por momento
  const coverage: Record<string, number> = {};
  MOMENT_ORDER.forEach(momento => {
    const objectives = config.objectives[momento] || {};
    const meals = selected[momento].map(id =>
      config.availableMeals.find(m => m.id === id)
    ).filter(Boolean) as CatalogMealItem[];

    let totalCoverage = 0;
    const objectiveKeys = Object.keys(objectives);

    if (objectiveKeys.length > 0) {
      meals.forEach(meal => {
        const { coverage: mealCoverage } = estimateObjectiveCoverage(meal, objectives);
        totalCoverage += mealCoverage;
      });

      coverage[momento] = Math.min(100, Math.round(
        (totalCoverage / (objectiveKeys.length * 7)) * 100
      ));
    } else {
      coverage[momento] = 100;
    }
  });

  // Calcular overlap con historial
  const historyOverlap = selectedMeals.filter(m =>
    config.history.includes(m.id)
  ).length;

  return {
    selected,
    coverage,
    variety: {
      uniqueCount: uniqueIds.size,
      styleDistribution,
      historyOverlap,
    },
    warnings,
  };
}

/**
 * Verifica que haya suficiente variedad en un plan generado
 */
export function validateVariety(
  result: RotationResult,
  minUniqueRatio: number = 0.6,
  maxHistoryOverlap: number = 5
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Total de slots: 7 días * 5 momentos = 35
  const totalSlots = 35;
  const uniqueRatio = result.variety.uniqueCount / totalSlots;

  if (uniqueRatio < minUniqueRatio) {
    issues.push(`Variedad insuficiente: ${result.variety.uniqueCount}/${totalSlots} comidas únicas`);
  }

  if (result.variety.historyOverlap > maxHistoryOverlap) {
    issues.push(`Muchas repeticiones del historial: ${result.variety.historyOverlap} comidas`);
  }

  // Verificar cobertura de objetivos
  const lowCoverage = Object.entries(result.coverage).filter(([, cov]) => cov < 60);
  if (lowCoverage.length > 0) {
    issues.push(`Cobertura baja en: ${lowCoverage.map(([m]) => m).join(', ')}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Genera sugerencias para mejorar la variedad
 */
export function generateVarietySuggestions(
  result: RotationResult,
  availableMeals: CatalogMealItem[]
): string[] {
  const suggestions: string[] = [];

  // Identificar estilos poco representados
  const totalMeals = 35;
  const underrepresentedStyles: string[] = [];

  for (const style of ['Mexicana', 'Italiana', 'Asiática', 'Mediterránea']) {
    const count = result.variety.styleDistribution[style] || 0;
    if (count < totalMeals * 0.1) { // Menos del 10%
      underrepresentedStyles.push(style);
    }
  }

  if (underrepresentedStyles.length > 0) {
    suggestions.push(
      `Considerar agregar más comidas ${underrepresentedStyles.join(', ')} para mayor variedad`
    );
  }

  // Verificar comidas que aparecen múltiples veces
  const mealCounts: Record<string, number> = {};
  Object.values(result.selected).flat().forEach(id => {
    mealCounts[id] = (mealCounts[id] || 0) + 1;
  });

  const repeatedMeals = Object.entries(mealCounts).filter(([, count]) => count > 3);
  if (repeatedMeals.length > 0) {
    suggestions.push(
      `${repeatedMeals.length} comidas se repiten más de 3 veces. Considerar agregar alternativas.`
    );
  }

  // Sugerir comidas del catálogo no utilizadas
  const usedIds = new Set(Object.values(result.selected).flat());
  const unusedMeals = availableMeals.filter(m => !usedIds.has(m.id));

  if (unusedMeals.length > 20) {
    suggestions.push(
      `${unusedMeals.length} comidas del catálogo no se utilizaron. Hay margen para más variedad.`
    );
  }

  return suggestions;
}

/**
 * Ajusta un plan existente para mejorar la variedad
 */
export function improveVariety(
  currentPlan: RotationResult,
  availableMeals: CatalogMealItem[],
  config: RotationConfig
): RotationResult {
  const newConfig = {
    ...config,
    history: [...config.history, ...Object.values(currentPlan.selected).flat()],
  };

  return selectMealsForWeek(newConfig);
}
