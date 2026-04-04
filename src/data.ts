import {
  Apple, Carrot, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart,
} from 'lucide-react';

import { perfilVO, equivalenciasVO, planVO } from './data/perfil-vo';
import { perfilVA, equivalenciasVA, planVA } from './data/perfil-va';

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
  vo: { ...perfilVO, plan: planVO } as Profile,
  va: { ...perfilVA, plan: planVA } as Profile,
};

export const equivalenciasData: Record<string, Equivalencia[]> = {
  vo: equivalenciasVO.map((eq: any) => ({ ...eq, icon: iconsMap[eq.icon] })),
  va: equivalenciasVA.map((eq: any) => ({ ...eq, icon: iconsMap[eq.icon] })),
};

export const rawData = {
  vo: JSON.stringify({ perfilVO, equivalenciasVO, planVO }, null, 2),
  va: JSON.stringify({ perfilVA, equivalenciasVA, planVA }, null, 2)
};
