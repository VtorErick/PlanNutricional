export interface SurfacePalette {
  screen: string;
  card: string;
  cardMuted: string;
  cardElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  success: string;
  successSoft: string;
  successText: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  accent1: string;
  accent2: string;
  gradientStart: string;
  gradientEnd: string;
  shadow: string;
}

export function getSurfacePalette(isDarkMode: boolean): SurfacePalette {
  if (isDarkMode) {
    return {
      // Base colors
      screen: '#08141A',
      card: '#102028',
      cardMuted: '#132733',
      cardElevated: '#17303D',
      border: 'rgba(255,255,255,0.08)',

      // Text colors
      text: '#FFFFFF',
      textMuted: 'rgba(255,255,255,0.6)',
      textInverse: '#0A0A0F',

      // Primary palette - teal/orange
      primary: '#14B8A6',
      primarySoft: 'rgba(20,184,166,0.18)',
      primaryMuted: 'rgba(20,184,166,0.10)',

      // Status colors
      success: '#10B981',
      successSoft: 'rgba(16,185,129,0.15)',
      successText: '#34D399',
      warning: '#F59E0B',
      warningSoft: 'rgba(245,158,11,0.15)',
      danger: '#EF4444',
      dangerSoft: 'rgba(239,68,68,0.15)',

      // Accent colors for gradients
      accent1: '#14B8A6',
      accent2: '#F59E0B',
      gradientStart: '#0EA5A4',
      gradientEnd: '#F59E0B',

      // Shadow
      shadow: 'rgba(0,0,0,0.5)',
    };
  }

  return {
    // Base colors
    screen: '#F2F7F5',
    card: '#FFFFFF',
    cardMuted: '#E8F1EE',
    cardElevated: '#FFFFFF',
    border: 'rgba(15,118,110,0.16)',

    // Text colors
    text: '#10231E',
    textMuted: '#4E6B63',
    textInverse: '#FFFFFF',

    // Primary palette - teal/orange
    primary: '#0F766E',
    primarySoft: 'rgba(15,118,110,0.14)',
    primaryMuted: 'rgba(15,118,110,0.08)',

    // Status colors
    success: '#10B981',
    successSoft: 'rgba(16,185,129,0.12)',
    successText: '#059669',
    warning: '#F59E0B',
    warningSoft: 'rgba(245,158,11,0.12)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239,68,68,0.12)',

    // Accent colors for gradients
    accent1: '#0F766E',
    accent2: '#D97706',
    gradientStart: '#0F766E',
    gradientEnd: '#D97706',

    // Shadow
    shadow: 'rgba(15,23,42,0.1)',
  };
}

export interface GradientPreset {
  colors: [string, string];
  locations?: [number, number];
}

export const gradients = {
  primary: { colors: ['#14B8A6', '#0F766E'] } as GradientPreset,
  accent: { colors: ['#0F766E', '#F59E0B'] } as GradientPreset,
  success: { colors: ['#10B981', '#059669'] } as GradientPreset,
  sunset: { colors: ['#F59E0B', '#EF4444'] } as GradientPreset,
  ocean: { colors: ['#14B8A6', '#22D3EE'] } as GradientPreset,
  dark: { colors: ['#102028', '#08141A'] } as GradientPreset,
};

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export function getShadows(elevation: 'small' | 'medium' | 'large' | 'floating', isDarkMode: boolean): ShadowPreset {
  const baseShadow = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.1)';
  const deepShadow = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(15,23,42,0.15)';

  const presets = {
    small: {
      shadowColor: baseShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: baseShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: deepShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    floating: {
      shadowColor: deepShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 16,
    },
  };

  return presets[elevation];
}

export interface TypographyPreset {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight: number;
  letterSpacing?: number;
}

export const typography = {
  hero: { fontSize: 32, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 } as TypographyPreset,
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.3 } as TypographyPreset,
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.2 } as TypographyPreset,
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, letterSpacing: -0.1 } as TypographyPreset,
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 } as TypographyPreset,
  bodyLarge: { fontSize: 17, fontWeight: '400', lineHeight: 26 } as TypographyPreset,
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 } as TypographyPreset,
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 } as TypographyPreset,
  label: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 } as TypographyPreset,
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 14, letterSpacing: 0.3 } as TypographyPreset,
  stat: { fontSize: 36, fontWeight: '800', lineHeight: 44, letterSpacing: -1 } as TypographyPreset,
};

export interface SpacingPreset {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export const spacing: SpacingPreset = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export interface BorderRadiusPreset {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
}

export const borderRadius: BorderRadiusPreset = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};
