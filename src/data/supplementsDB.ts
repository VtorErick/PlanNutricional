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
  }
];

export function getCompactSupplementsCatalog(): {id: string, name: string, goalSupport: string}[] {
  return supplementsDatabase.map(sup => ({
    id: sup.id,
    name: sup.name,
    goalSupport: sup.goalSupport
  }));
}
