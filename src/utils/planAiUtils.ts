import { iconsMap } from '../data';
import { parseObjectToData } from '../dataManager';
import type { Equivalencia, Profile, SupplementRecommendation } from '../types';
import type {
  PlanRevisionProfilePatch,
  SerializableEquivalencia,
  SerializableProfileSnapshot,
} from '../services/aiService';

const ICON_NAME_BY_COMPONENT = new Map(
  Object.entries(iconsMap).map(([name, component]) => [component, name])
);

type EditableProfileId = 'el' | 'ella';
type RawProfilePrefix = 'EL' | 'ELLA';

type RawBucketKeys = {
  prefix: RawProfilePrefix;
  profileKey: 'perfilEL' | 'perfilELLA';
  equivalenciasKey: 'equivalenciasEL' | 'equivalenciasELLA';
  supplementsKey: 'suplementosEL' | 'suplementosELLA';
  planKey: 'planEL' | 'planELLA';
};

export type AffectedPlanSlot = {
  dia: string;
  momento: string;
};

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getRawBucketKeys(profileId: EditableProfileId): RawBucketKeys {
  if (profileId === 'ella') {
    return {
      prefix: 'ELLA',
      profileKey: 'perfilELLA',
      equivalenciasKey: 'equivalenciasELLA',
      supplementsKey: 'suplementosELLA',
      planKey: 'planELLA',
    };
  }

  return {
    prefix: 'EL',
    profileKey: 'perfilEL',
    equivalenciasKey: 'equivalenciasEL',
    supplementsKey: 'suplementosEL',
    planKey: 'planEL',
  };
}

export function serializeEquivalencesData(
  equivalencias: Equivalencia[]
): SerializableEquivalencia[] {
  return equivalencias.map((entry) => ({
    titulo: entry.titulo,
    items: cloneSerializable(entry.items),
    icon:
      (typeof entry.icon === 'string'
        ? entry.icon
        : ICON_NAME_BY_COMPONENT.get(entry.icon)) || 'Heart',
  }));
}

export function buildSerializableProfileSnapshot(
  profile: Profile,
  equivalencias: Equivalencia[],
  suplementos: SupplementRecommendation[]
): SerializableProfileSnapshot {
  const { plan, ...perfil } = profile;

  return {
    perfil: cloneSerializable(perfil as Record<string, unknown>),
    equivalencias: serializeEquivalencesData(equivalencias),
    suplementos: cloneSerializable(suplementos),
    plan: cloneSerializable(plan),
  };
}

function truncateText(value: unknown, max = 180): string {
  if (typeof value !== 'string') return '';
  const normalized = value.trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export function buildCompactRevisionSnapshot(
  snapshot: SerializableProfileSnapshot,
  options?: {
    allowedMoments?: string[];
    includeReferenceData?: boolean;
  }
): SerializableProfileSnapshot {
  const perfil = snapshot?.perfil || {};
  const plan = snapshot?.plan || {};
  const allowedMoments = new Set(
    Array.isArray(options?.allowedMoments) ? options.allowedMoments : []
  );
  const filterByMoment = allowedMoments.size > 0;
  const includeReferenceData = options?.includeReferenceData !== false;

  const compactPlan = Object.fromEntries(
    Object.entries(plan).map(([dayKey, dayValue]) => {
      if (!isPlainObject(dayValue)) return [dayKey, {}];

      const compactDay = Object.fromEntries(
        Object.entries(dayValue).map(([momentKey, meals]) => {
          if (filterByMoment && !allowedMoments.has(momentKey)) return [momentKey, []];
          if (!Array.isArray(meals)) return [momentKey, []];
          return [
            momentKey,
            meals.slice(0, 1).map((meal: any) => ({
              nombre: truncateText(meal?.nombre, 100),
              porciones: truncateText(meal?.porciones, 120),
              detalle: truncateText(meal?.detalle, 90),
              tags: [],
              super: [],
              caloriasKcal: Number.isFinite(meal?.caloriasKcal) ? meal.caloriasKcal : 0,
              proteinaG: Number.isFinite(meal?.proteinaG) ? meal.proteinaG : 0,
              grasasG: Number.isFinite(meal?.grasasG) ? meal.grasasG : 0,
            })),
          ];
        })
      );

      return [dayKey, compactDay];
    })
  );

  return {
    perfil: {
      id: perfil.id,
      nombre: perfil.nombre,
      perfil: truncateText(perfil.perfil, 120),
      meta: truncateText(perfil.meta, 200),
      metaCaloricaKcalDia: perfil.metaCaloricaKcalDia,
      horariosTexto: truncateText(perfil.horariosTexto, 160),
      objetivosPorMomento: perfil.objetivosPorMomento || {},
      momentos: Array.isArray(perfil.momentos)
        ? perfil.momentos.map((moment: any) => ({
          key: moment?.key,
          label: moment?.label,
          hora: moment?.hora,
        }))
        : [],
    },
    equivalencias: includeReferenceData && Array.isArray(snapshot?.equivalencias)
      ? snapshot.equivalencias.map((entry) => ({
        titulo: truncateText(entry?.titulo, 80),
        icon: entry?.icon || 'Heart',
        items: Array.isArray(entry?.items)
          ? entry.items.slice(0, 5).map((item) => truncateText(item, 80))
          : [],
      }))
      : [],
    suplementos: includeReferenceData && Array.isArray(snapshot?.suplementos)
      ? snapshot.suplementos.map((supp) => ({
        name: truncateText(supp?.name, 80),
        goalSupport: truncateText(supp?.goalSupport, 100),
        whyItMayHelp: truncateText(supp?.whyItMayHelp, 120),
        howToUse: truncateText(supp?.howToUse, 120),
        timing: truncateText(supp?.timing, 80),
        notes: truncateText(supp?.notes, 120),
        caution: truncateText(supp?.caution, 120),
      }))
      : [],
    plan: compactPlan,
  };
}

export function buildRawBucketFromSnapshot(
  profileId: EditableProfileId,
  snapshot: SerializableProfileSnapshot
) {
  const keys = getRawBucketKeys(profileId);

  return {
    [keys.profileKey]: cloneSerializable(snapshot.perfil),
    [keys.equivalenciasKey]: cloneSerializable(snapshot.equivalencias),
    [keys.supplementsKey]: cloneSerializable(snapshot.suplementos),
    [keys.planKey]: cloneSerializable(snapshot.plan),
  };
}

export function getPatchSummaryLines(patch: PlanRevisionProfilePatch): string[] {
  return Array.isArray(patch.summary)
    ? patch.summary
        .filter((line): line is string => typeof line === 'string')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
}

export function hasPlanRevisionPatchChanges(patch: PlanRevisionProfilePatch): boolean {
  const hasProfilePatch =
    isPlainObject(patch.profilePatch) && Object.keys(patch.profilePatch).length > 0;
  const hasEquivalencias = Array.isArray(patch.equivalencias) && patch.equivalencias.length > 0;
  const hasSuplementos = Array.isArray(patch.suplementos) && patch.suplementos.length > 0;
  const hasPlanPatch = isPlainObject(patch.planPatch) && Object.keys(patch.planPatch).length > 0;

  return hasProfilePatch || hasEquivalencias || hasSuplementos || hasPlanPatch;
}

export function getAffectedPlanSlotsFromPatch(
  patch: PlanRevisionProfilePatch
): AffectedPlanSlot[] {
  if (!isPlainObject(patch.planPatch)) return [];

  const result: AffectedPlanSlot[] = [];
  Object.entries(patch.planPatch).forEach(([dia, dayValue]) => {
    if (!isPlainObject(dayValue)) return;
    Object.keys(dayValue).forEach((momento) => {
      result.push({ dia, momento });
    });
  });

  return result;
}

export function applyPlanRevisionPatchToBucket(
  profileId: EditableProfileId,
  currentBucket: Record<string, any>,
  patch: PlanRevisionProfilePatch
) {
  const keys = getRawBucketKeys(profileId);
  const nextBucket = cloneSerializable(currentBucket);
  const currentProfile = isPlainObject(nextBucket[keys.profileKey])
    ? nextBucket[keys.profileKey]
    : {};

  if (isPlainObject(patch.profilePatch)) {
    nextBucket[keys.profileKey] = {
      ...currentProfile,
      ...cloneSerializable(patch.profilePatch),
      id: currentProfile.id,
      nombre: currentProfile.nombre,
    };
  }

  if (Array.isArray(patch.equivalencias)) {
    nextBucket[keys.equivalenciasKey] = cloneSerializable(patch.equivalencias);
  }

  if (Array.isArray(patch.suplementos)) {
    nextBucket[keys.supplementsKey] = cloneSerializable(patch.suplementos);
  }

  if (isPlainObject(patch.planPatch)) {
    const currentPlan = isPlainObject(nextBucket[keys.planKey]) ? nextBucket[keys.planKey] : {};
    const nextPlan = cloneSerializable(currentPlan);

    Object.entries(patch.planPatch).forEach(([dia, dayValue]) => {
      if (!isPlainObject(dayValue)) return;
      const existingDay = isPlainObject(nextPlan[dia]) ? nextPlan[dia] : {};
      nextPlan[dia] = { ...existingDay };

      Object.entries(dayValue).forEach(([momento, meals]) => {
        nextPlan[dia][momento] = cloneSerializable(meals);
      });
    });

    nextBucket[keys.planKey] = nextPlan;
  }

  return parseObjectToData(nextBucket, keys.prefix);
}
