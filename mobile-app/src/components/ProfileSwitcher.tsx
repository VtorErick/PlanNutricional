import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, UserRound, Users } from 'lucide-react-native';

import { type PerfilActivo } from '../context/DietContext';
import { useDiet } from '../context/DietContext';
import { getShadows, getSurfacePalette, typography, spacing, borderRadius } from '../utils/mobileTheme';

const OPTIONS: { key: PerfilActivo; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'el', label: 'El', icon: UserRound },
  { key: 'ella', label: 'Ella', icon: User },
  { key: 'ambos', label: 'Ambos', icon: Users },
];

export function ProfileSwitcher({
  value,
  onChange,
}: {
  value: PerfilActivo;
  onChange: (perfil: PerfilActivo) => void;
}) {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <View style={[styles.container, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}> 
      {OPTIONS.map((option) => {
        const active = option.key === value;
        const Icon = option.icon;

        return (
          <Pressable key={option.key} onPress={() => onChange(option.key)} style={styles.buttonContainer}>
            {active ? (
              <LinearGradient
                colors={[palette.primary, palette.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonActive, getShadows('small', isDarkMode)]}
              >
                <Icon size={15} color={palette.textInverse} />
                <Text style={[styles.textActive, { color: palette.textInverse }]}>{option.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.button}>
                <Icon size={15} color={palette.textMuted} />
                <Text style={[styles.text, { color: palette.textMuted }]}>{option.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  text: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  textActive: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
  },
});
