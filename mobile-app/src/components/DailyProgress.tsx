import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarCheck2, Target } from 'lucide-react-native';

import { useDiet } from '../context/DietContext';
import { borderRadius, getShadows, getSurfacePalette, spacing, typography } from '../utils/mobileTheme';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function DailyProgress() {
  const { diaActivo, setDiaActivo, activeBundles, completedMeals, isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  const progress = useMemo(() => {
    const total = activeBundles.reduce(
      (acc, bundle) =>
        acc +
        Object.values(bundle.profile.plan[diaActivo] || {}).reduce(
          (dayAcc, meals) => dayAcc + (Array.isArray(meals) ? meals.length : 0),
          0
        ),
      0
    );

    const done = Object.entries(completedMeals).filter(([key, value]) => value && key.includes(`:${diaActivo}:`)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [activeBundles, completedMeals, diaActivo]);

  return (
    <View style={[styles.card, getShadows('small', isDarkMode), { backgroundColor: palette.card, borderColor: palette.border }]}> 
      <View style={styles.titleRow}>
        <View style={[styles.titleIcon, { backgroundColor: palette.primarySoft }]}> 
          <CalendarCheck2 size={16} color={palette.primary} />
        </View>
        <Text style={[styles.title, { color: palette.text }]}>Progreso del dia</Text>
        <View style={[styles.statPill, { backgroundColor: palette.cardMuted }]}> 
          <Target size={12} color={palette.primary} />
          <Text style={[styles.statPillText, { color: palette.primary }]}>{progress.percent}%</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {DAYS.map((day) => {
          const active = day === diaActivo;
          return (
            <Pressable
              key={day}
              onPress={() => setDiaActivo(day)}
              style={[
                styles.day,
                { backgroundColor: palette.cardMuted, borderColor: palette.border },
                active && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
              ]}
            >
              <Text style={[styles.dayText, { color: active ? palette.primary : palette.textMuted }]}>{day.slice(0, 3)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.barTrack, { backgroundColor: palette.cardMuted }]}> 
        <LinearGradient
          colors={[palette.primary, palette.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${progress.percent}%` }]}
        />
      </View>
      <Text style={[styles.caption, { color: palette.textMuted }]}>
        {progress.done}/{progress.total} comidas completadas
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    flex: 1,
  },
  statPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statPillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  days: {
    gap: 8,
  },
  day: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  dayText: {
    fontWeight: '700',
  },
  barTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  caption: {
    fontWeight: '600',
    fontSize: typography.bodySmall.fontSize,
  },
});
