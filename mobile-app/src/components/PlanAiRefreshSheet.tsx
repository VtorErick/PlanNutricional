import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Sparkles } from 'lucide-react-native';
import type { PlanRevisionMode } from '../services/aiService';
import { useDiet } from '../context/DietContext';
import { borderRadius, getSurfacePalette, spacing, typography } from '../utils/mobileTheme';

interface Props {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { instruction: string; requestMode: PlanRevisionMode }) => Promise<void>;
}

export default function PlanAiRefreshSheet({ visible, loading = false, onClose, onSubmit }: Props) {
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['56%'], []);
  const [instruction, setInstruction] = useState('');
  const [requestMode, setRequestMode] = useState<PlanRevisionMode>('adjust');
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  useEffect(() => {
    if (visible) modalRef.current?.present();
    else modalRef.current?.dismiss();
  }, [visible]);

  return (
    <BottomSheetModal ref={modalRef} snapPoints={snapPoints} onDismiss={onClose}>
      <BottomSheetView style={[styles.content, { backgroundColor: palette.card }]}> 
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: palette.primarySoft }]}>
            <Sparkles size={14} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Actualizar plan con IA</Text>
        </View>

        <View style={[styles.segment, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}> 
          <Pressable
            style={[
              styles.segmentButton,
              requestMode === 'adjust' && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
            ]}
            onPress={() => setRequestMode('adjust')}
          >
            <Text style={[styles.segmentText, { color: requestMode === 'adjust' ? palette.primary : palette.textMuted }]}>Ajustar</Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentButton,
              requestMode === 'regenerate' && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
            ]}
            onPress={() => setRequestMode('regenerate')}
          >
            <Text style={[styles.segmentText, { color: requestMode === 'regenerate' ? palette.primary : palette.textMuted }]}>Recrear</Text>
          </Pressable>
        </View>

        <TextInput
          style={[styles.input, styles.multiline, { borderColor: palette.border, backgroundColor: palette.cardMuted, color: palette.text }]}
          multiline
          placeholder={
            requestMode === 'adjust'
              ? 'Ej. cambia desayunos por opciones mas rapidas y reduce lacteos'
              : 'Ej. recrea el plan con enfoque antiinflamatorio y cenas mas ligeras'
          }
          placeholderTextColor={palette.textMuted}
          value={instruction}
          onChangeText={setInstruction}
        />

        <Pressable
          style={[styles.button, { backgroundColor: palette.primary }, (loading || !instruction.trim()) && styles.buttonDisabled]}
          disabled={loading || !instruction.trim()}
          onPress={async () => {
            try {
              await onSubmit({
                instruction: instruction.trim(),
                requestMode,
              });
              setInstruction('');
              onClose();
            } catch {
              // El error se refleja en el estado global del plan.
            }
          }}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Procesando...'
              : requestMode === 'regenerate'
                ? 'Recrear plan'
                : 'Solicitar ajuste'}
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  segment: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
