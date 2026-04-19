import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pill } from 'lucide-react-native';

import Header from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useDiet } from '@/src/context/DietContext';
import { borderRadius, getShadows, getSurfacePalette, spacing, typography } from '@/src/utils/mobileTheme';

export default function SupplementsScreen() {
  const { activeBundles, isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <Screen title="Suplementos" subtitle="Recomendaciones opcionales heredadas del plan web.">
      <Header />
      {activeBundles.map(({ id, profile, supplements }) => (
        <View key={id} style={styles.section}>
          <View style={[styles.profileRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.profileIcon, { backgroundColor: palette.primarySoft }]}>
              <Pill size={18} color={palette.primary} />
            </View>
            <Text style={[styles.profile, { color: palette.text }]}>{profile.nombre}</Text>
          </View>

          {supplements.map((item) => (
            <View
              key={`${id}-${item.name}`}
              style={[styles.card, getShadows('small', isDarkMode), { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Text style={[styles.name, { color: palette.text }]}>{item.name}</Text>
              <Text style={[styles.support, { color: palette.primary }]}>{item.goalSupport}</Text>
              <Text style={[styles.text, { color: palette.textMuted }]}>Uso: {item.howToUse}</Text>
              <Text style={[styles.text, { color: palette.textMuted }]}>Momento: {item.timing}</Text>
              <Text style={[styles.text, { color: palette.textMuted }]}>Notas: {item.notes}</Text>
              {item.caution ? (
                <View style={[styles.warningPill, { backgroundColor: palette.warningSoft }] }>
                  <Text style={[styles.warning, { color: palette.warning }]}>Cuidado: {item.caution}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  profileRow: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  support: {
    fontWeight: '600',
    fontSize: typography.bodySmall.fontSize,
  },
  text: {
    lineHeight: 20,
    fontSize: typography.bodySmall.fontSize,
  },
  warningPill: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  warning: {
    lineHeight: 18,
    fontWeight: '600',
    fontSize: typography.caption.fontSize,
  },
});
