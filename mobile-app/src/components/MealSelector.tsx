import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Circle, PencilLine, RefreshCw, RotateCcw } from 'lucide-react-native';

import { useDiet } from '../context/DietContext';
import type { MealItem } from '../types';
import { borderRadius, getShadows, getSurfacePalette, spacing, typography } from '../utils/mobileTheme';

interface MealSelectorProps {
  perfil: string;
  comidas: MealItem[];
  dia: string;
  momento: string;
  selecciones: Record<string, boolean>;
  onToggle: (perfil: string, dia: string, momento: string, nombre: string) => void;
  onEditMeal?: (meal: MealItem, occurrenceId: string) => void;
  onRestoreMeal?: (meal: MealItem, occurrenceId: string) => void;
  onReplaceMeal?: (meal: MealItem, occurrenceId: string) => void;
}

export default function MealSelector({
  perfil,
  comidas,
  dia,
  momento,
  selecciones,
  onToggle,
  onEditMeal,
  onRestoreMeal,
  onReplaceMeal,
}: MealSelectorProps) {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <View style={styles.list}>
      {comidas.map((comida, idx) => {
        const selected = Boolean(selecciones[`${perfil}-${dia}-${momento}-${comida.nombre}`]);
        const occurrenceId = `${dia}::${momento}::${idx}`;

        return (
          <Pressable
            key={`${comida.nombre}-${idx}`}
            onPress={() => onToggle(perfil, dia, momento, comida.nombre)}
            style={[
              styles.card,
              getShadows('small', isDarkMode),
              { backgroundColor: palette.card, borderColor: palette.border },
              selected && { borderColor: palette.primary, backgroundColor: palette.primaryMuted },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {selected ? (
                  <CheckCircle2 size={18} color={palette.success} />
                ) : (
                  <Circle size={18} color={palette.textMuted} />
                )}
                <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
                  {comida.nombre}
                </Text>
              </View>
              <View style={styles.actions}>
                {onRestoreMeal ? (
                  <Pressable
                    onPress={() => onRestoreMeal(comida, occurrenceId)}
                    style={[styles.iconButton, { backgroundColor: palette.cardMuted }]}
                  >
                    <RotateCcw size={14} color={palette.textMuted} />
                  </Pressable>
                ) : null}
                {onEditMeal ? (
                  <Pressable
                    onPress={() => onEditMeal(comida, occurrenceId)}
                    style={[styles.iconButton, { backgroundColor: palette.cardMuted }]}
                  >
                    <PencilLine size={14} color={palette.textMuted} />
                  </Pressable>
                ) : null}
                {onReplaceMeal ? (
                  <Pressable
                    onPress={() => onReplaceMeal(comida, occurrenceId)}
                    style={[styles.iconButton, { backgroundColor: palette.primarySoft }]}
                  >
                    <RefreshCw size={14} color={palette.primary} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Text style={[styles.detail, { color: palette.textMuted }]}>{comida.detalle}</Text>

            <View style={styles.footerRow}>
              <View style={[styles.portionPill, { backgroundColor: palette.primarySoft }]}>
                <Text style={[styles.portions, { color: palette.primary }]} numberOfLines={1}>
                  {comida.porciones}
                </Text>
              </View>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {comida.caloriasKcal || 0} kcal | P {comida.proteinaG || 0} g | G {comida.grasasG || 0} g
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: typography.body.fontSize,
    flex: 1,
  },
  detail: {
    lineHeight: 20,
    fontSize: typography.bodySmall.fontSize,
  },
  footerRow: {
    gap: spacing.xs,
  },
  portionPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    maxWidth: '100%',
  },
  portions: {
    fontWeight: '700',
    fontSize: typography.caption.fontSize,
  },
  meta: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
});
