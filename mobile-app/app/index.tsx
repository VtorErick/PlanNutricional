import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight, Moon, Settings, Sparkles, Sun, Users, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDiet } from '@/src/context/DietContext';
import { HAS_AI_PROVIDER, HAS_API_BASE } from '@/src/services/apiBase';
import { getSurfacePalette, getShadows, typography, spacing, borderRadius } from '@/src/utils/mobileTheme';
import { buildProfileInspectionText, extractProfileMetrics } from '@/src/utils/profileSummary';

function HeroSection({ isDarkMode, palette }: { isDarkMode: boolean; palette: any }) {
  const shadows = getShadows('medium', isDarkMode);

  return (
    <LinearGradient
      colors={[palette.gradientStart, palette.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroCard, shadows]}
    >
      <View style={styles.heroContent}>
        <View style={styles.heroIconContainer}>
          <Sparkles size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Nutricion inteligente</Text>
        <Text style={styles.heroSubtitle}>Plan personal, compras sincronizadas y ajustes por perfil.</Text>
      </View>
    </LinearGradient>
  );
}

function StatusBadge({ geminiStatus, palette }: { geminiStatus: any; palette: any }) {
  const status = (() => {
    if (!HAS_AI_PROVIDER) {
      return {
        label: 'IA opcional',
        value: 'Sin proveedor IA configurado. La app sigue funcionando.',
        color: palette.warning,
      };
    }

    if (!geminiStatus) {
      return {
        label: 'IA bajo demanda',
        value: HAS_API_BASE
          ? 'Valida conexion con backend desde Admin cuando lo necesites.'
          : 'IA directa lista para validar desde Admin.',
        color: palette.textMuted,
      };
    }

    if (geminiStatus.ok) {
      return {
        label: 'Asistente IA',
        value: HAS_API_BASE
          ? `Conectado: ${geminiStatus.selectedModel || geminiStatus.envModel || 'modelo por defecto'}`
          : `Directo: ${geminiStatus.selectedModel || geminiStatus.envModel || 'modelo por defecto'}`,
        color: '#10B981',
      };
    }

    if (geminiStatus.mode === 'offline') {
      return {
        label: 'Asistente IA',
        value: 'Backend fuera de linea. Reintenta en Admin.',
        color: palette.warning,
      };
    }

    return {
      label: 'Asistente IA',
      value: geminiStatus.error || 'No disponible por ahora.',
      color: palette.danger,
    };
  })();

  return (
    <View style={[styles.statusCard, { backgroundColor: palette.card }]}> 
      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
      <View style={styles.statusTextContainer}>
        <Text style={[styles.statusLabel, { color: palette.textMuted }]}>{status.label}</Text>
        <Text style={[styles.statusValue, { color: palette.text }]}>{status.value}</Text>
      </View>
      <Zap size={18} color={status.color} />
    </View>
  );
}

function ProfileCard({
  id,
  profile,
  summary,
  palette,
  isDarkMode,
  onOpenPlan,
  onOpenAi,
}: {
  id: 'el' | 'ella';
  profile: any;
  summary: string;
  palette: any;
  isDarkMode: boolean;
  onOpenPlan: () => void;
  onOpenAi: () => void;
}) {
  const shadows = getShadows('medium', isDarkMode);
  const isEl = id === 'el';

  return (
    <View style={[styles.profileCardContainer, shadows, { backgroundColor: palette.card }]}> 
      <View style={styles.profileHeader}>
        <View style={styles.profileMain}>
          <View style={[styles.profileAvatar, { backgroundColor: isEl ? '#3B82F6' : '#EC4899' }]}>
            <Text style={styles.profileAvatarText}>{isEl ? 'EL' : 'ELLA'}</Text>
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={[styles.profileName, { color: palette.text }]} numberOfLines={1}>
              {profile.nombre}
            </Text>
            <Text style={[styles.profileMeta, { color: palette.textMuted }]} numberOfLines={1}>
              {profile.meta}
            </Text>
          </View>
        </View>
        <View style={[styles.kcalBadge, { backgroundColor: palette.primarySoft }]}>
          <Text style={[styles.kcalBadgeText, { color: palette.primary }]}>
            {profile.metaCaloricaKcalDia ?? 0} kcal
          </Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: palette.cardMuted }]}>
        <Text style={[styles.summaryText, { color: palette.textMuted }]}>{summary}</Text>
      </View>

      <View style={styles.profileActions}>
        <Pressable
          style={[styles.secondaryButton, { backgroundColor: palette.cardMuted }]}
          onPress={onOpenPlan}
        >
          <Calendar size={18} color={palette.text} />
          <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Ver plan</Text>
        </Pressable>
        <Pressable onPress={onOpenAi}>
          <LinearGradient
            colors={[palette.primary, palette.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Sparkles size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Personalizar</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function CombinedCard({ onOpenPlan, onOpenAi, palette, isDarkMode, profilesCount, mealsPerDay }: any) {
  const shadows = getShadows('medium', isDarkMode);

  return (
    <View style={[styles.combinedCardContainer, shadows, { backgroundColor: palette.card }]}> 
      <View style={styles.combinedHeader}>
        <View style={[styles.combinedIcon, { backgroundColor: palette.primarySoft }]}>
          <Users size={24} color={palette.primary} />
        </View>
        <View style={styles.combinedTextContainer}>
          <Text style={[styles.combinedTitle, { color: palette.text }]}>Vista conjunta</Text>
          <Text style={[styles.combinedSubtitle, { color: palette.textMuted }]}>Sincroniza ambos perfiles</Text>
        </View>
      </View>

      <View style={styles.combinedStats}>
        <View style={[styles.statBox, { backgroundColor: palette.cardMuted }]}>
          <Text style={[styles.statNumber, { color: palette.primary }]}>{profilesCount}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>Perfiles</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: palette.cardMuted }]}>
          <Text style={[styles.statNumber, { color: palette.primary }]}>7</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>Dias</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: palette.cardMuted }]}>
          <Text style={[styles.statNumber, { color: palette.primary }]}>{mealsPerDay}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>Momentos</Text>
        </View>
      </View>

      <View style={styles.combinedActions}>
        <Pressable
          style={[styles.combinedSecondary, { backgroundColor: palette.cardMuted }]}
          onPress={onOpenPlan}
        >
          <Text style={[styles.combinedSecondaryText, { color: palette.text }]}>Ver plan</Text>
        </Pressable>
        <Pressable onPress={onOpenAi}>
          <LinearGradient
            colors={[palette.primary, palette.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.combinedPrimary}
          >
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.combinedPrimaryText}>Personalizar</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

export default function LandingScreen() {
  const { allBundles, setPerfilActivo, geminiStatus, isDarkMode, setIsDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  const [elBundle, ellaBundle] = allBundles;
  const availableBundles = [elBundle, ellaBundle].filter(Boolean);
  const mealsPerDay = Math.max(
    ...availableBundles.map((bundle: any) => Array.isArray(bundle?.profile?.momentos) ? bundle.profile.momentos.length : 0),
    0
  );

  const buildSummary = (rawPerfil?: string, rawDetalles?: string) => {
    const text = buildProfileInspectionText(rawPerfil, rawDetalles);
    const metrics = extractProfileMetrics(text);
    const parts = [
      metrics.weightKg ? `${metrics.weightKg} kg` : null,
      metrics.heightM ? `${metrics.heightM} m` : null,
      metrics.age ? `${metrics.age} anos` : null,
      metrics.imc ? `IMC ${metrics.imc.toFixed(1)}` : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' | ') : 'Perfil configurado y listo';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.screen }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>Plan Nutricional</Text>
            <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>Control diario y ajustes inteligentes</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.headerButton, { backgroundColor: palette.card }]}
              onPress={() => setIsDarkMode((current) => !current)}
            >
              {isDarkMode ? <Sun size={20} color={palette.warning} /> : <Moon size={20} color={palette.primary} />}
            </Pressable>
            <Pressable
              style={[styles.headerButton, { backgroundColor: palette.primary }]}
              onPress={() => router.push('/admin')}
            >
              <Settings size={20} color={palette.textInverse} />
            </Pressable>
          </View>
        </View>

        <HeroSection isDarkMode={isDarkMode} palette={palette} />
        <StatusBadge geminiStatus={geminiStatus} palette={palette} />

        {elBundle && (
          <ProfileCard
            id="el"
            profile={elBundle.profile}
            summary={buildSummary(elBundle.profile.perfil, elBundle.profile.detallesPerfil)}
            palette={palette}
            isDarkMode={isDarkMode}
            onOpenPlan={() => {
              setPerfilActivo('el');
              router.push('/(tabs)/plan');
            }}
            onOpenAi={() => {
              setPerfilActivo('el');
              router.push('/questionnaire');
            }}
          />
        )}

        {ellaBundle && (
          <ProfileCard
            id="ella"
            profile={ellaBundle.profile}
            summary={buildSummary(ellaBundle.profile.perfil, ellaBundle.profile.detallesPerfil)}
            palette={palette}
            isDarkMode={isDarkMode}
            onOpenPlan={() => {
              setPerfilActivo('ella');
              router.push('/(tabs)/plan');
            }}
            onOpenAi={() => {
              setPerfilActivo('ella');
              router.push('/questionnaire');
            }}
          />
        )}

        {(elBundle || ellaBundle) && (
          <CombinedCard
            palette={palette}
            isDarkMode={isDarkMode}
            profilesCount={availableBundles.length}
            mealsPerDay={mealsPerDay}
            onOpenPlan={() => {
              setPerfilActivo('ambos');
              router.push('/(tabs)/plan');
            }}
            onOpenAi={() => {
              setPerfilActivo('ambos');
              router.push('/questionnaire');
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 140,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
  },
  heroContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: typography.body.fontSize,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  statusTextContainer: {
    flex: 1,
    gap: 2,
  },
  statusLabel: {
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  profileCardContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  profileTextBlock: {
    flex: 1,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  profileAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
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
  kcalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  kcalBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryText: {
    fontSize: typography.body.fontSize,
    lineHeight: 20,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  secondaryButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  combinedCardContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  combinedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  combinedIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  combinedTextContainer: {
    flex: 1,
  },
  combinedTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  combinedSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: 2,
  },
  combinedStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statNumber: {
    fontSize: typography.stat.fontSize,
    fontWeight: typography.stat.fontWeight,
    letterSpacing: typography.stat.letterSpacing,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  combinedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  combinedSecondary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  combinedSecondaryText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  combinedPrimary: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  combinedPrimaryText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
});
