export interface MealOriginalSnapshot {
  nombre: string;
  porciones: string;
  detalle: string;
  tags: string[];
  super: string[];
  caloriasKcal?: number;
  proteinaG?: number;
  grasasG?: number;
}

export interface MealEditMeta {
  isEdited: boolean;
  original: MealOriginalSnapshot;
}

export interface MealAiMeta {
  normalizedByProfile?: boolean;
  normalizedTargetKcal?: number;
  profileId?: 'el' | 'ella';
  analyzedSource?: 'image' | 'text';
  analyzedModel?: string;
  confidence?: 'alta' | 'media' | 'baja';
  loggedAt?: string;
}

export interface MealItem {
  id?: string; // Preserved idRef from AI response for rotation tracking
  nombre: string;
  porciones: string;
  detalle: string;
  tags: string[];
  super: string[];
  caloriasKcal?: number;
  proteinaG?: number;
  grasasG?: number;
  editMeta?: MealEditMeta;
  aiMeta?: MealAiMeta;
  notaPersonalizada?: string;
}

export interface MealTime {
  key: string;
  label: string;
  hora: string;
}

export interface SupplementRecommendation {
  name: string;
  goalSupport: string;
  whyItMayHelp: string;
  howToUse: string;
  timing: string;
  notes: string;
  caution?: string;
}

export interface Profile {
  id: string;
  nombre: string;
  edad: number;
  descripcion: string;
  perfil: string;
  detallesPerfil?: string;
  meta: string;
  horariosTexto: string;
  notaSalud?: string;
  momentos: MealTime[];
  objetivosPorMomento: Record<string, Record<string, number>>;
  distribucionDiaria: { grupo: string; total: number; detalle: string }[];
  resumenPersonal: string[];
  metaCaloricaKcalDia?: number;
  plan: Record<string, Record<string, MealItem[]>>;
}

export interface Equivalencia {
  titulo: string;
  icon: any;
  items: string[];
}
