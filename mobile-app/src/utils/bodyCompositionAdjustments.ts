/**
 * Ajustes de porciones y distribución de macros basados en medidas corporales.
 * Utiliza WHtR (Waist-to-Height Ratio) y relación cintura-cadera para
 * personalizar la distribución de macronutrientes.
 */

export interface BodyMeasurements {
  waistCm: number;      // Circunferencia de cintura
  hipCm: number;        // Circunferencia de cadera
  neckCm?: number;      // Circunferencia de cuello (opcional, para grasa corporal estimada)
  chestCm?: number;     // Pecho (opcional)
  heightCm: number;    // Altura (requerido para WHtR)
  weightKg: number;    // Peso (requerido para IMC)
}

export interface MacroStrategy {
  name: string;
  description: string;
  carbPercentage: number;
  proteinPercentage: number;
  fatPercentage: number;
  recommendations: string[];
}

export interface AdjustedPortions {
  original: Record<string, number>;
  adjusted: Record<string, number>;
  strategy: MacroStrategy;
  reasoning: string[];
}

/**
 * Calcula WHtR (Waist-to-Height Ratio)
 * Valores: <0.5 óptimo, 0.5-0.6 moderado riesgo, >0.6 alto riesgo
 */
export function calculateWHtR(waistCm: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  return parseFloat((waistCm / heightCm).toFixed(3));
}

/**
 * Calcula relación cintura-cadera (WHR)
 * Valores: hombres <0.9, mujeres <0.85 son óptimos
 */
export function calculateWHR(waistCm: number, hipCm: number): number {
  if (hipCm <= 0) return 0;
  return parseFloat((waistCm / hipCm).toFixed(3));
}

/**
 * Estima grasa corporal usando fórmula de la Marina (opcional con medidas de cuello)
 */
export function estimateBodyFatNavy(
  measurements: BodyMeasurements,
  isMale: boolean
): number | null {
  const { waistCm, neckCm, heightCm, hipCm } = measurements;

  if (!neckCm || !heightCm) return null;

  try {
    if (isMale) {
      // Fórmula para hombres
      const logWaistNeck = Math.log10(waistCm - neckCm);
      const logHeight = Math.log10(heightCm);
      const bodyFat = 495 / (1.0324 - 0.19077 * logWaistNeck + 0.15456 * logHeight) - 450;
      return Math.max(2, Math.min(50, parseFloat(bodyFat.toFixed(1))));
    } else {
      // Fórmula para mujeres (requiere cadera)
      if (!hipCm) return null;
      const logWaistHipNeck = Math.log10(waistCm + hipCm - neckCm);
      const logHeight = Math.log10(heightCm);
      const bodyFat = 495 / (1.29579 - 0.35004 * logWaistHipNeck + 0.22100 * logHeight) - 450;
      return Math.max(10, Math.min(60, parseFloat(bodyFat.toFixed(1))));
    }
  } catch {
    return null;
  }
}

/**
 * Determina estrategia de macros basada en composición corporal
 */
export function getMacroStrategyByBodyComposition(
  measurements: BodyMeasurements,
  isMale: boolean
): MacroStrategy {
  const whtr = calculateWHtR(measurements.waistCm, measurements.heightCm);
  const whr = calculateWHR(measurements.waistCm, measurements.hipCm);
  const estimatedFat = estimateBodyFatNavy(measurements, isMale);

  // WHtR < 0.5: Distribución balanceada
  if (whtr < 0.5) {
    return {
      name: 'balanceada',
      description: 'Distribución equilibrada 40/30/30 - Composición corporal saludable',
      carbPercentage: 40,
      proteinPercentage: 30,
      fatPercentage: 30,
      recommendations: [
        'Mantener distribución actual de macros',
        'Enfocarse en calidad de nutrientes vs cantidad',
        'Priorizar carbohidratos complejos',
      ],
    };
  }

  // WHtR 0.5-0.6 o WHR elevado: Reducir carbohidratos, aumentar proteína
  if (whtr >= 0.5 && whtr < 0.6) {
    const isAppleShape = whr > (isMale ? 0.9 : 0.85);

    if (isAppleShape) {
      return {
        name: 'bajo_carb_control_grasa',
        description: 'Reducida en carbohidratos, control de grasa abdominal - Distribución androide',
        carbPercentage: 30,
        proteinPercentage: 40,
        fatPercentage: 30,
        recommendations: [
          'Reducir carbohidratos refinados y azúcares',
          'Aumentar proteína para saciedad y mantenimiento muscular',
          'Incluir grasas saludables (omega-3) para inflamación',
          'Priorizar verduras de bajo índice glucémico',
        ],
      };
    }

    return {
      name: 'moderada_proteina',
      description: 'Moderada en carbohidratos, proteína elevada',
      carbPercentage: 35,
      proteinPercentage: 35,
      fatPercentage: 30,
      recommendations: [
        'Ligera reducción de carbohidratos',
        'Aumentar proteína ligeramente',
        'Monitorear progreso de medidas',
      ],
    };
  }

  // WHtR >= 0.6: Bajo carbohidrato, alta proteína, control estricto
  return {
    name: 'bajo_carb_estricto',
    description: 'Bajo carbohidrato, alta proteína - Control de grasa visceral',
    carbPercentage: 25,
    proteinPercentage: 45,
    fatPercentage: 30,
    recommendations: [
      'Reducir carbohidratos significativamente (<100g/día)',
      'Proteína alta para preservar masa muscular (2g/kg)',
      'Grasas saludables en moderación',
      'Evitar azúcares y carbohidratos refinados completamente',
      'Considerar ayuno intermitente con supervisión médica',
    ],
  };
}

/**
 * Ajusta porciones SMAE basándose en medidas corporales
 */
export function adjustPortionsByBodyComposition(
  basePortions: Record<string, number>,
  measurements: BodyMeasurements,
  isMale: boolean,
  goals: string[]
): AdjustedPortions {
  const strategy = getMacroStrategyByBodyComposition(measurements, isMale);
  const adjusted: Record<string, number> = { ...basePortions };
  const reasoning: string[] = [];

  const goalStr = goals.join(' ').toLowerCase();
  const isWeightLoss = goalStr.includes('perder') || goalStr.includes('grasa');
  const isMuscleGain = goalStr.includes('ganar') || goalStr.includes('musculo');

  // Ajustar según estrategia
  switch (strategy.name) {
    case 'balanceada':
      // Mantener porciones base
      reasoning.push('WHtR óptimo (<0.5): Mantener distribución actual');
      break;

    case 'bajo_carb_control_grasa':
    case 'moderada_proteina':
      // Reducir cereales, aumentar proteína y verduras
      if (adjusted['cereales'] !== undefined) {
        const originalCereales = adjusted['cereales'];
        adjusted['cereales'] = Math.max(2, Math.round(adjusted['cereales'] * 0.8));
        reasoning.push(`Reducir cereales: ${originalCereales} → ${adjusted['cereales']} (control de grasa abdominal)`);
      }

      if (adjusted['proteina'] !== undefined) {
        const originalProteina = adjusted['proteina'];
        adjusted['proteina'] = Math.round(adjusted['proteina'] * 1.2);
        reasoning.push(`Aumentar proteína: ${originalProteina} → ${adjusted['proteina']} (saciedad y músculo)`);
      }

      if (adjusted['verduras'] !== undefined) {
        adjusted['verduras'] = Math.round(adjusted['verduras'] * 1.2);
        reasoning.push('Aumentar verduras para volumen y saciedad');
      }
      break;

    case 'bajo_carb_estricto':
      // Reducción significativa de carbohidratos
      if (adjusted['cereales'] !== undefined) {
        const originalCereales = adjusted['cereales'];
        adjusted['cereales'] = Math.max(1, Math.round(adjusted['cereales'] * 0.5));
        reasoning.push(`Reducir cereales significativamente: ${originalCereales} → ${adjusted['cereales']}`);
      }

      if (adjusted['frutas'] !== undefined) {
        const originalFrutas = adjusted['frutas'];
        adjusted['frutas'] = Math.max(1, Math.round(adjusted['frutas'] * 0.7));
        reasoning.push(`Limitar frutas: ${originalFrutas} → ${adjusted['frutas']} (control de azúcar)`);
      }

      if (adjusted['proteina'] !== undefined) {
        const originalProteina = adjusted['proteina'];
        adjusted['proteina'] = Math.round(adjusted['proteina'] * 1.4);
        reasoning.push(`Aumentar proteína sustancialmente: ${originalProteina} → ${adjusted['proteina']}`);
      }

      if (adjusted['grasas'] !== undefined) {
        adjusted['grasas'] = Math.round(adjusted['grasas'] * 0.9);
        reasoning.push('Mantener grasas en moderación (priorizar omega-3)');
      }
      break;
  }

  // Ajustes adicionales según objetivo
  if (isWeightLoss) {
    const totalPortions = Object.values(adjusted).reduce((a, b) => a + b, 0);
    if (totalPortions > 20) {
      // Reducir ligeramente porciones totales
      for (const key in adjusted) {
        adjusted[key] = Math.max(1, Math.round(adjusted[key] * 0.95));
      }
      reasoning.push('Deficit calórico ligero para pérdida de grasa');
    }
  }

  if (isMuscleGain && strategy.name !== 'bajo_carb_estricto') {
    if (adjusted['proteina'] !== undefined) {
      adjusted['proteina'] = Math.round(adjusted['proteina'] * 1.1);
      reasoning.push('Ajuste adicional de proteína para ganancia muscular');
    }
  }

  return {
    original: basePortions,
    adjusted,
    strategy,
    reasoning,
  };
}

/**
 * Calcula rango objetivo de calorías basado en composición
 */
export function calculateCalorieTargetByComposition(
  measurements: BodyMeasurements,
  isMale: boolean,
  activityLevel: string,
  goals: string[]
): { min: number; max: number; reasoning: string[] } {
  const { weightKg, heightCm } = measurements;
  const whtr = calculateWHtR(measurements.waistCm, heightCm);
  const reasoning: string[] = [];

  // Calcular TMB usando Mifflin-St Jeor
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * 30); // Asumiendo 30 años promedio
  bmr = isMale ? bmr + 5 : bmr - 161;

  // Factor de actividad
  const activityMultipliers: Record<string, number> = {
    'sedentario': 1.2,
    'ligero': 1.375,
    'moderado': 1.55,
    'activo': 1.725,
    'muy activo': 1.9,
  };
  const multiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  let min = tdee;
  let max = tdee;

  const goalStr = goals.join(' ').toLowerCase();

  if (goalStr.includes('perder') || goalStr.includes('grasa')) {
    // Deficit según WHtR
    if (whtr >= 0.6) {
      min = tdee - 600;
      max = tdee - 400;
      reasoning.push('WHtR elevado: Déficit moderado-agresivo (400-600 kcal)');
    } else if (whtr >= 0.5) {
      min = tdee - 500;
      max = tdee - 300;
      reasoning.push('WHtR moderado: Déficit moderado (300-500 kcal)');
    } else {
      min = tdee - 400;
      max = tdee - 200;
      reasoning.push('WHtR normal: Déficit conservador (200-400 kcal)');
    }
  } else if (goalStr.includes('ganar') || goalStr.includes('musculo')) {
    min = tdee + 200;
    max = tdee + 400;
    reasoning.push('Superávit calórico para ganancia muscular (200-400 kcal)');
  } else {
    min = tdee - 100;
    max = tdee + 100;
    reasoning.push('Mantenimiento con ligera flexibilidad');
  }

  // Asegurar mínimos seguros
  const safeMinimum = isMale ? 1500 : 1200;
  min = Math.max(min, safeMinimum);
  max = Math.max(max, safeMinimum + 200);

  return { min, max, reasoning };
}

/**
 * Genera resumen de recomendaciones basado en medidas
 */
export function generateBodyCompositionReport(
  measurements: BodyMeasurements,
  isMale: boolean,
  goals: string[]
): {
  whtr: number;
  whtrStatus: string;
  whr: number;
  whrStatus: string;
  estimatedBodyFat: number | null;
  strategy: MacroStrategy;
  recommendations: string[];
} {
  const whtr = calculateWHtR(measurements.waistCm, measurements.heightCm);
  const whr = calculateWHR(measurements.waistCm, measurements.hipCm);
  const estimatedBodyFat = estimateBodyFatNavy(measurements, isMale);
  const strategy = getMacroStrategyByBodyComposition(measurements, isMale);

  // Status WHtR
  let whtrStatus: string;
  if (whtr < 0.5) whtrStatus = 'Óptimo';
  else if (whtr < 0.6) whtrStatus = 'Moderado riesgo';
  else whtrStatus = 'Alto riesgo';

  // Status WHR
  const whrThreshold = isMale ? 0.9 : 0.85;
  const whrStatus = whr < whrThreshold ? 'Normal' : 'Elevado';

  // Recomendaciones personalizadas
  const recommendations: string[] = [
    ...strategy.recommendations,
  ];

  if (whtr >= 0.5) {
    recommendations.push('Monitorear cintura semanalmente (objetivo: reducir 1-2 cm/mes)');
    recommendations.push('Incluir entrenamiento de fuerza 3x/semana mínimo');
  }

  if (whr >= whrThreshold) {
    recommendations.push('Patrón androide detectado: priorizar ejercicio cardiovascular');
  }

  return {
    whtr,
    whtrStatus,
    whr,
    whrStatus,
    estimatedBodyFat,
    strategy,
    recommendations,
  };
}
