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
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    bgGradient: 'from-indigo-500 to-violet-600',
    bgGradientLight: 'from-indigo-50 via-violet-50 to-fuchsia-50',
    text: 'text-violet-600',
    textDark: 'text-violet-800',
    border: 'border-violet-200',
    borderLight: 'border-violet-100',
    borderAccent: 'border-violet-500',
    tagBg: 'bg-violet-100',
    tagText: 'text-violet-700',
    shadowLight: 'shadow-violet-500/20',
    momentoIconBgDone: 'bg-indigo-500 shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-violet-50 text-violet-400 border border-violet-100',
    momentoIconColorPending: 'text-violet-400',
    color500: '#8b5cf6',
    progressBg: 'from-indigo-50 via-violet-50 to-fuchsia-100',
    progressFill: 'from-indigo-300 via-violet-400 to-fuchsia-500',
    btnActive: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-violet-500',
    cardDone: 'bg-gradient-to-br from-indigo-500 to-violet-600 border-violet-300 shadow-sm',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-violet-50 border border-violet-100',
  },
  ella: {
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-50',
    bgGradient: 'from-rose-500 to-pink-600',
    bgGradientLight: 'from-rose-50 to-pink-50',
    text: 'text-rose-600',
    textDark: 'text-rose-800',
    border: 'border-rose-200',
    borderLight: 'border-rose-100',
    borderAccent: 'border-rose-500',
    tagBg: 'bg-rose-100',
    tagText: 'text-rose-700',
    shadowLight: 'shadow-rose-500/20',
    momentoIconBgDone: 'bg-rose-500 shadow-[0_4px_12px_rgba(244,63,94,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-rose-50 text-rose-400 border border-rose-100',
    momentoIconColorPending: 'text-rose-400',
    color500: '#f43f5e',
    progressBg: 'from-rose-50 via-pink-50 to-rose-100',
    progressFill: 'from-pink-300 via-rose-400 to-pink-600',
    btnActive: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-rose-500',
    cardDone: 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-300 shadow-sm',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-rose-50 border border-rose-100',
  },
  el: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    bgGradient: 'from-blue-500 to-cyan-600',
    bgGradientLight: 'from-blue-50 to-cyan-50',
    text: 'text-blue-600',
    textDark: 'text-blue-800',
    border: 'border-blue-200',
    borderLight: 'border-blue-100',
    borderAccent: 'border-blue-500',
    tagBg: 'bg-blue-100',
    tagText: 'text-blue-700',
    shadowLight: 'shadow-blue-500/20',
    momentoIconBgDone: 'bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-blue-50 text-blue-400 border border-blue-100',
    momentoIconColorPending: 'text-blue-400',
    color500: '#3b82f6',
    progressBg: 'from-blue-50 via-sky-50 to-indigo-100',
    progressFill: 'from-sky-300 via-blue-400 to-indigo-600',
    btnActive: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-blue-500',
    cardDone: 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-300 shadow-sm',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-blue-50 border border-blue-100',
  },
  default: {
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-50',
    bgGradient: 'from-slate-500 to-slate-600',
    bgGradientLight: 'from-slate-50 to-slate-100',
    text: 'text-slate-600',
    textDark: 'text-slate-800',
    border: 'border-slate-200',
    borderLight: 'border-slate-100',
    borderAccent: 'border-slate-500',
    tagBg: 'bg-slate-100',
    tagText: 'text-slate-700',
    shadowLight: 'shadow-slate-500/20',
    momentoIconBgDone: 'bg-slate-500 shadow-[0_4px_12px_rgba(100,116,139,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-slate-50 text-slate-400 border border-slate-100',
    momentoIconColorPending: 'text-slate-400',
    color500: '#64748b',
    progressBg: 'from-slate-50 via-gray-50 to-zinc-100',
    progressFill: 'from-slate-300 via-gray-400 to-zinc-600',
    btnActive: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-sm',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-slate-500',
    cardDone: 'bg-gradient-to-br from-slate-500 to-gray-600 border-slate-300 shadow-sm',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-slate-50 border border-slate-100',
  },
};

const DARK_ACCENT_COLORS: Record<ThemeKey, AccentColors> = {
  ambos: {
    bg: 'bg-violet-500',
    bgLight: 'bg-violet-950/70',
    bgGradient: 'from-indigo-900 via-violet-900 to-fuchsia-950',
    bgGradientLight: 'from-indigo-950/75 to-violet-950/70',
    text: 'text-violet-300',
    textDark: 'text-violet-100',
    border: 'border-violet-900/70',
    borderLight: 'border-violet-800/70',
    borderAccent: 'border-violet-400',
    tagBg: 'bg-violet-950/80',
    tagText: 'text-violet-200',
    shadowLight: 'shadow-violet-950/40',
    momentoIconBgDone: 'bg-violet-500 shadow-[0_4px_18px_rgba(139,92,246,0.35)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-violet-950/75 text-violet-300 border border-violet-900/70',
    momentoIconColorPending: 'text-violet-300',
    color500: '#a78bfa',
    progressBg: 'from-slate-800 via-indigo-950/80 to-violet-950/80',
    progressFill: 'from-indigo-400 via-violet-400 to-fuchsia-400',
    btnActive: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-violet-900/40',
    dot: 'bg-violet-400',
    cardDone: 'bg-gradient-to-br from-indigo-500 to-violet-600 border-violet-400 shadow-sm',
    cardPending: 'bg-slate-950/92 border-slate-800 shadow-[0_10px_30px_rgba(2,6,23,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-violet-950/75 border border-violet-900/60',
  },
  ella: {
    bg: 'bg-rose-500',
    bgLight: 'bg-fuchsia-950/70',
    bgGradient: 'from-fuchsia-900 via-rose-900 to-pink-950',
    bgGradientLight: 'from-fuchsia-950/75 to-rose-950/70',
    text: 'text-pink-300',
    textDark: 'text-rose-100',
    border: 'border-fuchsia-900/70',
    borderLight: 'border-fuchsia-800/70',
    borderAccent: 'border-pink-400',
    tagBg: 'bg-fuchsia-950/80',
    tagText: 'text-pink-200',
    shadowLight: 'shadow-fuchsia-950/40',
    momentoIconBgDone: 'bg-rose-500 shadow-[0_4px_18px_rgba(244,63,94,0.35)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-fuchsia-950/75 text-pink-300 border border-fuchsia-900/70',
    momentoIconColorPending: 'text-pink-300',
    color500: '#f43f5e',
    progressBg: 'from-slate-800 via-fuchsia-950/80 to-rose-950/80',
    progressFill: 'from-pink-400 via-rose-400 to-fuchsia-400',
    btnActive: 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-sm',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-fuchsia-900/40',
    dot: 'bg-pink-400',
    cardDone: 'bg-gradient-to-br from-rose-500 to-fuchsia-600 border-pink-400 shadow-sm',
    cardPending: 'bg-slate-950/92 border-slate-800 shadow-[0_10px_30px_rgba(2,6,23,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-fuchsia-950/75 border border-fuchsia-900/60',
  },
  el: {
    bg: 'bg-sky-500',
    bgLight: 'bg-sky-950/70',
    bgGradient: 'from-sky-900 via-blue-900 to-indigo-950',
    bgGradientLight: 'from-sky-950/75 to-blue-950/70',
    text: 'text-sky-300',
    textDark: 'text-sky-100',
    border: 'border-sky-900/70',
    borderLight: 'border-sky-800/70',
    borderAccent: 'border-sky-400',
    tagBg: 'bg-sky-950/80',
    tagText: 'text-sky-200',
    shadowLight: 'shadow-sky-950/40',
    momentoIconBgDone: 'bg-sky-500 shadow-[0_4px_18px_rgba(14,165,233,0.35)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-sky-950/75 text-sky-300 border border-sky-900/70',
    momentoIconColorPending: 'text-sky-300',
    color500: '#0ea5e9',
    progressBg: 'from-slate-800 via-sky-950/80 to-blue-950/80',
    progressFill: 'from-sky-400 via-blue-400 to-indigo-400',
    btnActive: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sm',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-sky-900/40',
    dot: 'bg-sky-400',
    cardDone: 'bg-gradient-to-br from-sky-500 to-indigo-600 border-sky-400 shadow-sm',
    cardPending: 'bg-slate-950/92 border-slate-800 shadow-[0_10px_30px_rgba(2,6,23,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-sky-950/75 border border-sky-900/60',
  },
  default: {
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-900/80',
    bgGradient: 'from-slate-800 to-slate-950',
    bgGradientLight: 'from-slate-900/85 to-slate-950/80',
    text: 'text-slate-300',
    textDark: 'text-slate-100',
    border: 'border-slate-800',
    borderLight: 'border-slate-700',
    borderAccent: 'border-slate-400',
    tagBg: 'bg-slate-900/80',
    tagText: 'text-slate-200',
    shadowLight: 'shadow-slate-950/40',
    momentoIconBgDone: 'bg-slate-500 shadow-[0_4px_18px_rgba(100,116,139,0.35)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-slate-900/80 text-slate-300 border border-slate-700',
    momentoIconColorPending: 'text-slate-300',
    color500: '#94a3b8',
    progressBg: 'from-slate-800 via-slate-900 to-slate-950',
    progressFill: 'from-slate-400 via-slate-300 to-zinc-200',
    btnActive: 'bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-sm',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-slate-800',
    dot: 'bg-slate-300',
    cardDone: 'bg-gradient-to-br from-slate-500 to-slate-700 border-slate-400 shadow-sm',
    cardPending: 'bg-slate-950/92 border-slate-800 shadow-[0_10px_30px_rgba(2,6,23,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-slate-900/80 border border-slate-700',
  },
};

const QUESTIONNAIRE_THEMES: Record<ThemeKey, QuestionnaireTheme> = {
  el: {
    accent: '#2563eb',
    light: 'bg-blue-50 dark:bg-sky-950/50',
    text: 'text-blue-600 dark:text-sky-200',
    border: 'border-blue-200 dark:border-sky-900/60',
    grad: 'from-blue-500 to-indigo-600',
  },
  ella: {
    accent: '#f43f5e',
    light: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-600 dark:text-rose-200',
    border: 'border-rose-200 dark:border-rose-900/60',
    grad: 'from-rose-500 to-pink-600',
  },
  ambos: {
    accent: '#8b5cf6',
    light: 'bg-violet-50 dark:bg-violet-950/50',
    text: 'text-violet-600 dark:text-violet-200',
    border: 'border-violet-200 dark:border-violet-900/60',
    grad: 'from-indigo-500 to-violet-600',
  },
  default: {
    accent: '#64748b',
    light: 'bg-slate-50 dark:bg-slate-950/50',
    text: 'text-slate-600 dark:text-slate-200',
    border: 'border-slate-200 dark:border-slate-800/60',
    grad: 'from-slate-500 to-slate-600',
  },
};

const LIGHT_MONITORING: Record<ThemeKey, MonitoringPalette> = {
  ambos: {
    hero: 'from-indigo-500 via-violet-500 to-purple-500',
    soft: 'bg-violet-50 border-violet-200 text-violet-900',
    bar: 'bg-violet-500',
    mutedBar: 'bg-violet-300',
    accent: 'text-violet-700',
    activeCard: 'bg-violet-600 text-white',
    inactiveCard: 'bg-slate-50 text-slate-900',
    cardTrack: 'bg-white',
  },
  ella: {
    hero: 'from-rose-500 via-pink-500 to-rose-600',
    soft: 'bg-rose-50 border-rose-200 text-rose-900',
    bar: 'bg-rose-500',
    mutedBar: 'bg-rose-300',
    accent: 'text-rose-700',
    activeCard: 'bg-rose-600 text-white',
    inactiveCard: 'bg-slate-50 text-slate-900',
    cardTrack: 'bg-white',
  },
  el: {
    hero: 'from-blue-500 via-sky-500 to-cyan-600',
    soft: 'bg-blue-50 border-blue-200 text-blue-900',
    bar: 'bg-blue-500',
    mutedBar: 'bg-blue-300',
    accent: 'text-blue-700',
    activeCard: 'bg-blue-600 text-white',
    inactiveCard: 'bg-slate-50 text-slate-900',
    cardTrack: 'bg-white',
  },
  default: {
    hero: 'from-slate-500 via-slate-600 to-slate-700',
    soft: 'bg-slate-50 border-slate-200 text-slate-900',
    bar: 'bg-slate-500',
    mutedBar: 'bg-slate-300',
    accent: 'text-slate-700',
    activeCard: 'bg-slate-600 text-white',
    inactiveCard: 'bg-slate-50 text-slate-900',
    cardTrack: 'bg-white',
  },
};

const DARK_MONITORING: Record<ThemeKey, MonitoringPalette> = {
  ambos: {
    hero: 'from-indigo-900 via-violet-900 to-purple-950',
    soft: 'bg-violet-950/70 border-violet-900/70 text-violet-100',
    bar: 'bg-violet-400',
    mutedBar: 'bg-violet-700',
    accent: 'text-violet-300',
    activeCard: 'bg-gradient-to-br from-indigo-950 to-violet-950 text-white shadow-[0_16px_32px_rgba(91,33,182,0.28)]',
    inactiveCard: 'bg-slate-950/92 text-slate-100',
    cardTrack: 'bg-slate-800',
  },
  ella: {
    hero: 'from-rose-900 via-pink-900 to-rose-950',
    soft: 'bg-fuchsia-950/70 border-fuchsia-900/70 text-rose-100',
    bar: 'bg-pink-400',
    mutedBar: 'bg-pink-700',
    accent: 'text-pink-300',
    activeCard: 'bg-gradient-to-br from-fuchsia-950 to-rose-950 text-white shadow-[0_16px_32px_rgba(157,23,77,0.28)]',
    inactiveCard: 'bg-slate-950/92 text-slate-100',
    cardTrack: 'bg-slate-800',
  },
  el: {
    hero: 'from-sky-900 via-blue-900 to-indigo-950',
    soft: 'bg-sky-950/70 border-sky-900/70 text-sky-100',
    bar: 'bg-sky-400',
    mutedBar: 'bg-sky-700',
    accent: 'text-sky-300',
    activeCard: 'bg-gradient-to-br from-sky-950 to-indigo-950 text-white shadow-[0_16px_32px_rgba(14,116,144,0.28)]',
    inactiveCard: 'bg-slate-950/92 text-slate-100',
    cardTrack: 'bg-slate-800',
  },
  default: {
    hero: 'from-slate-800 via-slate-900 to-slate-950',
    soft: 'bg-slate-900/70 border-slate-800 text-slate-100',
    bar: 'bg-slate-400',
    mutedBar: 'bg-slate-700',
    accent: 'text-slate-300',
    activeCard: 'bg-slate-900 text-white shadow-[0_16px_32px_rgba(30,41,59,0.28)]',
    inactiveCard: 'bg-slate-950/92 text-slate-100',
    cardTrack: 'bg-slate-800',
  },
};

const LANDING_THEMES: Record<ThemeKey, LandingTheme> = {
  el: {
    buttonTone: 'border-blue-300/25 bg-white/12 hover:bg-white/20 shadow-[0_6px_20px_rgba(59,130,246,0.20)] hover:shadow-[0_10px_26px_rgba(59,130,246,0.30)]',
    cardGradient: 'from-[#6366f1] via-[#3b82f6] to-[#60a5fa]',
    cardHoverShadow: 'hover:shadow-[0_20px_50px_rgba(59,130,246,0.25)]',
    metaText: 'text-blue-50/90',
    readyDot: 'bg-sky-200 shadow-[0_0_10px_rgba(186,230,253,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-blue-50/85 shadow-[0_10px_30px_rgba(29,78,216,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-blue-950/35',
    combinedBannerText: 'text-xs font-semibold text-blue-800 dark:text-blue-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-blue-600 dark:text-blue-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-blue-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-blue-50/60 mt-0.5',
  },
  ella: {
    buttonTone: 'border-pink-300/25 bg-white/12 hover:bg-white/20 shadow-[0_6px_20px_rgba(236,72,153,0.20)] hover:shadow-[0_10px_26px_rgba(236,72,153,0.30)]',
    cardGradient: 'from-[#ec4899] via-[#f472b6] to-[#fb7185]',
    cardHoverShadow: 'hover:shadow-[0_20px_50px_rgba(236,72,153,0.25)]',
    metaText: 'text-rose-50/90',
    readyDot: 'bg-pink-200 shadow-[0_0_10px_rgba(251,207,232,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-rose-50/85 shadow-[0_10px_30px_rgba(236,72,153,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-rose-950/35',
    combinedBannerText: 'text-xs font-semibold text-rose-800 dark:text-rose-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-rose-600 dark:text-rose-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-rose-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-rose-50/60 mt-0.5',
  },
  ambos: {
    buttonTone: 'border-violet-300/25 bg-white/12 hover:bg-white/20 shadow-[0_6px_20px_rgba(124,58,237,0.18)] hover:shadow-[0_10px_26px_rgba(124,58,237,0.28)]',
    cardGradient: 'from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]',
    cardHoverShadow: 'hover:shadow-[0_20px_50px_rgba(124,58,237,0.22)]',
    metaText: 'text-violet-50/90',
    readyDot: 'bg-violet-200 shadow-[0_0_10px_rgba(221,214,254,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-violet-50/85 shadow-[0_10px_30px_rgba(109,40,217,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-violet-950/35',
    combinedBannerText: 'text-xs font-semibold text-violet-800 dark:text-violet-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-violet-600 dark:text-violet-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-violet-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-violet-50/60 mt-0.5',
  },
  default: {
    buttonTone: 'border-slate-200/20 bg-white/10 hover:bg-white/16 shadow-[0_8px_24px_rgba(71,85,105,0.16)] hover:shadow-[0_12px_30px_rgba(71,85,105,0.24)]',
    cardGradient: 'from-slate-500 via-slate-600 to-slate-800',
    cardHoverShadow: 'hover:shadow-[0_22px_60px_rgba(71,85,105,0.22)]',
    metaText: 'text-slate-50/85',
    readyDot: 'bg-slate-300 shadow-[0_0_10px_rgba(226,232,240,0.7)]',
    combinedBannerSurface: 'rounded-2xl bg-slate-50/85 shadow-[0_10px_30px_rgba(71,85,105,0.08)] px-4 py-3 backdrop-blur-sm dark:bg-slate-950/35',
    combinedBannerText: 'text-xs font-semibold text-slate-800 dark:text-slate-200 text-center leading-relaxed',
    combinedBannerSubtext: 'block text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1',
    combinedStatsLabel: 'text-[9px] text-slate-50/75 font-bold uppercase tracking-widest mb-1',
    combinedStatsSubtext: 'text-[9px] text-slate-50/60 mt-0.5',
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
