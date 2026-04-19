import {
  generateShoppingListFromSelections,
  groupByCategory,
  getShoppingListStats,
} from '../src/utils/shoppingList';

describe('shoppingList utils', () => {
  it('consolida ingredientes repetidos y mantiene categorias', () => {
    const items = generateShoppingListFromSelections([
      {
        meal: {
          nombre: 'Huevos con aguacate',
          porciones: '2 huevos + 1/2 aguacate',
          detalle: 'huevo, aguacate',
          tags: [],
          super: ['huevo', 'aguacate'],
          caloriasKcal: 300,
          proteinaG: 20,
          grasasG: 18,
        },
      },
      {
        meal: {
          nombre: 'Bowl de pollo',
          porciones: '150g pollo + arroz',
          detalle: 'pollo, arroz, aguacate',
          tags: [],
          super: ['pollo', 'arroz', 'aguacate'],
          caloriasKcal: 520,
          proteinaG: 35,
          grasasG: 16,
        },
      },
    ]);

    const grouped = groupByCategory(items);
    const stats = getShoppingListStats(items);
    const aguacate = items.find((entry) => entry.ingredient === 'aguacate');

    expect(aguacate).toBeDefined();
    expect(aguacate?.recipes).toHaveLength(2);
    expect(grouped.frescos.some((entry) => entry.ingredient === 'aguacate')).toBe(true);
    expect(grouped.carnes.some((entry) => entry.ingredient === 'pollo')).toBe(true);
    expect(stats.totalItems).toBe(items.length);
    expect(stats.estimatedRecipes).toBe(2);
  });
});
