import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repairPlanSlots, calculateMomentMacros, scaleMomentMacrosToDailyTarget, normalizeDayName } from '../api/generate-plan.js';
import { mealsDatabase } from '../src/data/mealsDB.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEAL_MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];

function slotsToObject(slots: any[]) {
  const plan: any = {};
  for (const slot of slots) {
    const dia = normalizeDayName(slot.dia);
    if (!plan[dia]) plan[dia] = {};
    plan[dia][slot.momento] = slot.opciones;
  }
  for (const dia of WEEK_DAYS) {
    if (!plan[dia]) plan[dia] = {};
    for (const momento of MEAL_MOMENT_KEYS) {
      if (!plan[dia][momento]) plan[dia][momento] = [];
    }
  }
  return plan;
}

function verifyPlan(prefix: string, model: string) {
  const dir = path.join(repoRoot, 'scripts', `results-${model}`);
  const planRaw = JSON.parse(readFileSync(path.join(dir, `${prefix}-plan-parsed.json`), 'utf-8'));
  const profile = JSON.parse(readFileSync(path.join(dir, `precomputed-${prefix}.json`), 'utf-8'));
  const slots = planRaw[`planSemanal${prefix.toUpperCase()}`] || [];
  const planObj = slotsToObject(slots);

  // Apply server-side repair exactly as the API does
  const repaired = repairPlanSlots(planObj, profile, mealsDatabase);

  const baseMomentMacros = calculateMomentMacros(profile.objetivosPorMomento);
  const targetMomentMacros = scaleMomentMacrosToDailyTarget(
    baseMomentMacros,
    profile.objetivosPorMomento,
    profile.metaCaloricaKcalDia || 0
  );

  console.log(`\n=== Verificacion ${prefix.toUpperCase()} (${model}) ===`);
  console.log(`Meta calorica: ${profile.metaCaloricaKcalDia} kcal`);

  let errors = 0;
  const diaVerificar = 'Lunes'; // Solo verificamos un dia representativo
  let diaKcal = 0, diaProt = 0, diaCarb = 0, diaFat = 0;

  for (const momento of MEAL_MOMENT_KEYS) {
    const options = repaired[diaVerificar]?.[momento] || [];
    if (options.length === 0) {
      console.log(`ERROR: ${diaVerificar} ${momento} sin opciones`);
      errors++;
      continue;
    }

    const target = targetMomentMacros[momento];
    const first = options[0];
    const kcal = Number(first.caloriasKcal || first.kcal || 0);
    const prot = Number(first.proteinaG || 0);
    const carb = Number(first.carbohidratosG || 0);
    const fat = Number(first.grasasG || 0);

    diaKcal += kcal;
    diaProt += prot;
    diaCarb += carb;
    diaFat += fat;

    // Macros dentro de +/- 10% (o minimo 3g para valores pequenos)
    const tol = 0.10;
    const minTol = 3;
    if (target.kcal > 0 && Math.abs(kcal - target.kcal) > Math.max(target.kcal * tol, minTol)) {
      console.log(`ERROR ${diaVerificar} ${momento} kcal: ${kcal} vs objetivo ${target.kcal}`);
      errors++;
    }
    if (target.protein > 0 && Math.abs(prot - target.protein) > Math.max(target.protein * tol, minTol)) {
      console.log(`ERROR ${diaVerificar} ${momento} prot: ${prot} vs objetivo ${target.protein}`);
      errors++;
    }
    if (target.carbs > 0 && Math.abs(carb - target.carbs) > Math.max(target.carbs * tol, minTol)) {
      console.log(`ERROR ${diaVerificar} ${momento} carb: ${carb} vs objetivo ${target.carbs}`);
      errors++;
    }
    if (target.fat > 0 && Math.abs(fat - target.fat) > Math.max(target.fat * tol, minTol)) {
      console.log(`ERROR ${diaVerificar} ${momento} fat: ${fat} vs objetivo ${target.fat}`);
      errors++;
    }

    // Cierre calorico
    const calcKcal = prot * 4 + carb * 4 + fat * 9;
    if (Math.abs(kcal - calcKcal) > 20) {
      console.log(`ERROR ${diaVerificar} ${momento} cierre: ${kcal} vs calc ${calcKcal} (P${prot} C${carb} F${fat})`);
      errors++;
    }

    // Coherencia de porciones: el string debe mencionar cada grupo con qty>0
    // (usamos singular porque PORTION_LABELS genera singular)
    const portions = String(first.porciones || '').toLowerCase();
    const goals = profile.objetivosPorMomento[momento];
    if (goals) {
      const singularMap: Record<string, string> = {
        frutas: 'fruta', verduras: 'verdura', cereales: 'cereal',
        leguminosas: 'leguminosa', lacteos: 'lacteo', proteina: 'proteina', grasas: 'grasa',
      };
      Object.entries(goals).forEach(([group, qty]: any) => {
        if (qty > 0) {
          const term = singularMap[group] || group;
          if (!portions.includes(term)) {
            console.log(`ERROR ${diaVerificar} ${momento} falta ${group} en porciones: "${portions}"`);
            errors++;
          }
        }
      });
    }

    // Verificar que las 3 opciones sean intercambiables (mismos macros aprox)
    if (options.length >= 2) {
      const second = options[1];
      const kcal2 = Number(second.caloriasKcal || second.kcal || 0);
      if (Math.abs(kcal - kcal2) > target.kcal * 0.15) {
        console.log(`WARN ${diaVerificar} ${momento} opciones no intercambiables: ${kcal} vs ${kcal2}`);
        errors++;
      }
    }
  }

  const kcalTolerance = profile.metaCaloricaKcalDia * 0.10;
  if (Math.abs(diaKcal - profile.metaCaloricaKcalDia) > kcalTolerance) {
    console.log(`ERROR TOTAL ${diaVerificar}: ${diaKcal} kcal vs meta ${profile.metaCaloricaKcalDia}`);
    errors++;
  } else {
    console.log(`OK Suma ${diaVerificar}: ${diaKcal} kcal (meta ${profile.metaCaloricaKcalDia})`);
  }

  // Verificar consistencia entre todos los dias
  let diasInconsistentes = 0;
  for (const dia of WEEK_DAYS) {
    let diaSum = 0;
    for (const momento of MEAL_MOMENT_KEYS) {
      const opts = repaired[dia]?.[momento] || [];
      if (opts.length > 0) diaSum += Number(opts[0].caloriasKcal || opts[0].kcal || 0);
    }
    if (Math.abs(diaSum - profile.metaCaloricaKcalDia) > kcalTolerance) {
      diasInconsistentes++;
    }
  }
  if (diasInconsistentes > 0) {
    console.log(`ERROR: ${diasInconsistentes} dias no llegan a la meta calorica`);
    // Mostrar cuales
    for (const dia of WEEK_DAYS) {
      let diaSum = 0;
      for (const momento of MEAL_MOMENT_KEYS) {
        const opts = repaired[dia]?.[momento] || [];
        if (opts.length > 0) diaSum += Number(opts[0].caloriasKcal || opts[0].kcal || 0);
      }
      if (Math.abs(diaSum - profile.metaCaloricaKcalDia) > kcalTolerance) {
        console.log(`  -> ${dia}: ${diaSum} kcal`);
      }
    }
    errors++;
  } else {
    console.log(`OK Todos los dias cierran con la meta`);
  }

  console.log(`Total errores: ${errors}`);
  return errors === 0;
}

const allOk = [
  verifyPlan('el', 'deepseek-v4-flash'),
  verifyPlan('ella', 'deepseek-v4-flash'),
  verifyPlan('el', 'deepseek-v4-pro'),
  verifyPlan('ella', 'deepseek-v4-pro'),
].every(Boolean);

process.exit(allOk ? 0 : 1);
