/**
 * Builder de catálogo de comidas con selección rotativa optimizada.
 * Integra mealRotation para reducir tokens enviados a la IA,
 * manteniendo compatibilidad con el flujo existente.
 */

import type { CatalogMealItem } from '../data/mealsDB';
import type { RotationConfig } from './mealRotation';

export interface MealCatalogBuildOptions {
  // Si true, usa rotación para seleccionar exactamente 35 comidas (5×7)
  // Si false, usa el comportamiento original (56 comidas máximo)
  useRotation?: boolean;

  // Historial de comidas usadas recientemente (para evitar repetición)
  recentMealIds?: string[];

  // Ventana de días para evitar repetición (default: 14)
  varietyWindow?: number;

  // Perfil objetivo ('el' | 'ella')
  targetProfile?: 'el' | 'ella';

  // Porciones SMAE objetivo (para ponderar selección)
  targetPortions?: Record<string, number>;

  // Si true, incluye comidas de reserva si no hay suficientes
  allowFallback?: boolean;
}

/**
 * Estructura del catálogo enviado a la IA
 */
export interface CompactMealCatalogItem {
  id: string;
  nombre: string;
  tags: string[];
  super: string[];
  momentos: string[];
  // Campos opcionales para IA (puede usarlos o ignorarlos)
  cuisineStyles?: string[];
  prepTimeMinutes?: number;
  difficulty?: string;
  macroEstimate?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

/**
 * Resultado de la construcción del catálogo
 */
export interface MealCatalogResult {
  // Catálogo final enviado a IA
  catalog: CompactMealCatalogItem[];

  // Metadatos sobre la construcción
  meta: {
    // Método usado ('rotation' | 'filtered' | 'fallback')
    method: string;

    // Cuántas comidas iniciales había
    totalAvailable: number;

    // Cuántas se enviaron finalmente
    finalCount: number;

    // IDs seleccionados (para debugging)
    selectedIds: string[];

    // Mensajes de advertencia si los hay
    warnings: string[];
  };
}

/**
 * Convierte una comida completa a formato compacto para la IA
 */
function toCompactFormat(meal: CatalogMealItem): CompactMealCatalogItem {
  return {
    id: meal.id,
    nombre: meal.nombre,
    tags: meal.tags,
    super: meal.super,
    momentos: meal.momentos,
    cuisineStyles: meal.cuisineStyles,
    prepTimeMinutes: meal.prepTimeMinutes,
    difficulty: meal.difficulty,
    macroEstimate: meal.macroEstimate,
  };
}

/**
 * Construye catálogo de comidas optimizado para envío a IA.
 *
 * CONSERVADOR: Por defecto mantiene comportamiento original (56 comidas).
 * Si useRotation=true y hay suficientes comidas, selecciona 35 óptimas.
 */
export async function buildOptimizedMealsCatalog(
  allMeals: CatalogMealItem[],
  questionnaire: any,
  options: MealCatalogBuildOptions = {}
): Promise<MealCatalogResult> {
  const {
    useRotation = false, // Por defecto FALSE para no romper nada
    recentMealIds = [],
    varietyWindow = 14,
    targetProfile = 'el',
    targetPortions = {},
    allowFallback = true,
  } = options;

  const warnings: string[] = [];

  // PASO 1: Importar dinámicamente para evitar dependencias circulares
  const { filterCatalogForQuestionnaire } = await import('../data/mealsDB');

  // PASO 2: Filtrar por restricciones del usuario (siempre se hace)
  const filtered = filterCatalogForQuestionnaire(allMeals, questionnaire);
  const source = filtered.length > 0 ? filtered : allMeals;

  // PASO 3: Si no hay suficientes comidas, usar comportamiento original
  const MIN_MEALS_FOR_ROTATION = 40; // Necesitamos variedad suficiente

  if (!useRotation || source.length < MIN_MEALS_FOR_ROTATION) {
    if (useRotation && source.length < MIN_MEALS_FOR_ROTATION) {
      warnings.push(`Catálogo insuficiente para rotación (${source.length} < ${MIN_MEALS_FOR_ROTATION}). Usando filtrado estándar.`);
    }

    // Usar comportamiento original (56 comidas máximo)
    const { buildQuestionnaireMealsCatalog } = await import('../data/mealsDB');
    const catalog = buildQuestionnaireMealsCatalog(allMeals, questionnaire);

    return {
      catalog,
      meta: {
        method: filtered.length > 0 ? 'filtered' : 'fallback',
        totalAvailable: allMeals.length,
        finalCount: catalog.length,
        selectedIds: catalog.map(m => m.id),
        warnings,
      },
    };
  }

  // PASO 4: Intentar usar rotación (solo si useRotation=true y hay suficientes comidas)
  try {
    const { selectMealsForWeek } = await import('./mealRotation');

    const rotationConfig: RotationConfig = {
      availableMeals: source,
      objectives: {}, // Rotation espera objetivos por momento, no usamos por ahora
      history: recentMealIds,
      varietyWindow,
      targetProfile,
    };

    const rotationResult = selectMealsForWeek(rotationConfig);

    // Verificar que tenemos suficientes comidas seleccionadas
    const selectedIds = Object.values(rotationResult.selected).flat();
    const totalSelected = selectedIds.length;
    const EXPECTED_MIN = 30; // 5 momentos × 6 días mínimo

    // Crear mapa de comidas por ID para lookup rápido
    const mealsById = new Map(source.map(m => [m.id, m]));
    const selectedMeals = selectedIds
      .map(id => mealsById.get(id))
      .filter((m): m is CatalogMealItem => m !== undefined);

    if (totalSelected < EXPECTED_MIN && allowFallback) {
      warnings.push(`Rotación devolvió pocas comidas (${totalSelected}). Complementando con filtrado.`);

      // Complementar con comidas adicionales filtradas
      const selectedIdSet = new Set(selectedIds);

      const additional = source
        .filter(m => !selectedIdSet.has(m.id))
        .slice(0, 56 - totalSelected)
        .map(toCompactFormat);

      const rotationCatalog = selectedMeals.map(toCompactFormat);
      const combined = [...rotationCatalog, ...additional];

      return {
        catalog: combined,
        meta: {
          method: 'rotation+filtered',
          totalAvailable: source.length,
          finalCount: combined.length,
          selectedIds: combined.map(m => m.id),
          warnings,
        },
      };
    }

    // Éxito: Rotación funcionó bien
    const catalog = selectedMeals.map(toCompactFormat);

    return {
      catalog,
      meta: {
        method: 'rotation',
        totalAvailable: source.length,
        finalCount: catalog.length,
        selectedIds: catalog.map(m => m.id),
        warnings: rotationResult.warnings.length > 0
          ? [...warnings, ...rotationResult.warnings]
          : warnings,
      },
    };

  } catch (error) {
    // FALLBACK SEGURO: Si rotación falla, usar comportamiento original
    warnings.push(`Error en rotación: ${error instanceof Error ? error.message : 'desconocido'}. Usando filtrado estándar.`);

    const { buildQuestionnaireMealsCatalog } = await import('../data/mealsDB');
    const catalog = buildQuestionnaireMealsCatalog(allMeals, questionnaire);

    return {
      catalog,
      meta: {
        method: 'filtered',
        totalAvailable: allMeals.length,
        finalCount: catalog.length,
        selectedIds: catalog.map(m => m.id),
        warnings,
      },
    };
  }
}

/**
 * Verifica si el catálogo resultante es válido para envío a IA
 */
export function validateCatalogForAI(catalog: CompactMealCatalogItem[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(catalog)) {
    errors.push('Catálogo no es un array');
    return { valid: false, errors };
  }

  if (catalog.length === 0) {
    errors.push('Catálogo vacío');
    return { valid: false, errors };
  }

  if (catalog.length < 10) {
    errors.push(`Catálogo muy pequeño (${catalog.length} comidas)`);
  }

  // Verificar que cada comida tiene campos requeridos
  const requiredFields = ['id', 'nombre', 'tags', 'super', 'momentos'];
  for (let i = 0; i < catalog.length; i++) {
    const meal = catalog[i];
    for (const field of requiredFields) {
      if (!(field in meal)) {
        errors.push(`Comida ${i} (${meal.id || '?'}) falta campo: ${field}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
