import type { MealItem } from '../data';

export const vaPlan: Record<string, Record<string, MealItem[]>> = {
  Lunes: {
    desayuno: [
      {
        nombre: 'Huevos con nopales y tortilla',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '2 huevos revueltos con nopales y jitomate picado, 1 tortilla de maíz, 1/3 de aguacate. Cocinar con aceite en spray.',
        tags: ['mexicano', 'saciante', 'rápido'],
        super: ['huevo', 'nopales', 'jitomate', 'tortilla', 'aguacate'],
      },
      {
        nombre: 'Omelette de espinaca con queso panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: 'Omelette de 2 huevos con 1 taza de espinaca y champiñones, 30g queso panela rallado, 1 tortilla, 1 cdita aceite de oliva.',
        tags: ['proteico', 'bajo en carb', 'fácil'],
        super: ['huevo', 'espinaca', 'champiñón', 'panela', 'tortilla'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Manzana con crema de cacahuate y almendras',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 manzana mediana en rodajas + 1 cda de crema de cacahuate natural + 5 almendras.',
        tags: ['dulce-natural', 'saciante', 'práctico'],
        super: ['manzana', 'crema de cacahuate', 'almendras'],
      },
      {
        nombre: 'Yogurt natural con fresas y chía',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1/2 taza yogurt griego sin azúcar + 1 taza de fresas + 2 cdas de chía.',
        tags: ['fresco', 'fibra', 'anti-insulina'],
        super: ['yogurt griego', 'fresas', 'chía'],
      },
    ],
    comida: [
      {
        nombre: 'Pechuga asada con arroz integral y ensalada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g pechuga a la plancha + 1/2 taza arroz integral + ensalada (lechuga, jitomate, pepino) + 1 cdita aceite oliva + 1/4 aguacate.',
        tags: ['clásico', 'batch-cooking', 'equilibrado'],
        super: ['pollo', 'arroz integral', 'lechuga', 'jitomate', 'pepino', 'aceite oliva', 'aguacate'],
      },
      {
        nombre: 'Pollo en salsa verde con calabacitas',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g pollo desmenuzado en salsa verde con calabacitas y chayote, 1 tortilla de maíz, 6 nueces picadas encima.',
        tags: ['mexicano', 'reconfortante', 'casero'],
        super: ['pollo', 'tomate verde', 'calabacita', 'chayote', 'tortilla', 'nueces'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Pepino con limón y chile',
        porciones: 'Libre',
        detalle: '1 pepino en rodajas con jugo de limón y chile piquín. Sin límite.',
        tags: ['libre', 'crujiente', 'cero calorías'],
        super: ['pepino', 'limón'],
      },
      {
        nombre: 'Jícama con limón',
        porciones: 'Libre',
        detalle: '1 taza de jícama en bastones con limón y chile. Alimento libre.',
        tags: ['libre', 'fibra', 'refrescante'],
        super: ['jícama', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Atún con tostada horneada y aguacate',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1/2 lata de atún en agua con jitomate y pepino picado, 1 tostada horneada, 1/3 aguacate, limón al gusto.',
        tags: ['práctico', 'ligero', 'noche'],
        super: ['atún', 'jitomate', 'pepino', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Ensalada de pollo con nueces',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '80g pollo desmenuzado con lechuga, jitomate, pepino, 1 tostada horneada, 1 cdita aceite oliva, 5 nueces.',
        tags: ['fresco', 'saciante', 'fácil'],
        super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'tostada', 'aceite oliva', 'nueces'],
      },
    ],
  },

  Martes: {
    desayuno: [
      {
        nombre: 'Molletes integrales con frijol y panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 bolillo integral abierto con frijoles (1/2 taza), queso panela gratinado, pico de gallo encima. Cuenta como leguminosa del día.',
        tags: ['mexicano', 'antojito-controlado', 'leguminosa'],
        super: ['bolillo integral', 'frijol', 'panela', 'jitomate', 'cebolla', 'chile'],
      },
      {
        nombre: 'Huevos a la mexicana con tortilla',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '2 huevos revueltos con jitomate, cebolla y chile serrano, 1 tortilla de maíz, 1/3 aguacate.',
        tags: ['clásico', 'rápido', 'saciante'],
        super: ['huevo', 'jitomate', 'cebolla', 'chile', 'tortilla', 'aguacate'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Naranja con nueces',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '2 naranjas medianas + 6 nueces. La fibra de la naranja ayuda a controlar picos de insulina.',
        tags: ['anti-insulina', 'vitamina C', 'fácil'],
        super: ['naranja', 'nueces'],
      },
    ],
    comida: [
      {
        nombre: 'Carne asada con nopales y frijoles',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g carne de res magra asada, nopales a la plancha, ensalada verde, 1 tortilla, 1 cdita aceite. Si ya comiste frijol en desayuno, omite aquí.',
        tags: ['parrilla', 'mexicano', 'proteico'],
        super: ['res magra', 'nopales', 'lechuga', 'tortilla', 'aceite oliva'],
      },
      {
        nombre: 'Tostadas horneadas de pollo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '2 tostadas horneadas con pollo desmenuzado (120g), lechuga, jitomate, 1/4 aguacate, salsa verde.',
        tags: ['práctico', 'mexicano', 'crujiente'],
        super: ['tostada', 'pollo', 'lechuga', 'jitomate', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Gelatina light con pepino',
        porciones: 'Libre',
        detalle: '1 gelatina light + pepino en rodajas con limón.',
        tags: ['libre', 'dulce-controlado', 'hidratante'],
        super: ['gelatina light', 'pepino'],
      },
    ],
    cena: [
      {
        nombre: 'Quesadillas de champiñones con panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tortilla de maíz con 30g panela y champiñones salteados, espinaca al lado, 1/3 aguacate.',
        tags: ['antojito-controlado', 'rápido', 'vegetariano'],
        super: ['tortilla', 'panela', 'champiñón', 'espinaca', 'aguacate'],
      },
      {
        nombre: 'Sopa de verduras con huevo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: 'Sopa de calabacita, chayote, zanahoria y espinaca. Agregar 2 huevos pochados, 1 tostada, 7 almendras.',
        tags: ['reconfortante', 'ligero', 'casero'],
        super: ['calabacita', 'chayote', 'zanahoria', 'espinaca', 'huevo', 'tostada', 'almendras'],
      },
    ],
  },

  Miércoles: {
    desayuno: [
      {
        nombre: 'Chilaquiles verdes ligeros con pollo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tortilla cortada y horneada (no frita) con salsa verde, 80g pollo desmenuzado, cebolla, crema 1 cda, queso panela rallado. Jitomate y lechuga al lado.',
        tags: ['mexicano', 'antojito-controlado', 'fin de semana'],
        super: ['tortilla', 'tomate verde', 'pollo', 'panela', 'lechuga', 'crema'],
      },
      {
        nombre: 'Avena con yogurt y frutas',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1/3 taza avena cocida con yogurt griego, canela. Aparte: pepino y jícama con limón (verduras). 2 cdas chía y 5 almendras.',
        tags: ['dulce-natural', 'fibra', 'anti-insulina'],
        super: ['avena', 'yogurt griego', 'pepino', 'jícama', 'chía', 'almendras'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Guayabas con pistaches',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '2 guayabas medianas + un puñado de pistaches (aprox 20 piezas). Alta en vitamina C y fibra.',
        tags: ['fibra', 'vitamina C', 'crujiente'],
        super: ['guayaba', 'pistaches'],
      },
    ],
    comida: [
      {
        nombre: 'Pescado a la plancha con arroz y ensalada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '150g filete de tilapia o huachinango a la plancha con limón, 1/2 taza arroz integral, ensalada de lechuga y jitomate, 1 cdita aceite oliva, 1/4 aguacate.',
        tags: ['omega-3', 'ligero', 'mediterráneo'],
        super: ['pescado', 'arroz integral', 'lechuga', 'jitomate', 'aceite oliva', 'aguacate'],
      },
      {
        nombre: 'Picadillo de res con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g carne molida magra guisada con calabacita, zanahoria y ejotes en caldillo de jitomate, 1 tortilla, 6 nueces.',
        tags: ['casero', 'batch-cooking', 'familiar'],
        super: ['res molida', 'calabacita', 'zanahoria', 'ejotes', 'jitomate', 'tortilla', 'nueces'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Verduras crudas con limón',
        porciones: 'Libre',
        detalle: 'Palitos de zanahoria, jícama y pepino con limón y chile. Alimentos libres.',
        tags: ['libre', 'crujiente', 'saciante'],
        super: ['zanahoria', 'jícama', 'pepino'],
      },
    ],
    cena: [
      {
        nombre: 'Ensalada con queso panela y aguacate',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: 'Ensalada grande (lechuga, espinaca, jitomate, pepino) con 60g panela en cubos, 1 tostada, 1/3 aguacate, limón.',
        tags: ['fresco', 'vegetariano', 'ligero'],
        super: ['lechuga', 'espinaca', 'jitomate', 'pepino', 'panela', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Tacos de nopales con huevo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tortilla de maíz, nopales salteados con jitomate y cebolla, 2 huevos revueltos, 1/3 aguacate.',
        tags: ['mexicano', 'económico', 'rápido'],
        super: ['tortilla', 'nopales', 'jitomate', 'cebolla', 'huevo', 'aguacate'],
      },
    ],
  },

  Jueves: {
    desayuno: [
      {
        nombre: 'Huevos con champiñones y espinaca',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '2 huevos revueltos con 1 taza champiñones y espinaca salteados, 1 tortilla de maíz, 1/4 aguacate, 1 cdita aceite.',
        tags: ['proteico', 'bajo en carb', 'saciante'],
        super: ['huevo', 'champiñón', 'espinaca', 'tortilla', 'aguacate', 'aceite oliva'],
      },
      {
        nombre: 'Enfrijoladas ligeras con panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tortilla bañada en salsa de frijol (1/2 taza frijol licuado), 40g panela, cebolla, lechuga y jitomate al lado, crema 1 cda. Cuenta como leguminosa.',
        tags: ['mexicano', 'leguminosa', 'antojito-controlado'],
        super: ['tortilla', 'frijol', 'panela', 'lechuga', 'jitomate', 'crema'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Durazno con semillas de girasol',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 durazno mediano + 2 cdas de semillas de girasol + 5 almendras.',
        tags: ['dulce-natural', 'energía', 'fácil'],
        super: ['durazno', 'semillas de girasol', 'almendras'],
      },
    ],
    comida: [
      {
        nombre: 'Pollo en mole ligero con arroz',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g pechuga con mole casero ligero (poco aceite, sin exceso de chocolate), 1/2 taza arroz, ensalada de nopales con cebolla y jitomate.',
        tags: ['mexicano', 'especial', 'casero'],
        super: ['pollo', 'mole', 'arroz', 'nopales', 'cebolla', 'jitomate'],
      },
      {
        nombre: 'Lentejas guisadas con verdura',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1/2 taza lentejas con zanahoria, calabacita y jitomate, 1 tortilla, 1 cdita aceite, 1/4 aguacate. Leguminosa del día.',
        tags: ['leguminosa', 'fibra', 'económico'],
        super: ['lenteja', 'zanahoria', 'calabacita', 'jitomate', 'tortilla', 'aceite', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Gelatina light',
        porciones: 'Libre',
        detalle: '1 gelatina light de cualquier sabor. Alimento libre, ayuda con antojo de dulce.',
        tags: ['libre', 'dulce-controlado', 'práctico'],
        super: ['gelatina light'],
      },
    ],
    cena: [
      {
        nombre: 'Omelette de verduras con tostada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: 'Omelette de 2 huevos con pimiento morrón, cebolla y espinaca, 1 tostada horneada, 1/3 aguacate.',
        tags: ['rápido', 'proteico', 'noche'],
        super: ['huevo', 'pimiento morrón', 'cebolla', 'espinaca', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Ensalada de atún con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1/2 lata atún en agua, lechuga, jitomate, pepino, zanahoria rallada, 1 tostada, 1 cdita aceite oliva, 6 nueces.',
        tags: ['fresco', 'omega-3', 'completo'],
        super: ['atún', 'lechuga', 'jitomate', 'pepino', 'zanahoria', 'tostada', 'aceite oliva', 'nueces'],
      },
    ],
  },

  Viernes: {
    desayuno: [
      {
        nombre: 'Huevos con jamón de pavo y verdura',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '2 huevos revueltos con 2 rebanadas jamón de pavo, jitomate y espinaca, 1 tortilla, 1/4 aguacate.',
        tags: ['rápido', 'proteico', 'saciante'],
        super: ['huevo', 'jamón de pavo', 'jitomate', 'espinaca', 'tortilla', 'aguacate'],
      },
      {
        nombre: 'Yogurt con avena y papaya',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 taza yogurt griego + 1/3 taza avena + canela. Aparte: pepino y jícama con limón (verduras). 2 cdas linaza y 5 almendras.',
        tags: ['dulce-natural', 'anti-insulina', 'fibra'],
        super: ['yogurt griego', 'avena', 'pepino', 'jícama', 'linaza', 'almendras'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Pera con cacahuates',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 pera mediana + 14 cacahuates naturales (sin sal). Comer la fruta con cáscara para más fibra.',
        tags: ['fibra', 'saciante', 'práctico'],
        super: ['pera', 'cacahuates'],
      },
    ],
    comida: [
      {
        nombre: 'Pescado empapelado con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '150g filete de pescado en papel aluminio con calabacita, pimiento, cebolla y jitomate, 1/2 taza arroz integral, 1 cdita aceite oliva, 1/4 aguacate.',
        tags: ['omega-3', 'saludable', 'especial'],
        super: ['pescado', 'calabacita', 'pimiento', 'cebolla', 'jitomate', 'arroz integral', 'aceite oliva', 'aguacate'],
      },
      {
        nombre: 'Tacos de pollo con ensalada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '1 tortilla de maíz con 120g pollo asado desmenuzado, cebolla, cilantro, salsa verde. Ensalada de lechuga y jitomate al lado. 1/3 aguacate.',
        tags: ['mexicano', 'práctico', 'sabroso'],
        super: ['tortilla', 'pollo', 'cebolla', 'cilantro', 'lechuga', 'jitomate', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Pepino y zanahoria con limón',
        porciones: 'Libre',
        detalle: 'Bastones de pepino y zanahoria con jugo de limón y chile. Sin límite.',
        tags: ['libre', 'crujiente', 'vitaminas'],
        super: ['pepino', 'zanahoria', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Tostadas de atún con verdura',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tostada horneada con atún (1/2 lata), lechuga, jitomate, cebolla morada, 1/3 aguacate, salsa.',
        tags: ['práctico', 'mexicano', 'rápido'],
        super: ['tostada', 'atún', 'lechuga', 'jitomate', 'cebolla', 'aguacate'],
      },
      {
        nombre: 'Queso panela a la plancha con ensalada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '80g panela a la plancha, ensalada de espinaca, jitomate y pepino, 1 tostada, 1 cdita aceite, 6 nueces.',
        tags: ['vegetariano', 'rápido', 'ligero'],
        super: ['panela', 'espinaca', 'jitomate', 'pepino', 'tostada', 'aceite oliva', 'nueces'],
      },
    ],
  },

  Sábado: {
    desayuno: [
      {
        nombre: 'Chilaquiles rojos ligeros con huevo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tortilla cortada y horneada con salsa roja, 2 huevos estrellados encima, 1 cda crema, cebolla y cilantro. Lechuga al lado.',
        tags: ['mexicano', 'fin de semana', 'antojito-controlado'],
        super: ['tortilla', 'jitomate', 'huevo', 'crema', 'cebolla', 'lechuga'],
      },
      {
        nombre: 'Huevos divorciados ligeros',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '2 huevos estrellados, uno con salsa verde y otro con salsa roja, 1 tortilla, frijoles refritos (2 cdas), ensalada. 1/4 aguacate.',
        tags: ['especial', 'mexicano', 'completo'],
        super: ['huevo', 'salsa verde', 'salsa roja', 'tortilla', 'frijol', 'aguacate'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Fresas con yogurt y chía',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 taza de fresas con 1/2 taza yogurt natural sin azúcar y 2 cdas chía.',
        tags: ['anti-insulina', 'antioxidante', 'fresco'],
        super: ['fresas', 'yogurt', 'chía'],
      },
    ],
    comida: [
      {
        nombre: 'Carne asada con guacamole y ensalada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g carne de res asada, guacamole (1/3 aguacate con jitomate y cebolla), ensalada verde, 1 tortilla.',
        tags: ['parrilla', 'fin de semana', 'especial'],
        super: ['res', 'aguacate', 'jitomate', 'cebolla', 'lechuga', 'tortilla'],
      },
      {
        nombre: 'Caldo de pollo con verduras',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: 'Caldo con 120g pollo, calabacita, chayote, zanahoria, ejotes. 1 tortilla. 1/4 aguacate y limón.',
        tags: ['casero', 'reconfortante', 'familiar'],
        super: ['pollo', 'calabacita', 'chayote', 'zanahoria', 'ejotes', 'tortilla', 'aguacate'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Jícama con chile y limón',
        porciones: 'Libre',
        detalle: '1 taza de jícama en bastones con chile tajín y limón. Alimento libre.',
        tags: ['libre', 'crujiente', 'refrescante'],
        super: ['jícama', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Tacos de lechuga con pollo',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: 'Hojas grandes de lechuga como tortilla, 80g pollo desmenuzado, jitomate, cebolla, cilantro, 1 tostada extra. 1/3 aguacate.',
        tags: ['bajo en carb', 'fresco', 'ligero'],
        super: ['lechuga', 'pollo', 'jitomate', 'cebolla', 'tostada', 'aguacate'],
      },
      {
        nombre: 'Sopa de verduras con queso',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: 'Sopa de brócoli, zanahoria, calabacita y espinaca. 40g queso panela en cubos, 1 tostada, 1 cdita aceite, 5 almendras.',
        tags: ['reconfortante', 'caliente', 'noche'],
        super: ['brócoli', 'zanahoria', 'calabacita', 'espinaca', 'panela', 'tostada', 'almendras'],
      },
    ],
  },

  Domingo: {
    desayuno: [
      {
        nombre: 'Huevos rancheros ligeros',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '2 huevos estrellados sobre 1 tortilla de maíz, salsa ranchera (jitomate, cebolla, chile), frijoles refritos (2 cdas), 1/4 aguacate. Cuenta como leguminosa.',
        tags: ['mexicano', 'fin de semana', 'especial'],
        super: ['huevo', 'tortilla', 'jitomate', 'cebolla', 'chile', 'frijol', 'aguacate'],
      },
      {
        nombre: 'Avena con plátano y canela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1/3 taza avena cocida con 1/2 plátano, canela y yogurt griego. Aparte: pepino y jícama (verduras). 2 cdas chía, 5 nueces.',
        tags: ['dulce-natural', 'reconfortante', 'dominical'],
        super: ['avena', 'plátano', 'yogurt griego', 'pepino', 'jícama', 'chía', 'nueces'],
      },
    ],
    colacion_am: [
      {
        nombre: 'Kiwi con almendras',
        porciones: 'Fruta 1 | Grasas 2',
        detalle: '1 kiwi en rodajas + 10 almendras. Alto en vitamina C y grasas saludables.',
        tags: ['vitamina C', 'saciante', 'fácil'],
        super: ['kiwi', 'almendras'],
      },
    ],
    comida: [
      {
        nombre: 'Pollo rostizado con ensalada grande',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '120g pollo rostizado (sin piel), ensalada de lechuga, jitomate, pepino y zanahoria, 1 tortilla, 1 cdita aceite, 1/4 aguacate.',
        tags: ['dominical', 'familiar', 'práctico'],
        super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'zanahoria', 'tortilla', 'aceite', 'aguacate'],
      },
      {
        nombre: 'Pescado empapelado con arroz',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 3 | Grasas 2',
        detalle: '150g pescado en aluminio con epazote, jitomate, cebolla y chile poblano, 1/2 taza arroz integral, 6 nueces.',
        tags: ['especial', 'omega-3', 'mexicano'],
        super: ['pescado', 'epazote', 'jitomate', 'cebolla', 'chile poblano', 'arroz integral', 'nueces'],
      },
    ],
    colacion_pm: [
      {
        nombre: 'Pepino con limón',
        porciones: 'Libre',
        detalle: '1 pepino grande en rodajas con limón y chile piquín. Alimento libre.',
        tags: ['libre', 'refrescante', 'hidratante'],
        super: ['pepino', 'limón'],
      },
    ],
    cena: [
      {
        nombre: 'Quesadilla de espinaca con panela',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1 tortilla de maíz con 30g panela, espinaca salteada con ajo, champiñones. 1/3 aguacate. Ensalada de jitomate al lado.',
        tags: ['rápido', 'vegetariano', 'noche'],
        super: ['tortilla', 'panela', 'espinaca', 'champiñón', 'aguacate', 'jitomate'],
      },
      {
        nombre: 'Atún con verduras y tostada',
        porciones: 'Verduras 2 | Cereales 1 | Proteína 2 | Grasas 2',
        detalle: '1/2 lata atún en agua con lechuga, jitomate, pepino, cebolla morada, 1 tostada horneada, 1/3 aguacate, limón.',
        tags: ['práctico', 'ligero', 'omega-3'],
        super: ['atún', 'lechuga', 'jitomate', 'pepino', 'cebolla', 'tostada', 'aguacate'],
      },
    ],
  },
};
