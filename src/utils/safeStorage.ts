import { dispatchAppStorageError } from './storageEvents';

function reportStorageError(
  key: string,
  operation: 'read' | 'write',
  fallbackMessage: string
) {
  dispatchAppStorageError({
    key,
    operation,
    message: fallbackMessage,
  });
}

export function readStorageValue(storage: Storage | undefined, key: string) {
  if (!storage) return '';

  try {
    return (storage.getItem(key) || '').trim();
  } catch (error) {
    console.warn(`Error reading storage key "${key}":`, error);
    reportStorageError(key, 'read', `No se pudo leer "${key}" del almacenamiento local.`);
    return '';
  }
}

export function writeStorageValue(storage: Storage | undefined, key: string, value: string) {
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error writing storage key "${key}":`, error);
    reportStorageError(key, 'write', `No se pudo guardar "${key}" en el almacenamiento local.`);
    return false;
  }
}

export function removeStorageValue(storage: Storage | undefined, key: string) {
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing storage key "${key}":`, error);
    reportStorageError(key, 'write', `No se pudo limpiar "${key}" del almacenamiento local.`);
    return false;
  }
}
