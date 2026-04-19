import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Equivalencia } from '../types';
import { useDiet } from '../context/DietContext';
import { getSurfacePalette } from '../utils/mobileTheme';

export default function EquivalenciasCard({ equivalencia }: { equivalencia: Equivalencia }) {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <View style={[styles.card, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}>
      <Text style={[styles.title, { color: palette.text }]}>{equivalencia.titulo}</Text>
      <Text style={[styles.badge, { color: palette.primary }]}>{equivalencia.items.length} opciones</Text>
      <View style={styles.list}>
        {equivalencia.items.map((item, index) => (
          <View key={`${equivalencia.titulo}-${index}`} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: palette.primarySoft }]}>
              <Text style={[styles.dotText, { color: palette.primary }]}>{index + 1}</Text>
            </View>
            <Text style={[styles.item, { color: palette.textMuted }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    fontWeight: '700',
    fontSize: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontWeight: '800',
    fontSize: 12,
  },
  item: {
    flex: 1,
    lineHeight: 20,
  },
});
