export type SmaeGroupKey =
  | 'frutas'
  | 'verduras'
  | 'cereales'
  | 'leguminosas'
  | 'lacteos'
  | 'proteina'
  | 'grasas';

export interface SmaeGroupDefinition {
  key: SmaeGroupKey;
  label: string;
  icon: string;
  kcal: number;
  protein: number;
  fat: number;
  aliases: string[];
}

export const SMAE_GROUPS: Record<SmaeGroupKey, SmaeGroupDefinition> = {
  frutas: {
    key: 'frutas',
    label: 'Frutas',
    icon: '🍎',
    kcal: 60,
    protein: 0.5,
    fat: 0,
    aliases: ['fruta', 'frutas', 'frut'],
  },
  verduras: {
    key: 'verduras',
    label: 'Verduras',
    icon: '🥦',
    kcal: 25,
    protein: 1,
    fat: 0,
    aliases: ['verdura', 'verduras', 'verd'],
  },
  cereales: {
    key: 'cereales',
    label: 'Cereales',
    icon: '🌾',
    kcal: 70,
    protein: 2,
    fat: 1,
    aliases: ['cereal', 'cereales', 'cer'],
  },
  leguminosas: {
    key: 'leguminosas',
    label: 'Leguminosas',
    icon: '🫘',
    kcal: 120,
    protein: 8,
    fat: 1,
    aliases: ['leguminosa', 'leguminosas', 'leg'],
  },
  lacteos: {
    key: 'lacteos',
    label: 'Lacteos',
    icon: '🥛',
    kcal: 95,
    protein: 7,
    fat: 3,
    aliases: ['lacteo', 'lacteos', 'lact'],
  },
  proteina: {
    key: 'proteina',
    label: 'Proteina',
    icon: '🥩',
    kcal: 75,
    protein: 7,
    fat: 3,
    aliases: ['proteina', 'proteinas', 'prot'],
  },
  grasas: {
    key: 'grasas',
    label: 'Grasas',
    icon: '🥑',
    kcal: 45,
    protein: 0,
    fat: 5,
    aliases: ['grasa', 'grasas', 'gras'],
  },
};

export const SMAE_GROUP_ORDER: SmaeGroupKey[] = [
  'frutas',
  'verduras',
  'cereales',
  'proteina',
  'grasas',
  'lacteos',
  'leguminosas',
];

export const SMAE_ALIAS_TO_GROUP = Object.values(SMAE_GROUPS).reduce<Record<string, SmaeGroupKey>>(
  (acc, group) => {
    group.aliases.forEach((alias) => {
      acc[normalizeSmaeToken(alias)] = group.key;
    });
    return acc;
  },
  {}
);

export function normalizeSmaeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveSmaeGroup(value: string): SmaeGroupDefinition | null {
  const key = SMAE_ALIAS_TO_GROUP[normalizeSmaeToken(value)];
  return key ? SMAE_GROUPS[key] : null;
}
