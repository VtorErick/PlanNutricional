import { Profile } from '../types';

export const macroPortionCategories = [
  { key: 'frutas', label: 'Frutas', icon: '🍎' },
  { key: 'verduras', label: 'Verduras', icon: '🥦' },
  { key: 'cereales', label: 'Cereales', icon: '🌾' },
  { key: 'proteina', label: 'Proteina', icon: '🥩' },
  { key: 'grasas', label: 'Grasas', icon: '🥑' },
  { key: 'lacteos', label: 'Lacteos', icon: '🥛' },
  { key: 'leguminosas', label: 'Leguminosas', icon: '🫘' },
] as const;

export const getMomentMacroPortions = (profile: Profile, momentoKey: string) => {
  const objetivoMomento = (profile.objetivosPorMomento?.[momentoKey] || {}) as Record<string, number>;
  return macroPortionCategories
    .map((cat) => ({
      ...cat,
      cantidad: objetivoMomento[cat.key] || 0,
    }))
    .filter((item) => item.cantidad > 0);
};
