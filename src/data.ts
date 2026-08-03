import {
  Apple,
  Carrot,
  Wheat,
  Bean,
  Milk,
  Beef,
  Droplets,
  Candy,
  AlertTriangle,
  Heart,
} from 'lucide-react';

import defaultElSource from './data/defaults/perfil-el.json';
import defaultEllaSource from './data/defaults/perfil-ella.json';
import { defaultSupplements } from './data/defaultSupplements';
import { enrichPlanWithNutrition } from './utils/nutrition';
import { deduplicateMealPlan } from './utils/mealPlan';

import { Equivalencia, Profile, SupplementRecommendation } from './types';

export * from './types';

type DefaultProfileSource = {
  perfilEL?: Omit<Profile, 'plan'>;
  equivalenciasEL?: Array<Equivalencia & { icon: string }>;
  planEL?: Record<string, Record<string, any[]>>;
  perfilELLA?: Omit<Profile, 'plan'>;
  equivalenciasELLA?: Array<Equivalencia & { icon: string }>;
  planELLA?: Record<string, Record<string, any[]>>;
};

const defaultElData = defaultElSource as unknown as DefaultProfileSource;
const defaultEllaData = defaultEllaSource as unknown as DefaultProfileSource;

export const iconsMap: Record<string, any> = {
  Apple,
  Carrot,
  Wheat,
  Bean,
  Milk,
  Beef,
  Droplets,
  Candy,
  AlertTriangle,
  Heart,
};

const perfilEL = defaultElData.perfilEL as Profile;
const equivalenciasEL = (defaultElData.equivalenciasEL || []) as Array<
  Equivalencia & { icon: string }
>;
const planEL = defaultElData.planEL || {};

const perfilELLA = defaultEllaData.perfilELLA as Profile;
const equivalenciasELLA = (defaultEllaData.equivalenciasELLA || []) as Array<
  Equivalencia & { icon: string }
>;
const planELLA = defaultEllaData.planELLA || {};

export const perfilesData: Record<'el' | 'ella', Profile> = {
  el: { ...perfilEL, plan: enrichPlanWithNutrition(deduplicateMealPlan(planEL)) } as Profile,
  ella: { ...perfilELLA, plan: enrichPlanWithNutrition(deduplicateMealPlan(planELLA)) } as Profile,
};

export const equivalenciasData: Record<'el' | 'ella', Equivalencia[]> = {
  el: equivalenciasEL.map((eq) => ({ ...eq, icon: iconsMap[eq.icon] || Heart })),
  ella: equivalenciasELLA.map((eq) => ({ ...eq, icon: iconsMap[eq.icon] || Heart })),
};

export const supplementsData: Record<'el' | 'ella', SupplementRecommendation[]> = {
  el: [...defaultSupplements.el],
  ella: [...defaultSupplements.ella],
};

export function getRawDataText(profileId: 'el' | 'ella') {
  if (profileId === 'el') {
    return JSON.stringify(
      {
        perfilEL,
        equivalenciasEL,
        planEL: deduplicateMealPlan(planEL),
        suplementosEL: defaultSupplements.el,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      perfilELLA,
      equivalenciasELLA,
      planELLA: deduplicateMealPlan(planELLA),
      suplementosELLA: defaultSupplements.ella,
    },
    null,
    2
  );
}
