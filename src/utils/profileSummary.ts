const KG_REGEX = /(\d+(?:[.,]\d+)?)\s*kg\b/i;
const HEIGHT_CM_REGEX = /(\d+(?:[.,]\d+)?)\s*cm\b/i;
const HEIGHT_M_REGEX = /(\d+(?:[.,]\d+)?)\s*m\b/i;
const AGE_REGEX = /(\d+)\s*a(?:n|(?:\u00f1))os\b/i;
const IMC_REGEX = /IMC(?:\s*(?:de|:|-))?\s*([\d]+(?:[.,]\d+)?)/i;

function normalizeWhitespace(value: string | null | undefined) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeNumericToken(value: string) {
  return value.replace(',', '.').trim();
}

function formatWeight(weight: string | null) {
  if (!weight) return null;
  const numeric = Number(normalizeNumericToken(weight));
  if (!Number.isFinite(numeric)) return normalizeNumericToken(weight);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function formatHeightMeters(heightMeters: number | null) {
  if (!Number.isFinite(heightMeters) || !heightMeters) return null;
  return heightMeters.toFixed(2);
}

function formatImc(imc: number | null) {
  if (!Number.isFinite(imc) || !imc) return null;
  return imc.toFixed(1);
}

export function looksCompactProfile(value: string | null | undefined) {
  const text = normalizeWhitespace(value);
  if (!text) return false;

  return (text.includes('|') || text.includes('\u2022')) && /kg\b/i.test(text) && /\bIMC\b/i.test(text);
}

export function extractProfileMetrics(value: string | null | undefined) {
  const text = normalizeWhitespace(value);
  const weightMatch = text.match(KG_REGEX);
  const heightCmMatch = text.match(HEIGHT_CM_REGEX);
  const heightMetersMatch = text.match(HEIGHT_M_REGEX);
  const ageMatch = text.match(AGE_REGEX);
  const imcMatch = text.match(IMC_REGEX);

  const heightMeters = heightCmMatch
    ? Number(normalizeNumericToken(heightCmMatch[1])) / 100
    : heightMetersMatch
      ? Number(normalizeNumericToken(heightMetersMatch[1]))
      : null;
  const imc = imcMatch ? Number(normalizeNumericToken(imcMatch[1])) : null;

  return {
    weightKg: formatWeight(weightMatch?.[1] ?? null),
    heightM: formatHeightMeters(heightMeters),
    age: ageMatch?.[1] ?? null,
    imc: Number.isFinite(imc) ? imc : null,
  };
}

export function buildCompactProfileSummary(value: string | null | undefined) {
  const metrics = extractProfileMetrics(value);
  const parts = [
    metrics.weightKg ? `${metrics.weightKg} kg` : null,
    metrics.heightM ? `${metrics.heightM} m` : null,
    metrics.age ? `${metrics.age} anos` : null,
    metrics.imc ? `IMC ${formatImc(metrics.imc)}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length >= 2 ? parts.join(' | ') : null;
}

export function buildProfileInspectionText(
  perfil: string | null | undefined,
  detallesPerfil?: string | null
) {
  return [normalizeWhitespace(perfil), normalizeWhitespace(detallesPerfil)]
    .filter(Boolean)
    .join(' | ');
}

export function normalizeProfileSummary({
  perfil,
  detallesPerfil,
  fallbackPerfil,
  fallbackDetallesPerfil,
}: {
  perfil: string | null | undefined;
  detallesPerfil?: string | null | undefined;
  fallbackPerfil?: string | null | undefined;
  fallbackDetallesPerfil?: string | null | undefined;
}) {
  const safePerfil = normalizeWhitespace(perfil);
  const safeDetalles = normalizeWhitespace(detallesPerfil);
  const safeFallbackPerfil = normalizeWhitespace(fallbackPerfil);
  const safeFallbackDetalles = normalizeWhitespace(fallbackDetallesPerfil);

  const compactPerfil =
    buildCompactProfileSummary(safePerfil) ||
    buildCompactProfileSummary(safeDetalles) ||
    (looksCompactProfile(safePerfil) ? safePerfil : '') ||
    (looksCompactProfile(safeFallbackPerfil) ? safeFallbackPerfil : '');

  const inferredDetalles =
    safeDetalles ||
    (!looksCompactProfile(safePerfil) && safePerfil ? safePerfil : '') ||
    safeFallbackDetalles;

  return {
    perfil: compactPerfil || safeFallbackPerfil || safePerfil,
    detallesPerfil: inferredDetalles || undefined,
  };
}
