import { readStorageValue, removeStorageValue, writeStorageValue } from './safeStorage';

const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function getStoredGeminiApiKey() {
  if (typeof window === 'undefined') return '';

  const sessionValue = readStorageValue(window.sessionStorage, GEMINI_API_KEY_STORAGE_KEY);
  if (sessionValue) return sessionValue;

  const legacyLocalValue = readStorageValue(window.localStorage, GEMINI_API_KEY_STORAGE_KEY);
  if (!legacyLocalValue) return '';

  if (!writeStorageValue(window.sessionStorage, GEMINI_API_KEY_STORAGE_KEY, legacyLocalValue)) {
    return legacyLocalValue;
  }

  removeStorageValue(window.localStorage, GEMINI_API_KEY_STORAGE_KEY);
  return legacyLocalValue;
}

export function persistGeminiApiKey(apiKey: string) {
  if (typeof window === 'undefined') return;

  const trimmedKey = apiKey.trim();
  removeStorageValue(window.localStorage, GEMINI_API_KEY_STORAGE_KEY);

  if (trimmedKey) {
    writeStorageValue(window.sessionStorage, GEMINI_API_KEY_STORAGE_KEY, trimmedKey);
    return;
  }

  removeStorageValue(window.sessionStorage, GEMINI_API_KEY_STORAGE_KEY);
}
