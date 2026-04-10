export interface Equivalencia {
  titulo: string;
  icon: string;
  items: string[];
}

export const equivalencesDB: Equivalencia[] = [
  {
    titulo: 'Proteínas Magras (1 equivalente = 7g proteína)',
    icon: '🥩',
    items: [
      '30g Pechuga de Pollo (sin piel)',
      '30g Pechuga de Pavo',
      '40g Pescado Blanco (Tilapia, Mero)',
      '30g Atún en agua (drenado)',
      '30g Lomo de cerdo / Res magra',
      '30g Queso Panela o Cottage',
      '2 Claras de huevo (aprox. 60g)',
      '1 Huevo entero (aprox. 50g) *Aporta grasa'
    ]
  },
  {
    titulo: 'Grasas Saludables (1 equivalente = 5g grasa)',
    icon: '🥑',
    items: [
      '1/3 de Aguacate mediano (aprox. 30g)',
      '1 cucharadita (5ml) Aceite de Oliva / Aguacate',
      '10 mitades de Nuez',
      '10 Almendras o Cacahuates naturales',
      '1 cucharada (15g) Crema de cacahuate/almendra',
      '1 cucharada de Chía o Linaza',
      '5 Aceitunas medianas'
    ]
  },
  {
    titulo: 'Cereales y Tubérculos (1 eq = 15g carbohidrato)',
    icon: '🌾',
    items: [
      '1/2 taza (70g) Arroz cocido / Quinoa',
      '1/2 taza (70g) Avena cocida (o 30g cruda)',
      '1 Tortilla de maíz (o 1 rebanada pan molde)',
      '1/2 taza (80g) Pasta cocida',
      '1/2 Papa mediana o Camote (aprox. 70g)',
      '3 tazas Palomitas de maíz naturales',
      '2 Tostadas horneadas secas',
      '1/2 taza (80g) Elote en grano'
    ]
  },
  {
    titulo: 'Frutas (1 equivalente = 15g carbohidrato)',
    icon: '🍎',
    items: [
      '1 Manzana, Pera o Naranja mediana',
      '1 taza (150g) Fresas, Zarzamoras o Frambuesas',
      '1/2 Plátano o 1 Plátano dominico',
      '1 taza (150g) Melón o Papaya picada',
      '1 taza (150g) Sandía',
      '2 Guayabas o 2 Mandarinas pequeñas',
      '1/2 taza Mango o Piña picada',
      '17 Uvas medianas'
    ]
  },
  {
    titulo: 'Verduras (Libre consumo regular / 1 eq = 25kcal)',
    icon: '🥦',
    items: [
      '1 taza (100g) Brócoli o Coliflor',
      '1 taza Espinaca, Lechuga o Acelga (Libre)',
      '1/2 taza (70g) Zanahoria picada',
      '1 taza Calabacita o Chayote picado',
      '1 taza Jitomate picado / 1 Jitomate bola',
      '1/2 taza Pepino o Jícama',
      '1/2 taza Pimientos de colores',
      '1/2 taza Champiñones'
    ]
  },
  {
    titulo: 'Leguminosas (1 equivalente)',
    icon: '🫘',
    items: [
      '1/2 taza (80g) Frijoles cocidos',
      '1/2 taza (80g) Lentejas cocidas',
      '1/2 taza (80g) Garbanzos cocidos',
      '1/3 taza (50g) Edamames',
      '1/4 taza (40g) Hummus natural'
    ]
  },
  {
    titulo: 'Lácteos (1 equivalente)',
    icon: '🥛',
    items: [
      '1 taza (240ml) Leche descremada',
      '1 taza (240ml) Bebida de Almendra/Coco sin azúcar',
      '1 taza (240ml) Leche deslactosada light',
      '3/4 taza (150g) Yogurt Griego natural sin azúcar',
      '1 taza (240ml) Yogurt natural bebible sin azúcar'
    ]
  }
];
