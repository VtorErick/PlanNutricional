import type { MealItem } from '../types';

function normalizeMealName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Keeps one option per meal name within a meal-time slot.
 * Selection state is keyed by meal name, so duplicate names would make one
 * click select and render multiple cards at once.
 */
export function deduplicateMealOptions(meals: MealItem[]): MealItem[] {
  const seenNames = new Set<string>();

  return meals.filter((meal) => {
    const normalizedName = normalizeMealName(meal.nombre);
    if (!normalizedName || seenNames.has(normalizedName)) return false;

    seenNames.add(normalizedName);
    return true;
  });
}

export function deduplicateMealPlan(
  plan: Record<string, Record<string, MealItem[]>>
): Record<string, Record<string, MealItem[]>> {
  return Object.fromEntries(
    Object.entries(plan || {}).map(([day, moments]) => [
      day,
      Object.fromEntries(
        Object.entries(moments || {}).map(([moment, meals]) => [
          moment,
          deduplicateMealOptions(Array.isArray(meals) ? meals : []),
        ])
      ),
    ])
  );
}
