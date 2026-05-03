import { repairPlanSlots } from '../api/generate-plan.js';
import { mealsDatabase } from '../src/data/mealsDB.ts';
import { buildOptimizedMealsCatalog } from '../src/utils/mealCatalogBuilder.ts';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const MEAL_MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];

function slotsToObject(slots: any[]) {
  const plan: any = {};
  for (const slot of slots) {
    if (!plan[slot.dia]) plan[slot.dia] = {};
    plan[slot.dia][slot.momento] = slot.opciones;
  }
  // Ensure all days/moments exist
  for (const dia of WEEK_DAYS) {
    if (!plan[dia]) plan[dia] = {};
    for (const momento of MEAL_MOMENT_KEYS) {
      if (!plan[dia][momento]) plan[dia][momento] = [];
    }
  }
  return plan;
}

async function main() {
  const fs = await import('fs');
  const prefix = process.argv[2] || 'ella';
  const model = process.argv[3] || 'deepseek-v4-flash';

  const dir = `scripts/results-${model}`;
  const planRaw = JSON.parse(fs.readFileSync(`${dir}/${prefix}-plan-parsed.json`, 'utf-8'));
  const profile = JSON.parse(fs.readFileSync(`${dir}/precomputed-${prefix}.json`, 'utf-8'));

  const slots = planRaw[`planSemanal${prefix.toUpperCase()}`] || [];
  const planObj = slotsToObject(slots);

  // Use full mealsDatabase as catalog (repairPlanSlots only needs id/momentos/macroEstimate)
  const catalog = mealsDatabase;

  const repaired = repairPlanSlots(planObj, profile, catalog);

  // Analyze issues
  let wrongMomentCount = 0;
  let badPortionsCount = 0;
  let missingMacrosCount = 0;
  const details: string[] = [];

  for (const dia of WEEK_DAYS) {
    for (const momento of MEAL_MOMENT_KEYS) {
      const options = repaired[dia][momento];
      for (const meal of options) {
        const idRef = String(meal.idRef || '');
        const baseId = idRef.split('|MOD:')[0].trim();
        const catalogMeal = catalog.find((m: any) => m.id === baseId);
        if (!catalogMeal || !catalogMeal.momentos?.includes(momento)) {
          wrongMomentCount++;
          details.push(`${dia} ${momento}: ${idRef} no es valido para este momento`);
        }

        const por = meal.porciones;
        if (typeof por !== 'string' || por.trim().length < 10) {
          badPortionsCount++;
          details.push(`${dia} ${momento} ${meal.idRef}: porciones malformadas -> ${JSON.stringify(por)}`);
        }

        if (!Number.isFinite(Number(meal.caloriasKcal)) || !Number.isFinite(Number(meal.proteinaG))) {
          missingMacrosCount++;
        }
      }
    }
  }

  console.log(`\n=== Verificacion ${prefix} (${model}) ===`);
  console.log(`Comidas con idRef de momento incorrecto: ${wrongMomentCount}`);
  console.log(`Comidas con porciones malformadas: ${badPortionsCount}`);
  console.log(`Comidas con macros faltantes: ${missingMacrosCount}`);

  if (details.length) {
    console.log('\n--- Primeros 10 detalles ---');
    details.slice(0, 10).forEach((d) => console.log(d));
  }

  // Save repaired plan for inspection
  fs.writeFileSync(`${dir}/${prefix}-plan-repaired.json`, JSON.stringify(repaired, null, 2));
  console.log(`\nPlan reparado guardado en ${dir}/${prefix}-plan-repaired.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
