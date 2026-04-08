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
