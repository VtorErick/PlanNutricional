import { Profile } from '../types';

export const macroPortionCategories = [
  { key: 'frutas', label: 'Frutas', icon: 'Fr' },
  { key: 'verduras', label: 'Verduras', icon: 'Ve' },
  { key: 'cereales', label: 'Cereales', icon: 'Ce' },
  { key: 'proteina', label: 'Proteina', icon: 'Pr' },
  { key: 'grasas', label: 'Grasas', icon: 'Gr' },
  { key: 'lacteos', label: 'Lacteos', icon: 'La' },
  { key: 'leguminosas', label: 'Leguminosas', icon: 'Le' },
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
