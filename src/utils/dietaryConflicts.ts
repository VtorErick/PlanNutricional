/**
 * Detección de conflictos alimentarios entre condiciones médicas del usuario
 * y alimentos/comidas sugeridas. Identifica interacciones peligrosas o
 * combinaciones no recomendadas.
 */

import type { CatalogMealItem } from '../data/mealsDB';

export type ConflictSeverity = 'info' | 'warning' | 'danger';

export interface DietaryConflict {
  severity: ConflictSeverity;
  type: string;                    // Categoría del conflicto
  message: string;                 // Descripción para el usuario
  suggestion: string;               // Qué hacer al respecto
  affectedMealId?: string;        // Comida específica afectada (opcional)
  affectedIngredient?: string;    // Ingrediente problemático (opcional)
}

export interface UserHealthProfile {
  diagnostics: string[];          // Ej: ['diabetes', 'hipertension']
  medications: string[];          // Ej: ['metformina', 'levotiroxina']
  allergies: string[];              // Ej: ['gluten', 'mariscos']
  intolerances: string[];         // Ej: ['lactosa', 'fructosa']
  symptoms: string[];             // Ej: ['reflujo', 'estreñimiento']
  additionalConditions: string[]; // Condiciones libres del usuario
}

// Reglas de conflicto predefinidas
interface ConflictRule {
  id: string;
  type: string;
  severity: ConflictSeverity;
  condition: (profile: UserHealthProfile, meal?: CatalogMealItem, ingredient?: string) => boolean;
  message: string | ((meal?: CatalogMealItem, ingredient?: string) => string);
  suggestion: string;
}

/**
 * Normaliza texto para comparación
 */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica si alguna condición del usuario coincide con términos dados
 */
function hasCondition(profile: UserHealthProfile, terms: string[]): boolean {
  const allConditions = [
    ...profile.diagnostics,
    ...profile.symptoms,
    ...profile.additionalConditions,
  ].map(normalize);

  return terms.some(term =>
    allConditions.some(condition => condition.includes(normalize(term)))
  );
}

/**
 * Verifica si el usuario toma algún medicamento específico
 */
function takesMedication(profile: UserHealthProfile, medications: string[]): boolean {
  const userMeds = profile.medications.map(normalize);
  return medications.some(med =>
    userMeds.some(userMed => userMed.includes(normalize(med)))
  );
}

/**
 * Verifica si el usuario tiene alergia/intolerancia a un ingrediente
 */
function hasAllergy(profile: UserHealthProfile, ingredient: string): boolean {
  const allergies = [...profile.allergies, ...profile.intolerances].map(normalize);
  const normalizedIngredient = normalize(ingredient);

  return allergies.some(allergy =>
    normalizedIngredient.includes(allergy) || allergy.includes(normalizedIngredient)
  );
}

// Reglas de conflicto
const CONFLICT_RULES: ConflictRule[] = [
  // === MEDICAMENTOS ===
  {
    id: 'metformina_alcohol',
    type: 'medicamento-alcohol',
    severity: 'danger',
    condition: (profile) =>
      takesMedication(profile, ['metformina']) &&
      hasCondition(profile, ['alcohol', 'consumo frecuente']),
    message: 'Metformina + consumo frecuente de alcohol: Riesgo de acidosis láctica',
    suggestion: 'Evitar alcohol completamente o consultar al médico sobre reducción de dosis',
  },
  {
    id: 'warfarina_vit_k',
    type: 'medicamento-nutriente',
    severity: 'danger',
    condition: (profile) =>
      takesMedication(profile, ['warfarina', 'anticoagulante']),
    message: (meal) => `${meal?.nombre || 'Esta comida'} contiene interacción potencial con anticoagulantes`,
    suggestion: 'Mantener consumo de vitamina K consistente (no aumentar ni disminuir bruscamente)',
  },

  // === CONDICIONES MÉDICAS ===
  {
    id: 'diabetes_azucar',
    type: 'condicion-carbohidratos',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['diabetes', 'insulina', 'glucosa'])) return false;
      if (!meal?.super) return false;

      const sugaryIngredients = ['azucar', 'miel', 'mermelada', 'dulce', 'refresco', 'jugo', 'pastel'];
      return meal.super.some(ing =>
        sugaryIngredients.some(sugary => normalize(ing).includes(sugary))
      );
    },
    message: (meal) => `${meal?.nombre || 'Comida'} con azúcares añadidos: Puede elevar glucosa`,
    suggestion: 'Preferir edulcorantes naturales (stevia, monk fruit) o reducir porción',
  },
  {
    id: 'diabetes_fruta_jugosa',
    type: 'condicion-fruta',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['diabetes'])) return false;
      if (!meal?.super) return false;

      const highGiFruits = ['platano', 'mango', 'uva', 'sandia', 'papaya'];
      return meal.super.some(ing =>
        highGiFruits.some(fruit => normalize(ing).includes(fruit))
      );
    },
    message: 'Frutas de alto índice glucémico: Consumir con precaución',
    suggestion: 'Combinar con proteína/grasa para reducir pico glucémico, o preferir frutas de bajo IG (bayas, manzana)',
  },
  {
    id: 'hipertension_sodio',
    type: 'condicion-sodio',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['hipertension', 'presion alta'])) return false;
      if (!meal?.super) return false;

      const highSodium = ['salsa soya', 'sopa enlatada', 'conservas', 'embutidos', 'queso procesado', 'sal'];
      return meal.super.some(ing =>
        highSodium.some(sodium => normalize(ing).includes(sodium))
      );
    },
    message: (meal) => `${meal?.nombre || 'Comida'} potencialmente alta en sodio`,
    suggestion: 'Usar hierbas y especias en lugar de sal, elegir versiones bajas en sodio',
  },
  {
    id: 'calculos_renales_oxalatos',
    type: 'condicion-mineral',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['calculos renales', 'nefrolitiasis', 'oxalato'])) return false;
      if (!meal?.super) return false;

      const highOxalate = ['espinaca', 'acelga', 'rabano', 'remolacha', 'nueces', 'chocolate', 'te negro'];
      return meal.super.some(ing =>
        highOxalate.some(oxalate => normalize(ing).includes(oxalate))
      );
    },
    message: 'Alimentos altos en oxalatos: Pueden contribuir a cálculos renales',
    suggestion: 'Cocinar verduras (reduce oxalatos), combinar con calcio en la misma comida, hidratación abundante',
  },
  {
    id: 'gota_purinas',
    type: 'condicion-purinas',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['gota', 'acido urico', 'hiperuricemia'])) return false;
      if (!meal?.super) return false;

      const highPurine = ['higado', 'rinones', 'anchoas', 'sardinas', 'mariscos', 'carnes rojas', 'cerdo'];
      return meal.super.some(ing =>
        highPurine.some(purine => normalize(ing).includes(purine))
      );
    },
    message: 'Alimentos ricos en purinas: Pueden desencadenar crisis de gota',
    suggestion: 'Limitar a 1 porción/día, preferir lácteos bajos en grasa (protegen contra gota), hidratación',
  },

  // === SÍNTOMAS DIGESTIVOS ===
  {
    id: 'reflujo_acidos',
    type: 'sintoma-acidez',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['reflujo', 'gerd', 'gastritis', 'acidez'])) return false;
      if (!meal?.super) return false;

      const triggers = ['tomate', 'cafe', 'chocolate', 'menta', 'limon', 'naranja', 'picante', 'frito'];
      return meal.super.some(ing =>
        triggers.some(trigger => normalize(ing).includes(trigger))
      );
    },
    message: (meal) => `${meal?.nombre || 'Comida'} con potencial irritante para reflujo`,
    suggestion: 'Evitar acostarse 2-3 horas después de comer, comer porciones más pequeñas',
  },
  {
    id: 'sii_fodmap',
    type: 'sintoma-digestivo',
    severity: 'info',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['sii', 'sindrome intestino', 'colitis', 'bloating'])) return false;
      if (!meal?.super) return false;

      const highFodmap = ['ajo', 'cebolla', 'huevo', 'manzana', 'pera', 'trigo', 'lacteos', 'leguminosas'];
      return meal.super.some(ing =>
        highFodmap.some(fodmap => normalize(ing).includes(fodmap))
      );
    },
    message: 'Alimentos FODMAP altos: Pueden causar distensión en SII',
    suggestion: 'Probar dieta baja en FODMAP temporalmente (2-6 semanas), reintroducir gradualmente',
  },

  // === CONDICIONES ESPECIALES ===
  {
    id: 'embarazo_alcohol',
    type: 'embarazo-alcohol',
    severity: 'danger',
    condition: (profile) => hasCondition(profile, ['embarazo', 'embarazada', 'gestacion']),
    message: 'Embarazo: Consumo de alcohol está contraindicado',
    suggestion: 'Evitar alcohol completamente durante el embarazo y lactancia',
  },
  {
    id: 'embarazo_sushi',
    type: 'embarazo-pescado',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['embarazo'])) return false;
      if (!meal?.super) return false;

      const rawFish = ['sushi', 'sashimi', 'pescado crudo', 'mariscos crudos'];
      return meal.super.some(ing =>
        rawFish.some(raw => normalize(ing).includes(raw))
      );
    },
    message: 'Pescado crudo en embarazo: Riesgo de parásitos/bacterias',
    suggestion: 'Preferir pescado bien cocido, evitar tempurizado o crudo',
  },
  {
    id: 'hipotiroidismo_soya',
    type: 'tiroides-soya',
    severity: 'info',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['hipotiroidismo', 'tiroides'])) return false;
      if (!meal?.super) return false;

      const goitrogenic = ['soya', 'tofu', 'edamame', 'miso', 'tempeh'];
      return meal.super.some(ing =>
        goitrogenic.some(soy => normalize(ing).includes(soy))
      );
    },
    message: 'Soya en hipotiroidismo: Potencial interferente si se consume en grandes cantidades',
    suggestion: 'Separar consumo de soya de la toma de levotiroxina por 4 horas, moderar cantidad',
  },
  {
    id: 'anemia_absorcion',
    type: 'anemia-hierro',
    severity: 'warning',
    condition: (profile, meal) => {
      if (!hasCondition(profile, ['anemia', 'deficiencia hierro'])) return false;
      if (!meal?.super) return false;

      const ironInhibitors = ['te', 'cafe', 'calcio', 'yogurt', 'leche', 'queso'];
      return meal.super.some(ing =>
        ironInhibitors.some(inhibitor => normalize(ing).includes(inhibitor))
      );
    },
    message: 'Inhibidores de absorción de hierro: Pueden reducir eficacia del tratamiento',
    suggestion: 'Consumir fuentes de hierro (carne, leguminosas) separadas de calcio/cafeína por 2 horas',
  },
];

/**
 * Detecta conflictos entre perfil de salud del usuario y una comida específica
 */
export function detectConflictsForMeal(
  profile: UserHealthProfile,
  meal: CatalogMealItem
): DietaryConflict[] {
  const conflicts: DietaryConflict[] = [];

  for (const rule of CONFLICT_RULES) {
    if (rule.condition(profile, meal)) {
      conflicts.push({
        severity: rule.severity,
        type: rule.type,
        message: typeof rule.message === 'function' ? rule.message(meal) : rule.message,
        suggestion: rule.suggestion,
        affectedMealId: meal.id,
      });
    }
  }

  // Verificar contraindicaciones médicas específicas de la comida
  if (meal.medicalContraindications) {
    for (const contraindication of meal.medicalContraindications) {
      if (hasCondition(profile, [contraindication])) {
        conflicts.push({
          severity: 'danger',
          type: 'contraindicacion-medica',
          message: `${meal.nombre} tiene contraindicación médica: ${contraindication}`,
          suggestion: 'Evitar esta comida completamente o consultar con médico',
          affectedMealId: meal.id,
        });
      }
    }
  }

  // Verificar alergias a ingredientes específicos
  if (meal.super) {
    for (const ingredient of meal.super) {
      if (hasAllergy(profile, ingredient)) {
        conflicts.push({
          severity: 'danger',
          type: 'alergia-ingrediente',
          message: `${meal.nombre} contiene ${ingredient} al cual tienes alergia/intolerancia`,
          suggestion: `Evitar ${ingredient} completamente, buscar alternativas sin este ingrediente`,
          affectedMealId: meal.id,
          affectedIngredient: ingredient,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detecta conflictos generales del perfil (sin comida específica)
 */
export function detectGeneralConflicts(profile: UserHealthProfile): DietaryConflict[] {
  const conflicts: DietaryConflict[] = [];

  // Metformina + alcohol (condición general)
  if (takesMedication(profile, ['metformina']) && hasCondition(profile, ['alcohol'])) {
    conflicts.push({
      severity: 'danger',
      type: 'medicamento-habito',
      message: 'Combinación Metformina + Alcohol: Riesgo de acidosis láctica',
      suggestion: 'Evitar alcohol completamente mientras tomes metformina',
    });
  }

  // Múltiples condiciones que requieren dieta baja en sodio
  if (hasCondition(profile, ['hipertension', 'insuficiencia cardiaca', 'edema'])) {
    conflicts.push({
      severity: 'warning',
      type: 'condicion-multiple',
      message: 'Múltiples condiciones requieren restricción de sodio estricta',
      suggestion: 'Limitar sodio a <1500mg/día, evitar alimentos procesados completamente',
    });
  }

  // Diabetes + Hipertensión (síndrome metabólico)
  if (hasCondition(profile, ['diabetes']) && hasCondition(profile, ['hipertension'])) {
    conflicts.push({
      severity: 'warning',
      type: 'sindrome-metabolico',
      message: 'Diabetes + Hipertensión: Mayor riesgo cardiovascular',
      suggestion: 'Priorizar dieta mediterránea, ejercicio regular, control estricto de ambas condiciones',
    });
  }

  return conflicts;
}

/**
 * Detecta todos los conflictos para un conjunto de comidas
 */
export function detectConflictsForMealPlan(
  profile: UserHealthProfile,
  meals: CatalogMealItem[]
): {
  conflicts: DietaryConflict[];
  summary: {
    danger: number;
    warning: number;
    info: number;
    uniqueMealsAffected: number;
  };
} {
  const allConflicts: DietaryConflict[] = [];
  const affectedMeals = new Set<string>();

  // Conflictos generales
  allConflicts.push(...detectGeneralConflicts(profile));

  // Conflictos por comida
  for (const meal of meals) {
    const mealConflicts = detectConflictsForMeal(profile, meal);
    allConflicts.push(...mealConflicts);

    if (mealConflicts.length > 0) {
      affectedMeals.add(meal.id);
    }
  }

  // Contar por severidad
  const summary = {
    danger: allConflicts.filter(c => c.severity === 'danger').length,
    warning: allConflicts.filter(c => c.severity === 'warning').length,
    info: allConflicts.filter(c => c.severity === 'info').length,
    uniqueMealsAffected: affectedMeals.size,
  };

  return { conflicts: allConflicts, summary };
}

/**
 * Valida si un plan completo es seguro para el usuario
 */
export function validatePlanSafety(
  profile: UserHealthProfile,
  meals: CatalogMealItem[]
): {
  isSafe: boolean;
  blockingIssues: DietaryConflict[];
  warnings: DietaryConflict[];
  canProceed: boolean;
} {
  const { conflicts, summary } = detectConflictsForMealPlan(profile, meals);

  const blockingIssues = conflicts.filter(c => c.severity === 'danger');
  const warnings = conflicts.filter(c => c.severity === 'warning' || c.severity === 'info');

  return {
    isSafe: blockingIssues.length === 0 && summary.danger === 0,
    blockingIssues,
    warnings,
    canProceed: blockingIssues.filter(b => b.type === 'alergia-ingrediente').length === 0,
  };
}

/**
 * Genera recomendaciones generales basadas en perfil de salud
 */
export function generateHealthRecommendations(profile: UserHealthProfile): string[] {
  const recommendations: string[] = [];

  if (hasCondition(profile, ['diabetes'])) {
    recommendations.push('Monitorear glucosa 2 horas post-prandial hasta identificar patrones');
    recommendations.push('Distribuir carbohidratos uniformemente en las comidas');
  }

  if (hasCondition(profile, ['hipertension'])) {
    recommendations.push('Priorizar alimentos ricos en potasio (plátano, aguacate, espinaca)');
    recommendations.push('Limitar sodio a <2000mg/día');
  }

  if (takesMedication(profile, ['levotiroxina'])) {
    recommendations.push('Tomar levotiroxina en ayunas, 30-60 min antes del desayuno');
    recommendations.push('Separar consumo de calcio, hierro y soya por 4 horas');
  }

  if (takesMedication(profile, ['metformina'])) {
    recommendations.push('Tomar metformina con comidas para reducir efectos gastrointestinales');
    recommendations.push('Monitorear niveles de B12 anualmente');
  }

  if (hasCondition(profile, ['reflujo', 'gerd'])) {
    recommendations.push('Última comida ligera 3 horas antes de dormir');
    recommendations.push('Elevar cabecera de la cama 15-20 cm');
  }

  return recommendations;
}
