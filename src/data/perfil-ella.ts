import type { MealItem, MealTime } from '../data';

// --- INFORMACIÓN PERSONAL Y METAS ---
export const perfilELLA = {
  id: 'ella',
  nombre: 'Ella',
  edad: 31,
  descripcion: 'Plan basado en la guía del nutriólogo con estructura de equivalentes. Frutas moderadas, verduras altas, grasas medidas. Adaptado para cuidar niveles de insulina.',
  perfil: '65 kg • 1.60 m • 31 años • IMC 25.4',
  meta: 'Llegar a peso saludable (~58 kg) con control de insulina',
  metaCaloricaKcalDia: 1500,
  horariosTexto: '8 am • Col. AM • 3 pm • Col. PM • 9–10 pm',
  momentos: [
    { key: 'desayuno', label: 'Desayuno', hora: '8:00 am' },
    { key: 'colacion_am', label: 'Colación mañana', hora: '11:00 am' },
    { key: 'comida', label: 'Comida', hora: '3:00 pm' },
    { key: 'colacion_pm', label: 'Colación tarde', hora: '6:00 pm' },
    { key: 'cena', label: 'Cena', hora: '9:00–10:00 pm' },
  ],
  objetivosPorMomento: {
    desayuno: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, lacteos: 0, proteina: 3, grasas: 2 },
    colacion_am: { frutas: 1, verduras: 0, cereales: 1, leguminosas: 0, lacteos: 0, proteina: 0, grasas: 2 },
    comida: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, lacteos: 0, proteina: 4, grasas: 2 },
    colacion_pm: { frutas: 0, verduras: 0, cereales: 0, leguminosas: 0, lacteos: 0, proteina: 0, grasas: 0 },
    cena: { frutas: 1, verduras: 0, cereales: 1, leguminosas: 0, lacteos: 1, proteina: 0, grasas: 2 },
  },
  distribucionDiaria: [
    { grupo: 'Frutas', total: 2, detalle: '1 en colación de la mañana + 1 en cena' },
    { grupo: 'Verduras', total: 4, detalle: '2 desayuno + 2 comida' },
    { grupo: 'Cereales', total: 4, detalle: '1 desayuno + 1 col. AM + 1 comida + 1 cena' },
    { grupo: 'Proteína (carne/queso/huevo)', total: 7, detalle: '3 desayuno + 4 comida' },
    { grupo: 'Grasas', total: 8, detalle: '2 desayuno + 2 col. mañana + 2 comida + 2 cena' },
    { grupo: 'lacteos', total: 1, detalle: '1 en cena' },
  ],
  resumenPersonal: [
    'Plan del nutriólogo con equivalentes claros por grupo. Verduras altas para saciedad, fruta controlada, y grasas siempre medidas.',
    'Importante por tu riesgo de insulina alta: nunca te saltes comidas, siempre combina carbohidrato con proteína o grasa, y prefiere fruta entera (nunca en jugo).',
    'Alimentos libres (pepino, jícama, gelatina light, verduras) los puedes comer sin límite cuando tengas hambre entre comidas.',
    'Leguminosas (frijol, lenteja, garbanzo) solo 3 veces por semana en cantidad de media taza. Son excelentes para control de azúcar.',
    'Con 65 kg, 1.60 m y actividad muy baja, un déficit moderado te lleva a ~58 kg. La clave es constancia, no restricción extrema.',
  ],
};

// --- EQUIVALENCIAS PARA EL NUTRIÓLOGO ---
export const equivalenciasELLA = [
  {
    titulo: 'Frutas permitidas (1 porción al día)',
    icon: 'Apple',
    items: [
      '1 manzana, pera, durazno, kiwi o mango = 1 porción',
      '1/2 plátano = 1 porción',
      '2 naranjas medianas, 2 guayabas o 1 toronja = 1 porción',
      '3 ciruelas pasas o 1 dátil = 1 porción',
      '1 taza de fresas, frambuesa, zarzamora, moras, melón, sandía o papaya = 1 porción',
      '15 uvas = 1 porción',
      '⚠️ Siempre enteras, NUNCA en jugo (por insulina)',
    ],
  },
  {
    titulo: 'Verduras permitidas (6 porciones al día)',
    icon: 'Carrot',
    items: [
      'Apio, brócoli, calabacita, chayote, coliflor, ejotes, espárragos, espinacas',
      'Champiñón, col, flor de calabaza, nopales, verdolaga',
      'Jitomate, tomate, cebolla, chile poblano, pimiento morrón',
      'Lechuga, pepino, zanahoria, betabel, germinado de alfalfa',
      'Alimentos libres: pepino, jícama, gelatina light (sin límite)',
    ],
  },
  {
    titulo: 'Cereales y tubérculos (3 porciones al día)',
    icon: 'Wheat',
    items: [
      '1 tortilla de maíz = 1 porción',
      '1/2 birote salado o integral (sin el migajón) = 1 porción',
      '1/3 taza de maíz pozolero = 1 porción',
      '1/2 taza arroz integral o quinoa cocida = 1 porción',
      '1/3 taza avena cruda o 1/2 taza cocida = 1 porción',
      '1 tostada horneada o 5 salmas = 1 porción',
      '1/3 taza elote cocido o cuscús = 1 porción',
      '⚠️ Evitar: pan refinado, galletas, granola con azúcar, pasta, tortilla de harina, papa, camote',
    ],
  },
  {
    titulo: 'Proteína: carne, queso o huevo (7 porciones al día)',
    icon: 'Beef',
    items: [
      '40 g pollo (pechuga sin piel), res magra o cerdo magro = 1 porción',
      '40 g pescado (tilapia, huachinango) o mariscos = 1 porción',
      '1 huevo = 1 porción',
      '30 g panela, Oaxaca, requesón o cottage = 1 porción',
      '1/3 lata atún o sardina en agua = 1 porción',
      '2 rebanadas jamón de pavo = 1 porción',
    ],
  },
  {
    titulo: 'Grasas permitidas (8 porciones al día)',
    icon: 'Droplets',
    items: [
      '1 cdita aceite de oliva o vegetal = 1 porción',
      '1/3 aguacate = 1 porción',
      '7 almendras o 6 nueces = 1 porción',
      '14 cacahuates o 20 pistaches = 1 porción',
      '2 cdas de chía, linaza o ajonjolí = 1 porción',
      '1 cda crema de cacahuate = 1 porción',
      'Pepitas, semillas de girasol, semillas de hemp también cuentan',
    ],
  },
  {
    titulo: 'Leguminosas y lácteos',
    icon: 'Bean',
    items: [
      'Frijol, lenteja, garbanzo, chícharo, soya',
      'Cantidad: media taza por vez',
      'Frecuencia: máximo 3 veces por semana',
      'lacteos deslactosada light: 1 taza (opcional)',
      'Yogurt natural sin azúcar o yogurt griego',
      '⚠️ Las leguminosas son excelentes para control de insulina por su fibra',
    ],
  },
  {
    titulo: 'Nota sobre insulina',
    icon: 'AlertTriangle',
    items: [
      'Nunca te saltes comidas — mantén horarios estables',
      'Siempre combina carbohidrato con proteína o grasa',
      'Prefiere frutas enteras, NUNCA en jugo',
      'Las leguminosas y la fibra son tus aliados',
      'Evita azúcares simples, refrescos, pan blanco y jugos',
      'La chía, linaza y avena ayudan a regular la glucosa',
    ],
  },
];

// --- PLAN DE COMIDAS (AGREGAR O QUITAR ELEMENTOS AQUÍ) ---
import { mealsDatabase, type CatalogMealItem } from './mealsDB';

export const planELLA: Record<string, Record<string, MealItem[]>> = {};

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const mapToVariantElla = (ids: string[]): MealItem[] => {
  return mealsDatabase.filter(m => ids.includes(m.id)).map(m => ({
    nombre: m.nombre,
    tags: m.tags,
    super: m.super,
    porciones: "Dummy",
    detalle: "Dummy",
    caloriasKcal: 0,
    proteinaG: 0,
    grasasG: 0,
  }));
};

const defaultEllaDayPlan = {
  desayuno: mapToVariantElla(['des_01', 'des_02', 'des_03']),
  colacion_am: mapToVariantElla(['col_01', 'col_02', 'col_03']),
  comida: mapToVariantElla(['com_01', 'com_02', 'com_03']),
  colacion_pm: mapToVariantElla(['col_01', 'col_02', 'col_03']),
  cena: mapToVariantElla(['cen_01', 'cen_02']),
};

WEEK_DAYS.forEach(day => {
  planELLA[day] = { ...defaultEllaDayPlan };
});
