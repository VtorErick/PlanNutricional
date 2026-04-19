const MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.|ðŸ|ï¸|Ð|Ñ)/;

function scoreMojibake(value: string) {
  return Array.from(value.matchAll(new RegExp(MOJIBAKE_PATTERN.source, 'g'))).length;
}

export function repairBrokenText(value: string): string {
  if (!value || !MOJIBAKE_PATTERN.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (!decoded) return value;

    const currentScore = scoreMojibake(value);
    const decodedScore = scoreMojibake(decoded);
    return decodedScore < currentScore ? decoded : value;
  } catch {
    return value;
  }
}

export function repairTextArtifactsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return repairBrokenText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => repairTextArtifactsDeep(entry)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        repairTextArtifactsDeep(entry),
      ])
    ) as T;
  }

  return value;
}
