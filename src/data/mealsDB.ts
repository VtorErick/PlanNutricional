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
  { id: 'com_32', momentos: ['comida'], nombre: 'Milanesa empanizada al aire libre (Airfryer)', tags: ['airfryer', 'crujiente', '15-30 min'], super: ['pollo', 'pan molido", "huevo", "papa'] },
  { id: 'com_33', momentos: ['comida'], nombre: 'Chuleta ahumada asada al comal', tags: ['rápido', 'comun', '<15 min', 'economico'], super: ['chuleta de cerdo', 'nopales asados', 'tortilla'] },
  { id: 'com_34', momentos: ['comida'], nombre: 'Sopa de verduras juliana calientita con pechuga deshebrada', tags: ['sopa', 'liquid', 'confort', '+30 min', 'economico'], super: ['caldo pollo', 'pollo', 'verduras mixtas', 'tortilla'] },
  { id: 'com_35', momentos: ['comida'], nombre: 'Torta de pierna o milanesa en pan integral', tags: ['portatil', 'calle', 'mexicano', 'rápido'], super: ['bolillo integral', 'carne de res magra', 'jitomate', 'aguacate', 'frijol'] },
  { id: 'com_36', momentos: ['comida'], nombre: 'Rollos de sushi caseros sin freír (maki)', tags: ['oriental', 'divertido', '+30 min'], super: ['arroz sushi', 'alga nori', 'pepino', 'surimi', 'queso crema light'] },
  { id: 'com_37', momentos: ['comida'], nombre: 'Chop Suey de verduras con pollo', tags: ['oriental', 'volumen', 'ligero', '15-30 min'], super: ['pollo', 'germinado soya', 'zanahoria', 'salsa soya'] },
  { id: 'com_38', momentos: ['comida'], nombre: 'Tamal fit o desgrasado (versión saludable hoja de plátano)', tags: ['mexicano", "fin-de-semana", "comun'], super: ['harina maiz', 'pollo', 'salsa verde', 'hoja plátano'] },
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
  { id: 'cen_35', momentos: ['cena'], nombre: 'Sándwich de crema de cacahuate y mermelada (PB&J)', tags: ['gringo', 'dulce', 'rápido', '<15 min', 'economico'], super: ['pan integral', 'crema cacahuate', 'mermelada light'] }
];

export function getCompactMealsCatalog(db: CatalogMealItem[] = mealsDatabase): {id: string, tags: string[], momentos: string[]}[] {
  return db.map(m => ({
    id: m.id,
    tags: m.tags,
    momentos: m.momentos,
  }));
}

export function filterCatalogForQuestionnaire(db: CatalogMealItem[], questionnaire: any): CatalogMealItem[] {
  if (!questionnaire) return db;
  
  // Extract intolerances and allergies to lower case
  const exclusions = [
    ...(questionnaire.intolerancias || []),
    ...(questionnaire.alergias || []),
  ].map((str: string) => (typeof str === 'string' ? str.toLowerCase().trim() : ''));

  if (exclusions.length === 0) return db;

  // Simple heuristic mapping
  const exclusionMap: Record<string, string[]> = {
    'lactosa': ['leche', 'queso', 'yogurt', 'panela', 'lácteos'],
    'mariscos': ['camarón', 'pescado', 'atún', 'salmón'],
    'gluten': ['pan', 'tortilla de harina', 'avena', 'galleta', 'pasta'],
    'huevo': ['huevo', 'claras'],
    'nueces': ['nuez', 'almendras', 'cacahuate'],
  };

  const activeForbiddenWords = exclusions.reduce((acc, exc) => {
    const list = exclusionMap[exc] || [exc];
    return acc.concat(list);
  }, [] as string[]);

  return db.filter(item => {
    // If ANY of the super items matches ANY forbidden word, exclude it.
    const hasForbidden = item.super.some((ing: string) => 
      activeForbiddenWords.some(fw => ing.toLowerCase().includes(fw))
    );
    return !hasForbidden;
  });
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
