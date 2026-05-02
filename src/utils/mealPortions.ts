export function sanitizeMealPortionsText(value: unknown, fallback = ''): string {
  const source = typeof value === 'string' ? value : fallback;
  const genericAdjustedPortion =
    /^\s*porcion\s+ajustada\s+segun\s+objetivo,\s+horario\s+y\s+restricciones\s+del\s+perfil\.?\s*$/i;

  if (genericAdjustedPortion.test(source.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
    return '';
  }

  return source
    .replace(/\s*\(\s*porci[oó]n\s+ajustad[ao]\s+a\s+~?\d+(?:[.,]\d+)?\s*kcal\s+para\s+este\s+perfil\s*\)\s*/gi, ' ')
    .replace(/\s*\(\s*porcion\s+ajustada\s+segun\s+objetivo,\s+horario\s+y\s+restricciones\s+del\s+perfil\.?\s*\)\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}
