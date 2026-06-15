export const APP_STORAGE_KEYS = [
  'darkMode',
  'diaActivo',
  'seleccionesDieta',
  'comprasCheck',
  'dataVersions',
  'customData',
  'profileLabels',
  'geminiApiKey',
  'geminiModel',
  'perfilActivo',
] as const;

function clearStorageKeys(storage: Storage) {
  APP_STORAGE_KEYS.forEach((key) => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove storage key "${key}":`, error);
    }
  });
}

export function clearAppStorage() {
  if (typeof window === 'undefined') return;

  try {
    clearStorageKeys(window.localStorage);
  } catch (error) {
    console.warn('Failed to clear app localStorage keys:', error);
  }

  try {
    clearStorageKeys(window.sessionStorage);
  } catch (error) {
    console.warn('Failed to clear app sessionStorage keys:', error);
  }
}
