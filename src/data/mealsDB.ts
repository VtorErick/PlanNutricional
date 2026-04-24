import type { MealItem } from '../types';
import { ensureMealNutrition, enrichPlanWithNutrition } from '../utils/nutrition';
import { buildCanonicalMealDetail, shouldReplaceMealDetail } from '../utils/nutritionValidation';
import { repairBrokenText } from '../utils/text';

export interface CatalogMealItem {
  id: string;
  momentos: string[];
  nombre: string;
  tags: string[];
  super: string[];
  // Campos para filtrado por preferencias del usuario (OPCIONALES durante migración)
  cuisineStyles?: ('Mexicana' | 'Italiana' | 'Asiática' | 'Mediterránea' | 'Casera' | 'Vegetariana')[];
  // Condiciones médicas que DEBEN evitar esta comida (texto libre del usuario)
  // Ejemplo: ['cálculos renales', 'got'] - si el usuario menciona esto, se excluye
  medicalContraindications?: string[];
  // Tiempo de preparación en minutos (realista)
  prepTimeMinutes?: number;
  // Dificultad de preparación
  difficulty?: 'facil' | 'media' | 'dificil';
  // Valores nutricionales estimados por porción estándar
  // Fuentes: USDA FoodData Central, BEDCA, etiquetas comerciales mexicanas
  macroEstimate?: {
    calories: number;
    protein: number; // gramos
    carbs: number;   // gramos
    fat: number;     // gramos
  };
  // Temporada recomendada (opcional)
  season?: ('invierno' | 'primavera' | 'verano' | 'otoño')[];
}

export const mealsDatabase: CatalogMealItem[] = [
// --- DESAYUNOS (40 opciones) ---
  { id: 'des_01', momentos: ['desayuno'], nombre: 'Huevos a la mexicana con aguacate', tags: ['mexicano', 'saciante', '15-30 min', 'caliente', 'economico'], super: ['huevo', 'panela', 'jitomate', 'cebolla', 'aguacate', 'tortilla', 'lácteos light'] },
  { id: 'des_02', momentos: ['desayuno'], nombre: 'Omelette de champiñones y espinaca', tags: ['rápido', '<15 min', 'ligero', 'vegetariano-opcional'], super: ['huevo', 'jamón pavo', 'champiñón', 'espinaca', 'tostada'] },
  { id: 'des_03', momentos: ['desayuno'], nombre: 'Avena nocturna (Overnight oats)', tags: ['dulce', '<15 min', 'meal-prep', 'fresco', 'economico'], super: ['avena', 'proteína whey', 'leche', 'manzana', 'chía'] },
  { id: 'des_04', momentos: ['desayuno'], nombre: 'Chilaquiles fit al horno con pollo', tags: ['mexicano', 'alto-carb', '+30 min', 'fin-de-semana'], super: ['tortilla horneada', 'pollo', 'salsa verde', 'queso panela', 'cebolla', 'crema light'] },
  { id: 'des_05', momentos: ['desayuno'], nombre: 'Pan tostado integral con salmón ahumado y aguacate', tags: ['gourmet', 'omega3', '<15 min'], super: ['pan integral', 'salmón', 'aguacate', 'queso crema light', 'alcaparras'] },
  { id: 'des_06', momentos: ['desayuno'], nombre: 'Claras de huevo con nopal y pico de gallo', tags: ['bajo-carb', 'volumen', 'mexicano', '15-30 min', 'economico'], super: ['claras', 'nopal', 'jitomate', 'cebolla', 'cilantro'] },
  { id: 'des_07', momentos: ['desayuno'], nombre: 'Hotcakes de avena y plátano', tags: ['dulce', 'confort', '15-30 min'], super: ['avena', 'huevo', 'plátano', 'leche', 'canela', 'miel'] },
  { id: 'des_08', momentos: ['desayuno'], nombre: 'Enfrijoladas caseras ligeras con queso cottage o panela', tags: ['vegano-opcional', 'mexicano', 'hierro', '15-30 min', 'economico'], super: ['tortilla', 'frijol', 'queso cottage', 'cebolla'] },
  { id: 'des_09', momentos: ['desayuno'], nombre: 'Bowl de yogurt griego con frutos rojos y nuez', tags: ['probióticos', 'fresco', '<15 min', 'dulce'], super: ['yogurt griego', 'fresa', 'mora', 'nuez', 'avena'] },
  { id: 'des_10', momentos: ['desayuno'], nombre: 'Huevos revueltos con machaca', tags: ['norteño', 'alto-proteina', 'caliente', '15-30 min'], super: ['huevo', 'machaca', 'jitomate', 'cebolla', 'tortilla harina light'] },
  { id: 'des_11', momentos: ['desayuno'], nombre: 'Smoothie verde detox con proteína', tags: ['liquido', '<15 min', 'fibra'], super: ['proteína whey', 'espinaca', 'apio', 'manzana verde', 'leche almendra'] },
  { id: 'des_12', momentos: ['desayuno'], nombre: 'Quesadillas de champiñón en tortilla de maíz', tags: ['sencillo', 'ligero', 'mexicano', '<15 min', 'economico'], super: ['tortilla', 'queso oaxaca', 'champiñón', 'salsa', 'aguacate'] },
  { id: 'des_13', momentos: ['desayuno'], nombre: 'Pudín de chía con leche de coco y mango', tags: ['vegano', 'omega3', 'gourmet', 'fresco', 'meal-prep'], super: ['chía', 'leche de coco', 'mango', 'almendras'] },
  { id: 'des_14', momentos: ['desayuno'], nombre: 'Tostada francesa fit con pan integral', tags: ['confort', 'dulce', 'alto-proteina', '15-30 min'], super: ['pan integral', 'claras', 'leche', 'canela', 'fresa'] },
  { id: 'des_15', momentos: ['desayuno'], nombre: 'Huevos poché sobre cama de espárragos asados', tags: ['keto', 'gourmet', 'bajo-carb', '15-30 min'], super: ['huevo', 'espárrago', 'aceite oliva', 'pimienta'] },
  { id: 'des_16', momentos: ['desayuno'], nombre: 'Wrap de espinaca con hummus y pechuga de pavo', tags: ['<15 min', 'ligero', 'sin-huevo', 'portatil'], super: ['wrap espinaca', 'hummus', 'jamón pavo', 'pepino'] },
  { id: 'des_17', momentos: ['desayuno'], nombre: 'Bowl de acai con granola sin azúcar', tags: ['antioxidante', 'fresco', 'dulce', '<15 min'], super: ['acai', 'plátano', 'granola', 'coco rallado'] },
  { id: 'des_18', momentos: ['desayuno'], nombre: 'Sopes de nopal con picadillo de soya', tags: ['vegano', 'mexicano', 'fibra', '+30 min'], super: ['nopal', 'soya texturizada', 'jitomate', 'frijol'] },
  { id: 'des_19', momentos: ['desayuno'], nombre: 'Huevos ahogados en salsa roja con verduras', tags: ['caliente', 'mexicano', 'volumen', '15-30 min'], super: ['huevo', 'calabaza', 'chayote', 'salsa roja'] },
  { id: 'des_20', momentos: ['desayuno'], nombre: 'Muffins de lino y moras al microondas', tags: ['keto', 'dulce', '<15 min'], super: ['harina de linaza', 'huevo', 'moras', 'aceite de coco'] },
  { id: 'des_21', momentos: ['desayuno'], nombre: 'Huevos revueltos con frijoles y totopos horneados', tags: ['mexicano', 'tradicional', '15-30 min', 'economico'], super: ['huevo', 'frijol', 'tortilla horneada', "salsa"] },
  { id: 'des_22', momentos: ['desayuno'], nombre: 'Torta de huevo con jamón en bolillo integral', tags: ['clasico', 'mexicano', '15-30 min', 'economico', 'portatil'], super: ['bolillo integral', 'huevo', 'jamón', 'frijol'] },
  { id: 'des_23', momentos: ['desayuno'], nombre: 'Molletes saludables en pan integral con pico de gallo', tags: ['mexicano', 'confort', '15-30 min', 'economico'], super: ['pan integral', 'frijol', 'queso oaxaca', "pico de gallo"] },
  { id: 'des_24', momentos: ['desayuno'], nombre: 'Avena cocida calientita con manzana y canela', tags: ['confort', 'caliente', '<15 min', 'economico'], super: ['avena', 'manzana', "canela", "leche"] },
  { id: 'des_25', momentos: ['desayuno'], nombre: 'Burrito mañanero integral con huevo y frijol', tags: ['mexicano', 'rápido', '<15 min', "portatil"], super: ['tortilla harina integral', 'huevo', 'frijol', 'aguacate'] },
  { id: 'des_26', momentos: ['desayuno'], nombre: 'Sincronizada integral de pavo con guacamole', tags: ['sencillo', '<15 min', 'economico'], super: ['tortilla harina integral', 'jamón pavo', 'queso oaxaca', 'guacamole'] },
  { id: 'des_27', momentos: ['desayuno'], nombre: 'Plátano al sartén con crema de cacahuate y requesón', tags: ['dulce', 'postre', '<15 min'], super: ['plátano', 'crema cacahuate', 'requesón', 'canela'] },
  { id: 'des_28', momentos: ['desayuno'], nombre: 'Arepas asadas de maíz con queso panela', tags: ['latino', '15-30 min', 'economico'], super: ["harina maiz", "queso panela", "mantequilla light"] },
  { id: 'des_29', momentos: ['desayuno'], nombre: 'Tacos de canasta al vapor caseros en sartén', tags: ['mexicano', '+30 min', 'economico'], super: ["tortilla de maíz", "frijol", "papa", "aceite", "repollo"] },
  { id: 'des_30', momentos: ['desayuno'], nombre: 'Waffles fit de proteína y avena', tags: ['fin-de-semana', 'dulce', 'alto-proteina', '+30 min'], super: ["avena", "proteína whey", "huevo", "aceite coco"] },
  { id: 'des_31', momentos: ['desayuno'], nombre: 'Huevos estrellados con salchicha de pavo al comal', tags: ['rápido', '<15 min', 'economico'], super: ["huevo", "salchicha pavo", "tortilla"] },
  { id: 'des_32', momentos: ['desayuno'], nombre: 'Licuado súper energético de amaranto y plátano', tags: ['liquido', '<15 min', "portatil"], super: ["leche", "plátano", "amaranto", "nueces"] },
  { id: 'des_33', momentos: ['desayuno'], nombre: 'Tostadas de requesón fresco con jitomate asado', tags: ["sencillo", "bajo-carb", "<15 min"], super: ["requesón", "tostada horneada", "jitomate", "cebolla"] },
  { id: 'des_34', momentos: ['desayuno'], nombre: 'Sánguche de claras de huevo y queso panela', tags: ["rápido", "<15 min", "proteina-magra"], super: ["pan de molde", "claras", "queso panela", "espinaca"] },
  { id: 'des_35', momentos: ['desayuno'], nombre: 'Entomatadas de queso fresco sin freír', tags: ["mexicano", "caliente", "15-30 min", "economico"], super: ["tortilla de maíz", "queso fresco", "salsa tomate", "cebolla"] },
  { id: 'des_36', momentos: ['desayuno'], nombre: 'Bowl de quinoa dulce estilo arroz con leche', tags: ["vegano", "dulce", "meal-prep"], super: ["quinoa", "leche almendra", "stevia", "canela"] },
  { id: 'des_37', momentos: ['desayuno'], nombre: 'Huevo cocido con aguacate en pan de granos', tags: ["clásico", "grasas-buenas", "<15 min"], super: ["huevo cocido", "aguacate", "pan con granos"] },
  { id: 'des_38', momentos: ['desayuno'], nombre: 'Empanada integral horneada de pollo deshebrado', tags: ["fin-de-semana", "elaborado", "+30 min"], super: ["harina integral", "pollo", "cebolla", "jitomate"] },
  { id: 'des_39', momentos: ['desayuno'], nombre: 'Champiñones salteados con tocino de pavo', tags: ["saciante", "keto", "15-30 min"], super: ["champiñón", "tocino pavo", "cebolla", "aguacate"] },
  { id: 'des_40', momentos: ['desayuno'], nombre: 'Pan pita relleno de huevo revuelto con acelgas', tags: ["rápido", "<15 min", "portatil"], super: ["pan pita", "huevo", "acelga", "queso"] },

  // --- COLACIONES (35 opciones) ---
  { id: 'col_01', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Gelatina light con trozos de durazno', tags: ['libre', 'dulce', '<15 min', 'economico'], super: ['gelatina light', 'durazno'] },
  { id: 'col_02', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Avena con fruta y nueces', tags: ['dulce', 'energía', '<15 min'], super: ['papaya', 'avena', 'nueces'] },
  { id: 'col_03', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Bastones de jícama y pepino con tajín', tags: ['libre', 'crujiente', 'fresco', 'vegano', 'economico', '<15 min'], super: ['jícama', 'pepino', 'zanahoria', 'limón', 'chile en polvo'] },
  { id: 'col_04', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Puñado de almendras o cacahuates tostados sin sal', tags: ['grasas-buenas', '<15 min', 'portátil', 'economico'], super: ['almendras', 'cacahuates'] },
  { id: 'col_05', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Manzana verde con crema de cacahuate comun', tags: ['saciante', 'dulce-salado', '<15 min'], super: ['manzana', 'crema cacahuate'] },
  { id: 'col_06', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Kefir líquido con probióticos', tags: ['liquido', 'probióticos', 'portátil'], super: ['kefir'] },
  { id: 'col_07', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Galletas de avena suntuosas (caseras) con chia', tags: ['crujiente', 'meal-prep', 'dulce'], super: ["avena", "chía", "huevo", "stevia"] },
  { id: 'col_08', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Taquitos fríos de jamón de pavo con panela', tags: ['proteína', 'fresco', 'bajo-carb', '<15 min'], super: ['jamón pavo', 'panela', 'espinaca'] },
  { id: 'col_09', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Barrita de cereal o amaranto comun', tags: ['ultra-rápido', 'portátil', 'economico'], super: ["amaranto", "miel"] },
  { id: 'col_10', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Plátano tabasco con ajonjolí', tags: ['potasio', 'energía-rápida', 'pre-entreno'], super: ['plátano', 'ajonjolí'] },
  { id: 'col_11', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Hummus clásico con tiras de apio crudo', tags: ['vegano', 'saciante', 'textura', 'meal-prep'], super: ['hummus', 'apio'] },
  { id: 'col_12', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Queso cottage con rodajas de piña fresca', tags: ['digestivo', 'proteína-lenta', '<15 min'], super: ['queso cottage', 'piña'] },
  { id: 'col_13', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Edamames al vapor con sal de mar', tags: ['botana', 'oriental', 'proteína-veg'], super: ['edamames'] },
  { id: 'col_14', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Mix estudiantil de nueces con arándanos', tags: ['salud-mental', 'antioxidante'], super: ["nuez", "arándanos", "semillas girasol"] },
  { id: 'col_15', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Taza de té matcha con leche de almendra', tags: ['termogénico', 'liquido', '<15 min'], super: ['leche almendra', 'te matcha'] },
  { id: 'col_16', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Palomitas de maíz sin grasa caseras', tags: ["volumen", "economico", "<15 min", "botana"], super: ["maíz palomero"] },
  { id: 'col_17', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Cacahuates japoneses horneados u horneados sanos', tags: ["botana", "rápido", "economico"], super: ["cacahuates"] },
  { id: 'col_18', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Nieve casera de helado de fresa y stevia', tags: ["fresco", "postre", "verano"], super: ["fresa congelada", "stevia", "yogurt"] },
  { id: 'col_19', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Bote de yogurt bebible convencional bajo en grasa', tags: ["ultra-rápido", "comercial", "portatil"], super: ["yogurt líquido light"] },
  { id: 'col_20', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Semillas de calabaza (pepitas) tostadas', tags: ["portatil", "crujiente", "economico"], super: ["semilla calabaza"] },
  { id: 'col_21', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Tostada Sanissimo de aguacate', tags: ["crujiente", "grasas-buenas", "<15 min"], super: ["tostada horneada", "aguacate", "sal"] },
  { id: 'col_22', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Batido de proteína recovery estándar', tags: ["liquido", "rápido", "post-entreno"], super: ["proteína whey", "agua"] },
  { id: 'col_23', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Tomates cherry de aperitivo', tags: ["crudo", "facil", "economico"], super: ["tomate cherry"] },
  { id: 'col_24', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Rollos de lechuga con atún', tags: ["frio", "proteina", "<15 min"], super: ["lechuga", "atún lata", "cebolla"] },
  { id: 'col_25', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Zanahoria baby empacada', tags: ["comercial", "ultra-rapido", "economico"], super: ["zanahoria baby"] },
  { id: 'col_26', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Fresas rebanadas con crema ligera (sustituto)', tags: ["postre", "dulce"], super: ["fresa", "crema light", "stevia"] },
  { id: 'col_27', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Obleas de amaranto y vainilla', tags: ["dulce", "portatil", "economico"], super: ["oblea amaranto"] },
  { id: 'col_28', momentos: ['colacion_am', 'colacion_pm'], nombre: '1 Huevo cocido cortado por la mitad con paprika', tags: ["proteina", "keto", "<15 min"], super: ["huevo cocido", "paprika"] },
  { id: 'col_29', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Media taza de edamames descongelados', tags: ["vegano", "practico"], super: ["edamames"] },
  { id: 'col_30', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Chocolate oscuro (>70% cacao) - 2 cuadritos', tags: ["postre", "antioxidante"], super: ["chocolate amargo"] },
  { id: 'col_31', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Mandarina fresca (2 pzas pequeñas)', tags: ["fruta", "invierno", "economico"], super: ["mandarina"] },
  { id: 'col_32', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Churritos de amaranto horneados', tags: ["botana", "salado", "portatil"], super: ["churros amaranto"] },
  { id: 'col_33', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Manzana verde cocida al microondas con canela', tags: ["postre", "caliente", "rápido"], super: ["manzana", "canela"] },
  { id: 'col_34', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Galletas Marías convencionales (4 pzas)', tags: ["clasico", "economico", "carbohidrato-rapido"], super: ["galletas marias"] },
  { id: 'col_35', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Mango rebanado en cubos frescos', tags: ["dulce", "verano", "fruta"], super: ["mango"] },

  // --- COMIDAS (40 opciones) ---
  { id: 'com_01', momentos: ['comida'], nombre: 'Bistec a la parrilla con pico de gallo y aguacate', tags: ['parrilla', 'llenador', 'mexicano', 'alto-proteina', '15-30 min'], super: ['res', 'panela', 'jitomate', 'cebolla', 'aguacate', 'tortilla'] },
  { id: 'com_02', momentos: ['comida'], nombre: 'Salmón al horno con quinoa y espárragos asados', tags: ['gourmet', 'omega3', 'ligero', 'anti-inflamatorio', '+30 min'], super: ['salmón', 'quinoa', 'espárrago', 'aceite oliva', 'limón'] },
  { id: 'com_03', momentos: ['comida'], nombre: 'Bowl de pollo Teriyaki con brócoli y arroz', tags: ['oriental', 'bowl', 'meal-prep', '15-30 min'], super: ['pollo', 'brócoli', 'arroz', 'ajonjolí', 'aceite sésamo', 'salsa soya'] },
  { id: 'com_04', momentos: ['comida'], nombre: 'Tacos de carne molida magra (picadillo)', tags: ['divertido', 'mexicano', 'saciante', 'economico'], super: ['res molida', 'lechuga', 'jitomate', 'tortilla', 'queso panela', "papa"] },
  { id: 'com_05', momentos: ['comida'], nombre: 'Pechuga asada con ensalada clásica de lechuga y arroz blanco', tags: ['clásico', 'fácil', 'balanceado', '15-30 min', "economico"], super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'arroz', 'aguacate'] },
  { id: 'com_06', momentos: ['comida'], nombre: 'Enchiladas verdes ligeras de pechuga de pollo', tags: ['mexicano', 'caliente', 'comfort-food', '+30 min'], super: ['pollo', 'tortilla', 'salsa verde', 'queso gratinar light', 'crema light'] },
  { id: 'com_07', momentos: ['comida'], nombre: 'Filete de pescado a la plancha puré de papas casero', tags: ['muy-ligero', 'bajo-grasa', 'digestivo', '15-30 min'], super: ['pescado', 'calabaza', 'zanahoria', 'papa', 'mantequilla light'] },
  { id: 'com_08', momentos: ['comida'], nombre: 'Lentejas caseras con plátano macho', tags: ['vegetariano', 'hierro', 'reconfortante', "economico", '+30 min'], super: ['lenteja', 'plátano macho', 'jitomate', 'cebolla', "cilantro"] },
  { id: 'com_09', momentos: ['comida'], nombre: 'Tinga de pollo económica con tostadas horneadas', tags: ['mexicano', 'meal-prep', 'rendidor', "economico"], super: ['pollo', 'cebolla', 'chipotle', 'tostada horneada', 'aguacate'] },
  { id: 'com_10', momentos: ['comida'], nombre: 'Medallón de atún sellado con costra de ajonjolí', tags: ['gourmet', 'omega3', 'rápido', '<15 min'], super: ['atún fresco', 'ajonjolí', 'ensalada mixta', 'salsa soya'] },
  { id: 'com_11', momentos: ['comida'], nombre: 'Ceviche de atún en lata con pepino y clamato', tags: ['fresco', 'verano', 'sin-fuego', 'costeño', 'economico', '<15 min'], super: ['atún lata', 'limón', 'clamato', 'pepino', 'tostada horneada'] },
  { id: 'com_12', momentos: ['comida'], nombre: 'Espagueti integral a la boloñesa de res', tags: ['italiano', 'alto-carb', 'pre-entreno', '+30 min'], super: ['pasta integral', 'res molida', 'salsa tomate', 'queso parmesano'] },
  { id: 'com_13', momentos: ['comida'], nombre: 'Fajitas de pollo con pimientos y cebolla', tags: ['colorido', 'vitamina-c', 'parrilla', '15-30 min', 'economico'], super: ['pollo', 'pimiento', 'cebolla', 'tortilla', 'guacamole'] },
  { id: 'com_14', momentos: ['comida'], nombre: 'Albóndigas de carne o soya en caldillo de tomate', tags: ['casero', 'económico', 'mexicano', 'guisado', '+30 min'], super: ['res molida', 'papa', 'zanahoria', 'jitomate', 'tortilla', 'soya'] },
  { id: 'com_15', momentos: ['comida'], nombre: 'Hamburguesa casera fit con pan de panadería dulce/salado', tags: ['antojo', 'cheat-meal-limpio', '15-30 min'], super: ['res magra', 'pan hamburguesa integral', 'lechuga', 'jitomate', 'mostaza', 'queso panela'] },
  { id: 'com_16', momentos: ['comida'], nombre: 'Poké bowl rápido de tofu o atún', tags: ['hawaiano', 'fresco', 'gourmet', '<15 min'], super: ['atún fresco', 'arroz', 'edamames', 'pepino', 'alga nori'] },
  { id: 'com_17', momentos: ['comida'], nombre: 'Pechuga rellena de requesón bañada en salsa de poblano', tags: ['cremoso', 'mexicano', 'alto-proteina', '+30 min'], super: ['pollo', 'requesón', 'espinaca', 'chile poblano', 'crema light'] },
  { id: 'com_18', momentos: ['comida'], nombre: 'Guiso de calabacitas con elote y queso panela', tags: ['vegetariano', 'reconfortante', 'mexicano', '15-30 min', 'economico'], super: ['calabaza', 'elote desgranado', 'jitomate', 'queso panela', 'tortilla'] },
  { id: 'com_19', momentos: ['comida'], nombre: 'Pimientos rellenos horneados', tags: ['horno', 'estético', 'bajo-carb', '+30 min'], super: ['pimiento', 'quinoa', 'res molida', 'salsa tomate'] },
  { id: 'com_20', momentos: ['comida'], nombre: 'Sopa de coditos cremosa con jamón y verduras', tags: ['clasico-mexicano', 'confort', 'economico'], super: ['pasta fideo', 'jamón pavo', 'crema light', 'zanahoria'] },
  { id: 'com_21', momentos: ['comida'], nombre: 'Camarones al mojo de ajo rápidos', tags: ['costeño', 'proteina-mar', '15-30 min'], super: ['camarón', 'ajo', 'mantequilla light', 'arroz'] },
  { id: 'com_22', momentos: ['comida'], nombre: 'Tacos dorados de pollo al horno', tags: ['mexicano', 'crujiente', '+30 min'], super: ['tortilla de maíz', 'pollo deshebrado', 'lechuga', 'crema light'] },
  { id: 'com_23', momentos: ['comida'], nombre: 'Salpicón de pollo rendidor', tags: ['fresco', 'economico', 'meal-prep'], super: ['pollo', 'lechuga', 'zanahoria raayada', 'vinagre', 'tostada horneada'] },
  { id: 'com_24', momentos: ['comida'], nombre: 'Chile relleno de queso o atún sin capear', tags: ['mexicano', 'volumen', 'bajo-carb', '+30 min'], super: ['chile poblano', 'queso panela', 'atún lata', 'salsa roja'] },
  { id: 'com_25', momentos: ['comida'], nombre: 'Arroz frito (Yakimeshi) de pechuga casero', tags: ['oriental', 'frito', 'economico', '15-30 min'], super: ['arroz', 'pollo', 'huevo', 'salsa soya', 'cebolleta'] },
  { id: 'com_26', momentos: ['comida'], nombre: 'Quesadillas gigantes de chicharrón prensado vegetal o setas', tags: ['mexicano', 'antojo', '15-30 min', 'economico'], super: ['tortilla grande', 'setas', 'queso oaxaca', 'salsa verde'] },
  { id: 'com_27', momentos: ['comida'], nombre: 'Pechuga extra crujiente horneada estilo sureño', tags: ['antojo', 'comfort-food', '+30 min'], super: ['pollo', 'avena molida', 'papa', 'ensalada col'] },
  { id: 'com_28', momentos: ['comida'], nombre: 'Entomatadas rellenas de pollo con queso panela', tags: ['mexicano', 'caliente', '15-30 min', 'economico'], super: ['tortilla de maíz', 'pollo deshebrado', 'salsa tomate', 'queso panela'] },
  { id: 'com_29', momentos: ['comida'], nombre: 'Tortitas de papa con atún en sartén antiadherente', tags: ['casero', 'niños', 'economico', '15-30 min'], super: ['papa', 'atún lata', 'huevo', 'lechuga'] },
  { id: 'com_30', momentos: ['comida'], nombre: 'Hígado de res encebollado rico en hierro', tags: ['hierro', 'nutritivo', 'mexicano', 'economico', '15-30 min'], super: ['higado de res', 'cebolla', 'tortilla', 'frijol'] },
  { id: 'com_31', momentos: ['comida'], nombre: 'Milanesa de cerdo o pollo a la plancha fina', tags: ['comun', 'clasico', '15-30 min', 'economico'], super: ['carne cerdo magra', 'ensalada verde', 'arroz'] },
  { id: 'com_32', momentos: ['comida'], nombre: 'Milanesa empanizada al aire libre (Airfryer)', tags: ['airfryer', 'crujiente', '15-30 min'], super: ['pollo', 'pan molido', 'huevo', 'papa'] },
  { id: 'com_33', momentos: ['comida'], nombre: 'Chuleta ahumada asada al comal', tags: ['rápido', 'comun', '<15 min', 'economico'], super: ['chuleta de cerdo', 'nopales asados', 'tortilla'] },
  { id: 'com_34', momentos: ['comida'], nombre: 'Sopa de verduras juliana calientita con pechuga deshebrada', tags: ['sopa', 'liquid', 'confort', '+30 min', 'economico'], super: ['caldo pollo', 'pollo', 'verduras mixtas', 'tortilla'] },
  { id: 'com_35', momentos: ['comida'], nombre: 'Torta de pierna o milanesa en pan integral', tags: ['portatil', 'calle', 'mexicano', 'rápido'], super: ['bolillo integral', 'carne de res magra', 'jitomate', 'aguacate', 'frijol'] },
  { id: 'com_36', momentos: ['comida'], nombre: 'Rollos de sushi caseros sin freír (maki)', tags: ['oriental', 'divertido', '+30 min'], super: ['arroz sushi', 'alga nori', 'pepino', 'surimi', 'queso crema light'] },
  { id: 'com_37', momentos: ['comida'], nombre: 'Chop Suey de verduras con pollo', tags: ['oriental', 'volumen', 'ligero', '15-30 min'], super: ['pollo', 'germinado soya', 'zanahoria', 'salsa soya'] },
  { id: 'com_38', momentos: ['comida'], nombre: 'Tamal fit o desgrasado (versión saludable hoja de plátano)', tags: ['mexicano', 'fin-de-semana', 'comun'], super: ['harina maiz', 'pollo', 'salsa verde', 'hoja plátano'] },
  { id: 'com_39', momentos: ['comida'], nombre: 'Guiso de nopales con carne de puerco magra', tags: ['mexicano', 'fibra', 'economico', '+30 min'], super: ['carne cerdo magra', 'nopal', 'salsa pasilla', 'tortilla'] },
  { id: 'com_40', momentos: ['comida'], nombre: 'Pollo a la mostaza y miel c/ arroz blanco', tags: ['cremoso', 'delicioso', '15-30 min'], super: ['pollo', 'mostaza dijón', 'miel', 'arroz'] },

  // --- CENAS (35 opciones) ---
  { id: 'cen_01', momentos: ['cena'], nombre: 'Sándwich de jamón clásico o pavo ahumado', tags: ['rápido', 'salado', 'clásico', '<15 min', 'economico'], super: ['pan integral', 'pavo', 'jitomate', 'aguacate', 'panela'] },
  { id: 'cen_02', momentos: ['cena'], nombre: 'Licuado de proteína, avena, plátano y nuez', tags: ['rápido', 'liquido', 'dulce', 'digestivo', '<15 min'], super: ['lácteos light', 'proteína whey', 'plátano', 'avena', 'nueces'] },
  { id: 'cen_03', momentos: ['cena'], nombre: 'Salpicón de res magra de las sobras', tags: ['fresco', 'bajo-carb', 'meal-prep', 'economico'], super: ['res deshebrada', 'lechuga', 'rábano', 'vinagre', 'tostada horneada'] },
  { id: 'cen_04', momentos: ['cena'], nombre: 'Ensaladilla fría de atún con mayonesa ligera', tags: ['rápido', 'económico', 'fresco', '<15 min'], super: ['atún lata', 'verduras mixtas', 'mayonesa light', 'galleta salada'] },
  { id: 'cen_05', momentos: ['cena'], nombre: 'Huarachitos ligeros de nopal asado con queso', tags: ['mexicano', 'bajo-carb', 'vegetariano', '15-30 min', 'economico'], super: ['nopal asado', 'queso panela', 'frijol untado', 'salsa roja'] },
  { id: 'cen_06', momentos: ['cena'], nombre: 'Yogurt griego con manzana picada al natural', tags: ['dulce', 'postre', 'saciante', '<15 min'], super: ['yogurt griego', 'manzana', 'canela', 'almendras'] },
  { id: 'cen_07', momentos: ['cena'], nombre: 'Tortitas de arroz orgánico estilo California', tags: ['crujiente', 'muy-ligero', 'bajo-carb', '<15 min'], super: ['galleta arroz', 'queso crema light', 'pepino', 'ajonjolí'] },
  { id: 'cen_08', momentos: ['cena'], nombre: 'Tacos de huevo cocido en tortilla de maíz', tags: ['proteína-pura', 'clasico', 'rápido', 'economico'], super: ['huevo cocido', 'tortilla de maíz', 'salsa picante'] },
  { id: 'cen_09', momentos: ['cena'], nombre: 'Tostadas trituradas de requesón con pico de gallo', tags: ['mexicano', 'crujiente', 'ligero', 'economico'], super: ['tostada horneada', 'requesón', 'jitomate', 'cebolla'] },
  { id: 'cen_10', momentos: ['cena'], nombre: 'Sincronizada integral de jamón de pierna comun', tags: ['caliente', 'fácil', 'confort', '<15 min', 'economico'], super: ['tortilla harina integral', 'queso manchego light', 'jamón de pierna'] },
  { id: 'cen_11', momentos: ['cena'], nombre: 'Caldo de fideos ramen casero con pollo y verduras', tags: ['sopa', 'hidratante', 'reconfortante', '15-30 min'], super: ['fideo integral', 'caldo pollo', 'huevo cocido', 'cebolla china'] },
  { id: 'cen_12', momentos: ['cena'], nombre: 'Bowl de hojuelas de maíz integral con fruta', tags: ['ultra-rápido', 'dulce', 'ligero', '<15 min', 'comun', 'economico'], super: ['cereal sin azucar', 'lácteos light', 'fresa'] },
  { id: 'cen_13', momentos: ['cena'], nombre: 'Crema de calabacita comun', tags: ['caliente', 'ligero', 'vegano-amigable', '15-30 min'], super: ['calabaza asada', 'leche descremada', 'cebolla'] },
  { id: 'cen_14', momentos: ['cena'], nombre: 'Quesadillas asadas de jamón', tags: ['mexicano', 'rápido', '<15 min', 'economico'], super: ['tortilla de maíz', 'queso oaxaca', 'jamón pavo'] },
  { id: 'cen_15', momentos: ['cena'], nombre: 'Ceviche de coliflor muy fresco', tags: ['vegano', 'fresco', 'muy-ligero', '15-30 min'], super: ['coliflor', 'limón', 'cebolla morada', 'cilantro', 'tostada horneada'] },
  { id: 'cen_16', momentos: ['cena'], nombre: 'Queso panela asado directo al comal', tags: ['rápido', 'mexicano', 'proteína-queso', '<15 min'], super: ['queso panela', 'salsa roja', 'tortilla'] },
  { id: 'cen_17', momentos: ['cena'], nombre: 'Panqué casero de vainilla con vaso de leche fresca', tags: ['rapido', 'dulce', 'comun', 'economico', '<15 min'], super: ['pan dulce moderado', 'leche'] },
  { id: 'cen_18', momentos: ['cena'], nombre: 'Chayotes hervidos con crema y queso fresco', tags: ['volumen', 'mexicano', 'ligero', 'economico'], super: ['chayote', 'queso fresco', 'crema light'] },
  { id: 'cen_19', momentos: ['cena'], nombre: 'Molletes simples de frijolitos refritos', tags: ['confort', 'mexicano', '15-30 min', 'economico'], super: ['bolillo integral', 'frijol', 'queso oaxaca'] },
  { id: 'cen_20', momentos: ['cena'], nombre: 'Hot dog con salchicha de pavo y bollo integral', tags: ['americano', 'antojo', 'rápido', '<15 min'], super: ['salchicha pavo', 'pan hotdog integral', 'jitomate', 'cebolla'] },
  { id: 'cen_21', momentos: ['cena'], nombre: 'Taza de arroz blanco caliente con un vaso de leche', tags: ['indigestion', 'medico', 'estomago', 'economico'], super: ['arroz blanco', 'leche'] },
  { id: 'cen_22', momentos: ['cena'], nombre: 'Gringas de carne al pastor (o adobada) ligera', tags: ['mexicano', 'callejero', 'antojo', 'economico'], super: ['tortilla harina integral', 'cerdo adobado', 'queso oaxaca', 'piña'] },
  { id: 'cen_23', momentos: ['cena'], nombre: 'Pechuga de pavo rebanada pura al natural', tags: ['keto', 'ultra-bajo', '<15 min'], super: ['pechuga de pavo', 'pepino'] },
  { id: 'cen_24', momentos: ['cena'], nombre: 'Rollos de sushi clásicos listos para comer', tags: ['comercial', 'portatil', 'rápido', 'oriental'], super: ['sushi preparado', 'salsa soya'] },
  { id: 'cen_25', momentos: ['cena'], nombre: 'Batido de manzana con canela calientito', tags: ['confort', 'liquido', '<15 min', 'economico'], super: ['leche', 'manzana', 'canela', 'avena'] },
  { id: 'cen_26', momentos: ['cena'], nombre: 'Sopa de fideo casero caldo rojo', tags: ['mexicano', 'confort', 'sopa', 'economico'], super: ['pasta fideo', 'jitomate', 'caldo pollo'] },
  { id: 'cen_27', momentos: ['cena'], nombre: 'Hamburguesita sencilla a la plancha', tags: ['calle', 'rápido', 'antojo'], super: ['medallon res', 'pan hamburguesa integral', 'queso amarillo light'] },
  { id: 'cen_28', momentos: ['cena'], nombre: 'Filete frito al sartén con poquito aceite y ensalada verde', tags: ['casero', 'pescado', 'ligero'], super: ['pescado', 'lechuga', 'aceite', 'limón'] },
  { id: 'cen_29', momentos: ['cena'], nombre: 'Empanada comprada de atún o espinaca', tags: ['callejero', 'argentino', 'comun'], super: ['empanada'] },
  { id: 'cen_30', momentos: ['cena'], nombre: 'Huevo revuelto con jamón super básico', tags: ['rápido', 'economico', '<15 min'], super: ['huevo', 'jamón pavo', 'tortilla'] },
  { id: 'cen_31', momentos: ['cena'], nombre: 'Puré de manzanas baby sin azúcar añadida', tags: ['digestivo', 'suave', 'bebe', 'rápido'], super: ['puré manzana'] },
  { id: 'cen_32', momentos: ['cena'], nombre: 'Gordita de chicharrón prensado seca al comal', tags: ['mexicano', 'antojo', 'economico', '+30 min'], super: ['masa maiz', 'chicharrón prensado', 'lechuga'] },
  { id: 'cen_33', momentos: ['cena'], nombre: 'Tostadas siberia caseras de pechuga', tags: ['norteño', 'aguacate', 'rápido'], super: ['tostada horneada', 'pollo', 'crema light', 'aguacate'] },
  { id: 'cen_34', momentos: ['cena'], nombre: 'Ensalada de atún con garbanzo y vinagreta de limón', tags: ['proteina', 'fibra', 'fresco', '<15 min'], super: ['atún lata', 'garbanzo cocido', 'jitomate', 'cebolla morada', 'limón', 'aceite oliva'] },
  { id: 'cen_35', momentos: ['cena'], nombre: 'Sándwich de crema de cacahuate y mermelada (PB&J)', tags: ['gringo', 'dulce', 'rápido', '<15 min', 'economico'], super: ['pan integral', 'crema cacahuate', 'mermelada light'] },

  // === COMIDAS NUEVAS DOCUMENTADAS ===
  // Fuentes: USDA FoodData Central, BEDCA (Base Española), etiquetas comerciales mexicanas
  // Nota: Los valores macro son estimaciones por porción estándar de receta casera

  // --- DESAYUNOS MEXICANOS CASEROS (Saludables, no de la calle) ---
  {
    id: 'des_41',
    momentos: ['desayuno'],
    nombre: 'Sopes de pollo deshebrado con frijol y nopal',
    tags: ['mexicano', 'proteina', 'fibra', 'sin-freir'],
    super: ['masa de maíz', 'pollo deshebrado', 'frijol refrito', 'nopal asado', 'queso fresco', 'salsa verde'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 320, protein: 22, carbs: 38, fat: 9 },
    medicalContraindications: ['diabetes descontrolada', 'intolerancia al maíz']
  },
  {
    id: 'des_42',
    momentos: ['desayuno'],
    nombre: 'Papas con chorizo de soya al comal',
    tags: ['mexicano', 'vegano', 'proteina-vegetal', 'economico'],
    super: ['papa cocida', 'chorizo de soya', 'cebolla', 'cilantro', 'tortilla de maíz'],
    cuisineStyles: ['Mexicana', 'Vegetariana'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 280, protein: 12, carbs: 48, fat: 6 },
    medicalContraindications: ['dieta baja en carbohidratos', 'enfermedad renal (potasio alto)']
  },
  {
    id: 'des_43',
    momentos: ['desayuno'],
    nombre: 'Memelitas de frijol con queso y aguacate',
    tags: ['mexicano', 'vegetariano', 'saciante', 'oaxaqueño'],
    super: ['masa de maíz', 'frijol negro', 'queso oaxaca', 'aguacate', 'salsa roja'],
    cuisineStyles: ['Mexicana', 'Vegetariana'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 340, protein: 15, carbs: 42, fat: 14 },
    medicalContraindications: ['dieta keto', 'intolerancia a la lactosa']
  },
  {
    id: 'des_44',
    momentos: ['desayuno'],
    nombre: 'Chilaquiles de salsa verde con pollo y crema ligera',
    tags: ['mexicano', 'tradicional', 'proteina', 'fin-de-semana'],
    super: ['tortilla de maíz horneada', 'pollo deshebrado', 'salsa verde', 'crema light', 'queso fresco', 'cebolla'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 24, carbs: 42, fat: 12 },
    medicalContraindications: ['reflujo gastroesofágico', 'gastritis (salsa muy ácida)']
  },
  {
    id: 'des_45',
    momentos: ['desayuno'],
    nombre: 'Gorditas de nopal rellenas de requesón',
    tags: ['mexicano', 'bajo-carb', 'digestivo', 'economico'],
    super: ['nopal molido', 'masa de maíz', 'requesón', 'salsa verde', 'cebolla'],
    cuisineStyles: ['Mexicana', 'Vegetariana'],
    prepTimeMinutes: 30,
    difficulty: 'media',
    macroEstimate: { calories: 260, protein: 14, carbs: 32, fat: 8 },
    medicalContraindications: ['diabetes descontrolada (limitar porción)']
  },
  {
    id: 'des_46',
    momentos: ['desayuno'],
    nombre: 'Tlacoyos de haba con nopal ensalada',
    tags: ['mexicano', 'proteina-vegetal', 'alto-fibra', 'tradicional'],
    super: ['masa de maíz azul', 'habas cocidas', 'nopal', 'cebolla', 'cilantro', 'salsa verde'],
    cuisineStyles: ['Mexicana', 'Vegetariana'],
    prepTimeMinutes: 40,
    difficulty: 'dificil',
    macroEstimate: { calories: 300, protein: 14, carbs: 52, fat: 5 },
    medicalContraindications: ['síndrome de intestino irritable (FODMAP alto)']
  },
  {
    id: 'des_47',
    momentos: ['desayuno'],
    nombre: 'Caldo de pollo con verduras y garbanzo',
    tags: ['mexicano', 'caldo', 'reconfortante', 'proteina'],
    super: ['pollo con hueso', 'calabacita', 'zanahoria', 'apio', 'garbanzo', 'cebolla', 'epazote'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 45,
    difficulty: 'media',
    macroEstimate: { calories: 240, protein: 26, carbs: 18, fat: 8 },
    medicalContraindications: ['dieta baja en sodio (controlar sal)']
  },
  {
    id: 'des_48',
    momentos: ['desayuno'],
    nombre: 'Tortilla de patata española al horno (light)',
    tags: ['español', 'europeo', 'proteina', 'sin-freir'],
    super: ['huevo', 'papa', 'cebolla', 'aceite de oliva', 'pimentón'],
    cuisineStyles: ['Mediterránea', 'Casera'],
    prepTimeMinutes: 30,
    difficulty: 'media',
    macroEstimate: { calories: 290, protein: 16, carbs: 28, fat: 14 },
    medicalContraindications: ['diabetes descontrolada', 'dieta baja en carbohidratos']
  },
  {
    id: 'des_49',
    momentos: ['desayuno'],
    nombre: 'Frittata de espinaca y tomates secos',
    tags: ['italiano', 'mediterraneo', 'proteina', 'sin-freir'],
    super: ['huevo', 'espinaca', 'tomate seco', 'queso feta', 'aceituna', 'aceite de oliva'],
    cuisineStyles: ['Italiana', 'Mediterránea'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 310, protein: 19, carbs: 8, fat: 22 },
    medicalContraindications: ['cálculos renales (oxalatos en espinaca)', 'hipertensión (sodio en queso feta)']
  },
  {
    id: 'des_50',
    momentos: ['desayuno'],
    nombre: 'Shakshuka (huevos en salsa de tomate)',
    tags: ['medio-oriente', 'mediterraneo', 'proteina', 'vegetariano'],
    super: ['huevo', 'tomate', 'pimentón', 'cebolla', 'comino', 'aceite de oliva', 'pan integral'],
    cuisineStyles: ['Mediterránea', 'Casera'],
    prepTimeMinutes: 30,
    difficulty: 'media',
    macroEstimate: { calories: 340, protein: 17, carbs: 32, fat: 16 },
    medicalContraindications: ['reflujo gastroesofágico (tomate ácido)']
  },

  // --- DESAYUNOS ASIÁTICOS ---
  {
    id: 'des_51',
    momentos: ['desayuno'],
    nombre: 'Congee de arroz integral con pollo y jengibre',
    tags: ['chino', 'sopa', 'digestivo', 'reconfortante'],
    super: ['arroz integral', 'pollo deshebrado', 'jengibre fresco', 'cebolla verde', 'salsa de soya baja en sodio'],
    cuisineStyles: ['Asiática', 'Casera'],
    prepTimeMinutes: 40,
    difficulty: 'media',
    macroEstimate: { calories: 270, protein: 18, carbs: 38, fat: 5 },
    medicalContraindications: ['diabetes descontrolada (limitar porción)']
  },
  {
    id: 'des_52',
    momentos: ['desayuno'],
    nombre: 'Tamagoyaki (omelette japonés dulce)',
    tags: ['japones', 'proteina', 'tradicional'],
    super: ['huevo', 'mirin', 'salsa de soya', 'azúcar', 'aceite'],
    cuisineStyles: ['Asiática'],
    prepTimeMinutes: 15,
    difficulty: 'media',
    macroEstimate: { calories: 220, protein: 14, carbs: 12, fat: 14 },
    medicalContraindications: ['diabetes (azúcar añadida)', 'intolerancia al huevo']
  },
  {
    id: 'des_53',
    momentos: ['desayuno'],
    nombre: 'Miso shiru con tofu y algas wakame',
    tags: ['japones', 'sopa', 'probioticos', 'bajo-carb'],
    super: ['pasta de miso', 'tofu firme', 'alga wakame', 'cebolla verde', 'dashi'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 120, protein: 10, carbs: 8, fat: 5 },
    medicalContraindications: ['hipertensión (sodio en miso)', 'enfermedad tiroidea (yodo en algas)']
  },
  {
    id: 'des_54',
    momentos: ['desayuno'],
    nombre: 'Bibimbap de desayuno con arroz y vegetales',
    tags: ['coreano', 'bowl', 'vegetales', 'colorido'],
    super: ['arroz', 'espinaca', 'zanahoria', 'brotes de soya', 'huevo', 'salsa de chile coreano (gochujang moderada)'],
    cuisineStyles: ['Asiática'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 16, carbs: 52, fat: 12 },
    medicalContraindications: ['diabetes descontrolada', 'reflujo (picante)']
  },
  {
    id: 'des_55',
    momentos: ['desayuno'],
    nombre: 'Panqueques de matcha con azuki (sin azúcar añadida)',
    tags: ['japones', 'dulce-natural', 'antioxidante'],
    super: ['harina de trigo integral', 'polvo de matcha', 'pasta de frijol azuki sin azúcar', 'huevo', 'leche'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 290, protein: 11, carbs: 45, fat: 8 },
    medicalContraindications: ['intolerancia al gluten']
  },

  // --- DESAYUNOS ITALIANOS ---
  {
    id: 'des_56',
    momentos: ['desayuno'],
    nombre: 'Uova in purgatorio (huevos en salsa de tomate)',
    tags: ['italiano', 'mediterraneo', 'proteina', 'sencillo'],
    super: ['huevo', 'tomate triturado', 'ajo', 'aceite de oliva', 'albahaca', 'pan integral'],
    cuisineStyles: ['Italiana', 'Mediterránea'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 320, protein: 16, carbs: 30, fat: 16 },
    medicalContraindications: ['reflujo gastroesofágico']
  },
  {
    id: 'des_57',
    momentos: ['desayuno'],
    nombre: 'Panini integral de mozzarella, tomate y albahaca',
    tags: ['italiano', 'vegetariano', 'fresco', 'portatil'],
    super: ['pan ciabatta integral', 'mozzarella fresca', 'tomate', 'albahaca', 'aceite de oliva'],
    cuisineStyles: ['Italiana', 'Vegetariana'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 340, protein: 16, carbs: 38, fat: 16 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'des_58',
    momentos: ['desayuno'],
    nombre: 'Frittata de calabacín y parmesano',
    tags: ['italiano', 'bajo-carb', 'proteina'],
    super: ['huevo', 'calabacín', 'queso parmesano', 'aceite de oliva', 'nuez moscada'],
    cuisineStyles: ['Italiana'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 280, protein: 18, carbs: 6, fat: 20 },
    medicalContraindications: ['alergia al huevo']
  },
  {
    id: 'des_59',
    momentos: ['desayuno'],
    nombre: 'Ricotta toast con frutos rojos y miel',
    tags: ['italiano', 'dulce', 'proteina', 'probióticos'],
    super: ['pan integral', 'queso ricotta', 'fresa', 'mora', 'miel', 'nueces'],
    cuisineStyles: ['Italiana', 'Mediterránea'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 310, protein: 14, carbs: 38, fat: 12 },
    medicalContraindications: ['diabetes (controlar miel)', 'intolerancia a la lactosa']
  },
  {
    id: 'des_60',
    momentos: ['desayuno'],
    nombre: 'Polenta cremosa con champiñones salteados',
    tags: ['italiano', 'vegetariano', 'confort', 'caliente'],
    super: ['harina de maíz (polenta)', 'champiñón', 'mantequilla light', 'queso parmesano', 'tomillo'],
    cuisineStyles: ['Italiana', 'Vegetariana'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 290, protein: 10, carbs: 42, fat: 10 },
    medicalContraindications: ['diabetes descontrolada']
  },

  // --- COLACIONES SALUDABLES (15 nuevas) ---
  {
    id: 'col_36',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Yogurt griego natural con linaza molida',
    tags: ['probioticos', 'omega3', 'proteina', 'rapido'],
    super: ['yogurt griego sin azúcar', 'linaza molida', 'canela'],
    cuisineStyles: ['Casera', 'Mediterránea'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 140, protein: 15, carbs: 9, fat: 5 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'col_37',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Manzana con crema de cacahuate natural',
    tags: ['saciante', 'fibra', 'grasas-saludables', 'portatil'],
    super: ['manzana mediana', 'crema de cacahuate sin azúcar', 'canela'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 3,
    difficulty: 'facil',
    macroEstimate: { calories: 190, protein: 5, carbs: 25, fat: 9 },
    medicalContraindications: ['alergia a nueces (cacahuate es legumbre pero consultar)']
  },
  {
    id: 'col_38',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Requesón descremado con pepino y chía',
    tags: ['bajo-carb', 'proteina', 'fresco', 'digestivo'],
    super: ['requesón descremado', 'pepino', 'semillas de chía', 'sal de mar'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 120, protein: 14, carbs: 5, fat: 5 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'col_39',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Hummus casero con bastones de zanahoria',
    tags: ['vegano', 'fibra', 'proteina-vegetal', 'mediterraneo'],
    super: ['garbanzo cocido', 'tahini', 'limón', 'ajo', 'aceite de oliva', 'zanahoria'],
    cuisineStyles: ['Mediterránea', 'Vegetariana'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 160, protein: 6, carbs: 18, fat: 8 },
    medicalContraindications: ['síndrome de intestino irritable (FODMAP alto)']
  },
  {
    id: 'col_40',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Edamames calientes con sal de mar',
    tags: ['proteina-vegetal', 'oriental', 'isoflavonas'],
    super: ['edamames en vaina', 'sal de mar'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 8,
    difficulty: 'facil',
    macroEstimate: { calories: 150, protein: 13, carbs: 10, fat: 6 },
    medicalContraindications: ['hipotiroidismo (soya cruda)', 'alergia a la soya']
  },
  {
    id: 'col_41',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Pepino relleno de atún con mayonesa ligera',
    tags: ['proteina', 'bajo-carb', 'fresco', 'rapido'],
    super: ['pepino grande', 'atún en agua', 'mayonesa light', 'cebolla morada', 'limón'],
    cuisineStyles: ['Mediterránea', 'Casera'],
    prepTimeMinutes: 8,
    difficulty: 'facil',
    macroEstimate: { calories: 130, protein: 18, carbs: 4, fat: 4 },
    medicalContraindications: []
  },
  {
    id: 'col_42',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Queso cottage con piña natural',
    tags: ['proteina-lenta', 'digestivo', 'bromelina'],
    super: ['queso cottage bajo en grasa', 'piña natural', 'canela'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 140, protein: 16, carbs: 12, fat: 3 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'col_43',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Rollo de pavo con queso crema y espinaca',
    tags: ['proteina', 'bajo-carb', 'portatil', 'rapido'],
    super: ['pechuga de pavo rebanada', 'queso crema light', 'hojas de espinaca'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 110, protein: 14, carbs: 2, fat: 5 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'col_44',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Huevo cocido con aguacate y todo bagel seasoning',
    tags: ['proteina', 'grasas-saludables', 'keto-friendly'],
    super: ['huevo grande cocido', 'aguacate', 'semillas de sésamo', 'semillas de amapola', 'sal'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 12,
    difficulty: 'facil',
    macroEstimate: { calories: 180, protein: 8, carbs: 4, fat: 15 },
    medicalContraindications: ['alergia al huevo', 'cálculos biliares (consultar grasa)']
  },
  {
    id: 'col_45',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Berries con nueces y toque de limón',
    tags: ['antioxidantes', 'omega3', 'fresco', 'sin-lacteos'],
    super: ['fresas', 'moras', 'arándanos', 'nueces', 'limón'],
    cuisineStyles: ['Vegetariana'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 150, protein: 3, carbs: 15, fat: 10 },
    medicalContraindications: ['alergia a nueces']
  },
  {
    id: 'col_46',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Batido de proteína con café frío (proteína frappé)',
    tags: ['proteina', 'cafeina', 'post-entreno', 'liquido'],
    super: ['proteína whey', 'café espresso frío', 'hielo', 'leche descremada'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 130, protein: 25, carbs: 5, fat: 2 },
    medicalContraindications: ['intolerancia a la lactosa', 'hipertensión descontrolada (cafeína)']
  },
  {
    id: 'col_47',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Palta chilena (aguacate) con tomate y sal marina',
    tags: ['grasas-saludables', 'fresco', 'vegetariano', 'simple'],
    super: ['aguacate', 'tomate', 'sal marina', 'aceite de oliva', 'pan integral'],
    cuisineStyles: ['Mediterránea', 'Vegetariana'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 200, protein: 4, carbs: 18, fat: 14 },
    medicalContraindications: []
  },
  {
    id: 'col_48',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Chía pudding con leche de coco sin azúcar',
    tags: ['vegano', 'omega3', 'fibra', 'meal-prep'],
    super: ['semillas de chía', 'leche de coco sin azúcar', 'vainilla natural'],
    cuisineStyles: ['Vegetariana'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 170, protein: 4, carbs: 10, fat: 14 },
    medicalContraindications: ['dieta baja en grasa', 'síndrome de intestino irritable (fibra alta)']
  },
  {
    id: 'col_49',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Jícama con limón y chile en polvo',
    tags: ['mexicano', 'hidratante', 'bajo-carb', 'fresco'],
    super: ['jícama', 'limón', 'chile en polvo (tajín sin sal opcional)', 'sal de mar mínima'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 50, protein: 1, carbs: 11, fat: 0 },
    medicalContraindications: ['reflujo gastroesofágico (ácido del limón)']
  },
  {
    id: 'col_50',
    momentos: ['colacion_am', 'colacion_pm'],
    nombre: 'Cottage cheese con ralladura de limón y hierbas',
    tags: ['proteina', 'fresco', 'mediterraneo', 'digestivo'],
    super: ['queso cottage bajo en grasa', 'cáscara de limón', 'hierbas provenzales', 'pimienta'],
    cuisineStyles: ['Mediterránea', 'Casera'],
    prepTimeMinutes: 3,
    difficulty: 'facil',
    macroEstimate: { calories: 110, protein: 14, carbs: 5, fat: 3 },
    medicalContraindications: ['intolerancia a la lactosa']
  },

  // --- COMIDAS/ALMUERZOS DOCUMENTADOS (20 nuevas) ---
  {
    id: 'com_41',
    momentos: ['comida'],
    nombre: 'Mole verde con pollo y arroz (sin freír)',
    tags: ['mexicano', 'tradicional', 'proteina', 'sin-freir'],
    super: ['pollo con hueso', 'mole verde (pasta)', 'arroz blanco', 'calabacitas', 'ejotes'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 50,
    difficulty: 'dificil',
    macroEstimate: { calories: 420, protein: 32, carbs: 45, fat: 14 },
    medicalContraindications: ['reflujo gastroesofágico (chile)', 'gastritis']
  },
  {
    id: 'com_42',
    momentos: ['comida'],
    nombre: 'Pescado al mojo de ajo con puré de papa',
    tags: ['mexicano', 'mariscos', 'omega3', 'proteina'],
    super: ['filete de pescado blanco', 'ajo', 'mantequilla light', 'limón', 'papa', 'leche descremada'],
    cuisineStyles: ['Mexicana', 'Mediterránea'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 35, carbs: 38, fat: 10 },
    medicalContraindications: ['alergia al pescado']
  },
  {
    id: 'com_43',
    momentos: ['comida'],
    nombre: 'Chiles rellenos de queso capeados (horno)',
    tags: ['mexicano', 'vegetariano', 'proteina', 'sin-freir'],
    super: ['chile poblano', 'queso oaxaca', 'huevo (capeado)', 'caldillo de tomate', 'cebolla'],
    cuisineStyles: ['Mexicana', 'Vegetariana'],
    prepTimeMinutes: 45,
    difficulty: 'dificil',
    macroEstimate: { calories: 310, protein: 22, carbs: 14, fat: 18 },
    medicalContraindications: ['reflujo (poblano picante)', 'intolerancia a la lactosa']
  },
  {
    id: 'com_44',
    momentos: ['comida'],
    nombre: 'Picadillo de res con verduras (zucchini, zanahoria)',
    tags: ['mexicano', 'proteina', 'economico', 'economico'],
    super: ['carne molida de res magra', 'calabacín', 'zanahoria', 'papa', 'jitomate', 'cebolla'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 340, protein: 28, carbs: 22, fat: 16 },
    medicalContraindications: ['dieta baja en purinas (gota)']
  },
  {
    id: 'com_45',
    momentos: ['comida'],
    nombre: 'Pasta integral con pesto de espinaca y pollo',
    tags: ['italiano', 'proteina', 'hidratos-complejos'],
    super: ['pasta integral', 'pechuga de pollo', 'espinaca', 'piñón', 'aceite de oliva', 'ajo'],
    cuisineStyles: ['Italiana', 'Casera'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 420, protein: 32, carbs: 48, fat: 12 },
    medicalContraindications: ['cálculos renales (oxalatos en espinaca)']
  },
  {
    id: 'com_46',
    momentos: ['comida'],
    nombre: 'Risotto de champiñones con parmesano',
    tags: ['italiano', 'vegetariano', 'confort', 'sin-gluten'],
    super: ['arroz arborio', 'champiñón', 'caldo de verduras', 'vino blanco (opcional)', 'queso parmesano', 'mantequilla light'],
    cuisineStyles: ['Italiana', 'Vegetariana'],
    prepTimeMinutes: 40,
    difficulty: 'dificil',
    macroEstimate: { calories: 360, protein: 12, carbs: 58, fat: 10 },
    medicalContraindications: ['diabetes descontrolada']
  },
  {
    id: 'com_47',
    momentos: ['comida'],
    nombre: 'Pollo a la parmesana al horno (light)',
    tags: ['italiano', 'proteina', 'horneado', 'sin-freir'],
    super: ['pechuga de pollo', 'pan integral molido', 'huevo', 'salsa de tomate', 'queso mozzarella light', 'albahaca'],
    cuisineStyles: ['Italiana'],
    prepTimeMinutes: 40,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 42, carbs: 22, fat: 14 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'com_48',
    momentos: ['comida'],
    nombre: 'Bowl de quinoa mediterráneo con falafel horneado',
    tags: ['mediterraneo', 'vegetariano', 'proteina-vegetal', 'alto-fibra'],
    super: ['quinoa cocida', 'falafel horneado', 'hummus', 'tomate cherry', 'pepino', 'aceituna', 'tahini'],
    cuisineStyles: ['Mediterránea', 'Vegetariana'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 390, protein: 16, carbs: 52, fat: 14 },
    medicalContraindications: ['síndrome de intestino irritable (FODMAP alto)']
  },
  {
    id: 'com_49',
    momentos: ['comida'],
    nombre: 'Moussaka griega de berenjena (versión light)',
    tags: ['griego', 'mediterraneo', 'proteina', 'vegetales'],
    super: ['berenjena', 'carne de res molida magra', 'cebolla', 'tomate', 'queso feta', 'bechamel ligera'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 60,
    difficulty: 'dificil',
    macroEstimate: { calories: 340, protein: 26, carbs: 18, fat: 18 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'com_50',
    momentos: ['comida'],
    nombre: 'Buddha bowl con tofu, vegetales y aderezo de sésamo',
    tags: ['asiatico', 'vegano', 'proteina-vegetal', 'colorido'],
    super: ['arroz integral', 'tofu firme', 'brócoli', 'zanahoria', 'edamame', 'salsa de sésamo', 'cebolla verde'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 30,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 18, carbs: 52, fat: 12 },
    medicalContraindications: ['hipotiroidismo (soya)', 'síndrome de intestino irritable']
  },
  {
    id: 'com_51',
    momentos: ['comida'],
    nombre: 'Mapo tofu (con carne molida de pavo)',
    tags: ['chino', 'proteina', 'especiado', 'mapo'],
    super: ['tofu firme', 'pavo molido magro', 'pasta de chile broad bean', 'ajo', 'jengibre', 'cebolla verde'],
    cuisineStyles: ['Asiática'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 290, protein: 26, carbs: 8, fat: 16 },
    medicalContraindications: ['reflujo (picante)', 'hipotiroidismo']
  },
  {
    id: 'com_52',
    momentos: ['comida'],
    nombre: 'Teriyaki de salmón con arroz y edamame',
    tags: ['japones', 'mariscos', 'omega3', 'proteina'],
    super: ['filete de salmón', 'salsa teriyaki baja en sodio', 'arroz', 'edamame', 'semillas de sésamo'],
    cuisineStyles: ['Asiática'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 460, protein: 38, carbs: 42, fat: 16 },
    medicalContraindications: ['alergia al pescado', 'hipertensión (sodio en teriyaki)']
  },
  {
    id: 'com_53',
    momentos: ['comida'],
    nombre: 'Curry de garbanzos y espinaca (chana saag)',
    tags: ['indio', 'vegetariano', 'proteina-vegetal', 'curry'],
    super: ['garbanzo cocido', 'espinaca', 'tomate', 'leche de coco light', 'garam masala', 'jengibre'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 320, protein: 14, carbs: 42, fat: 14 },
    medicalContraindications: ['cálculos renales (oxalatos)', 'síndrome de intestino irritable']
  },
  {
    id: 'com_54',
    momentos: ['comida'],
    nombre: 'Pad thai de pollo (fideos de arroz)',
    tags: ['tailandes', 'asiatico', 'proteina', 'tamarindo'],
    super: ['fideos de arroz', 'pollo', 'huevos', 'brotes de soya', 'cacahuates', 'salsa de pescado (opcional)', 'tamarindo'],
    cuisineStyles: ['Asiática'],
    prepTimeMinutes: 30,
    difficulty: 'media',
    macroEstimate: { calories: 420, protein: 28, carbs: 48, fat: 14 },
    medicalContraindications: ['alergia a nueces (cacahuates)', 'soya']
  },
  {
    id: 'com_55',
    momentos: ['comida'],
    nombre: 'Fajitas de pollo con pimientos y cebolla',
    tags: ['mexicano', 'proteina', 'vegetales', 'rapido'],
    super: ['pechuga de pollo en tiras', 'pimiento verde', 'pimiento rojo', 'cebolla', 'tortilla integral', 'limón'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 25,
    difficulty: 'facil',
    macroEstimate: { calories: 340, protein: 32, carbs: 32, fat: 10 },
    medicalContraindications: ['reflujo (pimientos ácidos)']
  },
  {
    id: 'com_56',
    momentos: ['comida'],
    nombre: 'Carnitas de cerdo horneadas con nopales asados',
    tags: ['mexicano', 'proteina', 'horneado', 'michoacan'],
    super: ['carne de cerdo magra', 'naranja', 'leche (técnica de cocción)', 'nopal asado', 'salsa verde'],
    cuisineStyles: ['Mexicana'],
    prepTimeMinutes: 90,
    difficulty: 'dificil',
    macroEstimate: { calories: 360, protein: 38, carbs: 12, fat: 18 },
    medicalContraindications: ['dieta baja en purinas (gota)', 'dieta kosher', 'dieta halal']
  },
  {
    id: 'com_57',
    momentos: ['comida'],
    nombre: 'Caldo tlalpeño con pollo y garbanzo',
    tags: ['mexicano', 'sopa', 'caldo', 'reconfortante'],
    super: ['pollo con hueso', 'caldo de pollo', 'garbanzo', 'chile chipotle (moderado)', 'aguacate', 'queso fresco', 'epazote'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 50,
    difficulty: 'media',
    macroEstimate: { calories: 290, protein: 26, carbs: 18, fat: 14 },
    medicalContraindications: ['reflujo (chile)', 'intolerancia a la lactosa']
  },
  {
    id: 'com_58',
    momentos: ['comida'],
    nombre: 'Milanesas de soya a la napolitana (horno)',
    tags: ['mexicano', 'vegetariano', 'proteina-vegetal', 'sin-carne'],
    super: ['milanesa de soya texturizada', 'salsa de tomate', 'queso mozzarella light', 'orégano'],
    cuisineStyles: ['Mexicana', 'Vegetariana'],
    prepTimeMinutes: 30,
    difficulty: 'facil',
    macroEstimate: { calories: 260, protein: 22, carbs: 18, fat: 12 },
    medicalContraindications: ['hipotiroidismo (soya)', 'intolerancia a la lactosa']
  },
  {
    id: 'com_59',
    momentos: ['comida'],
    nombre: 'Torta de jamón de pavo con aguacate (pan integral)',
    tags: ['mexicano', 'proteina', 'rapido', 'portatil'],
    super: ['pan integral', 'pechuga de pavo', 'aguacate', 'lechuga', 'jitomate', 'mostaza'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 320, protein: 22, carbs: 38, fat: 10 },
    medicalContraindications: ['intolerancia al gluten']
  },
  {
    id: 'com_60',
    momentos: ['comida'],
    nombre: 'Salmón al horno con costra de hierbas y espárragos',
    tags: ['europeo', 'mariscos', 'omega3', 'proteina'],
    super: ['filete de salmón', 'eneldo', 'perejil', 'limón', 'espárragos', 'aceite de oliva'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 25,
    difficulty: 'media',
    macroEstimate: { calories: 380, protein: 36, carbs: 8, fat: 22 },
    medicalContraindications: ['alergia al pescado']
  },

  // --- CENAS LIGERAS DOCUMENTADAS (15 nuevas) ---
  {
    id: 'cen_36',
    momentos: ['cena'],
    nombre: 'Crema de calabaza con jengibre (sin crema)',
    tags: ['ligero', 'caliente', 'digestivo', 'bajo-grasa'],
    super: ['calabaza', 'cebolla', 'jengibre fresco', 'caldo de pollo bajo en sodio', 'aceite de oliva'],
    cuisineStyles: ['Casera', 'Asiática'],
    prepTimeMinutes: 30,
    difficulty: 'facil',
    macroEstimate: { calories: 140, protein: 4, carbs: 22, fat: 6 },
    medicalContraindications: ['diabetes descontrolada (limitar porción)']
  },
  {
    id: 'cen_37',
    momentos: ['cena'],
    nombre: 'Sopa de pollo con fideos integrales y espinaca',
    tags: ['reconfortante', 'proteina', 'cena-caliente'],
    super: ['caldo de pollo', 'pechuga de pollo deshebrada', 'fideos integrales', 'espinaca', 'zanahoria'],
    cuisineStyles: ['Casera', 'Mexicana'],
    prepTimeMinutes: 25,
    difficulty: 'facil',
    macroEstimate: { calories: 220, protein: 20, carbs: 22, fat: 6 },
    medicalContraindications: ['cálculos renales (oxalatos en espinaca)']
  },
  {
    id: 'cen_38',
    momentos: ['cena'],
    nombre: 'Rollitos de lechuga con pollo deshebrado y hummus',
    tags: ['ligero', 'bajo-carb', 'proteina', 'fresco'],
    super: ['lechuga romana', 'pollo deshebrado', 'hummus', 'pepino', 'zanahoria'],
    cuisineStyles: ['Mediterránea', 'Casera'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 180, protein: 24, carbs: 10, fat: 6 },
    medicalContraindications: ['síndrome de intestino irritable (FODMAP alto en hummus)']
  },
  {
    id: 'cen_39',
    momentos: ['cena'],
    nombre: 'Omelette de claras con champiñones y espinaca',
    tags: ['proteina', 'bajo-carb', 'bajo-grasa', 'rapido'],
    super: ['claras de huevo', 'champiñón', 'espinaca', 'aceite de oliva en spray'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 12,
    difficulty: 'facil',
    macroEstimate: { calories: 120, protein: 18, carbs: 4, fat: 4 },
    medicalContraindications: ['cálculos renales (oxalatos)']
  },
  {
    id: 'cen_40',
    momentos: ['cena'],
    nombre: 'Ensalada de garbanzos con tomate y pepino',
    tags: ['vegetariano', 'proteina-vegetal', 'fresco', 'mediterraneo'],
    super: ['garbanzo cocido', 'tomate', 'pepino', 'cebolla morada', 'perejil', 'aceite de oliva', 'limón'],
    cuisineStyles: ['Mediterránea', 'Vegetariana'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 240, protein: 10, carbs: 28, fat: 10 },
    medicalContraindications: ['síndrome de intestino irritable (FODMAP alto)']
  },
  {
    id: 'cen_41',
    momentos: ['cena'],
    nombre: 'Sardinas en lata con ensalada verde y tostada',
    tags: ['omega3', 'proteina', 'economico', 'rapido'],
    super: ['sardinas en agua (lata)', 'lechuga mixta', 'tomate cherry', 'tostada integral', 'limón'],
    cuisineStyles: ['Mediterránea', 'Casera'],
    prepTimeMinutes: 8,
    difficulty: 'facil',
    macroEstimate: { calories: 260, protein: 24, carbs: 16, fat: 12 },
    medicalContraindications: ['alergia al pescado', 'dieta baja en sodio (verificar sardinas)']
  },
  {
    id: 'cen_42',
    momentos: ['cena'],
    nombre: 'Requesón descremado con pepino y cebolla morada',
    tags: ['proteina', 'bajo-carb', 'ligero', 'fresco'],
    super: ['requesón descremado', 'pepino', 'cebolla morada', 'eneldo', 'aceite de oliva'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 5,
    difficulty: 'facil',
    macroEstimate: { calories: 140, protein: 18, carbs: 6, fat: 6 },
    medicalContraindications: ['intolerancia a la lactosa']
  },
  {
    id: 'cen_43',
    momentos: ['cena'],
    nombre: 'Verduras al vapor con tofu salteado',
    tags: ['vegano', 'bajo-carb', 'proteina-vegetal', 'ligero'],
    super: ['brócoli', 'coliflor', 'pimiento', 'tofu firme', 'salsa de soya baja en sodio', 'jengibre'],
    cuisineStyles: ['Asiática', 'Vegetariana'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 160, protein: 14, carbs: 12, fat: 8 },
    medicalContraindications: ['hipotiroidismo (soya)', 'cálculos renales (oxalatos en brócoli)']
  },
  {
    id: 'cen_44',
    momentos: ['cena'],
    nombre: 'Consomé de pollo con verduras julianas',
    tags: ['digestivo', 'caliente', 'bajo-carb', 'ligero'],
    super: ['caldo de pollo desgrasado', 'calabacín', 'zanahoria', 'apio', 'espinaca', 'cilantro'],
    cuisineStyles: ['Mexicana', 'Casera'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 80, protein: 12, carbs: 6, fat: 2 },
    medicalContraindications: ['dieta baja en sodio (controlar caldo)']
  },
  {
    id: 'cen_45',
    momentos: ['cena'],
    nombre: 'Atún a la plancha con ensalada de aguacate',
    tags: ['proteina', 'omega3', 'bajo-carb', 'fresco'],
    super: ['filete de atún fresco', 'aguacate', 'lechuga', 'pepino', 'aceite de oliva', 'limón'],
    cuisineStyles: ['Mediterránea'],
    prepTimeMinutes: 15,
    difficulty: 'media',
    macroEstimate: { calories: 280, protein: 34, carbs: 8, fat: 14 },
    medicalContraindications: ['alergia al pescado']
  },
  {
    id: 'cen_46',
    momentos: ['cena'],
    nombre: 'Huevo revuelto con espinaca y queso cottage',
    tags: ['proteina', 'bajo-carb', 'rapido', 'ligero'],
    super: ['huevo', 'espinaca', 'queso cottage bajo en grasa', 'aceite de oliva'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 220, protein: 20, carbs: 4, fat: 14 },
    medicalContraindications: ['cálculos renales (oxalatos)', 'intolerancia a la lactosa']
  },
  {
    id: 'cen_47',
    momentos: ['cena'],
    nombre: 'Guiso de lentejas con verduras (pequeña porción)',
    tags: ['vegetariano', 'proteina-vegetal', 'fibra', 'caliente'],
    super: ['lentejas cocidas', 'calabacín', 'zanahoria', 'cebolla', 'tomate', 'apio'],
    cuisineStyles: ['Vegetariana', 'Casera'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 200, protein: 14, carbs: 28, fat: 4 },
    medicalContraindications: ['síndrome de intestino irritable (FODMAP alto)', 'dieta baja en carbohidratos']
  },
  {
    id: 'cen_48',
    momentos: ['cena'],
    nombre: 'Sopa de tomate casera con albahaca',
    tags: ['vegetariana', 'digestiva', 'caliente', 'ligero'],
    super: ['tomate rojo', 'cebolla', 'ajo', 'caldo de verduras', 'albahaca', 'aceite de oliva'],
    cuisineStyles: ['Italiana', 'Vegetariana'],
    prepTimeMinutes: 25,
    difficulty: 'facil',
    macroEstimate: { calories: 100, protein: 3, carbs: 14, fat: 5 },
    medicalContraindications: ['reflujo gastroesofágico (tomate ácido)']
  },
  {
    id: 'cen_49',
    momentos: ['cena'],
    nombre: 'Pechuga de pollo a la plancha con brócoli al vapor',
    tags: ['proteina', 'bajo-carb', 'bajo-grasa', 'simple'],
    super: ['pechuga de pollo', 'brócoli', 'aceite de oliva', 'limón', 'ajo'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 20,
    difficulty: 'facil',
    macroEstimate: { calories: 220, protein: 36, carbs: 6, fat: 6 },
    medicalContraindications: ['cálculos renales (oxalatos en brócoli)']
  },
  {
    id: 'cen_50',
    momentos: ['cena'],
    nombre: 'Ensalada griega con queso feta y aceitunas',
    tags: ['vegetariana', 'mediterranea', 'fresco', 'proteina'],
    super: ['pepino', 'tomate', 'cebolla morada', 'queso feta', 'aceituna', 'aceite de oliva', 'orégano'],
    cuisineStyles: ['Mediterránea', 'Vegetariana'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 240, protein: 10, carbs: 10, fat: 18 },
    medicalContraindications: ['intolerancia a la lactosa', 'dieta baja en sodio (aceitunas)']
  }
];

export function getCompactMealsCatalog(
  db: CatalogMealItem[] = mealsDatabase
): {id: string, nombre: string, tags: string[], momentos: string[]}[] {
  return db.map(m => ({
    id: m.id,
    nombre: m.nombre,
    tags: m.tags,
    momentos: m.momentos,
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
    return value.flatMap((entry) => splitQuestionnaireValues(entry));
  }

  if (typeof value !== 'string') return [];

  return value
    .split(/[,\n;]+/g)
    .map((entry) => normalizeToken(entry))
    .filter(Boolean);
}

function getQuestionnaireSignals(questionnaire: any) {
  return {
    diagnostics: splitQuestionnaireValues(questionnaire?.healthContext?.diagnostics ?? questionnaire?.diagnostics),
    allergies: splitQuestionnaireValues(questionnaire?.healthContext?.allergies ?? questionnaire?.alergias),
    intolerances: splitQuestionnaireValues(questionnaire?.healthContext?.intolerances ?? questionnaire?.intolerancias),
    digestiveSymptoms: splitQuestionnaireValues(
      questionnaire?.healthContext?.digestiveSymptoms ?? questionnaire?.digestiveSymptoms
    ),
    favoriteFoods: splitQuestionnaireValues(questionnaire?.preferences?.favoriteFoods ?? questionnaire?.favoriteFoods),
    dislikedFoods: splitQuestionnaireValues(questionnaire?.preferences?.dislikedFoods ?? questionnaire?.dislikedFoods),
    favoriteCuisineStyles: splitQuestionnaireValues(
      questionnaire?.preferences?.favoriteCuisineStyles ?? questionnaire?.favoriteCuisineStyles
    ),
    cookingTime: normalizeToken(questionnaire?.preferences?.cookingTime ?? questionnaire?.cookingTime ?? ''),
    objectives: splitQuestionnaireValues(questionnaire?.profileContext?.objectives ?? questionnaire?.objectives),
  };
}

export function filterCatalogForQuestionnaire(db: CatalogMealItem[], questionnaire: any): CatalogMealItem[] {
  if (!questionnaire) return db;
 
  const signals = getQuestionnaireSignals(questionnaire);
  const exclusions = [
    ...signals.intolerances,
    ...signals.allergies,
    ...signals.dislikedFoods,
  ];

  if (exclusions.length === 0) return db;

  const exclusionMap: Record<string, string[]> = {
    'lactosa': ['leche', 'queso', 'yogurt', 'panela', 'lácteos'],
    'lacteos': ['leche', 'queso', 'yogurt', 'panela', 'lácteos'],
    'mariscos': ['camarón', 'pescado', 'atún', 'salmón'],
    'gluten': ['pan', 'tortilla de harina', 'avena', 'galleta', 'pasta'],
    'huevo': ['huevo', 'claras'],
    'nueces': ['nuez', 'almendras', 'cacahuate'],
    'yogurt': ['yogurt', 'kefir'],
    'queso': ['queso', 'panela', 'oaxaca', 'cottage', 'requesón', 'requeson', 'manchego'],
    'queso manchego': ['manchego'],
    'queso cottage': ['cottage'],
    'brócoli': ['brocoli'],
    'brocoli': ['brocoli'],
    'coliflor': ['coliflor'],
  };

  const activeForbiddenWords = exclusions.reduce((acc, exc) => {
    const list = exclusionMap[exc] || [exc];
    return acc.concat(list);
  }, [] as string[]);

  return db.filter(item => {
    const haystack = [...item.super, item.nombre, ...item.tags].map((entry) => normalizeToken(entry));
    const hasForbidden = haystack.some((entry) =>
      activeForbiddenWords.some((fw) => entry.includes(normalizeToken(fw)))
    );
    return !hasForbidden;
  });
}

function scoreMealForQuestionnaire(item: CatalogMealItem, questionnaire: any) {
  const signals = getQuestionnaireSignals(questionnaire);
  const haystack = normalizeToken([item.nombre, ...item.tags, ...item.super].join(' '));
  let score = 0;

  const includesAny = (values: string[]) => values.some((value) => haystack.includes(value));

  if (signals.favoriteCuisineStyles.length > 0 && includesAny(signals.favoriteCuisineStyles)) {
    score += 5;
  }

  if (signals.favoriteFoods.length > 0) {
    score += signals.favoriteFoods.reduce((acc, value) => acc + (haystack.includes(value) ? 2 : 0), 0);
  }

  if (signals.cookingTime) {
    if (signals.cookingTime.includes('45') && item.tags.some((tag) => /\+30 min|15-30 min/i.test(tag))) score += 2;
    if (signals.cookingTime.includes('15') && item.tags.some((tag) => /<15 min|15-30 min/i.test(tag))) score += 2;
  }

  if (signals.diagnostics.some((entry) => /(diabetes|insulina|sop|poliquist)/.test(entry))) {
    if (includesAny(['alto-proteina', 'proteina', 'bajo-carb', 'fibra', 'omega3', 'anti-inflamatorio', 'aguacate'])) score += 4;
    if (includesAny(['dulce', 'postre', 'alto-carb', 'carbohidrato-rapido', 'pan dulce', 'miel', 'mermelada'])) score -= 8;
  }

  if (signals.diagnostics.some((entry) => /(hipotiroid|tiroid)/.test(entry))) {
    if (includesAny(['brocoli', 'coliflor', 'soya texturizada', 'germinado soya'])) score -= 4;
    if (includesAny(['proteina', 'alto-proteina', 'cocido', 'parrilla'])) score += 1;
  }

  if (signals.digestiveSymptoms.some((entry) => /(estrenimiento|constip)/.test(entry))) {
    if (includesAny(['fibra', 'verduras', 'avena', 'chia', 'psyllium', 'frijol', 'lenteja'])) score += 3;
  }

  if (signals.digestiveSymptoms.some((entry) => /(distension|reflujo|colitis|gastritis)/.test(entry))) {
    if (includesAny(['chile', 'chipotle', 'salsa roja', 'salsa verde', 'grasa', 'frito', 'cremoso'])) score -= 5;
    if (includesAny(['digestivo', 'suave', 'ligero', 'caldo', 'calabaza', 'pollo'])) score += 2;
  }

  if (signals.objectives.some((entry) => /(musculo|ganar)/.test(entry)) && includesAny(['proteina', 'alto-proteina'])) {
    score += 3;
  }

  if (signals.objectives.some((entry) => /(perder|grasa|salud|control glucemico)/.test(entry)) && includesAny(['economico', '15-30 min', '<15 min', 'meal-prep'])) {
    score += 1;
  }

  return score;
}

export function buildQuestionnaireMealsCatalog(
  db: CatalogMealItem[],
  questionnaire: any
): {id: string, nombre: string, tags: string[], momentos: string[]}[] {
  const filtered = filterCatalogForQuestionnaire(db, questionnaire);
  const source = filtered.length > 0 ? filtered : db;
  const limitByMoment: Record<string, number> = {
    desayuno: 12,
    colacion_am: 10,
    colacion_pm: 10,
    comida: 12,
    cena: 12,
  };

  const pickedIds = new Set<string>();
  const result: CatalogMealItem[] = [];

  Object.entries(limitByMoment).forEach(([momentKey, limit]) => {
    const ranked = source
      .filter((item) => item.momentos.includes(momentKey))
      .map((item) => ({ item, score: scoreMealForQuestionnaire(item, questionnaire) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.item.nombre.localeCompare(b.item.nombre, 'es');
      });

    ranked.forEach(({ item }) => {
      if (pickedIds.has(item.id)) return;
      if (result.filter((entry) => entry.momentos.includes(momentKey)).length >= limit) return;
      pickedIds.add(item.id);
      result.push(item);
    });
  });

  return getCompactMealsCatalog(result.length > 0 ? result : source);
}

function parseModifiedId(rawId: string): { baseId: string, modifier: string | null } {
  if (rawId.includes('|MOD:')) {
    const parts = rawId.split('|MOD:');
    return { baseId: parts[0].trim(), modifier: parts[1] ? parts[1].trim() : null };
  }
  return { baseId: rawId, modifier: null };
}

export interface HybridMealSelection {
  idRef: string;
  porciones: string;
  detalle: string;
  caloriasKcal: number;
  proteinaG: number;
  grasasG: number;
}

export function rehydratePlanRecord(plan: Record<string, Record<string, any[]>>, profileId: 'EL' | 'ELLA' = 'EL'): any {
  if (!plan) return plan;
  const hydrated: any = {};
  
  for (const dia in plan) {
    hydrated[dia] = {};
    for (const momento in plan[dia]) {
      const opciones = plan[dia][momento];
      if (Array.isArray(opciones)) {
        hydrated[dia][momento] = opciones.map(op => {
          if (op && typeof op === 'object' && op.idRef) {
            const { baseId, modifier } = parseModifiedId(op.idRef);
            const found = mealsDatabase.find(m => m.id === baseId);
            if (found) {
              const repairedName = repairBrokenText(found.nombre);
              const repairedTags = found.tags.map((tag) => repairBrokenText(tag));
              const repairedSuper = found.super.map((ingredient) => repairBrokenText(ingredient));
              const repairedDetail = repairBrokenText(typeof op.detalle === 'string' ? op.detalle : '');
              const baseMeal: MealItem = {
                nombre: repairedName,
                tags: repairedTags,
                super: repairedSuper,
                porciones: repairBrokenText(String(op.porciones || '')),
                detalle: shouldReplaceMealDetail(repairedDetail, repairedName, repairedSuper)
                  ? buildCanonicalMealDetail(repairedName, repairedSuper)
                  : repairedDetail,
                caloriasKcal: Number(op.caloriasKcal) || 0,
                proteinaG: Number(op.proteinaG) || 0,
                grasasG: Number(op.grasasG) || 0
              };

              if (modifier) {
                baseMeal.notaPersonalizada = `Adaptación de IA: ${modifier}`;
              }

              return ensureMealNutrition(baseMeal);
            }
          } else if (typeof op === 'string') {
             // Fallback for legacy ID-only
             const { baseId, modifier } = parseModifiedId(op);
             const found = mealsDatabase.find(m => m.id === baseId);
             if (found) {
               const repairedName = repairBrokenText(found.nombre);
               const repairedSuper = found.super.map((ingredient) => repairBrokenText(ingredient));
               return ensureMealNutrition({
                 nombre: repairedName,
                 tags: found.tags.map((tag) => repairBrokenText(tag)),
                 super: repairedSuper,
                 porciones: 'N/A',
                 detalle: buildCanonicalMealDetail(repairedName, repairedSuper),
               });
             }
          }
          return ensureMealNutrition(op);
        });
      } else {
        hydrated[dia][momento] = opciones;
      }
    }
  }
  return enrichPlanWithNutrition(hydrated);
}
