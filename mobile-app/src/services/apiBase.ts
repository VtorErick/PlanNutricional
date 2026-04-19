function normalizeApiBaseUrl(rawValue: string) {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return '';
  }

  try {
    const url = new URL(trimmedValue);
    return url.origin;
  } catch {
    return trimmedValue.replace(/\/+$/, '');
  }
}

export const API_BASE = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || '');
export const HAS_API_BASE = API_BASE.length > 0;
export const DIRECT_GEMINI_API_KEY = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
export const HAS_DIRECT_GEMINI_KEY = DIRECT_GEMINI_API_KEY.length > 0;
export const HAS_AI_PROVIDER = HAS_API_BASE || HAS_DIRECT_GEMINI_KEY;

export const AI_BACKEND_REQUIRED_MESSAGE =
  'Configura EXPO_PUBLIC_API_BASE_URL o EXPO_PUBLIC_GEMINI_API_KEY para habilitar IA en mobile.';
