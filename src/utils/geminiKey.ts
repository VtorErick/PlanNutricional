const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';

export function getEnvGeminiApiKey() {
  return ((import.meta as any).env?.GEMINI_API_KEY || '').trim();
}

export function getStoredGeminiApiKey() {
  try {
    return (localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function persistGeminiApiKey(apiKey: string) {
  try {
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmedKey);
      return;
    }
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
