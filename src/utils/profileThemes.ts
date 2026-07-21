export type AccentColors = {
  bg: string;
  bgLight: string;
  bgGradient: string;
  bgGradientLight: string;
  text: string;
  textDark: string;
  border: string;
  borderLight: string;
  borderAccent: string;
  tagBg: string;
  tagText: string;
  shadowLight: string;
  momentoIconBgDone: string;
  momentoIconColorDone: string;
  momentoIconBgPending: string;
  momentoIconColorPending: string;
  color500: string;
  progressBg: string;
  progressFill: string;
  btnActive: string;
  btnInactive: string;
  dot: string;
  cardDone: string;
  cardPending: string;
  iconDone: string;
  iconPending: string;
};

export type QuestionnaireTheme = {
  accent: string;
  light: string;
  text: string;
  border: string;
  grad: string;
};

export type MonitoringPalette = {
  hero: string;
  soft: string;
  bar: string;
  mutedBar: string;
  accent: string;
  activeCard: string;
  inactiveCard: string;
  cardTrack: string;
};

export type LandingTheme = {
  buttonTone: string;
  cardGradient: string;
  cardHoverShadow: string;
  metaText: string;
  readyDot: string;
  combinedBannerSurface: string;
  combinedBannerText: string;
  combinedBannerSubtext: string;
  combinedStatsLabel: string;
  combinedStatsSubtext: string;
};

type ThemeKey = 'el' | 'ella' | 'ambos' | 'default';

const LIGHT_ACCENT_COLORS: Record<ThemeKey, AccentColors> = {
  ambos: {
    bg: 'bg-pine-600',
    bgLight: 'bg-pine-50',
    bgGradient: 'from-pine-700 to-pine-500',
    bgGradientLight: 'from-pine-50 via-cream-50 to-cream-100',
    text: 'text-pine-700',
    textDark: 'text-pine-800',
    border: 'border-pine-200',
    borderLight: 'border-pine-100',
    borderAccent: 'border-pine-500',
    tagBg: 'bg-pine-100',
    tagText: 'text-pine-700',
    shadowLight: 'shadow-pine-500/20',
    momentoIconBgDone: 'bg-pine-600 shadow-[0_4px_12px_rgba(249,84,26,0.35)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-pine-50 text-pine-500 border border-pine-100',
    momentoIconColorPending: 'text-pine-500',
    color500: '#f9541a',
    progressBg: 'from-pine-50 via-cream-100 to-pine-100',
    progressFill: 'from-pine-400 to-pine-600',
    btnActive: 'bg-pine-800 text-white shadow-sm',
    btnInactive: 'bg-white text-ink-500 hover:bg-cream-100 border border-cream-200',
    dot: 'bg-pine-500',
    cardDone: 'bg-pine-700 border-pine-500 shadow-sm',
    cardPending: 'bg-white border-cream-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-pine-50 border border-pine-100',
  },
  ella: {
    bg: 'bg-coral-500',
    bgLight: 'bg-coral-50',
    bgGradient: 'from-coral-600 to-coral-400',
    bgGradientLight: 'from-coral-50 to-cream-100',
    text: 'text-coral-600',
    textDark: 'text-coral-700',
    border: 'border-coral-200',
    borderLight: 'border-coral-100',
    borderAccent: 'border-coral-500',
    tagBg: 'bg-coral-100',
    tagText: 'text-coral-600',
    shadowLight: 'shadow-coral-500/20',
    momentoIconBgDone: 'bg-coral-500 shadow-[0_4px_12px_rgba(249,47,124,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-coral-50 text-coral-400 border border-coral-100',
    momentoIconColorPending: 'text-coral-400',
    color500: '#f92f7c',
    progressBg: 'from-coral-50 via-cream-100 to-coral-100',
    progressFill: 'from-coral-300 to-coral-500',
    btnActive: 'bg-coral-600 text-white shadow-sm',
    btnInactive: 'bg-white text-ink-500 hover:bg-cream-100 border border-cream-200',
    dot: 'bg-coral-500',
    cardDone: 'bg-coral-500 border-coral-300 shadow-sm',
    cardPending: 'bg-white border-cream-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-coral-50 border border-coral-100',
  },
  el: {
    bg: 'bg-ocean-500',
    bgLight: 'bg-ocean-50',
    bgGradient: 'from-ocean-600 to-ocean-400',
    bgGradientLight: 'from-ocean-50 to-cream-100',
    text: 'text-ocean-600',
    textDark: 'text-ocean-700',
    border: 'border-ocean-200',
    borderLight: 'border-ocean-100',
    borderAccent: 'border-ocean-500',
    tagBg: 'bg-ocean-100',
    tagText: 'text-ocean-600',
    shadowLight: 'shadow-ocean-500/20',
    momentoIconBgDone: 'bg-ocean-500 shadow-[0_4px_12px_rgba(47,107,255,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-ocean-50 text-ocean-400 border border-ocean-100',
    momentoIconColorPending: 'text-ocean-400',
    color500: '#2f6bff',
    progressBg: 'from-ocean-50 via-cream-100 to-ocean-100',
    progressFill: 'from-ocean-300 to-ocean-500',
    btnActive: 'bg-ocean-600 text-white shadow-sm',
    btnInactive: 'bg-white text-ink-500 hover:bg-cream-100 border border-cream-200',
    dot: 'bg-ocean-500',
    cardDone: 'bg-ocean-500 border-ocean-300 shadow-sm',
    cardPending: 'bg-white border-cream-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-ocean-50 border border-ocean-100',
  },
  default: {
    bg: 'bg-ink-500',
    bgLight: 'bg-cream-100',
    bgGradient: 'from-ink-600 to-ink-500',
    bgGradientLight: 'from-cream-50 to-cream-100',
    text: 'text-ink-500',
    textDark: 'text-ink-700',
    border: 'border-cream-200',
    borderLight: 'border-cream-100',
    borderAccent: 'border-ink-500',
    tagBg: 'bg-cream-200',
    tagText: 'text-ink-600',
    shadowLight: 'shadow-ink-500/20',
    momentoIconBgDone: 'bg-ink-500 shadow-[0_4px_12px_rgba(107,107,116,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-cream-100 text-ink-400 border border-cream-200',
    momentoIconColorPending: 'text-ink-400',
    color500: '#6b6b74',
    progressBg: 'from-cream-50 via-cream-100 to-cream-200',
    progressFill: 'from-ink-400 to-ink-600',
    btnActive: 'bg-ink-800 text-white shadow-sm',
    btnInactive: 'bg-white text-ink-500 hover:bg-cream-100 border border-cream-200',
    dot: 'bg-ink-500',
    cardDone: 'bg-ink-600 border-ink-400 shadow-sm',
    cardPending: 'bg-white border-cream-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-cream-100 border border-cream-200',
  },
};

const DARK_ACCENT_COLORS: Record<ThemeKey, AccentColors> = {
  ambos: {
    bg: 'bg-pine-500',
    bgLight: 'bg-pine-950/60',
    bgGradient: 'from-pine-500 to-pine-700',
    bgGradientLight: 'from-pine-950/60 to-ink-950/70',
    text: 'text-pine-300',
    textDark: 'text-pine-200',
    border: 'border-pine-900/60',
    borderLight: 'border-pine-900/40',
    borderAccent: 'border-pine-400',
    tagBg: 'bg-pine-950/70',
    tagText: 'text-pine-200',
    shadowLight: 'shadow-pine-950/40',
    momentoIconBgDone: 'bg-pine-500 shadow-[0_4px_18px_rgba(251,119,54,0.45)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-pine-950/60 text-pine-300 border border-pine-900/50',
    momentoIconColorPending: 'text-pine-300',
    color500: '#fb7736',
    progressBg: 'from-ink-900 via-pine-950/70 to-pine-950/70',
    progressFill: 'from-pine-400 to-pine-300',
    btnActive: 'bg-pine-500 text-pine-950 shadow-sm',
    btnInactive: 'bg-ink-900/80 text-pine-100/70 hover:bg-ink-800 border border-pine-900/40',
    dot: 'bg-pine-400',
    cardDone: 'bg-pine-600 border-pine-400 shadow-sm',
    cardPending: 'bg-ink-900/90 border-ink-700 shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-pine-950/60 border border-pine-900/50',
  },
  ella: {
    bg: 'bg-coral-500',
    bgLight: 'bg-coral-950/40',
    bgGradient: 'from-coral-500 to-coral-700',
    bgGradientLight: 'from-coral-950/40 to-ink-950/70',
    text: 'text-coral-300',
    textDark: 'text-coral-200',
    border: 'border-coral-900/50',
    borderLight: 'border-coral-900/40',
    borderAccent: 'border-coral-400',
    tagBg: 'bg-coral-950/60',
    tagText: 'text-coral-200',
    shadowLight: 'shadow-coral-950/40',
    momentoIconBgDone: 'bg-coral-500 shadow-[0_4px_18px_rgba(249,47,124,0.4)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-coral-950/50 text-coral-300 border border-coral-900/40',
    momentoIconColorPending: 'text-coral-300',
    color500: '#ff5c9a',
    progressBg: 'from-ink-900 via-coral-950/50 to-coral-950/50',
    progressFill: 'from-coral-400 to-coral-300',
    btnActive: 'bg-coral-500 text-white shadow-sm',
    btnInactive: 'bg-ink-900/80 text-coral-100/70 hover:bg-ink-800 border border-coral-900/40',
    dot: 'bg-coral-400',
    cardDone: 'bg-coral-500 border-coral-400 shadow-sm',
    cardPending: 'bg-ink-900/90 border-ink-700 shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-coral-950/50 border border-coral-900/40',
  },
  el: {
    bg: 'bg-ocean-500',
    bgLight: 'bg-ocean-950/40',
    bgGradient: 'from-ocean-500 to-ocean-700',
    bgGradientLight: 'from-ocean-950/40 to-ink-950/70',
    text: 'text-ocean-300',
    textDark: 'text-ocean-200',
    border: 'border-ocean-900/50',
    borderLight: 'border-ocean-900/40',
    borderAccent: 'border-ocean-400',
    tagBg: 'bg-ocean-950/60',
    tagText: 'text-ocean-200',
    shadowLight: 'shadow-ocean-950/40',
    momentoIconBgDone: 'bg-ocean-400 shadow-[0_4px_18px_rgba(47,107,255,0.4)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-ocean-950/50 text-ocean-300 border border-ocean-900/40',
    momentoIconColorPending: 'text-ocean-300',
    color500: '#5c82ff',
    progressBg: 'from-ink-900 via-ocean-950/50 to-ocean-950/50',
    progressFill: 'from-ocean-400 to-ocean-300',
    btnActive: 'bg-ocean-500 text-white shadow-sm',
    btnInactive: 'bg-ink-900/80 text-ocean-100/70 hover:bg-ink-800 border border-ocean-900/40',
    dot: 'bg-ocean-400',
    cardDone: 'bg-ocean-500 border-ocean-400 shadow-sm',
    cardPending: 'bg-ink-900/90 border-ink-700 shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-ocean-950/50 border border-ocean-900/40',
  },
  default: {
    bg: 'bg-ink-500',
    bgLight: 'bg-ink-900/80',
    bgGradient: 'from-ink-700 to-ink-900',
    bgGradientLight: 'from-ink-900/85 to-ink-950/80',
    text: 'text-ink-300',
    textDark: 'text-ink-100',
    border: 'border-ink-700',
    borderLight: 'border-ink-600',
    borderAccent: 'border-ink-400',
    tagBg: 'bg-ink-900/80',
    tagText: 'text-ink-200',
    shadowLight: 'shadow-black/40',
    momentoIconBgDone: 'bg-ink-400 shadow-[0_4px_18px_rgba(0,0,0,0.4)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-ink-900/80 text-ink-300 border border-ink-700',
    momentoIconColorPending: 'text-ink-300',
    color500: '#8a8a93',
    progressBg: 'from-ink-800 via-ink-900 to-ink-950',
    progressFill: 'from-ink-400 via-ink-300 to-ink-200',
    btnActive: 'bg-ink-500 text-white shadow-sm',
    btnInactive: 'bg-ink-900/90 text-ink-200 hover:bg-ink-800 border border-ink-700',
    dot: 'bg-ink-300',
    cardDone: 'bg-ink-500 border-ink-400 shadow-sm',
    cardPending: 'bg-ink-900/90 border-ink-700 shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-ink-900/80 border border-ink-700',
  },
};

const QUESTIONNAIRE_THEMES: Record<ThemeKey, QuestionnaireTheme> = {
  el: {
    accent: '#1f53e6',
    light: 'bg-ocean-50 dark:bg-ocean-950/40',
    text: 'text-ocean-600 dark:text-ocean-200',
    border: 'border-ocean-200 dark:border-ocean-900/50',
    grad: 'from-ocean-600 to-ocean-400',
  },
  ella: {
    accent: '#f92f7c',
    light: 'bg-coral-50 dark:bg-coral-950/40',
    text: 'text-coral-600 dark:text-coral-200',
    border: 'border-coral-200 dark:border-coral-900/50',
    grad: 'from-coral-600 to-coral-400',
  },
  ambos: {
    accent: '#f9541a',
    light: 'bg-pine-50 dark:bg-pine-950/50',
    text: 'text-pine-700 dark:text-pine-200',
    border: 'border-pine-200 dark:border-pine-900/50',
    grad: 'from-pine-700 to-pine-500',
  },
  default: {
    accent: '#6b6b74',
    light: 'bg-cream-100 dark:bg-ink-900/50',
    text: 'text-ink-500 dark:text-ink-200',
    border: 'border-cream-200 dark:border-ink-700/60',
    grad: 'from-ink-600 to-ink-500',
  },
};

const LIGHT_MONITORING: Record<ThemeKey, MonitoringPalette> = {
  ambos: {
    hero: 'from-pine-700 via-pine-600 to-pine-500',
    soft: 'bg-pine-50 border-pine-200 text-pine-900',
    bar: 'bg-pine-500',
    mutedBar: 'bg-pine-300',
    accent: 'text-pine-700',
    activeCard: 'bg-pine-700 text-white',
    inactiveCard: 'bg-cream-100 text-ink-700',
    cardTrack: 'bg-white',
  },
  ella: {
    hero: 'from-coral-600 via-coral-500 to-coral-400',
    soft: 'bg-coral-50 border-coral-200 text-coral-700',
    bar: 'bg-coral-500',
    mutedBar: 'bg-coral-300',
    accent: 'text-coral-600',
    activeCard: 'bg-coral-600 text-white',
    inactiveCard: 'bg-cream-100 text-ink-700',
    cardTrack: 'bg-white',
  },
  el: {
    hero: 'from-ocean-700 via-ocean-600 to-ocean-400',
    soft: 'bg-ocean-50 border-ocean-200 text-ocean-700',
    bar: 'bg-ocean-500',
    mutedBar: 'bg-ocean-300',
    accent: 'text-ocean-600',
    activeCard: 'bg-ocean-600 text-white',
    inactiveCard: 'bg-cream-100 text-ink-700',
    cardTrack: 'bg-white',
  },
  default: {
    hero: 'from-ink-600 via-ink-600 to-ink-700',
    soft: 'bg-cream-100 border-cream-200 text-ink-700',
    bar: 'bg-ink-500',
    mutedBar: 'bg-ink-400',
    accent: 'text-ink-600',
    activeCard: 'bg-ink-700 text-white',
    inactiveCard: 'bg-cream-100 text-ink-700',
    cardTrack: 'bg-white',
  },
};

const DARK_MONITORING: Record<ThemeKey, MonitoringPalette> = {
  ambos: {
    hero: 'from-pine-800 via-pine-700 to-pine-600',
    soft: 'bg-pine-950/60 border-pine-900/50 text-pine-100',
    bar: 'bg-pine-400',
    mutedBar: 'bg-pine-700',
    accent: 'text-pine-300',
    activeCard: 'bg-pine-600 text-white shadow-[0_16px_32px_rgba(67,18,6,0.45)]',
    inactiveCard: 'bg-ink-900/90 text-ink-100',
    cardTrack: 'bg-ink-800',
  },
  ella: {
    hero: 'from-coral-800 via-coral-700 to-coral-600',
    soft: 'bg-coral-950/50 border-coral-900/40 text-coral-100',
    bar: 'bg-coral-400',
    mutedBar: 'bg-coral-700',
    accent: 'text-coral-300',
    activeCard: 'bg-coral-600 text-white shadow-[0_16px_32px_rgba(92,10,42,0.45)]',
    inactiveCard: 'bg-ink-900/90 text-ink-100',
    cardTrack: 'bg-ink-800',
  },
  el: {
    hero: 'from-ocean-800 via-ocean-700 to-ocean-600',
    soft: 'bg-ocean-950/50 border-ocean-900/40 text-ocean-100',
    bar: 'bg-ocean-400',
    mutedBar: 'bg-ocean-700',
    accent: 'text-ocean-300',
    activeCard: 'bg-ocean-600 text-white shadow-[0_16px_32px_rgba(18,44,112,0.45)]',
    inactiveCard: 'bg-ink-900/90 text-ink-100',
    cardTrack: 'bg-ink-800',
  },
  default: {
    hero: 'from-ink-700 via-ink-800 to-ink-900',
    soft: 'bg-ink-900/70 border-ink-700 text-ink-100',
    bar: 'bg-ink-400',
    mutedBar: 'bg-ink-600',
    accent: 'text-ink-300',
    activeCard: 'bg-ink-700 text-white shadow-[0_16px_32px_rgba(0,0,0,0.4)]',
    inactiveCard: 'bg-ink-900/90 text-ink-100',
    cardTrack: 'bg-ink-800',
  },
};

const LANDING_THEMES: Record<ThemeKey, LandingTheme> = {
  el: {
    buttonTone: 'border-ocean-300/25 bg-white/12 hover:bg-white/20 shadow-[0_6px_20px_rgba(47,107,255,0.20)] hover:shadow-[0_10px_26px_rgba(47,107,255,0.30)]',
    cardGradient: 'from-[#1f53e6] via-[#2f6bff] to-[#5c82ff]',
    cardHoverShadow: 'hover:shadow-[0_20px_50px_rgba(47,107,255,0.25)]',
    metaText: 'text-ocean-50/90',
    readyDot: 'bg-ocean-200 shadow-[0_0_10px_rgba(185,204,255,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-ocean-50/85 shadow-[0_10px_30px_rgba(26,67,184,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-ocean-950/35',
    combinedBannerText: 'text-xs font-semibold text-ocean-700 dark:text-ocean-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-ocean-600 dark:text-ocean-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-ocean-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-ocean-50/60 mt-0.5',
  },
  ella: {
    buttonTone: 'border-coral-300/25 bg-white/12 hover:bg-white/20 shadow-[0_6px_20px_rgba(217,58,86,0.20)] hover:shadow-[0_10px_26px_rgba(217,58,86,0.30)]',
    cardGradient: 'from-[#e01b68] via-[#f92f7c] to-[#ff5c9a]',
    cardHoverShadow: 'hover:shadow-[0_20px_50px_rgba(217,58,86,0.25)]',
    metaText: 'text-coral-50/90',
    readyDot: 'bg-coral-200 shadow-[0_0_10px_rgba(255,185,210,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-coral-50/85 shadow-[0_10px_30px_rgba(217,58,86,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-coral-950/35',
    combinedBannerText: 'text-xs font-semibold text-coral-700 dark:text-coral-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-coral-600 dark:text-coral-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-coral-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-coral-50/60 mt-0.5',
  },
  ambos: {
    buttonTone: 'border-pine-300/25 bg-white/12 hover:bg-white/20 shadow-[0_6px_20px_rgba(249,84,26,0.18)] hover:shadow-[0_10px_26px_rgba(249,84,26,0.28)]',
    cardGradient: 'from-[#ea4109] via-[#f9541a] to-[#fb7736]',
    cardHoverShadow: 'hover:shadow-[0_20px_50px_rgba(249,84,26,0.22)]',
    metaText: 'text-pine-50/90',
    readyDot: 'bg-pine-200 shadow-[0_0_10px_rgba(254,204,170,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-pine-50/85 shadow-[0_10px_30px_rgba(249,84,26,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-pine-950/35',
    combinedBannerText: 'text-xs font-semibold text-pine-800 dark:text-pine-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-pine-700 dark:text-pine-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-pine-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-pine-50/60 mt-0.5',
  },
  default: {
    buttonTone: 'border-cream-200/20 bg-white/10 hover:bg-white/16 shadow-[0_8px_24px_rgba(107,107,116,0.16)] hover:shadow-[0_12px_30px_rgba(107,107,116,0.24)]',
    cardGradient: 'from-ink-500 via-ink-600 to-ink-800',
    cardHoverShadow: 'hover:shadow-[0_22px_60px_rgba(107,107,116,0.22)]',
    metaText: 'text-cream-50/85',
    readyDot: 'bg-cream-300 shadow-[0_0_10px_rgba(228,228,232,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-cream-50/85 shadow-[0_10px_30px_rgba(107,107,116,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-ink-950/35',
    combinedBannerText: 'text-xs font-semibold text-ink-700 dark:text-ink-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-ink-500 dark:text-ink-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-cream-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-cream-50/60 mt-0.5',
  },
};

function normalizeThemeKey(value: string | null | undefined): ThemeKey {
  if (value === 'el' || value === 'ella' || value === 'ambos') {
    return value;
  }

  return 'default';
}

export function getAccentColors(perfilActivo: string | null, isDarkMode = false): AccentColors {
  const key = normalizeThemeKey(perfilActivo);
  return isDarkMode ? DARK_ACCENT_COLORS[key] : LIGHT_ACCENT_COLORS[key];
}

export function getQuestionnaireTheme(perfilActivo: string | null): QuestionnaireTheme {
  return QUESTIONNAIRE_THEMES[normalizeThemeKey(perfilActivo)];
}

export function getMonitoringPalette(perfilActivo: string | null, isDarkMode = false): MonitoringPalette {
  const key = normalizeThemeKey(perfilActivo);
  return isDarkMode ? DARK_MONITORING[key] : LIGHT_MONITORING[key];
}

export function getLandingTheme(perfilActivo: string | null): LandingTheme {
  return LANDING_THEMES[normalizeThemeKey(perfilActivo)];
}
