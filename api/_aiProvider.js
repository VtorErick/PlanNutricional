export const AI_PROVIDER_DEEPSEEK = 'deepseek';
export const AI_PROVIDER_GEMINI = 'gemini';

export function normalizeAiProvider(value) {
  const normalized = String(value || '').trim().replace(/^['"]|['"]$/g, '').toLowerCase();

  if (!normalized || normalized === AI_PROVIDER_DEEPSEEK) {
    return AI_PROVIDER_DEEPSEEK;
  }

  if (normalized === AI_PROVIDER_GEMINI) {
    return AI_PROVIDER_GEMINI;
  }

  return AI_PROVIDER_DEEPSEEK;
}
