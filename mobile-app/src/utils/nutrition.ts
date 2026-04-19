import type { MealItem, Profile } from '../types';
import { hasRecognizablePortions, shouldTreatMacroAsMissing } from './nutritionValidation';

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
  frut: 'frutas',
  verdura: 'verduras',
  verduras: 'verduras',
  verd: 'verduras',
  cereal: 'cereales',
  cereales: 'cereales',
  cer: 'cereales',
  leguminosa: 'leguminosas',
  leguminosas: 'leguminosas',
  leg: 'leguminosas',
  lacteo: 'lacteos',
  lacteos: 'lacteos',
  lact: 'lacteos',
  proteina: 'proteina',
  proteinas: 'proteina',
  prot: 'proteina',
  grasas: 'grasas',
  grasa: 'grasas',
  gras: 'grasas',
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

  let kcal = 0;
  let protein = 0;
  let fat = 0;

  for (const match of portionsText.matchAll(/(?:(\d+(?:[.,]\d+)?)\s*([\p{L}_]+)|([\p{L}_]+)\s*(\d+(?:[.,]\d+)?))/gu)) {
    const rawAmount = match[1] || match[4];
    const rawKey = match[2] || match[3];
    if (!rawAmount || !rawKey) continue;

    const key = PORTION_KEY_ALIASES[normalizePortionKeyToken(rawKey)];
    const amount = Number(String(rawAmount).replace(',', '.'));
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
  const estimated = estimateMealNutritionFromPortions(meal.porciones);
  const hasValidCalories =
    typeof meal.caloriasKcal === 'number' &&
    Number.isFinite(meal.caloriasKcal) &&
    meal.caloriasKcal > 0;
  const canEstimateFromPortions = hasRecognizablePortions(meal.porciones);

  const currentCalories = hasValidCalories ? Math.round(meal.caloriasKcal as number) : estimated.caloriasKcal;
  const currentProtein =
    canEstimateFromPortions && shouldTreatMacroAsMissing(meal.proteinaG, estimated.proteinaG)
      ? estimated.proteinaG
      : typeof meal.proteinaG === 'number' && Number.isFinite(meal.proteinaG)
        ? Math.round(meal.proteinaG)
        : estimated.proteinaG;
  const currentFat =
    canEstimateFromPortions && shouldTreatMacroAsMissing(meal.grasasG, estimated.grasasG)
      ? estimated.grasasG
      : typeof meal.grasasG === 'number' && Number.isFinite(meal.grasasG)
        ? Math.round(meal.grasasG)
        : estimated.grasasG;

  return {
    ...meal,
    caloriasKcal: currentCalories,
    proteinaG: currentProtein,
    grasasG: currentFat,
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

// --- Clinical Engine (TDEE & SMAE) ---
// Mifflin-St Jeor Equation
export function calculateClinicalTDEE(weightKg: number, heightCm: number, age: number, isMale: boolean, activityStr: string, goals: string[]): { bmr: number; tdee: number; targetKcal: number } {
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  bmr = isMale ? bmr + 5 : bmr - 161;

  let multiplier = 1.2; // Sedentario
  const act = (activityStr || "").toLowerCase();
  if (act.includes("ligero")) multiplier = 1.375;
  else if (act.includes("moderado")) multiplier = 1.55;
  else if (act.includes("activo")) multiplier = 1.725;
  else if (act.includes("intenso") || act.includes("atleta")) multiplier = 1.9;

  const tdee = bmr * multiplier;
  let targetKcal = tdee;

  const goalStr = goals.join(" ").toLowerCase();
  if (goalStr.includes("perder") || goalStr.includes("bajar")) {
    targetKcal -= 400;
  } else if (goalStr.includes("ganar") || goalStr.includes("masa") || goalStr.includes("musculo")) {
    targetKcal += 300;
  }

  // Safety floor
  if (isMale && targetKcal < 1500) targetKcal = 1500;
  if (!isMale && targetKcal < 1200) targetKcal = 1200;

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), targetKcal: Math.round(targetKcal) };
}

export function generateSmaePortionsFromKcal(targetKcal: number, weightKg: number, goals: string[]): Record<string, number> {
  const goalStr = goals.join(" ").toLowerCase();
  const isLoss = goalStr.includes("perder");
  const isMuscle = goalStr.includes("musculo") || goalStr.includes("ganar");
  
  // Protein: 1.8g to 2.2g per kg
  let proteinPerKg = 1.8;
  if (isLoss) proteinPerKg = 2.0;
  if (isMuscle) proteinPerKg = 2.2;
  
  let targetProteinGrops = Math.round((weightKg * proteinPerKg) / 7);

  // Fixed healthy bases
  let verduras = isLoss ? 4 : 3;
  let frutas = isLoss ? 2 : 3;
  let lacteos = 1;

  // Let subtract what we have so far
  let kcalUsed = (verduras * 25) + (frutas * 60) + (lacteos * 95) + (targetProteinGrops * 75);
  let kcalLeftForEnergy = targetKcal - kcalUsed;

  // Split remainder between fats and carbs (cereals). Cereals = 70kcal, Grasas = 45kcal
  // Ratio: roughly 40% fat, 60% cereals of remainder
  let fatKcal = kcalLeftForEnergy * 0.45;
  let carbKcal = kcalLeftForEnergy * 0.55;

  let grasas = Math.max(2, Math.round(fatKcal / 45));
  let cereales = Math.max(2, Math.round(carbKcal / 70));

  return {
    verduras,
    frutas,
    lacteos,
    proteina: targetProteinGrops,
    grasas,
    cereales,
    leguminosas: 0 // Optional / Flexible swap by user
  };
}

export function distributeSmaeToMeals(portions: Record<string, number>, mealsCount: number): Record<string, Record<string, number>> {
  const mealKeys = mealsCount === 5 
    ? ["desayuno", "colacion_am", "comida", "colacion_pm", "cena"]
    : ["desayuno", "comida", "cena"];
    
  const grid: Record<string, Record<string, number>> = {};
  mealKeys.forEach(m => grid[m] = { verduras:0, frutas:0, lacteos:0, proteina:0, grasas:0, cereales:0, leguminosas:0 });

  // Greedy distribution
  const distribute = (group: string, total: number) => {
    let remaining = total;
    while(remaining > 0) {
      for (const m of mealKeys) {
        if (remaining <= 0) break;
        // Rules
        if (group === "proteina" && m.includes("colacion") && grid[m].proteina >= 1) continue;
        if (group === "cereales" && m.includes("colacion")) continue; // Avoid carbs in snacks
        
        grid[m][group] = (grid[m][group] || 0) + 1;
        remaining--;
      }
    }
  };

  Object.entries(portions).forEach(([group, amount]) => distribute(group, amount));
  return grid;
}

