import type { MealItem, Profile } from '../types';

const EXCHANGE_VALUES: Record<string, { kcal: number; protein: number; fat: number }> = {
  frutas: { kcal: 60, protein: 0.5, fat: 0 },
  verduras: { kcal: 25, protein: 1, fat: 0 },
  cereales: { kcal: 70, protein: 2, fat: 1 },
  leguminosas: { kcal: 120, protein: 8, fat: 1 },
  lacteos: { kcal: 95, protein: 7, fat: 3 },
  proteina: { kcal: 75, protein: 7, fat: 3 },
  grasas: { kcal: 45, protein: 0, fat: 5 },
};

const PORTION_KEY_ALIASES: Record<string, string> = {
  fruta: 'frutas',
  frutas: 'frutas',
  verdura: 'verduras',
  verduras: 'verduras',
  cereal: 'cereales',
  cereales: 'cereales',
  leguminosa: 'leguminosas',
  leguminosas: 'leguminosas',
  lacteo: 'lacteos',
  lacteos: 'lacteos',
  proteina: 'proteina',
  proteinas: 'proteina',
  grasas: 'grasas',
  grasa: 'grasas',
};

function normalizePortionKeyToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function estimateMealNutritionFromPortions(
  portionsText: string
): { caloriasKcal: number; proteinaG: number; grasasG: number } {
  if (!portionsText || /libre/i.test(portionsText)) {
    return { caloriasKcal: 35, proteinaG: 1, grasasG: 0 };
  }

  const entries = portionsText
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  let kcal = 0;
  let protein = 0;
  let fat = 0;

  for (const entry of entries) {
    const match = entry.match(/([\p{L}]+)\s*(\d+)/u);
    if (!match) continue;

    const key = PORTION_KEY_ALIASES[normalizePortionKeyToken(match[1])];
    const amount = Number(match[2]);
    if (!key || Number.isNaN(amount)) continue;

    const exchange = EXCHANGE_VALUES[key];
    kcal += exchange.kcal * amount;
    protein += exchange.protein * amount;
    fat += exchange.fat * amount;
  }

  return {
    caloriasKcal: Math.max(35, Math.round(kcal || 0)),
    proteinaG: Math.max(0, Math.round(protein || 0)),
    grasasG: Math.max(0, Math.round(fat || 0)),
  };
}

export function ensureMealNutrition(meal: MealItem): MealItem {
  if (
    typeof meal.caloriasKcal === 'number' &&
    Number.isFinite(meal.caloriasKcal) &&
    meal.caloriasKcal > 0
  ) {
    return {
      ...meal,
      proteinaG:
        typeof meal.proteinaG === 'number' && Number.isFinite(meal.proteinaG)
          ? Math.round(meal.proteinaG)
          : meal.proteinaG,
      grasasG:
        typeof meal.grasasG === 'number' && Number.isFinite(meal.grasasG)
          ? Math.round(meal.grasasG)
          : meal.grasasG,
      caloriasKcal: Math.round(meal.caloriasKcal),
    };
  }

  const estimated = estimateMealNutritionFromPortions(meal.porciones);
  return {
    ...meal,
    caloriasKcal: estimated.caloriasKcal,
    proteinaG:
      typeof meal.proteinaG === 'number' ? Math.round(meal.proteinaG) : estimated.proteinaG,
    grasasG: typeof meal.grasasG === 'number' ? Math.round(meal.grasasG) : estimated.grasasG,
  };
}

export function enrichPlanWithNutrition(plan: Record<string, Record<string, MealItem[]>>) {
  const nextPlan: Record<string, Record<string, MealItem[]>> = {};

  for (const [dia, momentos] of Object.entries(plan || {})) {
    nextPlan[dia] = {};
    for (const [momento, comidas] of Object.entries(momentos || {})) {
      nextPlan[dia][momento] = Array.isArray(comidas) ? comidas.map(ensureMealNutrition) : [];
    }
  }

  return nextPlan;
}

export function estimateDailyCaloriesFromObjectives(profile: Profile): number {
  return estimateDailyMacroTargetsFromObjectives(profile).kcal;
}

export function estimateDailyMacroTargetsFromObjectives(
  profile: Profile
): { kcal: number; proteinG: number; fatG: number } {
  const objetivos = profile.objetivosPorMomento || {};
  let kcal = 0;
  let protein = 0;
  let fat = 0;

  for (const grupos of Object.values(objetivos)) {
    for (const [groupKey, amount] of Object.entries(grupos || {})) {
      const normalized = PORTION_KEY_ALIASES[normalizePortionKeyToken(groupKey)];
      const exchange = normalized ? EXCHANGE_VALUES[normalized] : null;
      if (!exchange) continue;
      const n = Number(amount) || 0;
      kcal += exchange.kcal * n;
      protein += exchange.protein * n;
      fat += exchange.fat * n;
    }
  }

  return {
    kcal: Math.round(kcal),
    proteinG: Math.round(protein),
    fatG: Math.round(fat),
  };
}

export function sumSelectedMealCalories(meals: MealItem[]): number {
  return meals.reduce((acc, meal) => acc + (meal.caloriasKcal || 0), 0);
}

export function sumSelectedMealProtein(meals: MealItem[]): number {
  return meals.reduce((acc, meal) => acc + (meal.proteinaG || 0), 0);
}

export function sumSelectedMealFat(meals: MealItem[]): number {
  return meals.reduce((acc, meal) => acc + (meal.grasasG || 0), 0);
}
