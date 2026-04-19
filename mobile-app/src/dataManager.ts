import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { Profile, Equivalencia, MealItem } from './types';
import { normalizeProfileSummary } from './utils/profileSummary';
import { rehydratePlanRecord } from './data/mealsDB';
import { supplementsDatabase } from './data/supplementsDB';
import { equivalenciasEL } from './data/perfil-el';
import { equivalenciasELLA } from './data/perfil-ella';
import { defaultSupplements } from './data/defaultSupplements';
import { hydrateSupplementFromReference } from './utils/nutritionValidation';
import { repairTextArtifactsDeep } from './utils/text';

type RawProfilePrefix = 'EL' | 'ELLA';

function cloneSerializableData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeDayName(day: string): string {
  const withoutAccents = day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return withoutAccents.charAt(0).toUpperCase() + withoutAccents.slice(1).toLowerCase();
}

export function parseObjectToData(parsed: any, expectedPrefix: RawProfilePrefix): any {
  parsed = repairTextArtifactsDeep(cloneSerializableData(parsed));
  const perfilKey = `perfil${expectedPrefix}`;
  const equivKey = `equivalencias${expectedPrefix}`;
  const planKey = `plan${expectedPrefix}`;
  const supplementsKey = `suplementos${expectedPrefix}`;

  if (!parsed[equivKey] || (Array.isArray(parsed[equivKey]) && parsed[equivKey].length === 0)) {
    parsed[equivKey] = expectedPrefix === 'EL' ? equivalenciasEL : equivalenciasELLA;
  }

  if (!parsed[perfilKey] || !parsed[planKey]) {
    const wrongPrefix = expectedPrefix === 'EL' ? 'ELLA' : 'EL';
    if (parsed[`perfil${wrongPrefix}`]) {
      const expectedLabel = expectedPrefix === 'EL' ? 'El' : 'Ella';
      const wrongLabel = wrongPrefix === 'EL' ? 'El' : 'Ella';
      throw new Error(`Intentaste subir un archivo de ${wrongLabel} en la seccion de ${expectedLabel}. Sube el archivo correcto.`);
    }
    throw new Error(`El archivo JSON no contiene las estructuras requeridas (${perfilKey}, ${planKey}).`);
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
  } else {
    const supplementCatalog = [
      ...defaultSupplements.el.map((item, index) => ({ ...item, id: `default_el_${index}` })),
      ...defaultSupplements.ella.map((item, index) => ({ ...item, id: `default_ella_${index}` })),
      ...supplementsDatabase.map((item) => ({
        ...item,
        notes: 'Complemento opcional; validar tolerancia y contexto clinico antes de usarlo.',
      })),
    ];
    parsed[supplementsKey] = parsed[supplementsKey]
      .map((supOp: string | any) => hydrateSupplementFromReference(supOp, supplementCatalog))
      .filter(Boolean);
  }

  parsed[planKey] = rehydratePlanRecord(parsed[planKey], expectedPrefix);

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

  const normalized = parseObjectToData(cloneSerializableData(parsed), expectedPrefix);

  return {
    [perfilKey]: normalized[perfilKey],
    [equivKey]: normalized[equivKey],
    [planKey]: normalized[planKey],
    [supplementsKey]: Array.isArray(normalized[supplementsKey]) ? normalized[supplementsKey] : [],
  };
}

export async function downloadJsonFile(fileName: string, content: string) {
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('La opcion de compartir archivos no esta disponible en este dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: fileName,
    UTI: 'public.json',
  });
}
