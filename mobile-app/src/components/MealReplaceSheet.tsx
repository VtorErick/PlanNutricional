import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Clock3, Search, Sparkles, Users, UtensilsCrossed } from 'lucide-react-native';

import { mealsDatabase } from '../data/mealsDB';
import type { MealItem } from '../types';
import { useDiet } from '../context/DietContext';
import { borderRadius, getSurfacePalette, spacing, typography } from '../utils/mobileTheme';

interface MealReplaceSheetProps {
  visible: boolean;
  moment: string;
  currentMeal: MealItem | null;
  allowCompanionSync: boolean;
  onClose: () => void;
  onSelect: (catalogMealId: string, syncCompanion: boolean) => void;
}

function formatPrepMinutes(value: number | undefined) {
  if (!value || value <= 0) return '15-25 min';
  if (value < 15) return '<15 min';
  return `${value} min`;
}

export default function MealReplaceSheet({
  visible,
  moment,
  currentMeal,
  allowCompanionSync,
  onClose,
  onSelect,
}: MealReplaceSheetProps) {
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [query, setQuery] = useState('');
  const [syncCompanion, setSyncCompanion] = useState(allowCompanionSync);
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  useEffect(() => {
    setSyncCompanion(allowCompanionSync);
  }, [allowCompanionSync]);

  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible]);

  const options = useMemo(() => {
    const normalizedQuery = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    return mealsDatabase
      .filter((entry) => entry.momentos.includes(moment))
      .filter((entry) => {
        if (!normalizedQuery) return true;
        const haystack = [entry.nombre, ...(entry.tags || []), ...(entry.super || [])]
          .join(' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const prepA = a.prepTimeMinutes || 99;
        const prepB = b.prepTimeMinutes || 99;
        if (prepA !== prepB) return prepA - prepB;
        return a.nombre.localeCompare(b.nombre, 'es');
      })
      .slice(0, 60);
  }, [moment, query]);

  return (
    <BottomSheetModal ref={modalRef} snapPoints={snapPoints} onDismiss={onClose}>
      <BottomSheetView style={[styles.content, { backgroundColor: palette.card }]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: palette.primarySoft }]}>
            <UtensilsCrossed size={16} color={palette.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: palette.text }]}>Cambiar comida</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={2}>
              {currentMeal?.nombre || 'Selecciona una opcion del catalogo'}
            </Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}>
          <Search size={16} color={palette.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre, ingrediente o estilo"
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.text }]}
          />
        </View>

        {allowCompanionSync ? (
          <View style={[styles.syncRow, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}>
            <View style={styles.syncLabelWrap}>
              <Users size={16} color={palette.primary} />
              <Text style={[styles.syncTitle, { color: palette.text }]}>Aplicar tambien al otro perfil</Text>
            </View>
            <Switch
              value={syncCompanion}
              onValueChange={setSyncCompanion}
              trackColor={{ false: palette.border, true: palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {options.map((entry) => (
            <Pressable
              key={entry.id}
              style={[styles.optionCard, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}
              onPress={() => {
                onSelect(entry.id, syncCompanion);
                onClose();
              }}
            >
              <View style={styles.optionTop}>
                <Text style={[styles.optionTitle, { color: palette.text }]}>{entry.nombre}</Text>
                <View style={[styles.kcalBadge, { backgroundColor: palette.primarySoft }]}>
                  <Sparkles size={12} color={palette.primary} />
                  <Text style={[styles.kcalBadgeText, { color: palette.primary }]}>
                    {entry.macroEstimate?.calories || 0} kcal
                  </Text>
                </View>
              </View>

              <View style={styles.optionMeta}>
                <View style={[styles.metaPill, { backgroundColor: palette.card }]}>
                  <Clock3 size={12} color={palette.textMuted} />
                  <Text style={[styles.metaText, { color: palette.textMuted }]}>
                    {formatPrepMinutes(entry.prepTimeMinutes)}
                  </Text>
                </View>
                {(entry.tags || []).slice(0, 3).map((tag) => (
                  <View key={`${entry.id}-${tag}`} style={[styles.metaPill, { backgroundColor: palette.card }]}>
                    <Text style={[styles.metaText, { color: palette.textMuted }]}>{tag}</Text>
                  </View>
                ))}
              </View>

              {!!entry.super?.length && (
                <Text style={[styles.ingredients, { color: palette.textMuted }]} numberOfLines={2}>
                  {entry.super.slice(0, 6).join(', ')}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.h4.fontSize,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    paddingVertical: 0,
  },
  syncRow: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  syncLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  syncTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  optionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    flex: 1,
  },
  kcalBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kcalBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  optionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  ingredients: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: 18,
  },
});
