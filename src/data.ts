import {
  Apple, Carrot, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart,
} from 'lucide-react';
import { vaPlan } from './data/vaPlan';
import { voPlan } from './data/voPlan';

export interface MealItem {
  nombre: string;
  porciones: string;
  detalle: string;
  tags: string[];
  super: string[];
}

export interface MealTime {
  key: string;
  label: string;
  hora: string;
}

export interface Profile {
  id: string;
  nombre: string;
  edad: number;
  descripcion: string;
  perfil: string;
  meta: string;
  horariosTexto: string;
  notaSalud?: string;
  momentos: MealTime[];
  objetivosPorMomento: Record<string, Record<string, number>>;
  distribucionDiaria: { grupo: string; total: number; detalle: string }[];
  resumenPersonal: string[];
  plan: Record<string, Record<string, MealItem[]>>;
}

export interface Equivalencia {
  titulo: string;
  icon: any;
  items: string[];
}

export const perfilesData: Record<string, Profile> = {
  vo: {
    id: 'vo',
    nombre: 'V(o)',
    edad: 32,
    descripcion: 'Plan diseñado para bajar de peso con horarios tarde-noche. Tu riesgo principal es llegar con hambre y rebotar a pan, galletas, cereal o dulce. Este plan mete proteína fuerte en cada comida y opciones dulces inteligentes.',
    perfil: '90 kg • 1.70 m • 32 años • IMC 31.1',
    meta: 'Llegar a peso saludable (~75 kg) sin sentir castigo',
    horariosTexto: '9–10 am • Col. AM • 5–6 pm • Col. PM • 10–11 pm',
    momentos: [
      { key: 'desayuno', label: 'Desayuno', hora: '9:00–10:00 am' },
      { key: 'colacion_am', label: 'Colación mañana', hora: '12:00–1:00 pm' },
      { key: 'comida', label: 'Comida', hora: '5:00–6:00 pm' },
      { key: 'colacion_pm', label: 'Colación tarde', hora: '7:30–8:30 pm' },
      { key: 'cena', label: 'Cena', hora: '10:00–11:00 pm' },
    ],
    objetivosPorMomento: {
      desayuno: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, leche: 0, proteina: 3, grasas: 2 },
      colacion_am: { frutas: 1, verduras: 0, cereales: 0, leguminosas: 0, leche: 0, proteina: 0, grasas: 2 },
      comida: { frutas: 0, verduras: 2, cereales: 2, leguminosas: 0, leche: 0, proteina: 4, grasas: 2 },
      colacion_pm: { frutas: 0, verduras: 0, cereales: 0, leguminosas: 0, leche: 0, proteina: 0, grasas: 0 },
      cena: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, leche: 0, proteina: 3, grasas: 2 },
    },
    distribucionDiaria: [
      { grupo: 'Frutas', total: 1, detalle: '1 en colación AM' },
      { grupo: 'Verduras', total: 6, detalle: '2 desayuno + 2 comida + 2 cena' },
      { grupo: 'Cereales', total: 4, detalle: '1 desayuno + 2 comida + 1 cena' },
      { grupo: 'Proteína', total: 10, detalle: '3 desayuno + 4 comida + 3 cena' },
      { grupo: 'Grasas', total: 8, detalle: '2 desayuno + 2 col. AM + 2 comida + 2 cena' },
      { grupo: 'Leguminosas', total: 3, detalle: '½ taza, máximo 3 veces por semana' },
    ],
    resumenPersonal: [
      'Tu riesgo principal no es comer poquito: es llegar con hambre y rebotar a pan, galletas, cereal o dulce. Por eso el plan lleva proteína alta en cada comida.',
      'La comida fuerte va más tarde porque tus horarios reales son tarde-noche. Así llegas menos descompensado a la cena.',
      'Las colaciones de mañana y tarde son tu escudo anti-antojo: fruta con grasa saludable te mantiene estable y los alimentos libres (pepino, jícama, gelatina) son ilimitados.',
      'Con 90 kg, 1.70 m y actividad muy baja, tu meta es ~75 kg. Esto se logra creando un déficit moderado sin pasar hambre.',
      'Tip clave: cuando te pegue el antojo de dulce, ve a yogurt griego con canela, fruta con nueces, gelatina light, o 1-2 cuadritos de chocolate amargo. No es trampa, es estrategia.',
    ],
    plan: voPlan,
  },
  va: {
    id: 'va',
    nombre: 'V(a)',
    edad: 31,
    descripcion: 'Plan basado en la guía del nutriólogo con estructura de equivalentes. Frutas moderadas, verduras altas, grasas medidas. Adaptado para cuidar niveles de insulina.',
    perfil: '65 kg • 1.60 m • 31 años • IMC 25.4',
    meta: 'Llegar a peso saludable (~58 kg) con control de insulina',
    horariosTexto: '8 am • Col. AM • 3 pm • Col. PM • 9–10 pm',
    notaSalud: '⚠️ Riesgo de insulina alta: priorizar fibra, evitar azúcares simples, no saltarse comidas, preferir frutas enteras (nunca en jugo), y combinar siempre carbohidrato con proteína o grasa.',
    momentos: [
      { key: 'desayuno', label: 'Desayuno', hora: '8:00 am' },
      { key: 'colacion_am', label: 'Colación mañana', hora: '11:00 am' },
      { key: 'comida', label: 'Comida', hora: '3:00 pm' },
      { key: 'colacion_pm', label: 'Colación tarde', hora: '6:00 pm' },
      { key: 'cena', label: 'Cena', hora: '9:00–10:00 pm' },
    ],
    objetivosPorMomento: {
      desayuno: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, leche: 0, proteina: 2, grasas: 2 },
      colacion_am: { frutas: 1, verduras: 0, cereales: 0, leguminosas: 0, leche: 0, proteina: 0, grasas: 2 },
      comida: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, leche: 0, proteina: 3, grasas: 2 },
      colacion_pm: { frutas: 0, verduras: 0, cereales: 0, leguminosas: 0, leche: 0, proteina: 0, grasas: 0 },
      cena: { frutas: 0, verduras: 2, cereales: 1, leguminosas: 0, leche: 0, proteina: 2, grasas: 2 },
    },
    distribucionDiaria: [
      { grupo: 'Frutas', total: 1, detalle: '1 en colación de la mañana' },
      { grupo: 'Verduras', total: 6, detalle: '2 desayuno + 2 comida + 2 cena' },
      { grupo: 'Cereales', total: 3, detalle: '1 desayuno + 1 comida + 1 cena' },
      { grupo: 'Proteína (carne/queso/huevo)', total: 7, detalle: '2 desayuno + 3 comida + 2 cena' },
      { grupo: 'Grasas', total: 8, detalle: '2 desayuno + 2 col. mañana + 2 comida + 2 cena' },
      { grupo: 'Leguminosas', total: 3, detalle: '½ taza, máximo 3 veces por semana' },
    ],
    resumenPersonal: [
      'Plan del nutriólogo con equivalentes claros por grupo. Verduras altas para saciedad, fruta controlada, y grasas siempre medidas.',
      'Importante por tu riesgo de insulina alta: nunca te saltes comidas, siempre combina carbohidrato con proteína o grasa, y prefiere fruta entera (nunca en jugo).',
      'Alimentos libres (pepino, jícama, gelatina light, verduras) los puedes comer sin límite cuando tengas hambre entre comidas.',
      'Leguminosas (frijol, lenteja, garbanzo) solo 3 veces por semana en cantidad de media taza. Son excelentes para control de azúcar.',
      'Con 65 kg, 1.60 m y actividad muy baja, un déficit moderado te lleva a ~58 kg. La clave es constancia, no restricción extrema.',
    ],
    plan: vaPlan,
  },
};

export const equivalenciasData: Record<string, Equivalencia[]> = {
  vo: [
    {
      titulo: 'Proteína (carne, queso, huevo)',
      icon: Beef,
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
      icon: Wheat,
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
      icon: Droplets,
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
      icon: Apple,
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
      icon: Candy,
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
      icon: Heart,
      items: [
        'Pepino, jícama, gelatina light, verduras crudas',
        'Limón, chile piquín, tajín, especias',
        'Úsalos cuando tengas hambre entre comidas',
        'Son tu arma secreta contra los antojos',
      ],
    },
  ],
  va: [
    {
      titulo: 'Frutas permitidas (1 porción al día)',
      icon: Apple,
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
      icon: Carrot,
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
      icon: Wheat,
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
      icon: Beef,
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
      icon: Droplets,
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
      icon: Bean,
      items: [
        'Frijol, lenteja, garbanzo, chícharo, soya',
        'Cantidad: media taza por vez',
        'Frecuencia: máximo 3 veces por semana',
        'Leche deslactosada light: 1 taza (opcional)',
        'Yogurt natural sin azúcar o yogurt griego',
        '⚠️ Las leguminosas son excelentes para control de insulina por su fibra',
      ],
    },
    {
      titulo: 'Nota sobre insulina',
      icon: AlertTriangle,
      items: [
        'Nunca te saltes comidas — mantén horarios estables',
        'Siempre combina carbohidrato con proteína o grasa',
        'Prefiere frutas enteras, NUNCA en jugo',
        'Las leguminosas y la fibra son tus aliados',
        'Evita azúcares simples, refrescos, pan blanco y jugos',
        'La chía, linaza y avena ayudan a regular la glucosa',
      ],
    },
  ],
};
