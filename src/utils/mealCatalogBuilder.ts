/**
 * Builder de catálogo de comidas con selección rotativa optimizada.
 * Integra mealRotation para reducir tokens enviados a la IA,
 * manteniendo compatibilidad con el flujo existente.
 */

import type { CatalogMealItem } from '../data/mealsDB';
import type { RotationConfig } from './mealRotation';

// Phase 3: In-memory cache for filtered catalogs (5 min TTL)
const catalogCache = new Map<string, { result: MealCatalogResult; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(questionnaire: any, options: MealCatalogBuildOptions): string {
  const keyParts = [
    JSON.stringify(questionnaire?.healthContext || {}),
    JSON.stringify(questionnaire?.preferences || {}),
    JSON.stringify(questionnaire?.planConfig?.selectedMoments || []),
    options.useRotation ? 'rot' : 'norot',
    options.targetProfile || 'el',
  ];
  return keyParts.join('|');
}

function getCachedCatalog(key: string): MealCatalogResult | null {
  const entry = catalogCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    catalogCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCachedCatalog(key: string, result: MealCatalogResult): void {
  catalogCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

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
  momentos: string[];
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
    momentos: meal.momentos,
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

  // Phase 3: Check cache first (skip if using rotation with recent history)
  if (recentMealIds.length === 0) {
    const cacheKey = getCacheKey(questionnaire, options);
    const cached = getCachedCatalog(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const warnings: string[] = [];

  // PASO 1: Importar dinámicamente para evitar dependencias circulares
  const { filterCatalogForQuestionnaire } = await import('../data/mealsDB');

  // PASO 2: Filtrar por restricciones del usuario (siempre se hace)
  const filtered = filterCatalogForQuestionnaire(allMeals, questionnaire);
  const source = filtered.length > 0 ? filtered : allMeals;
  const { buildConfigFromQuestionnaire, getRankedMealsForUser } = await import('./mealScoring');
  const rankedSource = getRankedMealsForUser(
    source,
    buildConfigFromQuestionnaire(questionnaire)
  ).map(({ meal }) => meal);
  const qualitySource = rankedSource.length > 0 ? rankedSource : source;

  // PASO 3: Si no hay suficientes comidas, usar comportamiento original
  const MIN_MEALS_FOR_ROTATION = 40; // Necesitamos variedad suficiente

  let result: MealCatalogResult;

  if (!useRotation || qualitySource.length < MIN_MEALS_FOR_ROTATION) {
    if (useRotation && qualitySource.length < MIN_MEALS_FOR_ROTATION) {
      warnings.push(`Catálogo insuficiente para rotación (${source.length} < ${MIN_MEALS_FOR_ROTATION}). Usando filtrado estándar.`);
    }

    // Usar comportamiento original (56 comidas máximo)
    const { buildQuestionnaireMealsCatalog } = await import('../data/mealsDB');
    const catalog = buildQuestionnaireMealsCatalog(allMeals, questionnaire);

    result = {
      catalog,
      meta: {
        method: filtered.length > 0 ? 'filtered' : 'fallback',
        totalAvailable: allMeals.length,
        finalCount: catalog.length,
        selectedIds: catalog.map(m => m.id),
        warnings,
      },
    };
  } else {
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

        result = {
          catalog: combined,
          meta: {
            method: 'rotation+filtered',
            totalAvailable: source.length,
            finalCount: combined.length,
            selectedIds: combined.map(m => m.id),
            warnings,
          },
        };
      } else {
        // Éxito: Rotación funcionó bien
        const catalog = selectedMeals.map(toCompactFormat);

        result = {
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
      }
    } catch (error) {
      // FALLBACK SEGURO: Si rotación falla, usar comportamiento original
      warnings.push(`Error en rotación: ${error instanceof Error ? error.message : 'desconocido'}. Usando filtrado estándar.`);

      const { buildQuestionnaireMealsCatalog } = await import('../data/mealsDB');
      const catalog = buildQuestionnaireMealsCatalog(allMeals, questionnaire);

      result = {
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

  // Phase 3: Cache result if not using rotation history
  if (recentMealIds.length === 0) {
    const cacheKey = getCacheKey(questionnaire, options);
    setCachedCatalog(cacheKey, result);
  }

  return result;
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
  const requiredFields = ['id', 'nombre', 'tags', 'momentos'];
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
