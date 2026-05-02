const FOOD_GROUP_KEYS = [
  'frutas', 'verduras', 'cereales', 'leguminosas', 'lacteos', 'proteina', 'grasas',
];

const MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
const MOMENT_LABELS = {
  desayuno: 'Desayuno',
  colacion_am: 'Colación mañana',
  comida: 'Comida',
  colacion_pm: 'Colación tarde',
  cena: 'Cena',
};

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function pickFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeQuestionnaireInput(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const profileContext = isPlainObject(source.profileContext) ? source.profileContext : {};
  const healthContext = isPlainObject(source.healthContext) ? source.healthContext : {};
  const preferences = isPlainObject(source.preferences) ? source.preferences : {};
  const routine = isPlainObject(source.routine) ? source.routine : {};

  return {
    ...source,
    age: pickFirstDefined(source.age, profileContext.age),
    currentWeightKg: pickFirstDefined(source.currentWeightKg, profileContext.currentWeightKg),
    heightCm: pickFirstDefined(source.heightCm, profileContext.heightCm),
    targetWeightKg: pickFirstDefined(source.targetWeightKg, profileContext.targetWeightKg),
    objectives: pickFirstDefined(source.objectives, profileContext.objectives) || [],
    objectiveTimeline: pickFirstDefined(
      source.objectiveTimeline,
      profileContext.objectiveTimeline,
      profileContext.objectiveTimelineWeeks
    ),
    clinicalPortionsGrid: pickFirstDefined(source.clinicalPortionsGrid, profileContext.clinicalPortionsGrid),
    diagnostics: pickFirstDefined(source.diagnostics, healthContext.diagnostics),
    allergies: pickFirstDefined(source.allergies, healthContext.allergies),
    medications: pickFirstDefined(source.medications, healthContext.medications),
    intolerances: pickFirstDefined(source.intolerances, healthContext.intolerances),
    digestiveSymptoms: pickFirstDefined(source.digestiveSymptoms, healthContext.digestiveSymptoms),
    favoriteFoods: pickFirstDefined(source.favoriteFoods, preferences.favoriteFoods),
    dislikedFoods: pickFirstDefined(source.dislikedFoods, preferences.dislikedFoods),
    favoriteCuisineStyles: pickFirstDefined(source.favoriteCuisineStyles, preferences.favoriteCuisineStyles),
    cookingTime: pickFirstDefined(source.cookingTime, preferences.cookingTime),
    activityLevel: pickFirstDefined(source.activityLevel, routine.activityLevel),
    wakeTime: pickFirstDefined(source.wakeTime, routine.wakeTime),
    sleepTime: pickFirstDefined(source.sleepTime, routine.sleepTime),
    trainingFrequency: pickFirstDefined(source.trainingFrequency, routine.trainingFrequency),
    bodyMeasurements: pickFirstDefined(source.bodyMeasurements, profileContext.bodyMeasurements),
  };
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeImc(weightKg, heightM) {
  return heightM > 0 ? weightKg / (heightM * heightM) : 0;
}

function imcLabel(imc) {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Peso saludable';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}

function computeBmr(weightKg, heightCm, age, isMale) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return isMale ? base + 5 : base - 161;
}

function activityMultiplier(level) {
  const normalized = String(level || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('ligero') || normalized.includes('bajo')) return 1.375;
  if (normalized.includes('moderado')) return 1.55;
  if (normalized.includes('alto') || normalized.includes('intenso') || normalized.includes('muy')) return 1.725;
  return 1.2;
}

function computeTargetCalories(weightKg, heightCm, age, isMale, activityLevel, objectives) {
  const bmr = computeBmr(weightKg, heightCm, age, isMale);
  const tdee = Math.round(bmr * activityMultiplier(activityLevel));
  const objStr = (objectives || []).join(' ').toLowerCase();
  let adjustment = 0;
  if (objStr.includes('bajar') || objStr.includes('perder') || objStr.includes('grasa') || objStr.includes('deficit')) adjustment = -400;
  else if (objStr.includes('aumentar') || objStr.includes('masa') || objStr.includes('musculo') || objStr.includes('ganar')) adjustment = +300;
  else if (objStr.includes('mantener') || objStr.includes('tonificar')) adjustment = -100;
  const result = tdee + adjustment;
  if (isMale) return Math.max(1600, Math.min(3200, result));
  return Math.max(1300, Math.min(2600, result));
}

function computeDistribution(calories, isMale) {
  const base = {
    frutas: 3, verduras: 4, cereales: isMale ? 6 : 5, leguminosas: 1, lacteos: 2, proteina: isMale ? 7 : 5, grasas: 3,
  };
  if (calories >= 2500) { base.cereales += 2; base.proteina += 2; base.grasas += 1; }
  else if (calories >= 2200) { base.cereales += 1; base.proteina += 1; base.grasas += 1; }
  else if (calories <= 1500) { base.cereales -= 1; base.proteina -= 1; base.frutas -= 1; }
  Object.keys(base).forEach((k) => { base[k] = Math.max(0, base[k]); });
  return base;
}

function distributeToMoments(distribution) {
  const result = {};
  MOMENT_KEYS.forEach((mk) => { result[mk] = {}; FOOD_GROUP_KEYS.forEach((gk) => { result[mk][gk] = 0; }); });
  result.desayuno.cereales = Math.ceil(distribution.cereales * 0.35);
  result.desayuno.proteina = Math.max(1, Math.round(distribution.proteina * 0.3));
  result.desayuno.lacteos = Math.min(1, distribution.lacteos);
  result.desayuno.grasas = Math.ceil(distribution.grasas * 0.3);
  result.desayuno.frutas = Math.min(1, distribution.frutas);
  result.colacion_am.frutas = Math.min(1, Math.max(0, distribution.frutas - 1));
  result.colacion_am.cereales = Math.min(1, Math.max(0, distribution.cereales - result.desayuno.cereales));
  result.colacion_am.grasas = Math.min(1, Math.max(0, distribution.grasas - result.desayuno.grasas));
  result.comida.verduras = Math.ceil(distribution.verduras * 0.5);
  result.comida.cereales = Math.min(2, Math.max(0, distribution.cereales - result.desayuno.cereales - result.colacion_am.cereales));
  result.comida.proteina = Math.max(1, Math.round(distribution.proteina * 0.45));
  result.comida.leguminosas = distribution.leguminosas;
  result.comida.grasas = Math.min(1, Math.max(0, distribution.grasas - result.desayuno.grasas - result.colacion_am.grasas));
  result.colacion_pm.frutas = Math.min(1, Math.max(0, distribution.frutas - result.desayuno.frutas - result.colacion_am.frutas));
  result.colacion_pm.proteina = 0;
  result.colacion_pm.lacteos = Math.min(1, Math.max(0, distribution.lacteos - result.desayuno.lacteos));
  result.cena.verduras = Math.max(0, distribution.verduras - result.comida.verduras);
  result.cena.cereales = Math.max(0, distribution.cereales - result.desayuno.cereales - result.colacion_am.cereales - result.comida.cereales);
  result.cena.proteina = Math.max(0, distribution.proteina - result.desayuno.proteina - result.comida.proteina - result.colacion_pm.proteina);
  result.cena.grasas = Math.max(0, distribution.grasas - result.desayuno.grasas - result.colacion_am.grasas - result.comida.grasas);
  result.cena.frutas = Math.max(0, distribution.frutas - result.desayuno.frutas - result.colacion_am.frutas - result.colacion_pm.frutas);
  result.cena.lacteos = Math.max(0, distribution.lacteos - result.desayuno.lacteos - result.colacion_pm.lacteos);
  return result;
}

function addHours(timeStr, hours) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h + hours, m || 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return timeStr; }
}

function subtractHours(timeStr, hours) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h - hours, m || 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return timeStr; }
}

function buildMomentos(wakeTime, sleepTime, selectedMoments) {
  if (Array.isArray(selectedMoments) && selectedMoments.length > 0) {
    const byKey = new Map(
      selectedMoments
        .filter((moment) => moment && MOMENT_KEYS.includes(moment.key))
        .map((moment) => [moment.key, moment])
    );
    const normalized = MOMENT_KEYS
      .map((key) => byKey.get(key))
      .filter(Boolean)
      .map((moment) => ({
        key: moment.key,
        label: moment.label || MOMENT_LABELS[moment.key],
        hora: moment.hora || '',
      }));

    if (normalized.length === MOMENT_KEYS.length && normalized.every((moment) => moment.hora)) {
      return normalized;
    }
  }

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

function computeSupplements(objectives, diagnostics) {
  const result = new Set();
  const obj = (objectives || []).join(' ').toLowerCase();
  const diag = String(diagnostics || '').toLowerCase();
  if (obj.includes('musculo') || obj.includes('masa') || obj.includes('fuerza') || obj.includes('deport')) { result.add('sup_whey'); result.add('sup_creatina'); }
  if (obj.includes('bajar') || obj.includes('perder') || obj.includes('grasa') || obj.includes('tonificar')) { result.add('sup_whey'); }
  if (diag.includes('diabetes') || diag.includes('insulina') || diag.includes('sop')) { result.add('sup_magnesio'); result.add('sup_omega3'); }
  if (diag.includes('hipertension') || diag.includes('presion')) { result.add('sup_omega3'); }
  if (diag.includes('hipotiroid') || diag.includes('tiroides')) { result.add('sup_omega3'); result.add('sup_multivitamin'); }
  if (obj.includes('estres') || obj.includes('ansiedad') || obj.includes('dormir') || obj.includes('sueno')) { result.add('sup_magnesio'); result.add('sup_ashwagandha'); }
  if (diag.includes('gastritis') || diag.includes('colitis') || diag.includes('reflujo')) { result.add('sup_probioticos'); }
  if (result.size === 0) { result.add('sup_multivitamin'); result.add('sup_omega3'); }
  return Array.from(result).slice(0, 5);
}

function buildDescription(objectives, activityLevel) {
  return `Plan personalizado para: ${(objectives || []).join(', ')}. Nivel de actividad ${(activityLevel || 'moderado').toLowerCase()}. Distribución balanceada con énfasis en saciedad y adherencia.`;
}

function buildHealthNote(diagnostics, allergies, medications) {
  const parts = [];
  if (diagnostics) parts.push(`Consideraciones médicas: ${diagnostics}.`);
  if (allergies) parts.push(`Alergias a considerar: ${allergies}.`);
  if (medications) parts.push(`Interacciones con medicamentos: ${medications}.`);
  if (parts.length === 0) return 'Mantener hidratación adecuada y consultar cambios importantes con profesional de la salud.';
  return parts.join(' ') + ' Consultar con profesional ante cualquier duda.';
}

function buildResumenPersonal(imc, imcLabel, objectives, targetWeightKg, currentWeightKg) {
  const result = [];
  const obj = (objectives || []).join(', ').toLowerCase();
  result.push(`IMC actual: ${imc.toFixed(1)} (${imcLabel}). Objetivos: ${obj}.`);
  if (targetWeightKg > 0 && currentWeightKg > 0) {
    const diff = currentWeightKg - targetWeightKg;
    if (diff > 0) result.push(`Meta de peso: reducir ${diff.toFixed(1)} kg de forma gradual y sostenida.`);
    else if (diff < 0) result.push(`Meta de peso: aumentar ${Math.abs(diff).toFixed(1)} kg enfocándose en masa muscular.`);
    else result.push(`Meta de peso: mantener peso actual optimizando composición corporal.`);
  }
  if (obj.includes('musculo') || obj.includes('masa')) result.push('Énfasis en proteína distribuida a lo largo del día para optimizar síntesis proteica muscular.');
  if (obj.includes('bajar') || obj.includes('perder') || obj.includes('grasa')) result.push('Déficit calórico moderado priorizando saciedad con fibra y proteína para adherencia sostenida.');
  result.push('El plan usa equivalentes SMAE flexibles para facilitar sustituciones sin desviarse de metas.');
  return result;
}

function buildDistribucionDetalle(distribution, momentos) {
  const grupoLabels = { frutas: 'Frutas', verduras: 'Verduras', cereales: 'Cereales', leguminosas: 'Leguminosas', lacteos: 'Lácteos', proteina: 'Proteína', grasas: 'Grasas' };
  return FOOD_GROUP_KEYS.map((gk) => {
    const total = distribution[gk] || 0;
    const momentParts = [];
    MOMENT_KEYS.forEach((mk) => { const v = momentos[mk]?.[gk] || 0; if (v > 0) momentParts.push(`${v} ${MOMENT_LABELS[mk].toLowerCase()}`); });
    const detalle = momentParts.length > 0 ? momentParts.join(' + ') : 'Distribuido según preferencias';
    return { grupo: grupoLabels[gk], total, detalle };
  });
}

export function generateProfile(input, profileId) {
  input = normalizeQuestionnaireInput(input);
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
  const momentos = buildMomentos(input.wakeTime, input.sleepTime, input.planConfig?.selectedMoments);

  return {
    id: profileId,
    nombre: isMale ? 'El' : 'Ella',
    edad: age,
    descripcion: buildDescription(input.objectives, input.activityLevel),
    perfil: `${weightKg.toFixed(0)} kg | ${heightM.toFixed(2)} m | ${age} años | IMC ${imc.toFixed(1)}`,
    detallesPerfil: `Perfil ${isMale ? 'masculino' : 'femenino'} de ${age} años. ${imcLbl} según IMC (${imc.toFixed(1)}). Actividad ${(input.activityLevel || 'moderada').toLowerCase()}.`,
    meta: `Llegar a peso ${targetWeightKg > 0 ? `~${targetWeightKg.toFixed(0)} kg` : 'saludable'} enfocándose en ${(input.objectives || []).join(', ').toLowerCase()}`,
    metaCaloricaKcalDia: calories,
    horariosTexto: momentos.map((m) => m.hora).join(' • '),
    notaSalud: buildHealthNote(input.diagnostics || '', input.allergies || '', input.medications || ''),
    momentos,
    objetivosPorMomento,
    distribucionDiaria: buildDistribucionDetalle(distribution, objetivosPorMomento),
    resumenPersonal: buildResumenPersonal(imc, imcLbl, input.objectives || [], targetWeightKg, weightKg),
  };
}

export function generateSupplements(input, supplementsDb) {
  input = normalizeQuestionnaireInput(input);
  const ids = computeSupplements(input.objectives || [], input.diagnostics || '');
  const validIds = new Set((supplementsDb || []).map((s) => s.id));
  return ids.filter((id) => validIds.has(id));
}

export { FOOD_GROUP_KEYS, MOMENT_KEYS, normalizeQuestionnaireInput };
