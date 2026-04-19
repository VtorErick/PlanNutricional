import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';

import type { MealItem } from '../types';

export function MealCard({
  meal,
  completed,
  onToggle,
}: {
  meal: MealItem;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={[styles.card, completed && styles.cardDone]}>
      <View style={styles.header}>
        <Text style={styles.title}>{meal.nombre}</Text>
        {completed ? <CheckCircle2 color="#16a34a" size={20} /> : <Circle color="#64748b" size={20} />}
      </View>
      <Text style={styles.portions}>{meal.porciones}</Text>
      <Text style={styles.detail}>{meal.detalle}</Text>
      {meal.super?.length ? (
        <Text style={styles.extra}>Extras: {meal.super.join(', ')}</Text>
      ) : null}
      {meal.caloriasKcal ? (
        <Text style={styles.macros}>
          {meal.caloriasKcal} kcal · P {meal.proteinaG ?? 0} g · G {meal.grasasG ?? 0} g
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardDone: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  portions: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  detail: {
    color: '#475569',
    lineHeight: 20,
  },
  extra: {
    color: '#334155',
    fontSize: 13,
  },
  macros: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
});
