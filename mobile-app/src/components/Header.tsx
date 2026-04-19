import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FileText, Moon, Settings, Sparkles, Sun } from 'lucide-react-native';

import { ProfileSwitcher } from './ProfileSwitcher';
import { useDiet } from '../context/DietContext';
import { getSurfacePalette, getShadows, typography, spacing, borderRadius } from '../utils/mobileTheme';

export default function Header() {
  const { perfilActivo, setPerfilActivo, activeBundles, exportProfilePdf, isDarkMode, setIsDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);
  const shadows = getShadows('medium', isDarkMode);

  const subtitle = (() => {
    if (perfilActivo === 'ambos') return 'Coordinacion semanal de ambos perfiles';
    const current = activeBundles.find((bundle) => bundle.id === perfilActivo);
    return current?.profile?.meta || 'Seguimiento diario de nutricion';
  })();

  return (
    <View style={[styles.container, shadows, { backgroundColor: palette.card, borderColor: palette.border }]}> 
      <View style={styles.topRow}>
        <View style={styles.logoSection}>
          <View style={[styles.logoIcon, { backgroundColor: palette.primarySoft }]}>
            <Sparkles size={16} color={palette.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: palette.text, ...typography.h4 }]}>Plan Nutricional</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: palette.cardMuted }]}
            onPress={() => setIsDarkMode((current) => !current)}
          >
            {isDarkMode ? <Sun size={18} color={palette.warning} /> : <Moon size={18} color={palette.primary} />}
          </Pressable>
          <Pressable
            style={[styles.iconButton, { backgroundColor: palette.cardMuted }]}
            onPress={() => {
              const first = activeBundles[0]?.id;
              if (first) {
                void exportProfilePdf(first);
              }
            }}
          >
            <FileText size={18} color={palette.success} />
          </Pressable>
          <Pressable style={[styles.iconButton, { backgroundColor: palette.primary }]} onPress={() => router.push('/admin')}>
            <Settings size={18} color={palette.textInverse} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />
      <ProfileSwitcher value={perfilActivo} onChange={setPerfilActivo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  titleBlock: {
    flex: 1,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
