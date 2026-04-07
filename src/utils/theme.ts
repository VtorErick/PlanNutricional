export type AccentColors = {
  bg: string;
  bgLight: string;
  bgGradient: string;
  bgGradientLight: string;
  text: string;
  textDark: string;
  border: string;
  borderLight: string; // for border-${color}-100
  borderAccent: string;
  tagBg: string;
  tagText: string;
  shadowLight: string; // for shadow-${color}-500/20
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

const LIGHT_THEME_COLORS: Record<'el' | 'ella' | 'ambos' | 'default', AccentColors> = {
  ambos: {
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    bgGradient: 'from-indigo-500 to-purple-600',
    bgGradientLight: 'from-indigo-50 to-purple-50',
    text: 'text-indigo-600',
    textDark: 'text-indigo-800',
    border: 'border-indigo-200',
    borderLight: 'border-indigo-100',
    borderAccent: 'border-indigo-500',
    tagBg: 'bg-indigo-100',
    tagText: 'text-indigo-700',
    shadowLight: 'shadow-indigo-500/20',
    momentoIconBgDone: 'bg-indigo-500 shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-emerald-50 text-emerald-400 border border-emerald-100',
    momentoIconColorPending: 'text-emerald-400',
    color500: '#14b8a6', // teal-500
    progressBg: 'from-emerald-50 via-teal-50 to-emerald-100',
    progressFill: 'from-emerald-300 via-teal-400 to-emerald-600',
    btnActive: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-emerald-500',
    cardDone: 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-emerald-200',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-emerald-50 border border-emerald-100',
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
    color500: '#f43f5e', // rose-500
    progressBg: 'from-rose-50 via-pink-50 to-rose-100',
    progressFill: 'from-pink-300 via-rose-400 to-pink-600',
    btnActive: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-rose-500',
    cardDone: 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400 shadow-rose-200',
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
    color500: '#3b82f6', // blue-500
    progressBg: 'from-blue-50 via-sky-50 to-indigo-100',
    progressFill: 'from-sky-300 via-blue-400 to-indigo-600',
    btnActive: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-blue-500',
    cardDone: 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-blue-200',
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
    color500: '#64748b', // slate-500
    progressBg: 'from-slate-50 via-gray-50 to-zinc-100',
    progressFill: 'from-slate-300 via-gray-400 to-zinc-600',
    btnActive: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: 'bg-slate-500',
    cardDone: 'bg-gradient-to-br from-slate-500 to-gray-600 border-slate-400 shadow-slate-200',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: 'bg-slate-50 border border-slate-100',
  }
};

const DARK_THEME_COLORS: Record<'el' | 'ella' | 'ambos' | 'default', AccentColors> = {
  ambos: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-950/70',
    bgGradient: 'from-emerald-900 via-teal-900 to-green-950',
    bgGradientLight: 'from-emerald-950/75 to-teal-950/70',
    text: 'text-emerald-300',
    textDark: 'text-emerald-100',
    border: 'border-emerald-900/70',
    borderLight: 'border-emerald-800/70',
    borderAccent: 'border-emerald-400',
    tagBg: 'bg-emerald-950/80',
    tagText: 'text-emerald-200',
    shadowLight: 'shadow-emerald-950/40',
    momentoIconBgDone: 'bg-emerald-500 shadow-[0_4px_18px_rgba(16,185,129,0.35)]',
    momentoIconColorDone: 'text-white',
    momentoIconBgPending: 'bg-emerald-950/75 text-emerald-300 border border-emerald-900/70',
    momentoIconColorPending: 'text-emerald-300',
    color500: '#10b981',
    progressBg: 'from-slate-800 via-emerald-950/80 to-teal-950/80',
    progressFill: 'from-emerald-400 via-teal-400 to-green-400',
    btnActive: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/35',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-emerald-900/40',
    dot: 'bg-emerald-400',
    cardDone: 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-[0_16px_32px_rgba(4,120,87,0.28)]',
    cardPending: 'bg-slate-950/92 border-slate-800 shadow-[0_10px_30px_rgba(2,6,23,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-emerald-950/75 border border-emerald-900/60',
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
    btnActive: 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/35',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-fuchsia-900/40',
    dot: 'bg-pink-400',
    cardDone: 'bg-gradient-to-br from-rose-500 to-fuchsia-600 border-pink-400 shadow-[0_16px_32px_rgba(157,23,77,0.28)]',
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
    btnActive: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-950/35',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-sky-900/40',
    dot: 'bg-sky-400',
    cardDone: 'bg-gradient-to-br from-sky-500 to-indigo-600 border-sky-400 shadow-[0_16px_32px_rgba(14,116,144,0.28)]',
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
    btnActive: 'bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-lg shadow-slate-950/35',
    btnInactive: 'bg-slate-950/90 text-slate-200 hover:bg-slate-900 border border-slate-800',
    dot: 'bg-slate-300',
    cardDone: 'bg-gradient-to-br from-slate-500 to-slate-700 border-slate-400 shadow-[0_16px_32px_rgba(30,41,59,0.28)]',
    cardPending: 'bg-slate-950/92 border-slate-800 shadow-[0_10px_30px_rgba(2,6,23,0.4)]',
    iconDone: 'bg-white/20',
    iconPending: 'bg-slate-900/80 border border-slate-700',
  },
};

/**
 * Returns the theme accent colors object for a given active profile.
 * 
 * @param perfilActivo Current active profile: 'el' | 'ella' | 'ambos' | null
 * @param isDarkMode Whether the UI is currently using dark mode.
 * @returns AccentColors Object precomputed with full tailwind classes.
 */
export const getAccentColors = (
  perfilActivo: string | null,
  isDarkMode = false
): AccentColors => {
  const palette = isDarkMode ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  if (perfilActivo === 'ambos') return palette.ambos;
  if (perfilActivo === 'ella') return palette.ella;
  if (perfilActivo === 'el') return palette.el;
  return palette.default;
};
