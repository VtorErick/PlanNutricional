import type { MealItem } from '../data';

export const voPlan: Record<string, Record<string, MealItem[]>> = {
  Lunes: {
    desayuno: [
      {
        nombre: 'Huevos a la mexicana con tortillas',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '3 huevos revueltos con jitomate, cebolla y chile serrano, 2 tortillas de maíz, 1/4 aguacate. Cocinar con aceite en spray.',
        tags: ['mexicano', 'saciante', 'anti-antojo'],
        super: ['huevo', 'jitomate', 'cebolla', 'chile', 'tortilla', 'aguacate'],
      },
      {
        nombre: 'Yogurt alto en proteína con avena',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 taza yogurt griego natural + 1/3 taza avena + canela. Aparte: pepino y jícama con limón (verduras). 2 cdas chía, 5 almendras.',
        tags: ['dulce-controlado', 'anti-antojo', 'fácil'],
        super: ['yogurt griego', 'avena', 'canela', 'pepino', 'jícama', 'chía', 'almendras'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Manzana con crema de cacahuate',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 manzana grande + 1 cda crema de cacahuate natural + 5 almendras. Comer despacio, la fibra + grasa te mantiene sin hambre.',
        tags: ['anti-antojo', 'dulce-natural', 'saciante'],
        super: ['manzana', 'crema de cacahuate', 'almendras'],
      },
    ],
    comida: [
      {
        nombre: 'Pollo asado con arroz y nopales',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g pechuga asada + 1/2 taza arroz integral + nopales asados + ensalada verde + 1 tortilla + 1 cdita aceite + 1/4 aguacate.',
        tags: ['batch-cooking', 'muy saciante', 'limpio'],
        super: ['pollo', 'arroz integral', 'nopales', 'lechuga', 'pepino', 'tortilla', 'aceite oliva', 'aguacate'],
      },
      {
        nombre: 'Carne asada con ensalada completa',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g carne de res magra asada, ensalada grande (lechuga, jitomate, pepino, cebolla), 2 tortillas, 1/4 aguacate.',
        tags: ['parrilla', 'proteico', 'llenador'],
        super: ['res magra', 'lechuga', 'jitomate', 'pepino', 'cebolla', 'tortilla', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Pepino con limón y chile',
        porciones: 'Libre',
        detalle: '1 pepino grande en rodajas con limón y chile piquín. Sin límite — esto mata el antojo de botana.',
        tags: ['libre', 'anti-antojo', 'crujiente'],
        super: ['pepino', 'limón'],
      },
      {
        nombre: 'Gelatina light',
        porciones: 'Libre',
        detalle: '1-2 gelatinas light. Libre. Alternativa para cuando quieres algo dulce sin romper el plan.',
        tags: ['libre', 'dulce-controlado', 'práctico'],
        super: ['gelatina light'],
      },
    ],
    cena: [
      {
        nombre: 'Ensalada de atún completa',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 lata atún en agua con pepino, jitomate, lechuga, cebolla morada, 1 tostada horneada, 1/3 aguacate, limón.',
        tags: ['noche', 'sin pesadez', 'rápido'],
        super: ['atún', 'pepino', 'jitomate', 'lechuga', 'cebolla', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Omelette nocturno con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '3 huevos en omelette con espinaca, champiñón y pimiento, 1 tortilla, 1/3 aguacate.',
        tags: ['rápido', 'proteico', 'anti-antojo'],
        super: ['huevo', 'espinaca', 'champiñón', 'pimiento', 'tortilla', 'aguacate'],
      },
    ],
  },

  Martes: {
    desayuno: [
      {
        nombre: 'Mollete ligero con frijoles y panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 bolillo integral con frijoles (1/2 taza), panela gratinada, pico de gallo. Ensalada de lechuga al lado. 1/4 aguacate. Cuenta como leguminosa.',
        tags: ['antojito-controlado', 'mexicano', 'leguminosa'],
        super: ['bolillo integral', 'frijol', 'panela', 'jitomate', 'cebolla', 'lechuga', 'aguacate'],
      },
      {
        nombre: 'Huevos con espinaca y champiñón',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '3 huevos revueltos con espinaca y champiñón salteados, 1 tortilla de maíz, 1/3 aguacate, 1 cdita aceite.',
        tags: ['proteico', 'saciante', 'bajo en carb'],
        super: ['huevo', 'espinaca', 'champiñón', 'tortilla', 'aguacate', 'aceite oliva'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Plátano con nueces',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1/2 plátano + 8 nueces. Combinación de energía rápida + grasas que controlan hambre.',
        tags: ['energía', 'saciante', 'práctico'],
        super: ['plátano', 'nueces'],
      },
    ],
    comida: [
      {
        nombre: 'Picadillo magro con arroz',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g carne molida magra en picadillo con calabacita, zanahoria y ejotes, 1/2 taza arroz, 1 tortilla, 1 cdita aceite.',
        tags: ['casero', 'batch-cooking', 'llenador'],
        super: ['res molida', 'calabacita', 'zanahoria', 'ejotes', 'arroz', 'tortilla', 'aceite'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Jícama con chile y limón',
        porciones: 'Libre',
        detalle: '1 taza jícama en bastones con tajín y limón. Libre, ideal para antojo de botana crujiente.',
        tags: ['libre', 'crujiente', 'anti-antojo'],
        super: ['jícama', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Sopa de verduras con tostada de pollo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: 'Sopa de calabacita, zanahoria, chayote y espinaca, 1 tostada horneada con 100g pollo desmenuzado y 1/3 aguacate.',
        tags: ['calmante', 'noche', 'ligero'],
        super: ['calabacita', 'zanahoria', 'chayote', 'espinaca', 'pollo', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Quesadilla de panela con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tortilla con 50g panela, champiñones y espinaca. Guacamole al lado (1/3 aguacate). Ensalada de jitomate.',
        tags: ['antojito-controlado', 'rápido', 'saciante'],
        super: ['tortilla', 'panela', 'champiñón', 'espinaca', 'aguacate', 'jitomate'],
      },
    ],
  },

  Miércoles: {
    desayuno: [
      {
        nombre: 'Chilaquiles ligeros con huevo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tortilla cortada y horneada (no frita) con salsa verde, 2 huevos estrellados encima, 1 cda crema, 30g panela. Lechuga y jitomate al lado.',
        tags: ['mexicano', 'antojito-controlado', 'satisfactorio'],
        super: ['tortilla', 'tomate verde', 'huevo', 'crema', 'panela', 'lechuga', 'jitomate'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Naranja con almendras',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '2 naranjas medianas + 10 almendras. La fibra de la naranja entera (no jugo) ayuda a evitar picos de azúcar.',
        tags: ['vitamina C', 'fibra', 'fácil'],
        super: ['naranja', 'almendras'],
      },
    ],
    comida: [
      {
        nombre: 'Pollo en salsa verde con calabacitas y arroz',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g pollo en salsa verde con calabacitas y chayote, 1/2 taza arroz, 1 tortilla, 1/4 aguacate.',
        tags: ['mexicano', 'casero', 'reconfortante'],
        super: ['pollo', 'tomate verde', 'calabacita', 'chayote', 'arroz', 'tortilla', 'aguacate'],
      },
      {
        nombre: 'Pescado a la plancha con ensalada',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g filete de tilapia a la plancha con limón, ensalada grande, 1/2 taza arroz, 1 tortilla, 1 cdita aceite, 1/4 aguacate.',
        tags: ['omega-3', 'ligero', 'limpio'],
        super: ['tilapia', 'lechuga', 'jitomate', 'pepino', 'arroz', 'tortilla', 'aceite oliva', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Verduras crudas con limón',
        porciones: 'Libre',
        detalle: 'Palitos de pepino, zanahoria y jícama con limón y chile. Alimentos libres, come lo que quieras.',
        tags: ['libre', 'crujiente', 'anti-antojo'],
        super: ['pepino', 'zanahoria', 'jícama'],
      },
    ],
    cena: [
      {
        nombre: 'Ensalada de pollo grande',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g pollo desmenuzado con lechuga, jitomate, pepino, cebolla, 1 tostada, 1/3 aguacate, limón y salsa.',
        tags: ['completo', 'fresco', 'saciante'],
        super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'cebolla', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Tacos de lechuga con carne',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: 'Hojas de lechuga como tortilla con 120g carne molida magra, jitomate, cebolla, cilantro. 1 tostada extra, 1/3 aguacate.',
        tags: ['bajo en carb', 'sabroso', 'anti-antojo'],
        super: ['lechuga', 'res molida', 'jitomate', 'cebolla', 'cilantro', 'tostada', 'aguacate'],
      },
    ],
  },

  Jueves: {
    desayuno: [
      {
        nombre: 'Avena con yogurt y frutos',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1/3 taza avena cocida con 1 taza yogurt griego, canela. Aparte: pepino y jícama (verduras). 2 cdas linaza + 5 nueces. Esto sustituye pan/cereal sin ser castigo.',
        tags: ['dulce-controlado', 'anti-antojo', 'fibra'],
        super: ['avena', 'yogurt griego', 'canela', 'pepino', 'jícama', 'linaza', 'nueces'],
      },
      {
        nombre: 'Huevos con nopales y queso',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '2 huevos revueltos con nopales y cebolla, 40g panela, 1 tortilla, 1/4 aguacate.',
        tags: ['mexicano', 'saciante', 'clásico'],
        super: ['huevo', 'nopales', 'cebolla', 'panela', 'tortilla', 'aguacate'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Guayabas con cacahuates',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '2 guayabas + 14 cacahuates naturales. Alta fibra + proteína vegetal = control de hambre.',
        tags: ['fibra', 'proteína vegetal', 'económico'],
        super: ['guayaba', 'cacahuates'],
      },
    ],
    comida: [
      {
        nombre: 'Carne en salsa roja con nopales y frijoles',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g carne de res en salsa roja con nopales, 1/2 taza frijoles (leguminosa del día), 1 tortilla, 1/4 aguacate.',
        tags: ['mexicano', 'casero', 'leguminosa'],
        super: ['res', 'jitomate', 'chile', 'nopales', 'frijol', 'tortilla', 'aguacate'],
      },
      {
        nombre: 'Lentejas guisadas con verdura',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '1/2 taza lentejas + 100g pollo desmenuzado, con zanahoria, calabacita y jitomate, 1/2 taza arroz, 1 cdita aceite, 1/4 aguacate.',
        tags: ['leguminosa', 'fibra', 'muy llenador'],
        super: ['lenteja', 'pollo', 'zanahoria', 'calabacita', 'jitomate', 'arroz', 'aceite', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Pepino con limón',
        porciones: 'Libre',
        detalle: '1 pepino entero en rodajas con limón. Libre. Come todo lo que necesites.',
        tags: ['libre', 'hidratante', 'cero calorías'],
        super: ['pepino', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Tostadas de atún con verdura',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tostada horneada con 1 lata atún, lechuga, jitomate, cebolla morada, 1/3 aguacate, salsa valentina.',
        tags: ['práctico', 'rápido', 'sabroso'],
        super: ['tostada', 'atún', 'lechuga', 'jitomate', 'cebolla', 'aguacate'],
      },
      {
        nombre: 'Quesadilla con champiñones y espinaca',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tortilla con 50g panela/Oaxaca, champiñones y espinaca salteados, 1/3 aguacate. Jitomate al lado.',
        tags: ['antojito-controlado', 'vegetariano', 'noche'],
        super: ['tortilla', 'panela', 'champiñón', 'espinaca', 'aguacate', 'jitomate'],
      },
    ],
  },

  Viernes: {
    desayuno: [
      {
        nombre: 'Huevos con jamón de pavo y verdura',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '2 huevos + 3 rebanadas jamón de pavo revueltos con jitomate y espinaca, 1 tortilla, 1/4 aguacate, 1 cdita aceite.',
        tags: ['proteico', 'rápido', 'saciante'],
        super: ['huevo', 'jamón de pavo', 'jitomate', 'espinaca', 'tortilla', 'aguacate'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Pera con semillas de girasol',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 pera grande con cáscara + 2 cdas semillas de girasol + 5 almendras.',
        tags: ['fibra', 'saciante', 'fácil'],
        super: ['pera', 'semillas de girasol', 'almendras'],
      },
    ],
    comida: [
      {
        nombre: 'Pescado a la plancha con arroz y ensalada',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g filete de pescado a la plancha con limón, 1/2 taza arroz integral, ensalada grande, 1 tortilla, 1 cdita aceite, 1/4 aguacate.',
        tags: ['omega-3', 'limpio', 'ligero'],
        super: ['pescado', 'arroz integral', 'lechuga', 'jitomate', 'pepino', 'tortilla', 'aceite oliva', 'aguacate'],
      },
      {
        nombre: 'Tacos de carne asada con nopales',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '2 tortillas de maíz con 180g carne asada, nopales a la plancha, cebolla, cilantro, salsa, 1/3 aguacate.',
        tags: ['mexicano', 'parrilla', 'viernes'],
        super: ['tortilla', 'res', 'nopales', 'cebolla', 'cilantro', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Jícama con chile',
        porciones: 'Libre',
        detalle: 'Jícama en bastones con chile tajín y limón. Libre y crujiente.',
        tags: ['libre', 'crujiente', 'refrescante'],
        super: ['jícama', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Ensalada de pollo con aguacate',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g pollo desmenuzado, lechuga, jitomate, pepino, zanahoria, 1 tostada, 1/3 aguacate, limón.',
        tags: ['fresco', 'completo', 'noche'],
        super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'zanahoria', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Queso panela a la plancha con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '100g panela a la plancha, ensalada de espinaca, jitomate, pepino, 1 tostada, 1 cdita aceite, 6 nueces.',
        tags: ['vegetariano', 'rápido', 'saciante'],
        super: ['panela', 'espinaca', 'jitomate', 'pepino', 'tostada', 'aceite oliva', 'nueces'],
      },
    ],
  },

  Sábado: {
    desayuno: [
      {
        nombre: 'Chilaquiles verdes ligeros con pollo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tortilla cortada y horneada con salsa verde, 100g pollo desmenuzado, 1 cda crema, 30g panela, lechuga y cebolla al lado.',
        tags: ['fin de semana', 'mexicano', 'especial'],
        super: ['tortilla', 'tomate verde', 'pollo', 'crema', 'panela', 'lechuga'],
      },
      {
        nombre: 'Huevos divorciados con frijoles',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '2 huevos + 1 clara, salsa verde y roja, 1 tortilla, frijoles refritos (1/2 taza), 1/4 aguacate. Leguminosa.',
        tags: ['especial', 'mexicano', 'leguminosa'],
        super: ['huevo', 'salsa verde', 'salsa roja', 'tortilla', 'frijol', 'aguacate'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Fresas con yogurt y chía',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 taza fresas + 1/2 taza yogurt griego sin azúcar + 2 cdas chía. Anti-antojo dulce perfecto.',
        tags: ['anti-antojo', 'dulce-natural', 'saciante'],
        super: ['fresas', 'yogurt griego', 'chía'],
      },
    ],
    comida: [
      {
        nombre: 'Carne asada con guacamole y ensalada',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '200g carne asada, guacamole (1/3 aguacate, jitomate, cebolla, cilantro), ensalada grande, 2 tortillas.',
        tags: ['parrilla', 'fin de semana', 'premium'],
        super: ['res', 'aguacate', 'jitomate', 'cebolla', 'cilantro', 'lechuga', 'tortilla'],
      },
      {
        nombre: 'Caldo de res con verduras',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: 'Caldo con 180g res, calabacita, chayote, zanahoria, ejotes, elote (1/3 taza). 1 tortilla, 1/4 aguacate.',
        tags: ['casero', 'reconfortante', 'familiar'],
        super: ['res', 'calabacita', 'chayote', 'zanahoria', 'ejotes', 'elote', 'tortilla', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Gelatina light con pepino',
        porciones: 'Libre',
        detalle: '1-2 gelatinas light + pepino con limón. Libres. Para el antojo de dulce de la tarde.',
        tags: ['libre', 'dulce-controlado', 'anti-antojo'],
        super: ['gelatina light', 'pepino'],
      },
    ],
    cena: [
      {
        nombre: 'Tacos de lechuga con pollo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: 'Hojas de lechuga como tortilla con 120g pollo, jitomate, cebolla, cilantro. 1 tostada, 1/3 aguacate.',
        tags: ['bajo en carb', 'fresco', 'ligero'],
        super: ['lechuga', 'pollo', 'jitomate', 'cebolla', 'cilantro', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Sopa de verduras con huevo y panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: 'Sopa de brócoli, zanahoria, calabacita y espinaca. 2 huevos pochados + 30g panela, 1 tostada, 5 almendras.',
        tags: ['reconfortante', 'caliente', 'noche'],
        super: ['brócoli', 'zanahoria', 'calabacita', 'espinaca', 'huevo', 'panela', 'tostada', 'almendras'],
      },
    ],
  },

  Domingo: {
    desayuno: [
      {
        nombre: 'Huevos rancheros con frijol',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '2 huevos + 1 clara estrellados sobre 1 tortilla, salsa ranchera, frijoles (1/2 taza), 1/4 aguacate. Leguminosa.',
        tags: ['mexicano', 'dominical', 'especial'],
        super: ['huevo', 'tortilla', 'jitomate', 'chile', 'frijol', 'aguacate'],
      },
      {
        nombre: 'Avena con plátano y canela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1/3 taza avena + 1 taza yogurt griego + 1/2 plátano + canela. Aparte: pepino y jícama (verduras). 2 cdas chía + 5 nueces.',
        tags: ['dulce-controlado', 'dominical', 'anti-antojo'],
        super: ['avena', 'yogurt griego', 'plátano', 'pepino', 'jícama', 'chía', 'nueces'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Kiwi con nueces',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 kiwi + 8 nueces. Vitamina C + grasas saludables.',
        tags: ['vitamina C', 'saciante', 'rápido'],
        super: ['kiwi', 'nueces'],
      },
    ],
    comida: [
      {
        nombre: 'Pollo rostizado con ensalada y arroz',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g pollo rostizado (sin piel), ensalada grande, 1/2 taza arroz, 1 tortilla, 1/4 aguacate.',
        tags: ['dominical', 'familiar', 'práctico'],
        super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'zanahoria', 'arroz', 'tortilla', 'aguacate'],
      },
      {
        nombre: 'Carne asada con ensalada y guacamole',
        porciones: 'Verduras 2 | Cereales 2 | Proteína 4 | Grasas 2',
        detalle: '180g carne asada, ensalada verde, guacamole (1/3 aguacate), 2 tortillas, salsa.',
        tags: ['parrilla', 'especial', 'dominical'],
        super: ['res', 'lechuga', 'jitomate', 'pepino', 'cebolla', 'aguacate', 'tortilla'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Pepino con limón',
        porciones: 'Libre',
        detalle: '1 pepino en rodajas con limón y chile. Libre.',
        tags: ['libre', 'refrescante', 'cero calorías'],
        super: ['pepino', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Ensalada completa de atún',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 lata atún en agua, lechuga, jitomate, pepino, cebolla, 1 tostada, 1/3 aguacate, limón.',
        tags: ['práctico', 'ligero', 'noche'],
        super: ['atún', 'lechuga', 'jitomate', 'pepino', 'cebolla', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Quesadilla con verduras y panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tortilla con 50g panela, espinaca y champiñón salteados, 1/3 aguacate. Ensalada al lado.',
        tags: ['antojito-controlado', 'rápido', 'reconfortante'],
        super: ['tortilla', 'panela', 'espinaca', 'champiñón', 'aguacate'],
      },
    ],
  },
};
