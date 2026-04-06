import { Profile, Equivalencia, MealItem } from './types';

/**
 * Normaliza el nombre de un día: quita acentos, primera letra mayúscula, resto minúscula
 * Miércoles -> Miercoles, Sábado -> Sabado, lunes -> Lunes
 */
function normalizeDayName(day: string): string {
  const accents: Record<string, string> = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'ü': 'u', 'Ü': 'U', 'ñ': 'n', 'Ñ': 'N'
  };
  
  const withoutAccents = day.replace(/[áéíóúÁÉÍÓÚüÜñÑ]/g, char => accents[char] || char);
  return withoutAccents.charAt(0).toUpperCase() + withoutAccents.slice(1).toLowerCase();
}

/**
 * Parsea un JSON limpio y valida su estructura básica
 * Ahora es más permisivo para aceptar estructuras generadas por IA
 */
export function parseObjectToData(parsed: any, expectedPrefix: 'EL' | 'ELLA'): any {
  const perfilKey = `perfil${expectedPrefix}`;
  const equivKey = `equivalencias${expectedPrefix}`;
  const planKey = `plan${expectedPrefix}`;

  // Verificar que tenga las raíces esperadas
  if (!parsed[perfilKey] || !parsed[equivKey] || !parsed[planKey]) {
    const wrongPrefix = expectedPrefix === 'EL' ? 'ELLA' : 'EL';
    if (parsed[`perfil${wrongPrefix}`]) {
      const expectedLabel = expectedPrefix === 'EL' ? 'El' : 'Ella';
      const wrongLabel = wrongPrefix === 'EL' ? 'El' : 'Ella';
      throw new Error(`Intentaste subir un archivo de ${wrongLabel} en la sección de ${expectedLabel}. Sube el archivo correcto.`);
    }
    throw new Error(`El archivo JSON no contiene las estructuras requeridas (${perfilKey}, ${equivKey}, ${planKey}).`);
  }

  const perfil = parsed[perfilKey];
  // Validación permisiva: solo verificar que tenga nombre y momentos (array)
  if (!perfil.nombre || !Array.isArray(perfil.momentos)) {
    throw new Error('La estructura del perfil no coincide con el formato esperado. Faltan: nombre o momentos.');
  }

  const equivalencias = parsed[equivKey];
  if (!Array.isArray(equivalencias) || equivalencias.length === 0) {
    throw new Error('Las equivalencias deben ser un arreglo no vacío.');
  }

  let plan = parsed[planKey];
  if (typeof plan !== 'object' || plan === null) {
    throw new Error('El plan de comidas no tiene un formato válido.');
  }

  // Normalizar nombres de días (quitar acentos, estandarizar mayúsculas/minúsculas)
  const normalizedPlan: Record<string, any> = {};
  for (const [dayKey, dayData] of Object.entries(plan)) {
    const normalizedKey = normalizeDayName(dayKey);
    normalizedPlan[normalizedKey] = dayData;
  }
  plan = normalizedPlan;
  parsed[planKey] = plan;

  // Validar que el plan tenga al menos un día con momentos
  const dias = Object.keys(plan);
  if (dias.length === 0) {
    throw new Error('El plan no contiene días.');
  }

  // Validar que cada día tenga los momentos esperados Y que tengan comidas
  const momentosKeys = perfil.momentos.map((m: any) => m.key);
  const diasConMomentosVacios: string[] = [];
  
  for (const dia of dias) {
    const diaPlan = plan[dia];
    if (typeof diaPlan !== 'object' || diaPlan === null) {
      throw new Error(`El día ${dia} no tiene formato válido.`);
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

  // Validación estricta: rechazar planes con momentos vacíos
  if (diasConMomentosVacios.length > 0) {
    throw new Error(`El plan generado está incompleto. Faltan comidas en: ${diasConMomentosVacios.join(', ')}. Por favor, intenta generar el plan nuevamente.`);
  }

  return parsed;
}

export function parseJsonToData(jsonString: string, expectedPrefix: 'EL' | 'ELLA'): any {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('El archivo no tiene un formato JSON válido.');
  }

  return parseObjectToData(parsed, expectedPrefix);
}

/**
 * Descarga el contenido como texto con extension .json
 */
export function downloadJsonFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


