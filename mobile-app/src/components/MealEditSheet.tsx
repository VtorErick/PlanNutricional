import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { PencilLine } from 'lucide-react-native';

import type { MealItem } from '../types';
import { useDiet } from '../context/DietContext';
import { borderRadius, getSurfacePalette, spacing, typography } from '../utils/mobileTheme';

interface Props {
  visible: boolean;
  meal: MealItem | null;
  onClose: () => void;
  onSave: (draft: MealItem) => void;
}

export default function MealEditSheet({ visible, meal, onClose, onSave }: Props) {
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['72%'], []);
  const [draft, setDraft] = useState<MealItem | null>(meal);
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  useEffect(() => {
    setDraft(meal);
  }, [meal]);

  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal ref={modalRef} snapPoints={snapPoints} onDismiss={onClose}>
      <BottomSheetView style={[styles.content, { backgroundColor: palette.card }]}> 
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: palette.primarySoft }]}> 
            <PencilLine size={14} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Editar comida</Text>
        </View>

        <Text style={[styles.label, { color: palette.textMuted }]}>Nombre</Text>
        <TextInput
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.cardMuted, color: palette.text }]}
          value={draft?.nombre || ''}
          placeholder="Nombre"
          placeholderTextColor={palette.textMuted}
          onChangeText={(text) => setDraft((current) => (current ? { ...current, nombre: text } : current))}
        />

        <Text style={[styles.label, { color: palette.textMuted }]}>Porciones</Text>
        <TextInput
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.cardMuted, color: palette.text }]}
          value={draft?.porciones || ''}
          placeholder="Porciones"
          placeholderTextColor={palette.textMuted}
          onChangeText={(text) => setDraft((current) => (current ? { ...current, porciones: text } : current))}
        />

        <Text style={[styles.label, { color: palette.textMuted }]}>Detalle</Text>
        <TextInput
          style={[styles.input, styles.multiline, { borderColor: palette.border, backgroundColor: palette.cardMuted, color: palette.text }]}
          multiline
          value={draft?.detalle || ''}
          placeholder="Detalle"
          placeholderTextColor={palette.textMuted}
          onChangeText={(text) => setDraft((current) => (current ? { ...current, detalle: text } : current))}
        />

        <View style={styles.footer}>
          <Pressable style={[styles.secondaryButton, { borderColor: palette.border }]} onPress={onClose}>
            <Text style={[styles.secondaryButtonText, { color: palette.textMuted }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: palette.primary }]}
            onPress={() => {
              if (draft) onSave(draft);
              onClose();
            }}
          >
            <Text style={styles.primaryButtonText}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.h4.fontSize,
    fontWeight: '800',
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
