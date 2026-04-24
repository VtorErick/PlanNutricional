import type { SupplementCatalogItem } from '../data/supplementsDB';

export interface BodyMeasurements {
  waistCm?: string;
  hipCm?: string;
  neckCm?: string;
  chestCm?: string;
  armCm?: string;
  thighCm?: string;
}

export interface QuestionnaireInput {
  age?: string;
  currentWeightKg?: string;
  heightCm?: string;
  targetWeightKg?: string;
  objectives?: string[];
  objectiveTimeline?: string;
  activityLevel?: string;
  wakeTime?: string;
  sleepTime?: string;
  diagnostics?: string;
  allergies?: string;
  medications?: string;
  intolerances?: string;
  digestiveSymptoms?: string;
  bodyMeasurements?: BodyMeasurements;
}

export interface GeneratedProfile {
  id: string;
  nombre: string;
  edad: number;
  descripcion: string;
  perfil: string;
  detallesPerfil: string;
  meta: string;
  metaCaloricaKcalDia: number;
  horariosTexto: string;
  notaSalud: string;
  momentos: { key: string; label: string; hora: string }[];
  objetivosPorMomento: Record<string, Record<string, number>>;
  distribucionDiaria: { grupo: string; total: number; detalle: string }[];
  resumenPersonal: string[];
}

const FOOD_GROUP_KEYS = [
  'frutas',
  'verduras',
  'cereales',
  'leguminosas',
  'lacteos',
  'proteina',
  'grasas',
];

const MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
const MOMENT_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  colacion_am: 'Colación mañana',
  comida: 'Comida',
  colacion_pm: 'Colación tarde',
  cena: 'Cena',
};

function parseNumber(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeImc(weightKg: number, heightM: number): number {
  return heightM > 0 ? weightKg / (heightM * heightM) : 0;
}

function imcLabel(imc: number): string {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Peso saludable';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/**
 * Mifflin-St Jeor formula
 * Men: 10*weight + 6.25*height - 5*age + 5
 * Women: 10*weight + 6.25*height - 5*age - 161
 */
function computeBmr(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return isMale ? base + 5 : base - 161;
}

function activityMultiplier(level: string): number {
  const normalized = (level || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('ligero') || normalized.includes('bajo')) return 1.375;
  if (normalized.includes('moderado')) return 1.55;
  if (normalized.includes('alto') || normalized.includes('intenso') || normalized.includes('muy')) return 1.725;
  return 1.2; // sedentario default
}

function computeTargetCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  isMale: boolean,
  activityLevel: string,
  objectives: string[]
): number {
  const bmr = computeBmr(weightKg, heightCm, age, isMale);
  const tdee = Math.round(bmr * activityMultiplier(activityLevel));

  const objStr = (objectives || []).join(' ').toLowerCase();
  let adjustment = 0;

  if (objStr.includes('bajar') || objStr.includes('perder') || objStr.includes('grasa') || objStr.includes('deficit')) {
    adjustment = -400;
  } else if (objStr.includes('aumentar') || objStr.includes('masa') || objStr.includes('musculo') || objStr.includes('ganar')) {
    adjustment = +300;
  } else if (objStr.includes('mantener') || objStr.includes('tonificar')) {
    adjustment = -100;
  }

  const result = tdee + adjustment;
  // Clamp to safe ranges
  if (isMale) {
    return Math.max(1600, Math.min(3200, result));
  }
  return Math.max(1300, Math.min(2600, result));
}

function computeDistribution(calories: number, isMale: boolean): Record<string, number> {
  // SMAE portions based on caloric target
  // These are approximate clinical guidelines
  const base: Record<string, number> = {
    frutas: 3,
    verduras: 4,
    cereales: isMale ? 6 : 5,
    leguminosas: 1,
    lacteos: 2,
    proteina: isMale ? 7 : 5,
    grasas: 3,
  };

  // Adjust based on calories
  if (calories >= 2500) {
    base.cereales += 2;
    base.proteina += 2;
    base.grasas += 1;
  } else if (calories >= 2200) {
    base.cereales += 1;
    base.proteina += 1;
    base.grasas += 1;
  } else if (calories <= 1500) {
    base.cereales -= 1;
    base.proteina -= 1;
    base.frutas -= 1;
  }

  // Ensure minimums
  Object.keys(base).forEach((k) => {
    base[k] = Math.max(0, base[k]);
  });

  return base;
}

function distributeToMoments(distribution: Record<string, number>): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  MOMENT_KEYS.forEach((mk) => {
    result[mk] = {};
    FOOD_GROUP_KEYS.forEach((gk) => {
      result[mk][gk] = 0;
    });
  });

  // Desayuno: gets cereals, protein, dairy, fats, some fruit
  result.desayuno.cereales = Math.ceil(distribution.cereales * 0.35);
  result.desayuno.proteina = Math.ceil(distribution.proteina * 0.3);
  result.desayuno.lacteos = Math.min(1, distribution.lacteos);
  result.desayuno.grasas = Math.ceil(distribution.grasas * 0.3);
  result.desayuno.frutas = Math.min(1, distribution.frutas);

  // Colación AM: fruit, maybe some cereal/grains
  result.colacion_am.frutas = Math.min(1, Math.max(0, distribution.frutas - 1));
  result.colacion_am.cereales = Math.min(1, Math.max(0, distribution.cereales - result.desayuno.cereales));
  result.colacion_am.grasas = Math.min(1, Math.max(0, distribution.grasas - result.desayuno.grasas));

  // Comida: vegetables, cereals, protein, fats, legumes
  result.comida.verduras = Math.ceil(distribution.verduras * 0.5);
  result.comida.cereales = Math.min(2, Math.max(0, distribution.cereales - result.desayuno.cereales - result.colacion_am.cereales));
  result.comida.proteina = Math.ceil(distribution.proteina * 0.45);
  result.comida.leguminosas = distribution.leguminosas;
  result.comida.grasas = Math.min(1, Math.max(0, distribution.grasas - result.desayuno.grasas - result.colacion_am.grasas));

  // Colación PM: remaining fruit, some protein, dairy if left
  result.colacion_pm.frutas = Math.min(1, Math.max(0, distribution.frutas - result.desayuno.frutas - result.colacion_am.frutas));
  result.colacion_pm.proteina = Math.min(1, Math.max(0, distribution.proteina - result.desayuno.proteina - result.comida.proteina));
  result.colacion_pm.lacteos = Math.min(1, Math.max(0, distribution.lacteos - result.desayuno.lacteos));

  // Cena: vegetables, cereals, protein, fats
  result.cena.verduras = Math.max(0, distribution.verduras - result.comida.verduras);
  result.cena.cereales = Math.max(0, distribution.cereales - result.desayuno.cereales - result.colacion_am.cereales - result.comida.cereales);
  result.cena.proteina = Math.max(0, distribution.proteina - result.desayuno.proteina - result.comida.proteina - result.colacion_pm.proteina);
  result.cena.grasas = Math.max(0, distribution.grasas - result.desayuno.grasas - result.colacion_am.grasas - result.comida.grasas);
  result.cena.frutas = Math.max(0, distribution.frutas - result.desayuno.frutas - result.colacion_am.frutas - result.colacion_pm.frutas);
  result.cena.lacteos = Math.max(0, distribution.lacteos - result.desayuno.lacteos - result.colacion_pm.lacteos);

  return result;
}

function buildMomentos(wakeTime?: string, sleepTime?: string): { key: string; label: string; hora: string }[] {
  // Default schedule if no times provided
  const wake = wakeTime || '07:00';
  const sleep = sleepTime || '22:30';

  return [
    { key: 'desayuno', label: 'Desayuno', hora: wake },
    { key: 'colacion_am', label: 'Colación mañana', hora: addHours(wake, 3) },
    { key: 'comida', label: 'Comida', hora: addHours(wake, 6) },
    { key: 'colacion_pm', label: 'Colación tarde', hora: addHours(wake, 9) },
    { key: 'cena', label: 'Cena', hora: subtractHours(sleep, 2) },
  ];
}

function addHours(timeStr: string, hours: number): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h + hours, m || 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
}

function subtractHours(timeStr: string, hours: number): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h - hours, m || 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
}

function computeSupplements(objectives: string[], diagnostics: string): string[] {
  const result = new Set<string>();
  const obj = (objectives || []).join(' ').toLowerCase();
  const diag = (diagnostics || '').toLowerCase();

  if (obj.includes('musculo') || obj.includes('masa') || obj.includes('fuerza') || obj.includes('deport')) {
    result.add('sup_whey');
    result.add('sup_creatina');
  }

  if (obj.includes('bajar') || obj.includes('perder') || obj.includes('grasa') || obj.includes('tonificar')) {
    result.add('sup_whey');
  }

  if (diag.includes('diabetes') || diag.includes('insulina') || diag.includes('sop')) {
    result.add('sup_magnesio');
    result.add('sup_omega3');
  }

  if (diag.includes('hipertension') || diag.includes('presion')) {
    result.add('sup_omega3');
  }

  if (diag.includes('hipotiroid') || diag.includes('tiroides')) {
    result.add('sup_omega3');
    result.add('sup_multivitamin');
  }

  if (obj.includes('estres') || obj.includes('ansiedad') || obj.includes('dormir') || obj.includes('sueno')) {
    result.add('sup_magnesio');
    result.add('sup_ashwagandha');
  }

  if (diag.includes('gastritis') || diag.includes('colitis') || diag.includes('reflujo')) {
    result.add('sup_probioticos');
  }

  // Default for active people
  if (result.size === 0) {
    result.add('sup_multivitamin');
    result.add('sup_omega3');
  }

  return Array.from(result).slice(0, 5);
}

function buildDescription(objectives: string[], activityLevel: string): string {
  const obj = (objectives || []).join(', ');
  const act = activityLevel || 'moderado';
  return `Plan personalizado para: ${obj}. Nivel de actividad ${act.toLowerCase()}. Distribución balanceada con énfasis en saciedad y adherencia.`;
}

function buildHealthNote(diagnostics: string, allergies: string, medications: string): string {
  const parts: string[] = [];
  if (diagnostics) parts.push(`Consideraciones médicas: ${diagnostics}.`);
  if (allergies) parts.push(`Alergias a considerar: ${allergies}.`);
  if (medications) parts.push(`Interacciones con medicamentos: ${medications}.`);
  if (parts.length === 0) return 'Mantener hidratación adecuada y consultar cambios importantes con profesional de la salud.';
  return parts.join(' ') + ' Consultar con profesional ante cualquier duda.';
}

function buildResumenPersonal(
  imc: number,
  imcLabel: string,
  objectives: string[],
  targetWeightKg: number,
  currentWeightKg: number
): string[] {
  const result: string[] = [];
  const obj = (objectives || []).join(', ').toLowerCase();

  result.push(`IMC actual: ${imc.toFixed(1)} (${imcLabel}). Objetivos: ${obj}.`);

  if (targetWeightKg > 0 && currentWeightKg > 0) {
    const diff = currentWeightKg - targetWeightKg;
    if (diff > 0) {
      result.push(`Meta de peso: reducir ${diff.toFixed(1)} kg de forma gradual y sostenida.`);
    } else if (diff < 0) {
      result.push(`Meta de peso: aumentar ${Math.abs(diff).toFixed(1)} kg enfocándose en masa muscular.`);
    } else {
      result.push(`Meta de peso: mantener peso actual optimizando composición corporal.`);
    }
  }

  if (obj.includes('musculo') || obj.includes('masa')) {
    result.push('Énfasis en proteína distribuida a lo largo del día para optimizar síntesis proteica muscular.');
  }

  if (obj.includes('bajar') || obj.includes('perder') || obj.includes('grasa')) {
    result.push('Déficit calórico moderado priorizando saciedad con fibra y proteína para adherencia sostenida.');
  }

  result.push('El plan usa equivalentes SMAE flexibles para facilitar sustituciones sin desviarse de metas.');

  return result;
}

function buildDistribucionDetalle(distribution: Record<string, number>, momentos: Record<string, Record<string, number>>): { grupo: string; total: number; detalle: string }[] {
  const grupoLabels: Record<string, string> = {
    frutas: 'Frutas',
    verduras: 'Verduras',
    cereales: 'Cereales',
    leguminosas: 'Leguminosas',
    lacteos: 'Lácteos',
    proteina: 'Proteína',
    grasas: 'Grasas',
  };

  return FOOD_GROUP_KEYS.map((gk) => {
    const total = distribution[gk] || 0;
    const momentParts: string[] = [];
    MOMENT_KEYS.forEach((mk) => {
      const v = momentos[mk]?.[gk] || 0;
      if (v > 0) momentParts.push(`${v} ${MOMENT_LABELS[mk].toLowerCase()}`);
    });
    const detalle = momentParts.length > 0 ? momentParts.join(' + ') : 'Distribuido según preferencias';
    return { grupo: grupoLabels[gk], total, detalle };
  });
}

/**
 * Generate a complete profile locally from questionnaire data.
 */
export function generateProfile(
  input: QuestionnaireInput,
  profileId: 'el' | 'ella'
): GeneratedProfile {
  const isMale = profileId === 'el';
  const weightKg = parseNumber(input.currentWeightKg);
  const heightCm = parseNumber(input.heightCm);
  const heightM = heightCm / 100;
  const age = parseNumber(input.age);
  const targetWeightKg = parseNumber(input.targetWeightKg);

  const imc = computeImc(weightKg, heightM);
  const imcLbl = imcLabel(imc);

  const calories = computeTargetCalories(weightKg, heightCm, age, isMale, input.activityLevel || '', input.objectives || []);

  const distribution = computeDistribution(calories, isMale);
  const objetivosPorMomento = distributeToMoments(distribution);

  const momentos = buildMomentos(input.wakeTime, input.sleepTime);

  const profileLine = `${weightKg.toFixed(0)} kg | ${heightM.toFixed(2)} m | ${age} años | IMC ${imc.toFixed(1)}`;

  const targetStr = targetWeightKg > 0 ? `~${targetWeightKg.toFixed(0)} kg` : 'saludable';
  const meta = `Llegar a peso ${targetStr} enfocándose en ${(input.objectives || []).join(', ').toLowerCase()}`;

  const horariosTexto = momentos.map((m) => m.hora).join(' • ');

  return {
    id: profileId,
    nombre: isMale ? 'El' : 'Ella',
    edad: age,
    descripcion: buildDescription(input.objectives || [], input.activityLevel || ''),
    perfil: profileLine,
    detallesPerfil: `Perfil ${isMale ? 'masculino' : 'femenino'} de ${age} años. ${imcLbl} según IMC (${imc.toFixed(1)}). Actividad ${(input.activityLevel || 'moderada').toLowerCase()}.`,
    meta,
    metaCaloricaKcalDia: calories,
    horariosTexto,
    notaSalud: buildHealthNote(input.diagnostics || '', input.allergies || '', input.medications || ''),
    momentos,
    objetivosPorMomento,
    distribucionDiaria: buildDistribucionDetalle(distribution, objetivosPorMomento),
    resumenPersonal: buildResumenPersonal(imc, imcLbl, input.objectives || [], targetWeightKg, weightKg),
  };
}

/**
 * Generate supplements list from questionnaire data.
 */
export function generateSupplements(
  input: QuestionnaireInput,
  supplementsDb: SupplementCatalogItem[]
): string[] {
  const ids = computeSupplements(input.objectives || [], input.diagnostics || '');
  // Validate against DB
  const validIds = new Set(supplementsDb.map((s) => s.id));
  return ids.filter((id) => validIds.has(id));
}

export { FOOD_GROUP_KEYS, MOMENT_KEYS };
