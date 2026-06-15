import { Profile } from '../types';
import { SMAE_GROUP_ORDER, SMAE_GROUPS } from '../data/smae';

export const macroPortionCategories = SMAE_GROUP_ORDER.map((key) => {
  const group = SMAE_GROUPS[key];
  return { key: group.key, label: group.label, icon: group.icon };
});

export const getMomentMacroPortions = (profile: Profile, momentoKey: string) => {
  const objetivoMomento = (profile.objetivosPorMomento?.[momentoKey] || {}) as Record<string, number>;
  return macroPortionCategories
    .map((cat) => ({
      ...cat,
      cantidad: objetivoMomento[cat.key] || 0,
    }))
    .filter((item) => item.cantidad > 0);
};
