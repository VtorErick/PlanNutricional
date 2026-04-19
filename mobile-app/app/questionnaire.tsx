import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react-native';

import NutritionQuestionnaire from '@/src/components/NutritionQuestionnaire';
import { useDiet } from '@/src/context/DietContext';
import { HAS_AI_PROVIDER, HAS_API_BASE } from '@/src/services/apiBase';
import { getSurfacePalette } from '@/src/utils/mobileTheme';

export default function QuestionnaireScreen() {
  const {
    perfilActivo,
    generationLoading,
    generationError,
    generateWithAi,
    isDarkMode,
    geminiStatus,
    refreshGeminiStatus,
  } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  useEffect(() => {
    if (!HAS_AI_PROVIDER || geminiStatus) return;
    refreshGeminiStatus().catch((error) => {
      console.warn('Gemini status refresh failed on questionnaire screen:', error);
    });
  }, [geminiStatus, refreshGeminiStatus]);

  return (
    <View style={[styles.container, { backgroundColor: palette.screen }]}>
      <View style={[styles.topBar, { borderBottomColor: palette.border, backgroundColor: palette.card }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={palette.text} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: palette.text }]}>Plan con IA</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: palette.card }] }>
          <View style={[styles.heroBadge, { backgroundColor: palette.primarySoft }]}>
            <Sparkles size={14} color={palette.primary} />
            <Text style={[styles.heroBadgeText, { color: palette.primary }]}>Cuestionario guiado</Text>
          </View>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Ajusta el plan con datos reales del perfil</Text>
          <Text style={[styles.heroSubtitle, { color: palette.textMuted }] }>
            Captura antropometria, contexto clinico, habitos y notas operativas con una estructura similar al flujo web.
          </Text>
        </View>

        {!HAS_AI_PROVIDER ? (
          <View style={[styles.aiDisabledCard, { backgroundColor: palette.warningSoft, borderColor: palette.warning }] }>
            <AlertTriangle size={18} color={palette.warning} />
            <View style={styles.aiDisabledTextWrap}>
              <Text style={[styles.aiDisabledTitle, { color: palette.text }]}>IA temporalmente desactivada</Text>
              <Text style={[styles.aiDisabledText, { color: palette.textMuted }] }>
                Configura EXPO_PUBLIC_API_BASE_URL o EXPO_PUBLIC_GEMINI_API_KEY para habilitar IA en mobile.
              </Text>
            </View>
          </View>
        ) : null}

        {!HAS_API_BASE && HAS_AI_PROVIDER ? (
          <View style={[styles.aiDisabledCard, { backgroundColor: palette.primarySoft, borderColor: palette.primary }] }>
            <Sparkles size={18} color={palette.primary} />
            <View style={styles.aiDisabledTextWrap}>
              <Text style={[styles.aiDisabledTitle, { color: palette.text }]}>Modo IA directo activo</Text>
              <Text style={[styles.aiDisabledText, { color: palette.textMuted }] }>
                Esta app usara Gemini directo desde mobile sin backend externo.
              </Text>
            </View>
          </View>
        ) : null}

        <NutritionQuestionnaire
          initialTargetProfile={perfilActivo}
          loading={generationLoading}
          errorMessage={generationError}
          aiEnabled={HAS_AI_PROVIDER}
          onSubmit={async (payload) => {
            try {
              await generateWithAi(payload);
              router.replace('/plan');
            } catch {
              // El estado de error ya se presenta dentro del cuestionario.
            }
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  topBarSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiDisabledCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aiDisabledTextWrap: {
    flex: 1,
    gap: 2,
  },
  aiDisabledTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiDisabledText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
