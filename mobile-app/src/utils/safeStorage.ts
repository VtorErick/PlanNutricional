import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function readStorageValue(key: string) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value?.trim() || '';
  } catch (error) {
    console.warn(`Error reading storage key "${key}":`, error);
    reportStorageError(key, 'read', `No se pudo leer "${key}" del almacenamiento local.`);
    return '';
  }
}

export async function writeStorageValue(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error writing storage key "${key}":`, error);
    reportStorageError(key, 'write', `No se pudo guardar "${key}" en el almacenamiento local.`);
    return false;
  }
}

export async function removeStorageValue(key: string) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing storage key "${key}":`, error);
    reportStorageError(key, 'write', `No se pudo limpiar "${key}" del almacenamiento local.`);
    return false;
  }
}
