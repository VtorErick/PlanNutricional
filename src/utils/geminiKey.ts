const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function safeRead(storage: Storage | undefined, key: string) {
  if (!storage) return '';

  try {
    return (storage.getItem(key) || '').trim();
  } catch {
    return '';
  }
}

function safeRemove(storage: Storage | undefined, key: string) {
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function getStoredGeminiApiKey() {
  if (typeof window === 'undefined') return '';

  const sessionValue = safeRead(window.sessionStorage, GEMINI_API_KEY_STORAGE_KEY);
  if (sessionValue) return sessionValue;

  const legacyLocalValue = safeRead(window.localStorage, GEMINI_API_KEY_STORAGE_KEY);
  if (!legacyLocalValue) return '';

  try {
    window.sessionStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, legacyLocalValue);
  } catch {
    return legacyLocalValue;
  }

  safeRemove(window.localStorage, GEMINI_API_KEY_STORAGE_KEY);
  return legacyLocalValue;
}

export function persistGeminiApiKey(apiKey: string) {
  if (typeof window === 'undefined') return;

  const trimmedKey = apiKey.trim();
  safeRemove(window.localStorage, GEMINI_API_KEY_STORAGE_KEY);

  try {
    if (trimmedKey) {
      window.sessionStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmedKey);
      return;
    }

    window.sessionStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
