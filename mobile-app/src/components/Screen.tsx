import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useDiet } from '../context/DietContext';
import { getSurfacePalette, typography, spacing } from '../utils/mobileTheme';

type Props = ScrollViewProps & {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  showGradient?: boolean;
};

export function Screen({ title, subtitle, children, refreshing, onRefresh, showGradient = true, ...props }: Props) {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.screen }]} edges={['top']}>
      {showGradient && (
        <LinearGradient
          colors={
            isDarkMode
              ? [palette.gradientStart + '24', palette.gradientEnd + '14', palette.screen]
              : [palette.gradientStart + '18', palette.gradientEnd + '10', palette.screen]
          }
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.45 }}
        />
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={palette.primary}
              colors={[palette.primary]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        {...props}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[styles.titleAccent, { backgroundColor: palette.primary }]} />
            <Text style={[styles.title, { color: palette.text, ...typography.h1 }]}>{title}</Text>
          </View>
          {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted, ...typography.body }]}>{subtitle}</Text> : null}
        </View>
        <View style={styles.contentWrapper}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
  },
  contentWrapper: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleAccent: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    letterSpacing: typography.h1.letterSpacing,
  },
  subtitle: {
    marginLeft: spacing.lg + 4,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
