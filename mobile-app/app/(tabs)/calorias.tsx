import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Beef, Droplet, Flame, Target, TrendingUp } from 'lucide-react-native';

import Header from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useDiet } from '@/src/context/DietContext';
import { borderRadius, getShadows, getSurfacePalette, spacing, typography } from '@/src/utils/mobileTheme';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

function calculateDayTotals(plan: Record<string, any>, day: string) {
  const dayPlan = plan[day] || {};
  const totals = { kcal: 0, protein: 0, fats: 0 };

  Object.values(dayPlan).forEach((meals) => {
    (meals as any[]).forEach((meal) => {
      totals.kcal += meal.caloriasKcal || 0;
      totals.protein += meal.proteinaG || 0;
      totals.fats += meal.grasasG || 0;
    });
  });

  return totals;
}

function MacroCard({ icon: Icon, value, label, color, bgColor, isDarkMode }: any) {
  const palette = getSurfacePalette(isDarkMode);
  const shadows = getShadows('small', isDarkMode);

  return (
    <View style={[styles.macroCard, shadows, { backgroundColor: bgColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.macroValue, { color: palette.text }]}>{Math.round(value)}</Text>
      <Text style={[styles.macroLabel, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ percent, isDarkMode }: { percent: number; isDarkMode: boolean }) {
  const palette = getSurfacePalette(isDarkMode);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <View style={styles.progressTitleRow}>
          <Target size={16} color={palette.primary} />
          <Text style={[styles.progressTitle, { color: palette.text }]}>Progreso hacia meta</Text>
        </View>
        <LinearGradient
          colors={[palette.primary, palette.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.percentBadge}
        >
          <Text style={styles.percentText}>{percent}%</Text>
        </LinearGradient>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: palette.cardMuted }]}>
        <LinearGradient
          colors={[palette.primary, palette.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${percent}%` }]}
        />
      </View>
    </View>
  );
}

function WeeklyChart({ weeklyTotals, diaActivo, maxWeeklyKcal, isDarkMode }: any) {
  const palette = getSurfacePalette(isDarkMode);

  return (
    <View style={[styles.chartCard, getShadows('small', isDarkMode), { backgroundColor: palette.card }]}>
      <View style={styles.chartHeader}>
        <TrendingUp size={18} color={palette.primary} />
        <Text style={[styles.chartTitle, { color: palette.text }]}>Consumo semanal</Text>
      </View>
      <View style={styles.weekChart}>
        {weeklyTotals.map((entry: any) => {
          const heightPercent = Math.max(15, Math.round((entry.kcal / maxWeeklyKcal) * 100));
          const isActive = entry.day === diaActivo;

          return (
            <View key={entry.day} style={styles.weekBarWrap}>
              <View style={[styles.weekTrack, { backgroundColor: palette.cardMuted }]}>
                {isActive ? (
                  <LinearGradient
                    colors={[palette.primary, palette.accent2]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.weekFill, { height: `${heightPercent}%` }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.weekFillInactive,
                      { height: `${heightPercent}%`, backgroundColor: palette.border },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.weekLabel, { color: isActive ? palette.primary : palette.textMuted }]}>
                {entry.day.slice(0, 2)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function CaloriasScreen() {
  const { activeBundles, diaActivo, isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <Screen title="Calorias" subtitle="Seguimiento de energia y macros por perfil">
      <Header />

      {activeBundles.map(({ id, profile }: { id: string; profile: any }) => {
        const totals = calculateDayTotals(profile.plan, diaActivo);
        const weeklyTotals = DAYS.map((day) => ({
          day,
          kcal: calculateDayTotals(profile.plan, day).kcal,
        }));
        const maxWeeklyKcal = Math.max(...weeklyTotals.map((entry) => entry.kcal), 1);
        const target = profile.metaCaloricaKcalDia ?? 0;
        const targetPercent = target > 0 ? Math.min(140, Math.round((totals.kcal / target) * 100)) : 0;

        return (
          <View key={id} style={styles.profileSection}>
            <View style={[styles.profileCard, getShadows('medium', isDarkMode), { backgroundColor: palette.card }]}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, { backgroundColor: id === 'el' ? '#3B82F6' : '#EC4899' }]}>
                  <Text style={styles.avatarText}>{id === 'el' ? 'EL' : 'ELLA'}</Text>
                </View>
                <View>
                  <Text style={[styles.profileName, { color: palette.text }]}>{profile.nombre}</Text>
                  <Text style={[styles.profileMeta, { color: palette.textMuted }]}>{diaActivo}</Text>
                </View>
              </View>
            </View>

            <View style={styles.macrosGrid}>
              <MacroCard
                icon={Flame}
                value={totals.kcal}
                label="Calorias"
                color="#F59E0B"
                bgColor={palette.card}
                isDarkMode={isDarkMode}
              />
              <MacroCard
                icon={Beef}
                value={totals.protein}
                label="Proteina"
                color="#10B981"
                bgColor={palette.card}
                isDarkMode={isDarkMode}
              />
              <MacroCard
                icon={Droplet}
                value={totals.fats}
                label="Grasas"
                color="#3B82F6"
                bgColor={palette.card}
                isDarkMode={isDarkMode}
              />
            </View>

            <ProgressBar percent={targetPercent} isDarkMode={isDarkMode} />

            <WeeklyChart
              weeklyTotals={weeklyTotals}
              diaActivo={diaActivo}
              maxWeeklyKcal={maxWeeklyKcal}
              isDarkMode={isDarkMode}
            />

            <View style={[styles.targetCard, { backgroundColor: palette.cardMuted }]}>
              <Target size={16} color={palette.textMuted} />
              <Text style={[styles.targetText, { color: palette.textMuted }]}>
                Meta diaria: <Text style={[styles.targetValue, { color: palette.primary }]}>{target} kcal</Text>
              </Text>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    gap: spacing.md,
  },
  profileCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  profileName: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  profileMeta: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: 2,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macroCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  macroValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.stat.fontWeight,
    letterSpacing: typography.stat.letterSpacing,
  },
  macroLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    textTransform: 'uppercase',
  },
  progressContainer: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  percentBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  chartCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chartTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 100,
  },
  weekBarWrap: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  weekTrack: {
    width: '100%',
    flex: 1,
    borderRadius: borderRadius.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekFill: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
  weekFillInactive: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
  weekLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  targetText: {
    fontSize: typography.bodySmall.fontSize,
  },
  targetValue: {
    fontWeight: '700',
  },
});
