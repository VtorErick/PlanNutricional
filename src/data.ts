import {
  Apple, Carrot, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart,
} from 'lucide-react';

import { perfilEL, equivalenciasEL, planEL } from './data/perfil-el';
import { perfilELLA, equivalenciasELLA, planELLA } from './data/perfil-ella';

export interface MealItem {
  nombre: string;
  porciones: string;
  detalle: string;
  tags: string[];
  super: string[];
}

export interface MealTime {
  key: string;
  label: string;
  hora: string;
}

export interface Profile {
  id: string;
  nombre: string;
  edad: number;
  descripcion: string;
  perfil: string;
  meta: string;
  horariosTexto: string;
  notaSalud?: string;
  momentos: MealTime[];
  objetivosPorMomento: Record<string, Record<string, number>>;
  distribucionDiaria: { grupo: string; total: number; detalle: string }[];
  resumenPersonal: string[];
  plan: Record<string, Record<string, MealItem[]>>;
}

export interface Equivalencia {
  titulo: string;
  icon: any;
  items: string[];
}

export const iconsMap: Record<string, any> = {
  Apple, Carrot, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart,
};

export const perfilesData: Record<string, Profile> = {
  el: { ...perfilEL, plan: planEL } as Profile,
  ella: { ...perfilELLA, plan: planELLA } as Profile,
};

export const equivalenciasData: Record<string, Equivalencia[]> = {
  el: equivalenciasEL.map((eq: any) => ({ ...eq, icon: iconsMap[eq.icon] })),
  ella: equivalenciasELLA.map((eq: any) => ({ ...eq, icon: iconsMap[eq.icon] })),
};

export const rawData = {
  el: JSON.stringify({ perfilEL, equivalenciasEL, planEL }, null, 2),
  ella: JSON.stringify({ perfilELLA, equivalenciasELLA, planELLA }, null, 2)
};
