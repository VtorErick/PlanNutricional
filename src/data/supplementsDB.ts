export interface SupplementCatalogItem {
  id: string;
  name: string;
  goalSupport: string;
  whyItMayHelp: string;
  howToUse: string;
  timing: string;
  caution: string;
}

export const supplementsDatabase: SupplementCatalogItem[] = [
  {
    id: 'sup_myo_inositol',
    name: 'Myo-inositol + D-chiro inositol',
    goalSupport: 'Apoyo metabólico y contexto de SOP / resistencia a la insulina',
    whyItMayHelp: 'Puede ser útil como complemento dentro de una estrategia integral para SOP y control glucémico.',
    howToUse: 'Seguir dosis y proporción del fabricante o indicación profesional.',
    timing: 'Dividido en 1 a 2 tomas al día según el producto.',
    caution: 'Revisar con profesional si ya existe tratamiento médico endocrino o antidiabético.',
  },
  {
    id: 'sup_whey',
    name: 'Proteína de Suero de Leche (Whey Protein)',
    goalSupport: 'Crecimiento muscular y alcance calórico',
    whyItMayHelp: 'Provee una fuente rápida, limpia y de alto valor biológico de aminoácidos esenciales.',
    howToUse: '1 scoop (aprox 25-30g) diluido en 250ml de agua o leche light.',
    timing: 'Post-entrenamiento o como acompañante de colaciones ligeras.',
    caution: 'Verificar tolerancia a la lactosa (elegir Isolate si hay sensibilidad).',
  },
  {
    id: 'sup_creatina',
    name: 'Creatina Monohidratada',
    goalSupport: 'Aumento de fuerza y rendimiento explosivo',
    whyItMayHelp: 'Satura las reservas de ATP muscular, retrasando la fatiga en el ejercicio anaeróbico.',
    howToUse: '5g diarios constantes, sin necesidad de periodo de carga ni descanso.',
    timing: 'En cualquier momento del día (idealmente con carbohidratos para mayor absorción).',
    caution: 'Asegurar una hidratación óptima (mínimo 2-3 litros de agua al día).',
  },
  {
    id: 'sup_omega3',
    name: 'Omega 3 (Aceite de Pescado)',
    goalSupport: 'Salud cardiovascular y desinflamación',
    whyItMayHelp: 'Rico en EPA/DHA, mejora el perfil lipídico y reduce la inflamación sistemática celular.',
    howToUse: '1 a 2 cápsulas diarias (aprox 1000mg combinados de EPA/DHA).',
    timing: 'Junto con alguna de las comidas principales ricas en grasa.',
    caution: 'Precaución o consultar al médico si se toman medicamentos anticoagulantes.',
  },
  {
    id: 'sup_magnesio',
    name: 'Citrato / Glicinato de Magnesio',
    goalSupport: 'Recuperación muscular y calidad de sueño',
    whyItMayHelp: 'Mineral esencial que apoya el sistema nervioso central, reduce calambres y mejora el descanso.',
    howToUse: 'Dosis estándar de 200mg a 400mg elementales.',
    timing: '30-45 minutos antes de dormir.',
    caution: 'No exceder la dosis recomendada para evitar ligero efecto laxante.',
  },
  {
    id: 'sup_multivitamin',
    name: 'Multivitamínico Integral',
    goalSupport: 'Cobertura de micronutrientes básicos',
    whyItMayHelp: 'Ayuda a rellenar deficiencias de vitaminas clave (Vitamina D, B12, Zinc) si la dieta es restrictiva.',
    howToUse: '1 pastilla/dosis indicada en el envase.',
    timing: 'Por las mañanas junto con el desayuno para evitar náuseas.',
    caution: 'Evitar si ya se consumen suficientes verduras y no hay déficit sanguíneo comprobado.',
  },
  {
    id: 'sup_colageno',
    name: 'Colágeno Hidrolizado',
    goalSupport: 'Salud articular y firmeza tegumentaria',
    whyItMayHelp: 'Ayuda a la elasticidad de los cartílagos, piel y tendones bajo alta presión física.',
    howToUse: '10g a 15g servidos en líquidos fríos o tibios.',
    timing: 'En ayunas o antes de dormir (su asimilación es independiente).',
    caution: 'No sustituye una proteína completa por su bajo perfil de triptófano.',
  },
  {
    id: 'sup_preworkout',
    name: 'Pre-Entreno Base Estimulante',
    goalSupport: 'Potencia cardiovascular temporal',
    whyItMayHelp: 'Provee energía inmediata combatiendo letargo pre-rutinas pesadas a base de cafeína.',
    howToUse: '1 medida estipulada en el frasco.',
    timing: '20 a 30 minutos antes de comenzar actividad física intensa.',
    caution: 'Prohibido en pacientes de hipertensión, arritmias, o alta sensibilidad a la cafeína.',
  },
  {
    id: 'sup_probioticos',
    name: 'Probióticos Multicepa',
    goalSupport: 'Salud digestiva y absorción de nutrientes',
    whyItMayHelp: 'Ayuda a equilibrar la microbiota intestinal, reduciendo la inflamación y mejorando la digestión.',
    howToUse: '1 cápsula diaria (mínimo 10-50 billones UFC).',
    timing: 'En ayunas o según indicaciones del laboratorio.',
    caution: 'Puede causar ligeros gases los primeros 3 días de adaptación.',
  },
  {
    id: 'sup_ashwagandha',
    name: 'Ashwagandha Extracto',
    goalSupport: 'Control de estrés y regulación del cortisol',
    whyItMayHelp: 'Adaptógeno natural que reduce los niveles sostenidos de cortisol, apoyando la relajación y el descanso.',
    howToUse: '300mg a 500mg estandarizados a withanólidos.',
    timing: 'Por las tardes o antes de dormir.',
    caution: 'No utilizar en caso de hipertiroidismo o embarazo sin supervisión.',
  },
  {
    id: 'sup_vitamina_c',
    name: 'Vitamina C',
    goalSupport: 'Sistema Inmunológico / Antioxidación',
    whyItMayHelp: 'Refuerza la inmunidad post-entrenamiento intenso y apoya la síntesis de colágeno natural.',
    howToUse: '500mg a 1000mg efervescente o cápsula.',
    timing: 'En ayunas o pre-entrenamiento.',
    caution: 'Excesos se eliminan en la orina sin toxicidad grave.',
  },
  {
    id: 'sup_lcarnitina',
    name: 'L-Carnitina',
    goalSupport: 'Oxidación de lípidos ligeros',
    whyItMayHelp: 'Ayuda a transportar los ácidos grasos a la mitocondria durante ejercicio aeróbico prolongado.',
    howToUse: '1000mg a 2000mg en forma líquida o cápsula.',
    timing: '30-45 minutos antes del ejercicio aeróbico.',
    caution: 'Efecto sinérgico limitable; requiere dieta estructurada y constancia.',
  },
  {
    id: 'sup_psyllium',
    name: 'Fibra soluble tipo psyllium',
    goalSupport: 'Saciedad, tránsito intestinal y apoyo glucémico',
    whyItMayHelp: 'Puede ayudar cuando hay estreñimiento, baja saciedad o dificultad para alcanzar la fibra diaria.',
    howToUse: 'Iniciar con una porción pequeña mezclada en abundante agua y aumentar gradualmente.',
    timing: 'Separado de medicamentos y siempre con hidratación suficiente.',
    caution: 'No usar sin agua suficiente. Separar varias horas de medicamentos importantes.',
  },
  {
    id: 'sup_vitamina_d',
    name: 'Vitamina D3',
    goalSupport: 'Cobertura micronutricional y salud metabólica general',
    whyItMayHelp: 'Puede ser relevante si hay baja exposición solar o una indicación clínica específica.',
    howToUse: 'Seguir dosis prescrita o recomendada por profesional según contexto.',
    timing: 'Con una comida principal que incluya algo de grasa.',
    caution: 'No suplementar dosis altas de forma crónica sin supervisión o estudios previos.',
  }
];

export function getCompactSupplementsCatalog(): {id: string, name: string, goalSupport: string}[] {
  return supplementsDatabase.map(sup => ({
    id: sup.id,
    name: sup.name,
    goalSupport: sup.goalSupport
  }));
}

function normalizeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function splitQuestionnaireValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => splitQuestionnaireValues(entry))
      .filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  return value
    .split(/[,\n;]+/g)
    .map((entry) => normalizeToken(entry))
    .filter(Boolean);
}

function getQuestionnaireContext(questionnaire: any) {
  const diagnostics = splitQuestionnaireValues(
    questionnaire?.healthContext?.diagnostics ?? questionnaire?.diagnostics
  );
  const digestiveSymptoms = splitQuestionnaireValues(
    questionnaire?.healthContext?.digestiveSymptoms ?? questionnaire?.digestiveSymptoms
  );
  const objectives = splitQuestionnaireValues(
    questionnaire?.profileContext?.objectives ?? questionnaire?.objectives
  );
  const intolerances = splitQuestionnaireValues(
    questionnaire?.healthContext?.intolerances ?? questionnaire?.intolerances
  );

  return { diagnostics, digestiveSymptoms, objectives, intolerances };
}

function scoreSupplement(item: SupplementCatalogItem, questionnaire: any) {
  const { diagnostics, digestiveSymptoms, objectives, intolerances } = getQuestionnaireContext(questionnaire);
  const id = item.id;
  let score = 0;

  const hasAny = (source: string[], patterns: RegExp[]) =>
    patterns.some((pattern) => source.some((entry) => pattern.test(entry)));

  if (hasAny(diagnostics, [/(diabetes|insulina|sop|poliquist)/])) {
    if (id === 'sup_myo_inositol') score += 9;
    if (id === 'sup_psyllium') score += 7;
    if (id === 'sup_omega3') score += 6;
    if (id === 'sup_probioticos') score += 4;
    if (id === 'sup_multivitamin' || id === 'sup_vitamina_d') score += 2;
  }

  if (hasAny(digestiveSymptoms, [/(estrenimiento|constip|distension|digest|colitis|reflujo)/])) {
    if (id === 'sup_psyllium') score += 8;
    if (id === 'sup_probioticos') score += 7;
    if (id === 'sup_magnesio') score += 3;
  }

  if (hasAny(objectives, [/(musculo|ganar|masa|fuerza)/])) {
    if (id === 'sup_creatina') score += 6;
    if (id === 'sup_whey') score += 5;
  }

  if (hasAny(objectives, [/(perder|grasa|control glucemico|salud)/])) {
    if (id === 'sup_omega3') score += 4;
    if (id === 'sup_psyllium') score += 4;
  }

  if (intolerances.some((entry) => /(lactosa|lacteo)/.test(entry)) && id === 'sup_whey') {
    score -= 3;
  }

  if (hasAny(diagnostics, [/(hipertension|presion|arritmia)/]) && id === 'sup_preworkout') {
    score -= 8;
  }

  if (hasAny(diagnostics, [/(hipertiroid)/]) && id === 'sup_ashwagandha') {
    score -= 8;
  }

  return score;
}

export function buildQuestionnaireSupplementsCatalog(
  questionnaire: any,
  limit = 6
): { id: string; name: string; goalSupport: string; caution: string }[] {
  const ranked = supplementsDatabase
    .map((item) => ({
      ...item,
      _score: scoreSupplement(item, questionnaire),
    }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return a.name.localeCompare(b.name, 'es');
    });

  const shortlisted = ranked
    .filter((item, index) => item._score > 0 || index < limit)
    .slice(0, limit);

  return shortlisted.map((item) => ({
    id: item.id,
    name: item.name,
    goalSupport: item.goalSupport,
    caution: item.caution,
  }));
}
