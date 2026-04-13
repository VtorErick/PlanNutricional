/**
 * Utilidades para matching flexible de condiciones médicas y medicamentos.
 * Maneja texto libre del usuario con errores de ortografía, abreviaciones,
 * variaciones y sinónimos.
 */

// Mapeo de condiciones médicas comunes con sus variantes
export const MEDICAL_CONDITION_ALIASES: Record<string, string[]> = {
  // SOP / Síndrome de Ovario Poliquístico
  'sindrome de ovario poliquistico': [
    'sop', 'ovaio poliquistico', 'ovario poliquistico', 'síndrome del ovaio poliquístico',
    'sindrom ovario polikistico', 'sindrom ovario poliquistico', 'poliquistosis ovarica',
    'poliquistosis ovárica', 'pcos', 'polycystic ovary syndrome', 'stein-leventhal',
    'hiperandrogenismo', 'anovulacion cronica', 'resistencia a la insulina ovarica'
  ],

  // Diabetes
  'diabetes': [
    'diabetes tipo 1', 'diabetes tipo 2', 'diabetes tipo i', 'diabetes tipo ii',
    'dm1', 'dm2', 'dm', 'diabetis', 'diavetes', 'diabetes mellitus', 'prediabetes',
    'hiperglucemia', 'glucosa alta', 'azucar alta en sangre', 'resistencia insulina',
    'insulino resistencia', 'hipoglucemiante', 'azucar elevada'
  ],

  // Hipertensión
  'hipertension': [
    'hipertension arterial', 'presion alta', 'tension alta', 'ta elevada',
    'hipertensión sistolica', 'hipertension diastolica', 'hta', 'has',
    'presion arterial elevada', 'tension arterial elevada', 'blood pressure high',
    'hipertenso', 'hipertensa', 'cardiovascular', 'enfermedad cardiovascular'
  ],

  // Hipotiroidismo
  'hipotiroidismo': [
    'hipotiroidismo primario', 'hipotiroidismo secundario', 'tiroide baja',
    'tiroides baja', 'funcion tiroidea baja', 'hipotirodismo', 'hipotiroid',
    'hashimoto', 'tiroiditis de hashimoto', 'tiroiditis autoinmune',
    'hormonas tiroideas bajas', 'tsh alta', 't4 baja'
  ],

  // Hipertiroidismo
  'hipertiroidismo': [
    'hipertiroidismo primario', 'tiroides alta', 'tiroide alta',
    'funcion tiroidea alta', 'hipermetabolismo', 'toxica nodular', 'bocio toxico',
    'enfermedad de graves', 'mal de basedow', 'tsh baja', 't4 alta'
  ],

  // Síndrome metabólico
  'sindrome metabolico': [
    'síndrome metabólico', 'sindrom metabolico', 'sindrom x', 'resistencia insulina multiple',
    'sindrome cardiometabolico', 'obesidad abdominal', 'grasa visceral',
    'trigliseridos altos', 'colesterol bajo hdl', 'metabolic syndrome'
  ],

  // Reflujo / GERD
  'reflujo gastroesofagico': [
    'reflujo', 'gerd', 'gastritis', 'acidez estomacal', 'acidez',
    'pirosis', 'ardor de estomago', 'ardor estomacal', 'regurgitacion acida',
    'hernia hiatal', 'dispepsia', 'reflujo nocturno', 'gastritis cronica',
    'erosion gastrica', 'ulceras gastricas', 'ulceras duodenales', 'gastroparesia'
  ],

  // Intolerancia al gluten / Enfermedad celíaca
  'intolerancia al gluten': [
    'celiaquia', 'enfermedad celiaca', 'gluten', 'intolerancia gluten',
    'sensibilidad gluten', 'gluten intolerance', 'sprue celiaco', 'celiac disease',
    'alergia gluten', 'no tolero gluten', 'gluten me hace mal'
  ],

  // Intolerancia a la lactosa
  'intolerancia a la lactosa': [
    'lactosa', 'intolerancia lactea', 'intolerancia lactosa', 'no tolero lactosa',
    'alergia a la leche', 'alergia lactosa', 'malabsorcion lactosa',
    'deficiencia lactasa', 'lactose intolerance', 'leche me hace mal',
    'productos lacteos me caen mal'
  ],

  // Cálculos renales
  'calculos renales': [
    'calculos renales', 'piedras en los riñones', 'litiasis renal', 'nefrolitiasis',
    'calculos en los riñones', 'renal calculos', 'kidney stones', 'oxalato alto',
    'calculos de calcio', 'calculos de acido urico', 'colico nefritico',
    'urolitiasis', 'cistolitiasis', 'piedras renales'
  ],

  // Gota
  'gota': [
    'gota', 'acido urico alto', 'hiperuricemia', 'artritis gotosa',
    'cristales de acido urico', 'gout', 'uricemia elevada', 'purinas',
    'artrosis gotosa', 'tophos gotosos'
  ],

  // SII
  'sindrome de intestino irritable': [
    'sii', 'colon irritable', 'intestino irritable', 'sindrome colon irritable',
    'irritable bowel syndrome', 'ibs', 'espasmos colon', 'colitis nerviosa',
    'colon espastico', 'transito intestinal alterado', 'distension abdominal',
    'meteorismo', 'flatulencias', 'estreñimiento alterno', 'diarrea alterna'
  ],

  // Embarazo
  'embarazo': [
    'embarazo', 'embarazada', 'gestacion', 'prenatal', 'embarazo primer trimestre',
    'embarazo segundo trimestre', 'embarazo tercer trimestre', 'lactancia',
    'maternidad', 'pregnancy', 'pregnant', 'embarazo multiple', 'feto'
  ],

  // Anemia
  'anemia': [
    'anemia', 'deficiencia hierro', 'anemia ferropriva', 'anemia cronica',
    'globulos rojos bajos', 'hemoglobina baja', 'hematocrito bajo',
    'ferritina baja', 'deficiencia acido folico', 'deficiencia vitamina b12',
    'anemia megaloblastica', 'paleta baja'
  ],

  // Colesterol alto
  'hipercolesterolemia': [
    'colesterol alto', 'hipercolesterolemia', 'ldl alto', 'colesterol malo alto',
    'dislipidemia', 'trigliseridos altos', 'hiperlipidemia', 'grasas en sangre altas',
    'colesterol total alto', 'colesterol elevado', 'colesterol ldl elevado'
  ],

  // Enfermedad renal crónica
  'enfermedad renal cronica': [
    'enfermedad renal', 'insuficiencia renal', 'riñones dañados', 'erc',
    'enfermedad renal cronica', 'funcion renal disminuida', 'creatinina alta',
    'tasa filtracion glomerular baja', 'proteinuria', 'hemodialisis', 'dialisis'
  ],

  // Estreñimiento
  'estreñimiento': [
    'estreñimiento', 'transito lento', 'evacuaciones infrecuentes', 'constipacion',
    'dificultad defecar', 'heces duras', 'colon lento', 'estrenimiento',
    'constipation', 'obstipacion', 'dismovilidad intestinal'
  ],

  // Gastroparesia
  'gastroparesia': [
    'gastroparesia', 'vaciamiento gastrico lento', 'motilidad gastrica reducida',
    'paralisis gastrica', 'digestion lenta', 'saciedad prolongada',
    'llenura temprana', 'sensacion saciedad persistente'
  ],

  // Osteoporosis
  'osteoporosis': [
    'osteoporosis', 'huesos fragiles', 'densidad osea baja', 'perdida masa osea',
    'osteopenia', 'fracturas por fragilidad', 'huesos porosos',
    'deficiencia calcio oseo', 'metabolismo oseo alterado'
  ],

  // Hígado graso
  'higado graso': [
    'higado graso', 'esteatosis hepatica', 'higado graso no alcoholico',
    'nafld', 'enfermedad higado graso', 'higado esteatosico',
    'hepatosis grasa', 'steatohepatitis no alcoholica', 'nash'
  ],

  // Síndrome de Cushing
  'sindrome de cushing': [
    'sindrome cushing', 'cushing', 'hipercortisolismo', 'exceso cortisol',
    'obesidad central cushing', 'cara de luna llena cushing'
  ],

  // Hipoglucemia
  'hipoglucemia': [
    'hipoglucemia', 'glucosa baja', 'azucar baja', 'azucar baja en sangre',
    'glucosa baja en sangre', 'bajones de azucar', 'sudoracion nocturna',
    'mareos por ayuno', 'inestabilidad glucosa'
  ],
};

// Mapeo de medicamentos comunes con sus variantes
export const MEDICATION_ALIASES: Record<string, string[]> = {
  // Metformina
  'metformina': [
    'metformina', 'metformin', 'glucophage', 'glifage', 'metfogamma',
    'metformax', 'metformine', 'metf', 'metform', 'biguanida'
  ],

  // Levotiroxina
  'levotiroxina': [
    'levotiroxina', 'levothyroxine', 'eutirox', 'synthroid', 't4 sintetica',
    'tiroxina', 'hormona tiroidea sintetica', 'levoxyl', 'tirosint'
  ],

  // Antihipertensivos
  'amlodipino': ['amlodipino', 'amlodipine', 'norvasc', 'istin', 'amlodip'],
  'losartan': ['losartan', 'losartán', 'cozaar', 'losartana', 'losar'],
  'enalapril': ['enalapril', 'enalaprill', 'renitec', 'vasotec', 'enapril'],
  'atenolol': ['atenolol', 'tenormin', 'atenol'],
  'hidroclorotiazida': ['hidroclorotiazida', 'hctz', 'microzide', 'diuretico tiazidico'],

  // Antidiabéticos
  'glibenclamida': ['glibenclamida', 'gliburide', 'daonil', 'euglucon', 'glyburide'],
  'glimepirida': ['glimepirida', 'glimepiride', 'amaryl', 'glim'],
  'insulina': ['insulina', 'insulin', 'rapida', 'nph', 'glargina', 'detemir',
    'aspart', 'lispro', 'glulisina', 'accion intermedia', 'accion larga'],
  'sitagliptina': ['sitagliptina', 'sitagliptin', 'januvia', 'dpp4'],
  'empagliflozina': ['empagliflozina', 'empagliflozin', 'jardiance', 'isgl'],

  // Anticoagulantes
  'warfarina': ['warfarina', 'warfarin', 'coumadin', 'sintrom', 'acenocumarol'],
  'rivaroxaban': ['rivaroxaban', 'xarelto', 'anticoagulante nuevo'],
  'apixaban': ['apixaban', 'eliquis'],

  // Antiácidos / GERD
  'omeprazol': ['omeprazol', 'omeprazole', 'prilosec', 'losec', 'inhibidor bomba protones', 'ibp'],
  'pantoprazol': ['pantoprazol', 'pantoprazole', 'protonix', 'protium'],
  'ranitidina': ['ranitidina', 'ranitidine', 'zantac', 'h2'],
  'lansoprazol': ['lansoprazol', 'lansoprazole', 'prevacid'],

  // Antidepresivos
  'sertralina': ['sertralina', 'sertraline', 'zoloft', 'sertralin'],
  'fluoxetina': ['fluoxetina', 'fluoxetine', 'prozac', 'fluxetina'],
  'escitalopram': ['escitalopram', 'lexapro', 'cipralex'],

  // Anticonceptivos
  'anticonceptivo oral': ['anticonceptivo', 'pastillas anticonceptivas', 'pildora',
    'birth control', 'yaz', 'yasmin', 'levonorgestrel', 'etinilestradiol'],

  // Suplementos comunes
  'omega 3': ['omega 3', 'omega-3', 'omega3', 'aceite pescado', 'fish oil', 'epa dha'],
  'vitamina d': ['vitamina d', 'vit d', 'colecalciferol', 'ergocalciferol', 'd3'],
  'calcio': ['calcio', 'carbonato calcio', 'calcium', 'citrate calcio'],
  'hierro': ['hierro', 'ferro', 'iron', 'sulfato ferroso', 'fumarato ferroso', 'ferritina'],
  'magnesio': ['magnesio', 'magnesium', 'magnesium oxide', 'magnesium citrate'],
  'zinc': ['zinc', 'zinc oxide', 'zinc gluconate', 'sulfato zinc'],
};

/**
 * Normaliza texto para comparación (minúsculas, sin acentos, sin espacios extra)
 */
function normalizeMedicalText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ') // Reemplaza caracteres especiales con espacio
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula distancia de Levenshtein entre dos strings
 * Útil para detectar errores de ortografía
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcula similitud de Jaro-Winkler (mejor para nombres cortos)
 */
function jaroWinklerSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro = ((matches / a.length) + (matches / b.length) + ((matches - transpositions / 2) / matches)) / 3;

  // Jaro-Winkler adjustment
  let prefixScale = 0.1;
  let prefix = 0;
  for (let i = 0; i < Math.min(a.length, b.length, 4); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return jaro + prefix * prefixScale * (1 - jaro);
}

/**
 * Encuentra la mejor coincidencia para una condición médica
 */
export function findMatchingCondition(userInput: string): string | null {
  const normalizedInput = normalizeMedicalText(userInput);

  // Primero: búsqueda exacta o contención
  for (const [canonicalCondition, aliases] of Object.entries(MEDICAL_CONDITION_ALIASES)) {
    const allVariants = [canonicalCondition, ...aliases];

    for (const variant of allVariants) {
      const normalizedVariant = normalizeMedicalText(variant);

      // Coincidencia exacta o contención
      if (normalizedInput === normalizedVariant ||
          normalizedInput.includes(normalizedVariant) ||
          normalizedVariant.includes(normalizedInput)) {
        return canonicalCondition;
      }
    }
  }

  // Segundo: búsqueda por similitud Jaro-Winkler
  let bestMatch: { condition: string; score: number } | null = null;
  const SIMILARITY_THRESHOLD = 0.85;

  for (const [canonicalCondition, aliases] of Object.entries(MEDICAL_CONDITION_ALIASES)) {
    const allVariants = [canonicalCondition, ...aliases];

    for (const variant of allVariants) {
      const score = jaroWinklerSimilarity(normalizedInput, normalizeMedicalText(variant));

      if (score >= SIMILARITY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { condition: canonicalCondition, score };
      }
    }
  }

  // Tercero: búsqueda por distancia Levenshtein para palabras cortas
  if (!bestMatch && normalizedInput.length <= 20) {
    const LEVENSHTEIN_THRESHOLD = 3;

    for (const [canonicalCondition, aliases] of Object.entries(MEDICAL_CONDITION_ALIASES)) {
      const allVariants = [canonicalCondition, ...aliases];

      for (const variant of allVariants) {
        const normalizedVariant = normalizeMedicalText(variant);
        if (Math.abs(normalizedInput.length - normalizedVariant.length) > LEVENSHTEIN_THRESHOLD) continue;

        const distance = levenshteinDistance(normalizedInput, normalizedVariant);

        if (distance <= LEVENSHTEIN_THRESHOLD) {
          return canonicalCondition;
        }
      }
    }
  }

  return bestMatch?.condition || null;
}

/**
 * Encuentra la mejor coincidencia para un medicamento
 */
export function findMatchingMedication(userInput: string): string | null {
  const normalizedInput = normalizeMedicalText(userInput);

  // Primero: búsqueda exacta o contención
  for (const [canonicalMed, aliases] of Object.entries(MEDICATION_ALIASES)) {
    const allVariants = [canonicalMed, ...aliases];

    for (const variant of allVariants) {
      const normalizedVariant = normalizeMedicalText(variant);

      if (normalizedInput === normalizedVariant ||
          normalizedInput.includes(normalizedVariant) ||
          normalizedVariant.includes(normalizedInput)) {
        return canonicalMed;
      }
    }
  }

  // Segundo: búsqueda por similitud
  let bestMatch: { medication: string; score: number } | null = null;
  const SIMILARITY_THRESHOLD = 0.8;

  for (const [canonicalMed, aliases] of Object.entries(MEDICATION_ALIASES)) {
    const allVariants = [canonicalMed, ...aliases];

    for (const variant of allVariants) {
      const score = jaroWinklerSimilarity(normalizedInput, normalizeMedicalText(variant));

      if (score >= SIMILARITY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { medication: canonicalMed, score };
      }
    }
  }

  return bestMatch?.medication || null;
}

/**
 * Procesa texto libre del usuario (puede contener múltiples condiciones separadas por comas, puntos, etc.)
 */
export function parseMedicalConditions(userInput: string): {
  matched: string[];
  unmatched: string[];
  details: Array<{ original: string; matched: string | null; confidence: 'high' | 'medium' | 'low' }>;
} {
  if (!userInput || userInput.trim() === '') {
    return { matched: [], unmatched: [], details: [] };
  }

  // Separar por delimitadores comunes
  const separators = /[,;|]+|\sy\s+|\se\s+/i;
  const rawInputs = userInput.split(separators).map(s => s.trim()).filter(Boolean);

  const matched: string[] = [];
  const unmatched: string[] = [];
  const details: Array<{ original: string; matched: string | null; confidence: 'high' | 'medium' | 'low' }> = [];

  for (const raw of rawInputs) {
    const canonical = findMatchingCondition(raw);

    if (canonical) {
      // Evitar duplicados
      if (!matched.includes(canonical)) {
        matched.push(canonical);
      }

      // Determinar confianza
      const normalizedRaw = normalizeMedicalText(raw);
      const normalizedCanonical = normalizeMedicalText(canonical);
      const similarity = jaroWinklerSimilarity(normalizedRaw, normalizedCanonical);

      let confidence: 'high' | 'medium' | 'low';
      if (similarity >= 0.95 || normalizedRaw === normalizedCanonical) {
        confidence = 'high';
      } else if (similarity >= 0.85) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      details.push({ original: raw, matched: canonical, confidence });
    } else {
      unmatched.push(raw);
      details.push({ original: raw, matched: null, confidence: 'low' });
    }
  }

  return { matched, unmatched, details };
}

/**
 * Procesa texto libre de medicamentos
 */
export function parseMedications(userInput: string): {
  matched: string[];
  unmatched: string[];
  details: Array<{ original: string; matched: string | null; confidence: 'high' | 'medium' | 'low' }>;
} {
  if (!userInput || userInput.trim() === '') {
    return { matched: [], unmatched: [], details: [] };
  }

  const separators = /[,;|]+|\sy\s+|\se\s+/i;
  const rawInputs = userInput.split(separators).map(s => s.trim()).filter(Boolean);

  const matched: string[] = [];
  const unmatched: string[] = [];
  const details: Array<{ original: string; matched: string | null; confidence: 'high' | 'medium' | 'low' }> = [] = [];

  for (const raw of rawInputs) {
    const canonical = findMatchingMedication(raw);

    if (canonical) {
      if (!matched.includes(canonical)) {
        matched.push(canonical);
      }

      const normalizedRaw = normalizeMedicalText(raw);
      const normalizedCanonical = normalizeMedicalText(canonical);
      const similarity = jaroWinklerSimilarity(normalizedRaw, normalizedCanonical);

      let confidence: 'high' | 'medium' | 'low';
      if (similarity >= 0.95 || normalizedRaw === normalizedCanonical) {
        confidence = 'high';
      } else if (similarity >= 0.85) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      details.push({ original: raw, matched: canonical, confidence });
    } else {
      unmatched.push(raw);
      details.push({ original: raw, matched: null, confidence: 'low' });
    }
  }

  return { matched, unmatched, details };
}

/**
 * Verifica si hay conflicto entre condiciones del usuario y contraindicaciones de una comida
 */
export function hasMedicalContraindicationConflict(
  userConditions: string[],
  mealContraindications: string[],
  options: { fuzzyMatch?: boolean; threshold?: number } = {}
): {
  hasConflict: boolean;
  matchedConditions: Array<{ userCondition: string; mealContraindication: string }>;
  confidence: number;
} {
  const { fuzzyMatch = true, threshold = 0.85 } = options;
  const matchedConditions: Array<{ userCondition: string; mealContraindication: string }> = [];

  // Normalizar y expandir condiciones del usuario
  const expandedUserConditions = userConditions.flatMap(condition => {
    const canonical = findMatchingCondition(condition);
    return canonical ? [canonical, condition] : [condition];
  });

  for (const userCondition of expandedUserConditions) {
    const normalizedUser = normalizeMedicalText(userCondition);

    for (const mealContra of mealContraindications) {
      const normalizedContra = normalizeMedicalText(mealContra);

      // Coincidencia exacta
      if (normalizedUser === normalizedContra ||
          normalizedUser.includes(normalizedContra) ||
          normalizedContra.includes(normalizedUser)) {
        matchedConditions.push({
          userCondition,
          mealContraindication: mealContra
        });
        continue;
      }

      // Coincidencia fuzzy si está habilitada
      if (fuzzyMatch) {
        const similarity = jaroWinklerSimilarity(normalizedUser, normalizedContra);
        if (similarity >= threshold) {
          matchedConditions.push({
            userCondition,
            mealContraindication: mealContra
          });
        }
      }
    }
  }

  const confidence = matchedConditions.length > 0
    ? Math.min(1, matchedConditions.length * 0.3 + 0.4)
    : 0;

  return {
    hasConflict: matchedConditions.length > 0,
    matchedConditions,
    confidence
  };
}
