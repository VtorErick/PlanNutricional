import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Activity, Ruler, Target, UserRound, Weight } from 'lucide-react-native';

import { useDiet, type ActivityLevel, type ProfileMetricsUpdate, type ProfileObjective } from '../context/DietContext';
import type { Profile } from '../types';
import { calculateClinicalTDEE } from '../utils/nutrition';
import { extractProfileMetrics } from '../utils/profileSummary';
import { borderRadius, getSurfacePalette, spacing, typography } from '../utils/mobileTheme';

interface ProfileEditSheetProps {
  visible: boolean;
  profileId: 'el' | 'ella' | null;
  profile: Profile | null;
  onClose: () => void;
  onSave: (profileId: 'el' | 'ella', payload: ProfileMetricsUpdate) => void;
}

type FormState = {
  nombre: string;
  edad: string;
  pesoKg: string;
  estaturaCm: string;
  objetivo: ProfileObjective;
  actividad: ActivityLevel;
  notas: string;
};

const OBJECTIVES: { key: ProfileObjective; label: string }[] = [
  { key: 'perder_grasa', label: 'Bajar grasa' },
  { key: 'mantener', label: 'Mantener' },
  { key: 'ganar_musculo', label: 'Ganar musculo' },
];

const ACTIVITIES: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentario', label: 'Sedentario' },
  { key: 'ligero', label: 'Ligero' },
  { key: 'moderado', label: 'Moderado' },
  { key: 'activo', label: 'Activo' },
  { key: 'intenso', label: 'Intenso' },
];

function inferObjective(profile: Profile): ProfileObjective {
  const text = `${profile.meta || ''} ${profile.descripcion || ''}`.toLowerCase();
  if (text.includes('ganar') || text.includes('musculo')) return 'ganar_musculo';
  if (text.includes('mant')) return 'mantener';
  return 'perder_grasa';
}

function inferActivity(profile: Profile): ActivityLevel {
  const text = `${profile.detallesPerfil || ''} ${profile.descripcion || ''}`.toLowerCase();
  if (text.includes('intenso')) return 'intenso';
  if (text.includes('activo')) return 'activo';
  if (text.includes('ligero')) return 'ligero';
  if (text.includes('sedent')) return 'sedentario';
  return 'moderado';
}

function buildDefaultForm(profile: Profile | null): FormState {
  if (!profile) {
    return {
      nombre: '',
      edad: '30',
      pesoKg: '70',
      estaturaCm: '170',
      objetivo: 'perder_grasa',
      actividad: 'moderado',
      notas: '',
    };
  }

  const parsed = extractProfileMetrics([profile.perfil, profile.detallesPerfil].filter(Boolean).join(' | '));
  const parsedWeight = parsed.weightKg ? Number(parsed.weightKg) : null;
  const parsedHeight = parsed.heightM ? Math.round(Number(parsed.heightM) * 100) : null;

  return {
    nombre: profile.nombre || '',
    edad: String(profile.edad || 30),
    pesoKg: String(parsedWeight || 70),
    estaturaCm: String(parsedHeight || 170),
    objetivo: inferObjective(profile),
    actividad: inferActivity(profile),
    notas: profile.detallesPerfil || '',
  };
}

export default function ProfileEditSheet({
  visible,
  profileId,
  profile,
  onClose,
  onSave,
}: ProfileEditSheetProps) {
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const [form, setForm] = useState<FormState>(buildDefaultForm(profile));
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  useEffect(() => {
    setForm(buildDefaultForm(profile));
  }, [profile]);

  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible]);

  const preview = useMemo(() => {
    const age = Math.max(16, Number(form.edad) || 30);
    const weightKg = Math.max(35, Number(form.pesoKg) || 70);
    const heightCm = Math.max(130, Number(form.estaturaCm) || 170);
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    const goalToken =
      form.objetivo === 'ganar_musculo'
        ? 'ganar musculo'
        : form.objetivo === 'mantener'
          ? 'mantener'
          : 'perder grasa';
    const tdee = calculateClinicalTDEE(
      weightKg,
      heightCm,
      age,
      profileId === 'el',
      form.actividad,
      [goalToken]
    );
    return {
      targetKcal: tdee.targetKcal,
      bmi,
    };
  }, [form.actividad, form.edad, form.estaturaCm, form.objetivo, form.pesoKg, profileId]);

  return (
    <BottomSheetModal ref={modalRef} snapPoints={snapPoints} onDismiss={onClose}>
      <BottomSheetView style={[styles.content, { backgroundColor: palette.card }]}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: palette.primarySoft }]}>
            <UserRound size={16} color={palette.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: palette.text }]}>Editar datos del perfil</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              Estos cambios actualizan metas, calorias y resumen.
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Nombre</Text>
            <TextInput
              value={form.nombre}
              onChangeText={(value) => setForm((current) => ({ ...current, nombre: value }))}
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.cardMuted, color: palette.text }]}
              placeholder="Nombre"
              placeholderTextColor={palette.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldWrap, styles.half]}>
              <Text style={[styles.label, { color: palette.textMuted }]}>Edad</Text>
              <View style={[styles.inputRow, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}>
                <Target size={14} color={palette.textMuted} />
                <TextInput
                  value={form.edad}
                  onChangeText={(value) => setForm((current) => ({ ...current, edad: value.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                  style={[styles.inlineInput, { color: palette.text }]}
                  placeholder="30"
                  placeholderTextColor={palette.textMuted}
                />
              </View>
            </View>
            <View style={[styles.fieldWrap, styles.half]}>
              <Text style={[styles.label, { color: palette.textMuted }]}>Peso (kg)</Text>
              <View style={[styles.inputRow, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}>
                <Weight size={14} color={palette.textMuted} />
                <TextInput
                  value={form.pesoKg}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, pesoKg: value.replace(/[^0-9.]/g, '') }))
                  }
                  keyboardType="decimal-pad"
                  style={[styles.inlineInput, { color: palette.text }]}
                  placeholder="70"
                  placeholderTextColor={palette.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Estatura (cm)</Text>
            <View style={[styles.inputRow, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}>
              <Ruler size={14} color={palette.textMuted} />
              <TextInput
                value={form.estaturaCm}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, estaturaCm: value.replace(/[^0-9]/g, '') }))
                }
                keyboardType="number-pad"
                style={[styles.inlineInput, { color: palette.text }]}
                placeholder="170"
                placeholderTextColor={palette.textMuted}
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Objetivo</Text>
            <View style={styles.chipsRow}>
              {OBJECTIVES.map((entry) => {
                const active = form.objetivo === entry.key;
                return (
                  <Pressable
                    key={entry.key}
                    onPress={() => setForm((current) => ({ ...current, objetivo: entry.key }))}
                    style={[
                      styles.choiceChip,
                      { borderColor: palette.border, backgroundColor: palette.cardMuted },
                      active && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
                    ]}
                  >
                    <Text style={[styles.choiceText, { color: active ? palette.primary : palette.textMuted }]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <View style={styles.labelRow}>
              <Activity size={14} color={palette.textMuted} />
              <Text style={[styles.label, { color: palette.textMuted }]}>Actividad</Text>
            </View>
            <View style={styles.chipsRow}>
              {ACTIVITIES.map((entry) => {
                const active = form.actividad === entry.key;
                return (
                  <Pressable
                    key={entry.key}
                    onPress={() => setForm((current) => ({ ...current, actividad: entry.key }))}
                    style={[
                      styles.choiceChip,
                      { borderColor: palette.border, backgroundColor: palette.cardMuted },
                      active && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
                    ]}
                  >
                    <Text style={[styles.choiceText, { color: active ? palette.primary : palette.textMuted }]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Notas (opcional)</Text>
            <TextInput
              value={form.notas}
              onChangeText={(value) => setForm((current) => ({ ...current, notas: value }))}
              style={[
                styles.input,
                styles.multiline,
                { borderColor: palette.border, backgroundColor: palette.cardMuted, color: palette.text },
              ]}
              placeholder="Ejemplo: prefiere cocinar 2 veces por semana."
              placeholderTextColor={palette.textMuted}
              multiline
            />
          </View>

          <View style={[styles.previewCard, { backgroundColor: palette.primarySoft }]}>
            <Text style={[styles.previewTitle, { color: palette.primary }]}>Vista previa</Text>
            <Text style={[styles.previewLine, { color: palette.text }]}>Meta calorica: {preview.targetKcal} kcal</Text>
            <Text style={[styles.previewLine, { color: palette.text }]}>IMC estimado: {preview.bmi.toFixed(1)}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={[styles.secondaryButton, { borderColor: palette.border }]} onPress={onClose}>
            <Text style={[styles.secondaryButtonText, { color: palette.textMuted }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: palette.primary }]}
            onPress={() => {
              if (!profileId) return;
              onSave(profileId, {
                nombre: form.nombre,
                edad: Number(form.edad) || 30,
                pesoKg: Number(form.pesoKg) || 70,
                estaturaCm: Number(form.estaturaCm) || 170,
                objetivo: form.objetivo,
                actividad: form.actividad,
                notas: form.notas,
              });
              onClose();
            }}
          >
            <Text style={styles.primaryButtonText}>Guardar cambios</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 34,
    height: 34,
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
  form: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
  },
  inputRow: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inlineInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    paddingVertical: 0,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  choiceChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  choiceText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  previewCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  previewTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewLine: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1.5,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
