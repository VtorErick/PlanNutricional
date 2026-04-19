import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import type { GeminiStatusResponse } from '../services/geminiStatusService';
import { showAppAlert } from '../utils/appDialogs';
import { getSurfacePalette } from '../utils/mobileTheme';

interface Props {
  onClearStorage: () => void;
  onOpenQuestionnaire: () => void;
  onRefreshGeminiStatus: () => Promise<void>;
  onExportFirstProfilePdf: () => Promise<void>;
  geminiStatus: GeminiStatusResponse | null;
  apiBaseUrl: string;
  aiMode: 'backend' | 'direct' | 'disabled';
  isDarkMode: boolean;
}

export default function AdminPanel({
  onClearStorage,
  onOpenQuestionnaire,
  onRefreshGeminiStatus,
  onExportFirstProfilePdf,
  geminiStatus,
  apiBaseUrl,
  aiMode,
  isDarkMode,
}: Props) {
  const palette = getSurfacePalette(isDarkMode);

  const copyValue = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    await showAppAlert('Copiado', `${label} copiado al portapapeles.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.title, { color: palette.text }]}>Panel administrativo</Text>
      <Text style={[styles.text, { color: palette.textMuted }]}>
        Herramientas operativas para resetear estado local y lanzar regeneracion asistida del plan.
      </Text>

      <View style={[styles.statusCard, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}>
        <Text style={[styles.statusTitle, { color: palette.text }]}>Estado de Gemini</Text>
        <Text style={[styles.statusText, { color: palette.textMuted }]}>
          {geminiStatus?.ok
            ? `Disponible: ${geminiStatus.selectedModel || geminiStatus.envModel || 'sin modelo'}`
            : geminiStatus?.error || 'Sin validar'}
        </Text>
        <Text style={[styles.statusText, { color: palette.textMuted }]}>
          Modo IA: {aiMode === 'backend' ? 'Backend' : aiMode === 'direct' ? 'Directo' : 'Desactivado'}
        </Text>
        <Text style={[styles.statusText, { color: palette.textMuted }]}>
          API base: {apiBaseUrl || 'sin configurar'}
        </Text>
      </View>

      <Pressable style={styles.primary} onPress={onOpenQuestionnaire}>
        <Text style={styles.primaryText}>Abrir cuestionario IA</Text>
      </Pressable>

      <Pressable style={styles.neutral} onPress={() => void onRefreshGeminiStatus()}>
        <Text style={styles.neutralText}>Validar Gemini otra vez</Text>
      </Pressable>

      <Pressable style={styles.neutral} onPress={() => void onExportFirstProfilePdf()}>
        <Text style={styles.neutralText}>Exportar PDF del perfil activo</Text>
      </Pressable>

      <Pressable
        style={styles.neutral}
        onPress={() => void copyValue('API base', apiBaseUrl || 'sin-configurar')}
      >
        <Text style={styles.neutralText}>Copiar API base</Text>
      </Pressable>

      <Pressable
        style={styles.neutral}
        onPress={() =>
          void copyValue(
            'Modelo Gemini',
            geminiStatus?.selectedModel || geminiStatus?.envModel || 'sin-modelo'
          )
        }
      >
        <Text style={styles.neutralText}>Copiar modelo Gemini</Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={onClearStorage}>
        <Text style={styles.secondaryText}>Limpiar almacenamiento</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  text: {
    lineHeight: 20,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  statusTitle: {
    fontWeight: '800',
  },
  statusText: {
    lineHeight: 20,
  },
  primary: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  neutral: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  neutralText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  secondaryText: {
    color: '#be123c',
    fontWeight: '700',
  },
});
