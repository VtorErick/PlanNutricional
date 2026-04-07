import { Profile, Equivalencia, MealItem } from './types';
import { normalizeProfileSummary } from './utils/profileSummary';

type RawProfilePrefix = 'EL' | 'ELLA';

/**
 * Normalizes a day name by removing accents and standardizing capitalization.
 * Miercoles -> Miercoles, Sabado -> Sabado, lunes -> Lunes
 */
function normalizeDayName(day: string): string {
  const withoutAccents = day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return withoutAccents.charAt(0).toUpperCase() + withoutAccents.slice(1).toLowerCase();
}

/**
 * Parses a clean JSON object and validates its base structure.
 * The validation is intentionally permissive for AI-generated payloads.
 */
export function parseObjectToData(parsed: any, expectedPrefix: RawProfilePrefix): any {
  const perfilKey = `perfil${expectedPrefix}`;
  const equivKey = `equivalencias${expectedPrefix}`;
  const planKey = `plan${expectedPrefix}`;
  const supplementsKey = `suplementos${expectedPrefix}`;

  if (!parsed[perfilKey] || !parsed[equivKey] || !parsed[planKey]) {
    const wrongPrefix = expectedPrefix === 'EL' ? 'ELLA' : 'EL';
    if (parsed[`perfil${wrongPrefix}`]) {
      const expectedLabel = expectedPrefix === 'EL' ? 'El' : 'Ella';
      const wrongLabel = wrongPrefix === 'EL' ? 'El' : 'Ella';
      throw new Error(`Intentaste subir un archivo de ${wrongLabel} en la seccion de ${expectedLabel}. Sube el archivo correcto.`);
    }
    throw new Error(`El archivo JSON no contiene las estructuras requeridas (${perfilKey}, ${equivKey}, ${planKey}).`);
  }

  const perfil = parsed[perfilKey];
  if (!perfil.nombre || !Array.isArray(perfil.momentos)) {
    throw new Error('La estructura del perfil no coincide con el formato esperado. Faltan: nombre o momentos.');
  }

  const normalizedProfileSummary = normalizeProfileSummary({
    perfil: perfil.perfil,
    detallesPerfil: perfil.detallesPerfil,
  });

  parsed[perfilKey] = {
    ...perfil,
    perfil: normalizedProfileSummary.perfil || perfil.perfil,
    ...(normalizedProfileSummary.detallesPerfil
      ? { detallesPerfil: normalizedProfileSummary.detallesPerfil }
      : {}),
  };

  const equivalencias = parsed[equivKey];
  if (!Array.isArray(equivalencias) || equivalencias.length === 0) {
    throw new Error('Las equivalencias deben ser un arreglo no vacio.');
  }

  let plan = parsed[planKey];
  if (typeof plan !== 'object' || plan === null) {
    throw new Error('El plan de comidas no tiene un formato valido.');
  }

  const normalizedPlan: Record<string, any> = {};
  for (const [dayKey, dayData] of Object.entries(plan)) {
    const normalizedKey = normalizeDayName(dayKey);
    normalizedPlan[normalizedKey] = dayData;
  }
  plan = normalizedPlan;
  parsed[planKey] = plan;

  const dias = Object.keys(plan);
  if (dias.length === 0) {
    throw new Error('El plan no contiene dias.');
  }

  const momentosKeys = perfil.momentos.map((m: any) => m.key);
  const diasConMomentosVacios: string[] = [];

  for (const dia of dias) {
    const diaPlan = plan[dia];
    if (typeof diaPlan !== 'object' || diaPlan === null) {
      throw new Error(`El dia ${dia} no tiene formato valido.`);
    }
    for (const momento of momentosKeys) {
      if (!Array.isArray(diaPlan[momento])) {
        diaPlan[momento] = [];
      }
      if (diaPlan[momento].length === 0) {
        diasConMomentosVacios.push(`${dia}.${momento}`);
      }
    }
  }

  if (diasConMomentosVacios.length > 0) {
    throw new Error(`El plan generado esta incompleto. Faltan comidas en: ${diasConMomentosVacios.join(', ')}. Por favor, intenta generar el plan nuevamente.`);
  }

  if (!Array.isArray(parsed[supplementsKey])) {
    parsed[supplementsKey] = [];
  }

  return parsed;
}

export function parseJsonToData(jsonString: string, expectedPrefix: RawProfilePrefix): any {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('El archivo no tiene un formato JSON valido.');
  }

  return parseObjectToData(parsed, expectedPrefix);
}

export function buildExportData(parsed: any, expectedPrefix: RawProfilePrefix) {
  const perfilKey = `perfil${expectedPrefix}`;
  const equivKey = `equivalencias${expectedPrefix}`;
  const planKey = `plan${expectedPrefix}`;
  const supplementsKey = `suplementos${expectedPrefix}`;

  const normalized = parseObjectToData(parsed, expectedPrefix);

  return {
    [perfilKey]: normalized[perfilKey],
    [equivKey]: normalized[equivKey],
    [planKey]: normalized[planKey],
    [supplementsKey]: Array.isArray(normalized[supplementsKey]) ? normalized[supplementsKey] : [],
  };
}

/**
 * Downloads content as plain text using a .json extension.
 */
export function downloadJsonFile(fileName: string, content: string) {
  if (typeof document === 'undefined' || !document.body || typeof URL === 'undefined') {
    throw new Error('JSON download is unavailable in the current environment.');
  }

  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  try {
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    URL.revokeObjectURL(objectUrl);
  }
}
