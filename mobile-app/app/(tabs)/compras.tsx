import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, ChefHat, ShoppingBag } from 'lucide-react-native';

import Header from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useDiet } from '@/src/context/DietContext';
import { groupByCategory } from '@/src/utils/shoppingList';
import { borderRadius, getShadows, getSurfacePalette, spacing, typography } from '@/src/utils/mobileTheme';

const LABELS: Record<string, string> = {
  frescos: 'Frescos',
  carnes: 'Carnes',
  lacteos: 'Lacteos',
  granos: 'Granos',
  conservas: 'Conservas',
  congelados: 'Congelados',
  especias: 'Especias',
  frutas: 'Frutas',
  panaderia: 'Panaderia',
};

const CATEGORY_COLORS: Record<string, string> = {
  frescos: '#10B981',
  carnes: '#EF4444',
  lacteos: '#3B82F6',
  granos: '#F59E0B',
  conservas: '#8B5CF6',
  congelados: '#06B6D4',
  especias: '#84CC16',
  frutas: '#F97316',
  panaderia: '#D97706',
};

function ProgressCard({ completed, total, isDarkMode }: { completed: number; total: number; isDarkMode: boolean }) {
  const palette = getSurfacePalette(isDarkMode);
  const shadows = getShadows('medium', isDarkMode);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={[styles.progressCard, shadows, { backgroundColor: palette.card }]}>
      <View style={styles.progressInfo}>
        <View style={[styles.progressIcon, { backgroundColor: palette.primarySoft }]}>
          <ShoppingBag size={24} color={palette.primary} />
        </View>
        <View>
          <Text style={[styles.progressTitle, { color: palette.text }]}>Lista de compras</Text>
          <Text style={[styles.progressSubtitle, { color: palette.textMuted }]}>
            {completed} de {total} items
          </Text>
        </View>
      </View>
      <View style={styles.progressCircleContainer}>
        <View style={[styles.progressCircle, { borderColor: palette.primary }]}>
          <Text style={[styles.progressPercent, { color: palette.primary }]}>{percent}%</Text>
        </View>
      </View>
    </View>
  );
}

function CategorySection({ category, items, checks, onToggle, isDarkMode }: any) {
  const palette = getSurfacePalette(isDarkMode);
  const shadows = getShadows('small', isDarkMode);
  const color = CATEGORY_COLORS[category] || palette.primary;
  const completedInCategory = items.filter((item: any) => checks[`${item.category}:${item.ingredient}`]).length;
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

  const toggleExpanded = React.useCallback((rowKey: string) => {
    setExpandedRows((current) => ({
      ...current,
      [rowKey]: !current[rowKey],
    }));
  }, []);

  return (
    <View style={[styles.categoryCard, shadows, { backgroundColor: palette.card }]}>
      <View style={[styles.categoryHeader, { borderBottomColor: palette.border }]}>
        <View style={styles.categoryTitleRow}>
          <View style={[styles.categoryIndicator, { backgroundColor: `${color}30` }]} />
          <Text style={[styles.categoryName, { color: palette.text }]}>{LABELS[category] || category}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.categoryCount, { color }]}>
            {completedInCategory}/{items.length}
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {items.map((item: any, index: number) => {
          const rowKey = `${item.category}:${item.ingredient}`;
          const isChecked = Boolean(checks[rowKey]);
          const isExpanded = Boolean(expandedRows[rowKey]);

          return (
            <View
              key={`${category}-${item.ingredient}`}
              style={[
                styles.itemContainer,
                index < items.length - 1 && styles.itemRowBorder,
                index < items.length - 1 && { borderColor: palette.border },
              ]}
            >
              <View style={styles.itemRow}>
                <Pressable style={styles.itemMain} onPress={() => onToggle(rowKey)}>
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && { backgroundColor: color, borderColor: color },
                      !isChecked && { borderColor: palette.border, backgroundColor: 'transparent' },
                    ]}
                  >
                    {isChecked && <Check size={14} color="#FFFFFF" />}
                  </View>
                  <View style={styles.itemText}>
                    <Text
                      style={[
                        styles.itemName,
                        { color: isChecked ? palette.textMuted : palette.text },
                        isChecked && styles.itemNameChecked,
                      ]}
                    >
                      {item.ingredient}
                    </Text>
                    {!!item.recipes.length && (
                      <View style={styles.recipesRow}>
                        <ChefHat size={12} color={palette.textMuted} />
                        <Text style={[styles.recipesText, { color: palette.textMuted }]}>
                          {item.recipes.length} comidas usan este ingrediente
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                <View style={styles.itemRight}>
                  <View style={[styles.amountBadge, { backgroundColor: palette.cardMuted }]}>
                    <Text style={[styles.amountText, { color: palette.text }]}>{item.totalAmount}</Text>
                  </View>
                  {!!item.recipes.length && (
                    <Pressable
                      onPress={() => toggleExpanded(rowKey)}
                      style={[styles.expandButton, { backgroundColor: palette.cardMuted }]}
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} color={palette.textMuted} />
                      ) : (
                        <ChevronDown size={14} color={palette.textMuted} />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>

              {isExpanded && item.recipes.length > 0 ? (
                <View style={[styles.recipesExpanded, { backgroundColor: palette.cardMuted }]}>
                  <Text style={[styles.recipesExpandedTitle, { color: palette.text }]}>Comidas relacionadas</Text>
                  {item.recipes.map((recipeName: string) => (
                    <Text key={`${rowKey}:${recipeName}`} style={[styles.recipeBullet, { color: palette.textMuted }]}>
                      - {recipeName}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ComprasScreen() {
  const { shoppingItems, shoppingChecks, toggleShoppingCheck, isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);
  const grouped = groupByCategory(shoppingItems);
  const completedCount = shoppingItems.filter(
    (item) => shoppingChecks[`${item.category}:${item.ingredient}`]
  ).length;

  return (
    <Screen title="Compras" subtitle="Organiza tu lista y revisa en que comidas se usa cada ingrediente">
      <Header />

      <ProgressCard completed={completedCount} total={shoppingItems.length} isDarkMode={isDarkMode} />

      {Object.entries(grouped).map(([category, items]) => (
        <CategorySection
          key={category}
          category={category}
          items={items}
          checks={shoppingChecks}
          onToggle={toggleShoppingCheck}
          isDarkMode={isDarkMode}
        />
      ))}

      {shoppingItems.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: palette.cardMuted }]}>
          <ShoppingBag size={48} color={palette.textMuted} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Lista vacia</Text>
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            Genera un plan para ver tu lista de compras aqui
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  progressSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: 2,
  },
  progressCircleContainer: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '800',
  },
  categoryCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIndicator: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  categoryName: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryCount: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  itemsList: {
    padding: spacing.xs,
  },
  itemContainer: {
    paddingVertical: spacing.xs,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
  },
  recipesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recipesText: {
    fontSize: typography.caption.fontSize,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  amountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  amountText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipesExpanded: {
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  recipesExpandedTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  recipeBullet: {
    fontSize: typography.bodySmall.fontSize,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
});
