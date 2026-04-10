import type { MealItem } from '../types';

export interface CatalogMealItem {
  id: string;
  momentos: string[];
  nombre: string;
  tags: string[];
  super: string[];
}

export const mealsDatabase: CatalogMealItem[] = [
  // --- DESAYUNOS (12 opciones) ---
  { id: 'des_01', momentos: ['desayuno'], nombre: 'Huevos a la mexicana con aguacate', tags: ['mexicano', 'saciante', 'clásico', '10min', 'caliente'], super: ['huevo', 'panela', 'jitomate', 'cebolla', 'aguacate', 'tortilla', 'lácteos light'] },
  { id: 'des_02', momentos: ['desayuno'], nombre: 'Omelette de champiñones y espinaca', tags: ['rápido', 'ligero', 'vegetariano-opcional', '7min'], super: ['huevo', 'jamón pavo', 'champiñón', 'espinaca', 'tostada'] },
  { id: 'des_03', momentos: ['desayuno'], nombre: 'Avena nocturna (Overnight oats) con proteína', tags: ['dulce', 'rápido', 'meal-prep', 'fresco'], super: ['avena', 'proteína whey', 'leche', 'manzana', 'chía'] },
  { id: 'des_04', momentos: ['desayuno'], nombre: 'Chilaquiles fit al horno con pollo', tags: ['mexicano', 'alto-carb', 'fin-de-semana'], super: ['tortilla horneada', 'pollo', 'salsa verde', 'queso panela', 'cebolla', 'crema light'] },
  { id: 'des_05', momentos: ['desayuno'], nombre: 'Pan tostado integral con salmón ahumado y aguacate', tags: ['gourmet', 'omega3', 'rápido'], super: ['pan integral', 'salmón', 'aguacate', 'queso crema light', 'alcaparras'] },
  { id: 'des_06', momentos: ['desayuno'], nombre: 'Claras de huevo con nopal y pico de gallo', tags: ['bajo-carb', 'volumen', 'mexicano', 'ligero'], super: ['claras', 'nopal', 'jitomate', 'cebolla', 'cilantro'] },
  { id: 'des_07', momentos: ['desayuno'], nombre: 'Hotcakes de avena y plátano', tags: ['dulce', 'confort', 'saciante'], super: ['avena', 'huevo', 'plátano', 'leche', 'canela', 'miel'] },
  { id: 'des_08', momentos: ['desayuno'], nombre: 'Enfrijoladas ligeras con queso cottage', tags: ['vegano-opcional', 'mexicano', 'hierro'], super: ['tortilla', 'frijol', 'queso cottage', 'cebolla'] },
  { id: 'des_09', momentos: ['desayuno'], nombre: 'Bowl de yogurt griego con frutos rojos y nuez', tags: ['probióticos', 'fresco', 'rápido', 'dulce'], super: ['yogurt griego', 'fresa', 'mora', 'nuez', 'avena'] },
  { id: 'des_10', momentos: ['desayuno'], nombre: 'Huevos revueltos con machaca', tags: ['norteño', 'alto-proteina', 'caliente'], super: ['huevo', 'machaca', 'jitomate', 'cebolla', 'tortilla harina light'] },
  { id: 'des_11', momentos: ['desayuno'], nombre: 'Smoothie verde detox con proteína', tags: ['liquido', 'rápido', 'fibra'], super: ['proteína whey', 'espinaca', 'apio', 'manzana verde', 'leche almendra'] },
  { id: 'des_12', momentos: ['desayuno'], nombre: 'Quesadillas de champiñón en tortilla de maíz', tags: ['sencillo', 'ligero', 'mexicano'], super: ['tortilla', 'queso oaxaca', 'champiñón', 'salsa', 'aguacate'] },

  // --- COLACIONES (10 opciones) ---
  { id: 'col_01', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Gelatina light', tags: ['libre', 'dulce', 'rápido'], super: ['gelatina light'] },
  { id: 'col_02', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Avena con fruta y nueces', tags: ['dulce', 'energía', 'rápido'], super: ['papaya', 'avena', 'nueces'] },
  { id: 'col_03', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Jícama y pepino con chile tajín', tags: ['libre', 'crujiente', 'fresco', 'vegano'], super: ['jícama', 'pepino', 'limón', 'chile en polvo'] },
  { id: 'col_04', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Puñado de almendras tostadas', tags: ['grasas-buenas', 'rápido', 'portátil'], super: ['almendras'] },
  { id: 'col_05', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Manzana verde con crema de cacahuate', tags: ['saciante', 'dulce-salado'], super: ['manzana', 'crema cacahuate'] },
  { id: 'col_06', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Yogurt para beber sin azúcar', tags: ['liquido', 'probióticos', 'portátil'], super: ['yogurt líquido light'] },
  { id: 'col_07', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Galletas de arroz con puré de aguacate', tags: ['crujiente', 'rápido', 'vegano'], super: ['galleta arroz', 'aguacate', 'sal'] },
  { id: 'col_08', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Rollitos de jamón de pavo con panela', tags: ['proteína', 'fresco', 'bajo-carb'], super: ['jamón pavo', 'panela'] },
  { id: 'col_09', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Barrita de proteína comercial (<150 kcal)', tags: ['ultra-rápido', 'portátil'], super: ['barra proteína'] },
  { id: 'col_10', momentos: ['colacion_am', 'colacion_pm'], nombre: 'Plátano dominico', tags: ['potasio', 'energía-rápida', 'pre-entreno'], super: ['plátano'] },

  // --- COMIDAS (15 opciones) ---
  { id: 'com_01', momentos: ['comida'], nombre: 'Bistec a la parrilla con pico de gallo y aguacate', tags: ['parrilla', 'llenador', 'mexicano', 'alto-proteina'], super: ['res', 'panela', 'jitomate', 'cebolla', 'aguacate', 'tortilla'] },
  { id: 'com_02', momentos: ['comida'], nombre: 'Salmón al horno con quinoa y espárragos', tags: ['gourmet', 'omega3', 'ligero'], super: ['salmón', 'quinoa', 'espárrago', 'aceite oliva'] },
  { id: 'com_03', momentos: ['comida'], nombre: 'Bowl de pollo tipo Teriyaki con brócoli', tags: ['oriental', 'bowl', 'meal-prep'], super: ['pollo', 'brócoli', 'arroz', 'ajonjolí', 'aceite sésamo', 'salsa soya'] },
  { id: 'com_04', momentos: ['comida'], nombre: 'Tacos de carne molida magra con lechuga', tags: ['divertido', 'mexicano', 'saciante'], super: ['res molida', 'lechuga', 'jitomate', 'tortilla', 'queso panela'] },
  { id: 'com_05', momentos: ['comida'], nombre: 'Pechuga asada con ensalada fresca y arroz', tags: ['clásico', 'fácil', 'balanceado'], super: ['pollo', 'lechuga', 'jitomate', 'pepino', 'arroz', 'aguacate'] },
  { id: 'com_06', momentos: ['comida'], nombre: 'Enchiladas suizas ligeras en salsa verde', tags: ['mexicano', 'caliente', 'comfort-food'], super: ['pollo', 'tortilla', 'salsa verde', 'queso gratinar light', 'crema light'] },
  { id: 'com_07', momentos: ['comida'], nombre: 'Filete de pescado a la plancha con verduras al vapor', tags: ['muy-ligero', 'bajo-grasa', 'digestivo'], super: ['pescado', 'calabaza', 'zanahoria', 'brócoli', 'arroz'] },
  { id: 'com_08', momentos: ['comida'], nombre: 'Lentejas guisadas con plátano macho asado', tags: ['vegetariano', 'hierro', 'reconfortante'], super: ['lenteja', 'plátano macho', 'jitomate', 'cebolla'] },
  { id: 'com_09', momentos: ['comida'], nombre: 'Tinga de pollo con tostadas horneadas', tags: ['mexicano', 'meal-prep', 'rendidor'], super: ['pollo', 'cebolla', 'chipotle', 'tostada horneada', 'aguacate'] },
  { id: 'com_10', momentos: ['comida'], nombre: 'Medallón de atún sellado con costra de ajonjolí', tags: ['gourmet', 'omega3', 'rápido'], super: ['atún fresco', 'ajonjolí', 'ensalada mixta', 'salsa soya'] },
  { id: 'com_11', momentos: ['comida'], nombre: 'Ceviche de pescado fresco con mango', tags: ['fresco', 'verano', 'sin-fuego'], super: ['pescado', 'limón', 'mango', 'pepino', 'tostada horneada'] },
  { id: 'com_12', momentos: ['comida'], nombre: 'Pasta integral a la boloñesa (res magra)', tags: ['italiano', 'alto-carb', 'pre-entreno'], super: ['pasta integral', 'res molida', 'salsa tomate', 'queso parmesano'] },
  { id: 'com_13', momentos: ['comida'], nombre: 'Fajitas de pollo con pimientos colorados', tags: ['colorido', 'vitamina-c', 'parrilla'], super: ['pollo', 'pimiento', 'cebolla', 'tortilla', 'guacamole'] },
  { id: 'com_14', momentos: ['comida'], nombre: 'Picadillo de soya texturizada con papas', tags: ['vegano', 'económico', 'mexicano'], super: ['soya', 'papa', 'zanahoria', 'jitomate', 'tortilla'] },
  { id: 'com_15', momentos: ['comida'], nombre: 'Hamburguesa casera fit (pan integral)', tags: ['antojo', 'cheat-meal-limpio'], super: ['res magra', 'pan hamburguesa integral', 'lechuga', 'jitomate', 'mostaza', 'queso amarillo light'] },

  // --- CENAS (12 opciones) ---
  { id: 'cen_01', momentos: ['cena'], nombre: 'Sándwich de pavo y aguacate', tags: ['rápido', 'salado', 'clásico'], super: ['pan integral', 'pavo', 'jitomate', 'aguacate'] },
  { id: 'cen_02', momentos: ['cena'], nombre: 'Licuado de avena, plátano y nuez', tags: ['rápido', 'liquido', 'dulce', 'digestivo'], super: ['lácteos light', 'plátano', 'avena', 'nueces'] },
  { id: 'cen_03', momentos: ['cena'], nombre: 'Salpicón de res a la vinagreta', tags: ['fresco', 'bajo-carb', 'meal-prep'], super: ['res deshebrada', 'lechuga', 'rábano', 'vinagre', 'tostada horneada'] },
  { id: 'cen_04', momentos: ['cena'], nombre: 'Atún en agua con ensalada de coditos', tags: ['rápido', 'económico', 'fresco'], super: ['atún lata', 'pasta fría', 'mayonesa light', 'apio'] },
  { id: 'cen_05', momentos: ['cena'], nombre: 'Sopesitos ligeros de nopal con queso', tags: ['mexicano', 'bajo-carb', 'vegetariano'], super: ['nopal asado', 'queso panela', 'frijol untado', 'salsa roja'] },
  { id: 'cen_06', momentos: ['cena'], nombre: 'Yogurt griego con manzana asada y canela', tags: ['dulce', 'postre', 'saciante'], super: ['yogurt griego', 'manzana', 'canela', 'almendras'] },
  { id: 'cen_07', momentos: ['cena'], nombre: 'Wraps de lechuga con pollo oriental', tags: ['crujiente', 'muy-ligero', 'bajo-carb'], super: ['pollo desmenuzado', 'lechuga orejona', 'zanahoria rallada', 'salsa soya'] },
  { id: 'cen_08', momentos: ['cena'], nombre: 'Huevo cocido con espinacas baby', tags: ['proteína-pura', 'keto-friendly', 'rápido'], super: ['huevo cocido', 'espinaca', 'aceite oliva'] },
  { id: 'cen_09', momentos: ['cena'], nombre: 'Tostadas de requesón con pico de gallo', tags: ['mexicano', 'crujiente', 'ligero'], super: ['tostada horneada', 'requesón', 'jitomate', 'cebolla'] },
  { id: 'cen_10', momentos: ['cena'], nombre: 'Quesadilla integral con jamón de pavo', tags: ['caliente', 'fácil', 'confort'], super: ['tortilla harina integral', 'queso oaxaca', 'jamón pavo'] },
  { id: 'cen_11', momentos: ['cena'], nombre: 'Caldo tlalpeño sin freír', tags: ['sopa', 'hidratante', 'enfermedad', 'reconfortante'], super: ['caldo pollo', 'pollo deshebrado', 'garbanzo', 'zanahoria', 'aguacate'] },
  { id: 'cen_12', momentos: ['cena'], nombre: 'Cereal de avena inflada con leche y fresas', tags: ['ultra-rápido', 'dulce', 'ligero'], super: ['avena inflada', 'lácteos light', 'fresa'] }
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
              const baseMeal: MealItem = {
                nombre: found.nombre,
                tags: found.tags,
                super: found.super,
                porciones: op.porciones,
                detalle: op.detalle,
                caloriasKcal: Number(op.caloriasKcal) || 0,
                proteinaG: Number(op.proteinaG) || 0,
                grasasG: Number(op.grasasG) || 0
              };

              if (modifier) {
                baseMeal.notaPersonalizada = `Adaptación de IA: ${modifier}`;
              }

              return baseMeal;
            }
          } else if (typeof op === 'string') {
             // Fallback for legacy ID-only
             const { baseId, modifier } = parseModifiedId(op);
             const found = mealsDatabase.find(m => m.id === baseId);
             if (found) {
               return { ...found, porciones: 'N/A', detalle: 'N/A' };
             }
          }
          return op;
        });
      } else {
        hydrated[dia][momento] = opciones;
      }
    }
  }
  return hydrated;
}
