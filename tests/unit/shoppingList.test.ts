import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateShoppingListFromCatalog,
  generateShoppingListFromSelections,
  groupByCategory,
  formatShoppingListAsText,
  getShoppingListStats,
  mergeShoppingLists,
  type ShoppingItem,
} from '../../src/utils/shoppingList';
import type { CatalogMealItem } from '../../src/data/mealsDB';
import type { MealItem } from '../../src/types';

// Datos de prueba
const testCatalogMeals: CatalogMealItem[] = [
  {
    id: 'des_01',
    momentos: ['desayuno'],
    nombre: 'Huevos a la mexicana',
    tags: ['mexicano', 'proteina'],
    super: ['huevo', 'jitomate', 'cebolla', 'aguacate'],
    cuisineStyles: ['Mexicana'],
    prepTimeMinutes: 15,
    difficulty: 'facil',
    macroEstimate: { calories: 320, protein: 18, carbs: 12, fat: 20 },
  },
  {
    id: 'com_01',
    momentos: ['comida'],
    nombre: 'Pollo con arroz',
    tags: ['proteina', 'casero'],
    super: ['pollo', 'arroz', 'cebolla', 'ajo'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 35,
    difficulty: 'media',
    macroEstimate: { calories: 450, protein: 35, carbs: 55, fat: 8 },
  },
  {
    id: 'cen_01',
    momentos: ['cena'],
    nombre: 'Ensalada verde',
    tags: ['ligero', 'vegetariano'],
    super: ['lechuga', 'tomate', 'pepino', 'queso feta'],
    cuisineStyles: ['Mediterránea', 'Vegetariana'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 180, protein: 8, carbs: 10, fat: 12 },
  },
];

test('generateShoppingListFromCatalog genera lista básica', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals, { peopleCount: 1 });

  assert.ok(list.length > 0, 'Debe generar items');

  const pollo = list.find(i => i.ingredient.toLowerCase().includes('pollo'));
  assert.ok(pollo, 'Debe incluir pollo');
  assert.ok(pollo!.category === 'carnes', 'Pollo debe estar en categoría carnes');
  assert.ok(pollo!.isEssential, 'Pollo debe ser esencial');
});

test('generateShoppingListFromCatalog agrupa ingredientes duplicados', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals);

  // Cebolla aparece en 2 comidas
  const cebollas = list.filter(i => i.ingredient.toLowerCase().includes('cebolla'));
  assert.strictEqual(cebollas.length, 1, 'Debe consolidar cebolla en un solo item');

  const cebolla = cebollas[0];
  assert.strictEqual(cebolla.recipes.length, 2, 'Debe referenciar ambas recetas');
  assert.ok(cebolla.recipes.includes('Huevos a la mexicana'));
  assert.ok(cebolla.recipes.includes('Pollo con arroz'));
});

test('generateShoppingListFromCatalog organiza por categorías', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals, { categorizeBySupermarket: true });

  // Verificar orden: frescos primero, luego carnes, etc.
  const categories = list.map(i => i.category);

  // Los primeros items deben ser frescos (frutas/verduras)
  assert.ok(
    categories.slice(0, 5).every(c => c === 'frescos' || c === 'carnes'),
    'Categorías frescos/carnes deben ir primero'
  );
});

test('generateShoppingListFromCatalog calcula cantidades según personas', () => {
  const list1 = generateShoppingListFromCatalog(testCatalogMeals.slice(0, 1), { peopleCount: 1 });
  const list2 = generateShoppingListFromCatalog(testCatalogMeals.slice(0, 1), { peopleCount: 2 });

  const huevos1 = list1.find(i => i.ingredient.toLowerCase().includes('huevo'));
  const huevos2 = list2.find(i => i.ingredient.toLowerCase().includes('huevo'));

  assert.ok(huevos1 && huevos2, 'Debe encontrar huevos en ambas listas');
  assert.ok(
    huevos2!.estimatedQuantity > huevos1!.estimatedQuantity,
    'Cantidad debe aumentar con más personas'
  );
});

test('generateShoppingListFromCatalog sugiere alternativas', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals, { includeAlternatives: true });

  const pollo = list.find(i => i.ingredient.toLowerCase().includes('pollo'));
  assert.ok(pollo, 'Debe encontrar pollo');
  assert.ok(pollo!.alternatives && pollo!.alternatives.length > 0, 'Debe sugerir alternativas para pollo');
});

test('generateShoppingListFromSelections funciona con selecciones', () => {
  const selections = [
    {
      meal: { nombre: 'Huevos', super: ['huevo', 'pan'], porciones: '', detalle: '', caloriasKcal: 200, proteinaG: 12, grasasG: 10, tags: [] } as MealItem,
      catalogMeal: testCatalogMeals[0],
    },
  ];

  const list = generateShoppingListFromSelections(selections);

  assert.ok(list.length > 0, 'Debe generar items desde selecciones');
});

test('groupByCategory agrupa correctamente', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals);
  const grouped = groupByCategory(list);

  assert.ok(grouped.frescos && grouped.frescos.length > 0, 'Debe tener categoría frescos');
  assert.ok(grouped.carnes && grouped.carnes.length > 0, 'Debe tener categoría carnes');
});

test('formatShoppingListAsText genera texto legible', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals);
  const text = formatShoppingListAsText(list);

  assert.ok(text.includes('🛒'), 'Debe incluir emoji de carrito');
  assert.ok(text.includes('LISTA DE COMPRAS'), 'Debe incluir título');
  assert.ok(text.includes('FRUTAS Y VERDURAS') || text.includes('CARNES'), 'Debe incluir categorías');
});

test('getShoppingListStats calcula estadísticas', () => {
  const list = generateShoppingListFromCatalog(testCatalogMeals);
  const stats = getShoppingListStats(list);

  assert.ok(stats.totalItems > 0, 'Debe tener items totales');
  assert.ok(stats.essentialItems >= 0, 'Debe tener items esenciales');
  assert.ok(stats.estimatedRecipes >= 0, 'Debe tener recetas estimadas');
  assert.ok(stats.byCategory.frescos >= 0, 'Debe tener conteo de frescos');
});

test('mergeShoppingLists combina múltiples listas', () => {
  const list1: ShoppingItem[] = [
    { ingredient: 'Pollo', totalAmount: '300g', unit: 'g', estimatedQuantity: 300, recipes: ['Comida 1'], category: 'carnes', isEssential: true },
    { ingredient: 'Arroz', totalAmount: '1 taza', unit: 'tazas', estimatedQuantity: 1, recipes: ['Comida 1'], category: 'granos', isEssential: true },
  ];

  const list2: ShoppingItem[] = [
    { ingredient: 'Pollo', totalAmount: '300g', unit: 'g', estimatedQuantity: 300, recipes: ['Comida 2'], category: 'carnes', isEssential: true },
    { ingredient: 'Lechuga', totalAmount: '200g', unit: 'g', estimatedQuantity: 200, recipes: ['Comida 2'], category: 'frescos', isEssential: false },
  ];

  const merged = mergeShoppingLists([list1, list2]);

  const pollo = merged.find(i => i.ingredient === 'Pollo');
  assert.ok(pollo, 'Debe tener pollo');
  assert.strictEqual(pollo!.estimatedQuantity, 600, 'Debe sumar cantidades de pollo');
  assert.strictEqual(pollo!.recipes.length, 2, 'Debe tener ambas recetas');

  assert.strictEqual(merged.length, 3, 'Debe tener 3 items únicos');
});

test('generateShoppingListFromCatalog maneja lista vacía', () => {
  const list = generateShoppingListFromCatalog([]);
  assert.strictEqual(list.length, 0, 'Debe retornar lista vacía');
});

test('Cantidades se calculan correctamente para diferentes tipos de ingredientes', () => {
  const meal: CatalogMealItem = {
    id: 'test',
    momentos: ['desayuno'],
    nombre: 'Desayuno mixto',
    tags: ['test'],
    super: ['huevo', 'leche', 'pan', 'aguacate'],
    cuisineStyles: ['Casera'],
    prepTimeMinutes: 10,
    difficulty: 'facil',
    macroEstimate: { calories: 400, protein: 20, carbs: 35, fat: 20 },
  };

  const list = generateShoppingListFromCatalog([meal], { peopleCount: 1 });

  const huevo = list.find(i => i.ingredient.toLowerCase().includes('huevo'));
  const leche = list.find(i => i.ingredient.toLowerCase().includes('leche'));
  const pan = list.find(i => i.ingredient.toLowerCase().includes('pan'));

  assert.ok(huevo?.unit === 'pzas', 'Huevo debe estar en piezas');
  assert.ok(leche?.unit === 'ml' || leche?.unit === 'L', 'Leche debe estar en volumen');
  assert.ok(pan?.unit === 'pzas' || pan?.unit === 'rebanadas', 'Pan debe estar en piezas');
});
