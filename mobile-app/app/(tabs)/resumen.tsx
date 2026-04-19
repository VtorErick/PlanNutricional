import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, PencilLine } from 'lucide-react-native';

import Header from '@/src/components/Header';
import ProfileEditSheet from '@/src/components/ProfileEditSheet';
import { Screen } from '@/src/components/Screen';
import { useDiet } from '@/src/context/DietContext';
import { showAppAlert } from '@/src/utils/appDialogs';
import { borderRadius, getShadows, getSurfacePalette, spacing, typography } from '@/src/utils/mobileTheme';

export default function ResumenScreen() {
  const { activeBundles, exportProfilePdf, isDarkMode, updateProfileMetrics } = useDiet();
  const [exportingId, setExportingId] = React.useState<'el' | 'ella' | null>(null);
  const [editingProfileId, setEditingProfileId] = React.useState<'el' | 'ella' | null>(null);
  const palette = getSurfacePalette(isDarkMode);
  const editingBundle = activeBundles.find((bundle) => bundle.id === editingProfileId) || null;

  return (
    <Screen title="Resumen" subtitle="Sintesis personal y exportacion del plan en PDF.">
      <Header />
      {activeBundles.map(({ id, profile }) => (
        <View
          key={id}
          style={[styles.card, getShadows('small', isDarkMode), { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.name, { color: palette.text }]}>{profile.nombre}</Text>
          <Text style={[styles.description, { color: palette.textMuted }]}>{profile.descripcion}</Text>
          <View style={styles.bulletsWrap}>
            {profile.resumenPersonal.map((line: string) => (
              <View key={line} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: palette.primary }]} />
                <Text style={[styles.bullet, { color: palette.textMuted }]}>{line}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={[styles.button, { backgroundColor: palette.primary }]}
            onPress={async () => {
              try {
                setExportingId(id);
                await exportProfilePdf(id);
              } catch (error) {
                await showAppAlert(
                  'No se pudo exportar el PDF',
                  error instanceof Error ? error.message : 'Ocurrio un error al generar el PDF.'
                );
              } finally {
                setExportingId(null);
              }
            }}
          >
            <FileText size={16} color="#fff" />
            <Text style={styles.buttonText}>{exportingId === id ? 'Generando PDF...' : 'Compartir PDF'}</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.cardMuted }]}
            onPress={() => setEditingProfileId(id)}
          >
            <PencilLine size={16} color={palette.textMuted} />
            <Text style={[styles.secondaryButtonText, { color: palette.textMuted }]}>Editar datos</Text>
          </Pressable>
        </View>
      ))}

      <ProfileEditSheet
        visible={Boolean(editingProfileId)}
        profileId={editingProfileId}
        profile={editingBundle?.profile || null}
        onClose={() => setEditingProfileId(null)}
        onSave={(profileId, payload) => updateProfileMetrics(profileId, payload)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
  },
  description: {
    lineHeight: 21,
    fontSize: typography.bodySmall.fontSize,
  },
  bulletsWrap: {
    gap: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 20,
    marginTop: 7,
  },
  bullet: {
    flex: 1,
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.xs,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: spacing.xs,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
});
