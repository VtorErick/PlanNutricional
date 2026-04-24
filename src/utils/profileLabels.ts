export type ProfileLabels = {
  el: string;
  ella: string;
};

export const DEFAULT_PROFILE_LABELS: ProfileLabels = {
  el: 'El',
  ella: 'Ella',
};

const MAX_PROFILE_LABEL_LENGTH = 24;

export function cleanProfileLabel(value: unknown, fallback: string) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const normalized = raw.replace(/\s+/g, ' ').slice(0, MAX_PROFILE_LABEL_LENGTH);
  return normalized || fallback;
}

export function sanitizeProfileLabels(value: unknown): ProfileLabels {
  const source =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Partial<ProfileLabels>)
      : {};

  return {
    el: cleanProfileLabel(source.el, DEFAULT_PROFILE_LABELS.el),
    ella: cleanProfileLabel(source.ella, DEFAULT_PROFILE_LABELS.ella),
  };
}

export function getProfileLabel(labels: ProfileLabels, profileId: keyof ProfileLabels) {
  return cleanProfileLabel(labels[profileId], DEFAULT_PROFILE_LABELS[profileId]);
}

export function getCombinedProfileLabel(labels: ProfileLabels) {
  const el = getProfileLabel(labels, 'el');
  const ella = getProfileLabel(labels, 'ella');
  return `${el} + ${ella}`;
}

export function getCompactProfileLabel(labels: ProfileLabels, profileId: 'el' | 'ella' | 'ambos') {
  if (profileId === 'ambos') return 'Ambos';
  const label = getProfileLabel(labels, profileId);
  return label.length > 8 ? `${label.slice(0, 7)}.` : label;
}
