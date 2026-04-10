import type { MealItem, MealTime } from '../data';

// --- INFORMACIÓN PERSONAL Y METAS ---
export const perfilEL = {
  id: 'el',
  nombre: 'El',
  edad: 32,
  descripcion: 'Plan diseñado para bajar de peso con horarios tarde-noche. Tu riesgo principal es llegar con hambre y rebotar a pan, galletas, cereal o dulce. Este plan mete proteína fuerte en cada comida y opciones dulces inteligentes.',
  perfil: '90 kg • 1.70 m • 32 años • IMC 31.1',
  meta: 'Llegar a peso saludable (~75 kg) sin sentir castigo',
  metaCaloricaKcalDia: 1850,
  horariosTexto: '9–10 am • Col. AM • 5–6 pm • Col. PM • 10–11 pm',
  momentos: [
    { key: 'desayuno', label: 'Desayuno', hora: '9:00–10:00 am' },
    { key: 'colacion_am', label: 'Colación mañana', hora: '12:00–1:00 pm' },
    { key: 'comida', label: 'Comida', hora: '5:00–6:00 pm' },
    { key: 'colacion_pm', label: 'Colación tarde', hora: '7:30–8:30 pm' },
    { key: 'cena', label: 'Cena', hora: '10:00–11:00 pm' },
  ],
  objetivosPorMomento: {
    desayuno: { frutas: 0, verduras: 2, cereales: 2, leguminosas: 0, lacteos: 1, proteina: 4, grasas: 2 },
    colacion_am: { frutas: 1, verduras: 0, cereales: 1, leguminosas: 0, lacteos: 0, proteina: 0, grasas: 2 },
    comida: { frutas: 0, verduras: 2, cereales: 2, leguminosas: 0, lacteos: 0, proteina: 5, grasas: 2 },
    colacion_pm: { frutas: 0, verduras: 0, cereales: 0, leguminosas: 0, lacteos: 0, proteina: 0, grasas: 0 },
    cena: { frutas: 2, verduras: 0, cereales: 2, leguminosas: 0, lacteos: 1, proteina: 0, grasas: 2 },
  },
  distribucionDiaria: [
    { grupo: 'Frutas', total: 3, detalle: '1 en colación AM + 2 en cena' },
    { grupo: 'Verduras', total: 4, detalle: '2 desayuno + 2 comida' },
    { grupo: 'Cereales', total: 7, detalle: '2 desayuno + 1 col. AM + 2 comida + 2 cena' },
    { grupo: 'Proteína', total: 9, detalle: '4 desayuno + 5 comida' },
    { grupo: 'Grasas', total: 8, detalle: '2 desayuno + 2 col. AM + 2 comida + 2 cena' },
    { grupo: 'lacteos', total: 2, detalle: '1 en desayuno + 1 en cena' },
  ],
  resumenPersonal: [
    'Tu riesgo principal no es comer poquito: es llegar con hambre y rebotar a pan, galletas, cereal o dulce. Por eso el plan lleva proteína alta en cada comida.',
    'La comida fuerte va más tarde porque tus horarios reales son tarde-noche. Así llegas menos descompensado a la cena.',
    'Las colaciones de mañana y tarde son tu escudo anti-antojo: fruta con grasa saludable te mantiene estable y los alimentos libres (pepino, jícama, gelatina) son ilimitados.',
    'Con 90 kg, 1.70 m y actividad muy baja, tu meta es ~75 kg. Esto se logra creando un déficit moderado sin pasar hambre.',
    'Tip clave: cuando te pegue el antojo de dulce, ve a yogurt griego con canela, fruta con nueces, gelatina light, o 1-2 cuadritos de chocolate amargo. No es trampa, es estrategia.',
  ],
};

// --- EQUIVALENCIAS PARA EL NUTRIÓLOGO ---
export const equivalenciasEL = [
  {
    titulo: 'Proteína (carne, queso, huevo)',
    icon: 'Beef',
    items: [
      '30-40 g de pollo, res o pescado crudo = 1 porción',
      '1 huevo = 1 porción',
      '40 g de panela o queso Oaxaca = 1 porción',
      '1/3 lata de atún en agua = 1 porción',
      '2 rebanadas de jamón de pavo = 1 porción',
      '30 g requesón o cottage = 1 porción',
    ],
  },
  {
    titulo: 'Cereales y tubérculos',
    icon: 'Wheat',
    items: [
      '1 tortilla de maíz o 2 tortillas chicas = 1 porción',
      '1/2 birote salado o integral (sin el migajón) = 1 porción',
      '1/3 taza de maíz pozolero = 1 porción',
      '1/2 taza de arroz integral cocido = 1 porción',
      '1/3 taza de avena cruda = 1 porción',
      '1/2 taza avena cocida = 1 porción',
      '5 salmas o 2 tostadas horneadas = 1 porción',
      '1/3 taza elote cocido = 1 porción',
      'Evitar: pan refinado, galletas, granola con azúcar, pasta, tortilla de harina',
    ],
  },
  {
    titulo: 'Grasas saludables',
    icon: 'Droplets',
    items: [
      '1/4 de aguacate = 1 porción',
      '10 almendras o 6 nueces = 1 porción',
      '14 cacahuates = 1 porción',
      '1 cucharadita de aceite de oliva = 1 porción',
      '1 cucharada de crema de cacahuate = 1 porción',
      '2 cdas de chía, linaza o ajonjolí = 1 porción',
      '20 pistaches = 1 porción',
    ],
  },
  {
    titulo: 'Frutas permitidas',
    icon: 'Apple',
    items: [
      '1 manzana, pera, durazno o kiwi = 1 porción',
      '1/2 plátano o 1/2 mango = 1 porción',
      '2 naranjas medianas o 2 guayabas = 1 porción',
      '1 taza de fresas, moras o papaya = 1 porción',
      '15 uvas = 1 porción',
      'Siempre enteras, nunca en jugo',
    ],
  },
  {
    titulo: 'Cuando te pegue el antojo de dulce',
    icon: 'Candy',
    items: [
      'Yogurt griego con canela — sabe a postre sin azúcar',
      '1 fruta + 10 nueces — dulce + grasa = saciedad',
      'Gelatina light — libre, sin límite',
      '1–2 cuadritos de chocolate amargo (70%+)',
      'Avena con canela y plátano — sabe dulce, es plan',
    ],
  },
  {
    titulo: 'Alimentos libres (sin límite)',
    icon: 'Heart',
    items: [
      'Pepino, jícama, gelatina light, verduras crudas',
      'Limón, chile piquín, tajín, especias',
      'Úsalos cuando tengas hambre entre comidas',
      'Son tu arma secreta contra los antojos',
    ],
  },
];

// --- PLAN DE COMIDAS (AGREGAR O QUITAR ELEMENTOS AQUÍ) ---
import { mealsDatabase } from './mealsDB';

export const planEL: Record<string, Record<string, MealItem[]>> = {};

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const mapToVariant = (ids: string[]): MealItem[] => {
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

const defaultElDayPlan = {
  desayuno: mapToVariant(['des_01', 'des_02', 'des_03']),
  colacion_am: mapToVariant(['col_01', 'col_02', 'col_03']),
  comida: mapToVariant(['com_01', 'com_02', 'com_03']),
  colacion_pm: mapToVariant(['col_04', 'col_05', 'col_06']),
  cena: mapToVariant(['cen_01', 'cen_02', 'cen_03']),
};

WEEK_DAYS.forEach(day => {
  planEL[day] = { ...defaultElDayPlan };
});
