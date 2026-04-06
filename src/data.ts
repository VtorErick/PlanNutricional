import {
  Apple, Carrot, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart,
} from 'lucide-react';

import { perfilEL, equivalenciasEL, planEL } from './data/perfil-el';
import { perfilELLA, equivalenciasELLA, planELLA } from './data/perfil-ella';
import { enrichPlanWithNutrition } from './utils/nutrition';

import { Profile, Equivalencia } from './types';

export * from './types';

export const iconsMap: Record<string, any> = {
  Apple, Carrot, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart,
};

export const perfilesData: Record<string, Profile> = {
  el: { ...perfilEL, plan: enrichPlanWithNutrition(planEL) } as Profile,
  ella: { ...perfilELLA, plan: enrichPlanWithNutrition(planELLA) } as Profile,
};

export const equivalenciasData: Record<string, Equivalencia[]> = {
  el: equivalenciasEL.map((eq: any) => ({ ...eq, icon: iconsMap[eq.icon] })),
  ella: equivalenciasELLA.map((eq: any) => ({ ...eq, icon: iconsMap[eq.icon] })),
};

export const rawData = {
  el: JSON.stringify({ perfilEL, equivalenciasEL, planEL }, null, 2),
  ella: JSON.stringify({ perfilELLA, equivalenciasELLA, planELLA }, null, 2)
};
