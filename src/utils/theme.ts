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

export const THEME_COLORS: Record<'el' | 'ella' | 'ambos' | 'default', AccentColors> = {
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

/**
 * Returns the theme accent colors object for a given active profile.
 * 
 * @param perfilActivo 'el' | 'ella' | 'ambos' | null
 * @returns AccentColors Object precomputed with full tailwind classes.
 */
export const getAccentColors = (perfilActivo: string | null): AccentColors => {
  if (perfilActivo === 'ambos') return THEME_COLORS.ambos;
  if (perfilActivo === 'ella') return THEME_COLORS.ella;
  if (perfilActivo === 'el') return THEME_COLORS.el;
  return THEME_COLORS.default;
};
