/**
 * Utilidades para generación de lista de compras optimizada.
 * Consolida ingredientes, calcula cantidades y organiza por categorías de supermercado.
 */

import type { CatalogMealItem } from '../data/mealsDB';
import type { MealItem } from '../types';

export type ShoppingCategory =
  | 'frescos'      // Frutas, verduras, hierbas
  | 'carnes'       // Pollo, res, pescado, huevos
  | 'lacteos'      // Leche, queso, yogurt
  | 'granos'       // Arroz, pasta, avena, pan
  | 'conservas'    // Latas, salsas, aceites
  | 'congelados'   // Verduras congeladas, etc.
  | 'especias';    // Sal, pimienta, condimentos

export interface ShoppingItem {
  ingredient: string;           // Nombre normalizado del ingrediente
  totalAmount: string;         // Cantidad estimada (ej: "600g", "3 pzas", "2 tazas")
  unit: string;                // Unidad base (g, kg, pzas, tazas, etc.)
  estimatedQuantity: number;     // Valor numérico para cálculos
  recipes: string[];           // Nombres de recetas que usan este ingrediente
  category: ShoppingCategory;  // Categoría de supermercado
  isEssential: boolean;        // Ingrediente esencial vs opcional
  alternatives?: string[];     // Alternativas si no está disponible
}

export interface ShoppingListConfig {
  peopleCount: number;        // Número de personas (default: 1)
  daysCount: number;           // Días del plan (default: 7)
  includeAlternatives: boolean; // Incluir sugerencias de alternativas
  categorizeBySupermarket: boolean; // Organizar por zonas de supermercado
}

const DEFAULT_CONFIG: ShoppingListConfig = {
  peopleCount: 1,
  daysCount: 7,
  includeAlternatives: true,
  categorizeBySupermarket: true,
};

// Mapeo de ingredientes a categorías
const INGREDIENT_CATEGORIES: Record<string, ShoppingCategory> = {
  // Frescos
  'aguacate': 'frescos', 'tomate': 'frescos', 'jitomate': 'frescos',
  'cebolla': 'frescos', 'ajo': 'frescos', 'papa': 'frescos',
  'calabacín': 'frescos', 'zanahoria': 'frescos', 'espinaca': 'frescos',
  'lechuga': 'frescos', 'pepino': 'frescos', 'champiñón': 'frescos',
  'nopal': 'frescos', 'calabaza': 'frescos', 'brócoli': 'frescos',
  'coliflor': 'frescos', 'apio': 'frescos', 'pimiento': 'frescos',
  ' cilantro': 'frescos', 'perejil': 'frescos', 'albahaca': 'frescos',
  'manzana': 'frescos', 'plátano': 'frescos', 'fresa': 'frescos',
  'mora': 'frescos', 'arándano': 'frescos',  'naranja': 'frescos', 'limón': 'frescos', 'lima': 'frescos',

  // Carnes y proteínas
  'pollo': 'carnes', 'pechuga': 'carnes', 'res': 'carnes',
  'carne molida': 'carnes', 'pescado': 'carnes', 'salmón': 'carnes',
  'atún': 'carnes', 'sardinas': 'carnes', 'huevo': 'carnes',
  'claras': 'carnes', 'jamón': 'carnes', 'pavo': 'carnes',
  'chorizo': 'carnes', 'tocino': 'carnes', 'machaca': 'carnes',

  // Lácteos
  'leche': 'lacteos', 'yogurt': 'lacteos', 'queso': 'lacteos',
  'queso fresco': 'lacteos', 'panela': 'lacteos', 'oaxaca': 'lacteos',
  'requesón': 'lacteos', 'cottage': 'lacteos', 'ricotta': 'lacteos',
  'mozzarella': 'lacteos', 'parmesano': 'lacteos', 'feta': 'lacteos',
  'crema': 'lacteos', 'mantequilla': 'lacteos',

  // Granos y carbohidratos
  'arroz': 'granos', 'pasta': 'granos', 'avena': 'granos',
  'quinoa': 'granos', 'tortilla': 'granos', 'pan': 'granos',
  'pan integral': 'granos', 'tostada': 'granos', 'frijol': 'granos',
  'lenteja': 'granos', 'garbanzo': 'granos', 'haba': 'granos',
  'harina': 'granos', 'maíz': 'granos', 'masa': 'granos',
  'cereal': 'granos', 'granola': 'granos',

  // Conservas y despensa
  'aceite': 'conservas', 'aceite de oliva': 'conservas',
  'salsa': 'conservas', 'salsa de soya': 'conservas',
  'vinagre': 'conservas', 'mostaza': 'conservas',
  'mayonesa': 'conservas', 'ketchup': 'conservas',
  'miel': 'conservas', 'azúcar': 'conservas', 'sal': 'conservas',
  'pimienta': 'especias', 'canela': 'especias',
  'comino': 'especias', 'orégano': 'especias', 'tomillo': 'especias',
  'sopa': 'conservas', 'caldo': 'conservas', 'caldo de pollo': 'conservas',
  'fideo': 'granos', 'pasta de tomate': 'conservas',

  // Congelados
  'vegetales congelados': 'congelados', 'edamame': 'congelados',
  'falafel congelado': 'congelados',
};

// Unidades comunes y sus conversiones aproximadas
const UNIT_NORMALIZATIONS: Record<string, { unit: string; factor: number }> = {
  'g': { unit: 'g', factor: 1 },
  'gramo': { unit: 'g', factor: 1 },
  'gramos': { unit: 'g', factor: 1 },
  'kg': { unit: 'g', factor: 1000 },
  'kilo': { unit: 'g', factor: 1000 },
  'kilos': { unit: 'g', factor: 1000 },
  'pz': { unit: 'pzas', factor: 1 },
  'pza': { unit: 'pzas', factor: 1 },
  'pieza': { unit: 'pzas', factor: 1 },
  'piezas': { unit: 'pzas', factor: 1 },
  'taza': { unit: 'tazas', factor: 1 },
  'tazas': { unit: 'tazas', factor: 1 },
  'cda': { unit: 'cdas', factor: 1 },
  'cucharada': { unit: 'cdas', factor: 1 },
  'cdita': { unit: 'cditas', factor: 1 },
  'cucharadita': { unit: 'cditas', factor: 1 },
  'ml': { unit: 'ml', factor: 1 },
  'l': { unit: 'ml', factor: 1000 },
  'litro': { unit: 'ml', factor: 1000 },
  'litros': { unit: 'ml', factor: 1000 },
};

// Ingredientes esenciales (no pueden omitirse fácilmente)
const ESSENTIAL_INGREDIENTS = [
  'pollo', 'res', 'pescado', 'huevo', 'tofu', 'garbanzo', 'lenteja',
  'arroz', 'pasta', 'pan', 'tortilla',
  'leche', 'yogurt', 'queso',
  'tomate', 'cebolla', 'ajo', 'aguacate',
];

/**
 * Normaliza el nombre de un ingrediente
 */
function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Determina la categoría de supermercado para un ingrediente
 */
function getCategory(ingredient: string): ShoppingCategory {
  const normalized = normalizeIngredient(ingredient);

  // Búsqueda exacta primero
  if (INGREDIENT_CATEGORIES[normalized]) {
    return INGREDIENT_CATEGORIES[normalized];
  }

  // Búsqueda por contención
  for (const [key, category] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  // Default a conservas si no se encuentra
  return 'conservas';
}

/**
 * Calcula cantidad estimada basada en el ingrediente y número de comidas
 */
function estimateQuantity(
  ingredient: string,
  mealCount: number,
  peopleCount: number
): { amount: string; unit: string; quantity: number } {
  const normalized = normalizeIngredient(ingredient);
  const baseMultiplier = mealCount * peopleCount;

  // Reglas específicas por tipo de ingrediente
  if (normalized.includes('pollo') || normalized.includes('pechuga')) {
    const grams = 150 * baseMultiplier;
    return { amount: `${grams}g`, unit: 'g', quantity: grams };
  }

  if (normalized.includes('res') || normalized.includes('carne molida')) {
    const grams = 120 * baseMultiplier;
    return { amount: `${grams}g`, unit: 'g', quantity: grams };
  }

  if (normalized.includes('pescado') || normalized.includes('salmon') || normalized.includes('atun')) {
    const grams = 150 * baseMultiplier;
    return { amount: `${grams}g`, unit: 'g', quantity: grams };
  }

  if (normalized.includes('huevo')) {
    const pieces = 2 * baseMultiplier;
    return { amount: `${pieces} pzas`, unit: 'pzas', quantity: pieces };
  }

  if (normalized.includes('leche')) {
    const ml = 250 * baseMultiplier;
    return { amount: ml >= 1000 ? `${(ml/1000).toFixed(1)}L` : `${ml}ml`, unit: 'ml', quantity: ml };
  }

  if (normalized.includes('arroz') || normalized.includes('pasta') || normalized.includes('quinoa')) {
    const cups = 0.5 * baseMultiplier;
    return { amount: `${cups.toFixed(1)} tazas`, unit: 'tazas', quantity: cups };
  }

  if (normalized.includes('tortilla')) {
    const pieces = 3 * baseMultiplier;
    return { amount: `${pieces} pzas`, unit: 'pzas', quantity: pieces };
  }

  if (normalized.includes('pan')) {
    const slices = 2 * baseMultiplier;
    return { amount: `${slices} rebanadas`, unit: 'pzas', quantity: slices };
  }

  if (normalized.includes('tomate') || normalized.includes('jitomate')) {
    const pieces = 2 * baseMultiplier;
    return { amount: `${pieces} pzas`, unit: 'pzas', quantity: pieces };
  }

  if (normalized.includes('cebolla')) {
    const pieces = 1 * baseMultiplier;
    return { amount: `${pieces} pzas`, unit: 'pzas', quantity: pieces };
  }

  if (normalized.includes('aguacate')) {
    const pieces = 0.5 * baseMultiplier;
    return { amount: `${pieces.toFixed(1)} pzas`, unit: 'pzas', quantity: pieces };
  }

  if (normalized.includes('espinaca') || normalized.includes('lechuga')) {
    const grams = 100 * baseMultiplier;
    return { amount: `${grams}g`, unit: 'g', quantity: grams };
  }

  if (normalized.includes('queso')) {
    const grams = 50 * baseMultiplier;
    return { amount: `${grams}g`, unit: 'g', quantity: grams };
  }

  if (normalized.includes('aceite')) {
    const tbs = 2 * baseMultiplier;
    return { amount: `${tbs} cucharadas`, unit: 'cdas', quantity: tbs };
  }

  // Default genérico
  return { amount: 'cantidad necesaria', unit: 'unidades', quantity: baseMultiplier };
}

/**
 * Verifica si un ingrediente es esencial
 */
function isEssential(ingredient: string): boolean {
  const normalized = normalizeIngredient(ingredient);
  return ESSENTIAL_INGREDIENTS.some(essential =>
    normalized.includes(essential) || essential.includes(normalized)
  );
}

/**
 * Sugiere alternativas para un ingrediente
 */
function suggestAlternatives(ingredient: string): string[] | undefined {
  const normalized = normalizeIngredient(ingredient);
  const alternatives: Record<string, string[]> = {
    'pollo': ['pavo', 'pescado blanco', 'tofu firme'],
    'res': ['pollo', 'pavo', 'soya texturizada'],
    'pescado': ['pollo', 'atún en lata', 'tofu'],
    'huevo': ['tofu (scrambled)', 'claras de huevo'],
    'leche': ['leche de almendra', 'leche de soya', 'yogurt'],
    'queso': ['tofu firme', 'levadura nutricional'],
    'pan': ['tortilla de maíz', 'tortilla integral', 'arroz'],
    'pasta': ['arroz', 'quinoa', 'fideos de arroz'],
    'arroz': ['quinoa', 'pasta integral', 'tortilla'],
    'aguacate': ['aceite de oliva', 'nueces', 'semillas'],
  };

  for (const [key, alts] of Object.entries(alternatives)) {
    if (normalized.includes(key)) {
      return alts;
    }
  }

  return undefined;
}

/**
 * Extrae ingredientes de un catálogo de comidas
 */
function extractIngredientsFromCatalog(
  meals: CatalogMealItem[],
  config: ShoppingListConfig
): Map<string, ShoppingItem> {
  const ingredients = new Map<string, ShoppingItem>();

  for (const meal of meals) {
    if (!meal.super || meal.super.length === 0) continue;

    for (const ingredient of meal.super) {
      const normalizedName = normalizeIngredient(ingredient);

      if (ingredients.has(normalizedName)) {
        // Agregar receta al existente
        const existing = ingredients.get(normalizedName)!;
        if (!existing.recipes.includes(meal.nombre)) {
          existing.recipes.push(meal.nombre);
        }
        // Actualizar cantidad
        const quantity = estimateQuantity(ingredient, existing.recipes.length, config.peopleCount);
        existing.totalAmount = quantity.amount;
        existing.estimatedQuantity = quantity.quantity;
      } else {
        // Crear nuevo item
        const quantity = estimateQuantity(ingredient, 1, config.peopleCount);
        const category = getCategory(ingredient);

        ingredients.set(normalizedName, {
          ingredient: ingredient, // Mantener nombre original para display
          totalAmount: quantity.amount,
          unit: quantity.unit,
          estimatedQuantity: quantity.quantity,
          recipes: [meal.nombre],
          category,
          isEssential: isEssential(ingredient),
          alternatives: config.includeAlternatives ? suggestAlternatives(ingredient) : undefined,
        });
      }
    }
  }

  return ingredients;
}

/**
 * Genera una lista de compras optimizada desde comidas del catálogo
 */
export function generateShoppingListFromCatalog(
  meals: CatalogMealItem[],
  config: Partial<ShoppingListConfig> = {}
): ShoppingItem[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const ingredients = extractIngredientsFromCatalog(meals, fullConfig);

  let items = Array.from(ingredients.values());

  // Ordenar por categoría si se solicita
  if (fullConfig.categorizeBySupermarket) {
    const categoryOrder: ShoppingCategory[] = [
      'frescos', 'carnes', 'lacteos', 'granos', 'conservas', 'congelados', 'especias'
    ];

    items.sort((a, b) => {
      const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return a.ingredient.localeCompare(b.ingredient);
    });
  }

  return items;
}

/**
 * Genera lista de compras desde comidas seleccionadas (con porciones)
 */
export function generateShoppingListFromSelections(
  selections: Array<{ meal: MealItem; catalogMeal?: CatalogMealItem }>,
  config: Partial<ShoppingListConfig> = {}
): ShoppingItem[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const ingredients = new Map<string, ShoppingItem>();

  for (const { meal, catalogMeal } of selections) {
    // Usar super del catálogo si está disponible, si no, inferir del nombre/detalle
    const ingredientsList = catalogMeal?.super ||
      meal.super ||
      (meal.detalle ? meal.detalle.split(',').map(s => s.trim()) : []);

    for (const ingredient of ingredientsList) {
      if (!ingredient) continue;

      const normalizedName = normalizeIngredient(ingredient);

      if (ingredients.has(normalizedName)) {
        const existing = ingredients.get(normalizedName)!;
        if (!existing.recipes.includes(meal.nombre)) {
          existing.recipes.push(meal.nombre);
        }
        const quantity = estimateQuantity(ingredient, existing.recipes.length, fullConfig.peopleCount);
        existing.totalAmount = quantity.amount;
        existing.estimatedQuantity = quantity.quantity;
      } else {
        const quantity = estimateQuantity(ingredient, 1, fullConfig.peopleCount);
        const category = getCategory(ingredient);

        ingredients.set(normalizedName, {
          ingredient,
          totalAmount: quantity.amount,
          unit: quantity.unit,
          estimatedQuantity: quantity.quantity,
          recipes: [meal.nombre],
          category,
          isEssential: isEssential(ingredient),
          alternatives: fullConfig.includeAlternatives ? suggestAlternatives(ingredient) : undefined,
        });
      }
    }
  }

  let items = Array.from(ingredients.values());

  if (fullConfig.categorizeBySupermarket) {
    const categoryOrder: ShoppingCategory[] = [
      'frescos', 'carnes', 'lacteos', 'granos', 'conservas', 'congelados', 'especias'
    ];

    items.sort((a, b) => {
      const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return a.ingredient.localeCompare(b.ingredient);
    });
  }

  return items;
}

/**
 * Agrupa items por categoría para display
 */
export function groupByCategory(items: ShoppingItem[]): Record<ShoppingCategory, ShoppingItem[]> {
  const grouped: Partial<Record<ShoppingCategory, ShoppingItem[]>> = {};

  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category]!.push(item);
  }

  return grouped as Record<ShoppingCategory, ShoppingItem[]>;
}

/**
 * Genera texto plano de la lista de compras para exportar/compartir
 */
export function formatShoppingListAsText(
  items: ShoppingItem[],
  includeRecipes: boolean = false
): string {
  const grouped = groupByCategory(items);
  const lines: string[] = ['🛒 LISTA DE COMPRAS', ''];

  const categoryEmojis: Record<ShoppingCategory, string> = {
    frescos: '🥬',
    carnes: '🥩',
    lacteos: '🥛',
    granos: '🌾',
    conservas: '🥫',
    congelados: '🧊',
    especias: '🌶️',
  };

  const categoryNames: Record<ShoppingCategory, string> = {
    frescos: 'FRUTAS Y VERDURAS',
    carnes: 'CARNES Y PROTEÍNAS',
    lacteos: 'LÁCTEOS',
    granos: 'GRANOS Y CARBOHIDRATOS',
    conservas: 'CONSERVAS Y DESPENSA',
    congelados: 'CONGELADOS',
    especias: 'ESPECIAS Y CONDIMENTOS',
  };

  for (const [category, categoryItems] of Object.entries(grouped)) {
    if (categoryItems.length === 0) continue;

    lines.push(`${categoryEmojis[category as ShoppingCategory]} ${categoryNames[category as ShoppingCategory]}`);
    lines.push('─'.repeat(30));

    for (const item of categoryItems) {
      const essential = item.isEssential ? '⭐' : '  ';
      lines.push(`${essential} ${item.ingredient}: ${item.totalAmount}`);

      if (includeRecipes && item.recipes.length > 0) {
        lines.push(`   (Para: ${item.recipes.join(', ')})`);
      }

      if (item.alternatives && item.alternatives.length > 0) {
        lines.push(`   Alternativas: ${item.alternatives.join(', ')}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Calcula estadísticas de la lista de compras
 */
export function getShoppingListStats(items: ShoppingItem[]): {
  totalItems: number;
  essentialItems: number;
  byCategory: Record<ShoppingCategory, number>;
  estimatedRecipes: number;
} {
  const byCategory: Record<ShoppingCategory, number> = {
    frescos: 0, carnes: 0, lacteos: 0, granos: 0,
    conservas: 0, congelados: 0, especias: 0,
  };

  const allRecipes = new Set<string>();

  for (const item of items) {
    byCategory[item.category]++;
    item.recipes.forEach(r => allRecipes.add(r));
  }

  return {
    totalItems: items.length,
    essentialItems: items.filter(i => i.isEssential).length,
    byCategory,
    estimatedRecipes: allRecipes.size,
  };
}

/**
 * Combina múltiples listas de compras (útil para planes de varias personas)
 */
export function mergeShoppingLists(lists: ShoppingItem[][]): ShoppingItem[] {
  const merged = new Map<string, ShoppingItem>();

  for (const list of lists) {
    for (const item of list) {
      const normalizedName = normalizeIngredient(item.ingredient);

      if (merged.has(normalizedName)) {
        const existing = merged.get(normalizedName)!;
        // Sumar cantidades si las unidades coinciden
        if (existing.unit === item.unit) {
          existing.estimatedQuantity += item.estimatedQuantity;
          existing.totalAmount = `${existing.estimatedQuantity}${existing.unit === 'g' ? 'g' : ' ' + existing.unit}`;
        }
        // Combinar recetas
        for (const recipe of item.recipes) {
          if (!existing.recipes.includes(recipe)) {
            existing.recipes.push(recipe);
          }
        }
      } else {
        merged.set(normalizedName, { ...item });
      }
    }
  }

  return Array.from(merged.values());
}
