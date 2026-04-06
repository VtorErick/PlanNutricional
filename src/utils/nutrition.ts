import type { MealItem, Profile } from '../types';

const EXCHANGE_VALUES: Record<string, { kcal: number; protein: number }> = {
  frutas: { kcal: 60, protein: 0.5 },
  verduras: { kcal: 25, protein: 1 },
  cereales: { kcal: 70, protein: 2 },
  leguminosas: { kcal: 120, protein: 8 },
  lacteos: { kcal: 95, protein: 7 },
  proteina: { kcal: 75, protein: 7 },
  grasas: { kcal: 45, protein: 0 },
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
  proteína: 'proteina',
  proteina: 'proteina',
  grasas: 'grasas',
  grasa: 'grasas',
};

export function estimateMealNutritionFromPortions(portionsText: string): { caloriasKcal: number; proteinaG: number } {
  if (!portionsText || /libre/i.test(portionsText)) {
    return { caloriasKcal: 35, proteinaG: 1 };
  }

  const entries = portionsText
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  let kcal = 0;
  let protein = 0;

  for (const entry of entries) {
    const match = entry.match(/([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s*(\d+)/);
    if (!match) continue;

    const key = PORTION_KEY_ALIASES[match[1].toLowerCase()];
    const amount = Number(match[2]);
    if (!key || Number.isNaN(amount)) continue;

    const exchange = EXCHANGE_VALUES[key];
    kcal += exchange.kcal * amount;
    protein += exchange.protein * amount;
  }

  return {
    caloriasKcal: Math.max(35, Math.round(kcal || 0)),
    proteinaG: Math.max(0, Math.round(protein || 0)),
  };
}

export function ensureMealNutrition(meal: MealItem): MealItem {
  if (typeof meal.caloriasKcal === 'number' && Number.isFinite(meal.caloriasKcal) && meal.caloriasKcal > 0) {
    return {
      ...meal,
      proteinaG: typeof meal.proteinaG === 'number' && Number.isFinite(meal.proteinaG)
        ? Math.round(meal.proteinaG)
        : meal.proteinaG,
      caloriasKcal: Math.round(meal.caloriasKcal),
    };
  }

  const estimated = estimateMealNutritionFromPortions(meal.porciones);
  return {
    ...meal,
    caloriasKcal: estimated.caloriasKcal,
    proteinaG: typeof meal.proteinaG === 'number' ? Math.round(meal.proteinaG) : estimated.proteinaG,
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
  const objetivos = profile.objetivosPorMomento || {};
  let kcal = 0;

  for (const grupos of Object.values(objetivos)) {
    for (const [groupKey, amount] of Object.entries(grupos || {})) {
      const normalized = PORTION_KEY_ALIASES[groupKey.toLowerCase()];
      const exchange = normalized ? EXCHANGE_VALUES[normalized] : null;
      if (!exchange) continue;
      kcal += exchange.kcal * (Number(amount) || 0);
    }
  }

  return Math.round(kcal);
}

export function sumSelectedMealCalories(meals: MealItem[]): number {
  return meals.reduce((acc, meal) => acc + (meal.caloriasKcal || 0), 0);
}
