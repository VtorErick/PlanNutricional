import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Target, Clock, ChevronRight } from 'lucide-react-native';

import DailyProgress from '@/src/components/DailyProgress';
import Header from '@/src/components/Header';
import MealEditSheet from '@/src/components/MealEditSheet';
import MealReplaceSheet from '@/src/components/MealReplaceSheet';
import MealSelector from '@/src/components/MealSelector';
import PlanAiRefreshSheet from '@/src/components/PlanAiRefreshSheet';
import { Screen } from '@/src/components/Screen';
import { getMealCompletionKey, useDiet } from '@/src/context/DietContext';
import type { MealItem } from '@/src/types';
import { getSurfacePalette, getShadows, typography, spacing, borderRadius } from '@/src/utils/mobileTheme';

function ProfileCard({ id, profile }: { id: 'el' | 'ella'; profile: any }) {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);
  const shadows = getShadows('small', isDarkMode);

  return (
    <View style={[styles.profileCard, shadows, { backgroundColor: palette.card, borderColor: palette.border }]}> 
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: palette.primarySoft }]}>
            <Text style={[styles.avatarText, { color: palette.primary }]}>{id === 'el' ? 'EL' : 'ELLA'}</Text>
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={[styles.profileName, { color: palette.text }]} numberOfLines={1}>{profile.nombre}</Text>
            <Text style={[styles.profileMeta, { color: palette.textMuted }]} numberOfLines={1}>{profile.meta}</Text>
          </View>
        </View>
        <View style={[styles.calorieBadge, { backgroundColor: palette.primarySoft }]}> 
          <Target size={12} color={palette.primary} />
          <Text style={[styles.calorieText, { color: palette.primary }]}>{profile.metaCaloricaKcalDia ?? 0} kcal</Text>
        </View>
      </View>
    </View>
  );
}

function MomentSection({
  moment,
  meals,
  profileId,
  diaActivo,
  completedMeals,
  onToggle,
  onEditMeal,
  onRestoreMeal,
  onReplaceMeal,
}: any) {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <View style={[styles.momentCard, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}> 
      <View style={styles.momentHeader}>
        <View style={styles.momentTitleRow}>
          <View style={[styles.momentIcon, { backgroundColor: palette.primarySoft }]}> 
            <Clock size={14} color={palette.primary} />
          </View>
          <Text style={[styles.momentLabel, { color: palette.text }]}>{moment.label}</Text>
        </View>
        <Text style={[styles.momentTime, { color: palette.textMuted }]}>{moment.hora}</Text>
      </View>

      <MealSelector
        perfil={profileId}
        dia={diaActivo}
        momento={moment.key}
        comidas={meals}
        selecciones={Object.fromEntries(
          meals.map((meal: MealItem) => [
            `${profileId}-${diaActivo}-${moment.key}-${meal.nombre}`,
            Boolean(completedMeals[getMealCompletionKey(profileId, diaActivo, moment.key, meal)]),
          ])
        )}
        onToggle={onToggle}
        onEditMeal={onEditMeal}
        onRestoreMeal={onRestoreMeal}
        onReplaceMeal={onReplaceMeal}
      />
    </View>
  );
}

export default function PlanScreen() {
  const {
    diaActivo,
    activeBundles,
    completedMeals,
    toggleMealComplete,
    updateMeal,
    restoreMeal,
    replaceMealWithCatalog,
    planRevisionLoading,
    planRevisionError,
    revisePlanWithAi,
    isDarkMode,
    perfilActivo,
  } = useDiet();
  const palette = getSurfacePalette(isDarkMode);
  const shadows = getShadows('medium', isDarkMode);

  const [editing, setEditing] = React.useState<{
    profileId: 'el' | 'ella';
    day: string;
    moment: string;
    index: number;
    meal: MealItem;
  } | null>(null);
  const [refreshVisible, setRefreshVisible] = React.useState(false);
  const [replacing, setReplacing] = React.useState<{
    profileId: 'el' | 'ella';
    day: string;
    moment: string;
    index: number;
    meal: MealItem;
  } | null>(null);

  return (
    <Screen title="Mi plan" subtitle="Rutina diaria, progreso y ajustes inteligentes">
      <Header />
      <DailyProgress />

      {activeBundles.map(({ id, profile }: { id: 'el' | 'ella'; profile: any }) => (
        <View key={id} style={styles.section}>
          <ProfileCard id={id} profile={profile} />

          {profile.momentos.map((moment: any) => {
            const meals = profile.plan[diaActivo]?.[moment.key] || [];
            return (
              <MomentSection
                key={moment.key}
                moment={moment}
                meals={meals}
                profileId={id}
                diaActivo={diaActivo}
                completedMeals={completedMeals}
                onToggle={(perfil: string, dia: string, momento: string, nombre: string) => {
                  const meal = meals.find((entry: MealItem) => entry.nombre === nombre);
                  if (!meal) return;
                  toggleMealComplete(getMealCompletionKey(perfil as 'el' | 'ella', dia, momento, meal));
                }}
                onEditMeal={(meal: MealItem, occurrenceId: string) => {
                  const [, , indexRaw] = occurrenceId.split('::');
                  setEditing({
                    profileId: id,
                    day: diaActivo,
                    moment: moment.key,
                    index: Number(indexRaw),
                    meal,
                  });
                }}
                onRestoreMeal={(_: MealItem, occurrenceId: string) => {
                  const [, , indexRaw] = occurrenceId.split('::');
                  restoreMeal(id, diaActivo, moment.key, Number(indexRaw));
                }}
                onReplaceMeal={(meal: MealItem, occurrenceId: string) => {
                  const [, , indexRaw] = occurrenceId.split('::');
                  setReplacing({
                    profileId: id,
                    day: diaActivo,
                    moment: moment.key,
                    index: Number(indexRaw),
                    meal,
                  });
                }}
              />
            );
          })}
        </View>
      ))}

      <Pressable onPress={() => setRefreshVisible(true)}>
        <LinearGradient
          colors={[palette.primary, palette.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.aiButton, shadows]}
        >
          <Sparkles size={20} color="#FFFFFF" />
          <Text style={styles.aiButtonText}>Solicitar ajuste con IA</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      {!!planRevisionError && (
        <View style={[styles.errorCard, { backgroundColor: palette.dangerSoft }]}> 
          <Text style={[styles.errorText, { color: palette.danger }]}>{planRevisionError}</Text>
        </View>
      )}

      <MealEditSheet
        visible={Boolean(editing)}
        meal={editing?.meal || null}
        onClose={() => setEditing(null)}
        onSave={(draft) => {
          if (!editing) return;
          updateMeal(editing.profileId, editing.day, editing.moment, editing.index, draft);
        }}
      />

      <PlanAiRefreshSheet
        visible={refreshVisible}
        loading={planRevisionLoading}
        onClose={() => setRefreshVisible(false)}
        onSubmit={({ instruction, requestMode }) => revisePlanWithAi(instruction, requestMode)}
      />

      <MealReplaceSheet
        visible={Boolean(replacing)}
        moment={replacing?.moment || ''}
        currentMeal={replacing?.meal || null}
        allowCompanionSync={perfilActivo === 'ambos'}
        onClose={() => setReplacing(null)}
        onSelect={(catalogMealId, syncCompanion) => {
          if (!replacing) return;
          replaceMealWithCatalog(
            replacing.profileId,
            replacing.day,
            replacing.moment,
            replacing.index,
            catalogMealId,
            { syncCompanion }
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  profileCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  profileTextBlock: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  profileMeta: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: 2,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  calorieText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  momentCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  momentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  momentIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  momentTime: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  errorCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    textAlign: 'center',
  },
});
