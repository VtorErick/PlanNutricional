import { DEFAULT_GEMINI_MODEL, normalizeModelName } from '../utils/geminiModels';

export interface GeminiStatusResponse {
  ok: boolean;
  error?: string;
  message?: string;
  keySource?: 'env' | 'custom';
  envModel?: string;
  preferredModel?: string;
  selectedModel: string;
  availableModels: string[];
  orderedModels: string[];
  fallbackModels: string[];
  generationChecked?: boolean;
}

interface FetchGeminiStatusOptions {
  preferredModel?: string;
  checkGeneration?: boolean;
  customApiKey?: string;
}

function buildFallbackError(error: string): GeminiStatusResponse {
  return {
    ok: false,
    error,
    envModel: DEFAULT_GEMINI_MODEL,
    selectedModel: '',
    availableModels: [],
    orderedModels: [],
    fallbackModels: [],
  };
}

export async function fetchGeminiStatus(
  options: FetchGeminiStatusOptions = {}
): Promise<GeminiStatusResponse> {
  try {
    const response = await fetch('/api/gemini-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredModel: normalizeModelName(options.preferredModel || '') || undefined,
        checkGeneration: Boolean(options.checkGeneration),
        customApiKey: options.customApiKey?.trim() || undefined,
      }),
    });

    const json = await response.json().catch(() => null);

    if (response.ok) {
      return {
        ok: Boolean(json?.ok),
        error: json?.error,
        message: json?.message,
        keySource: json?.keySource === 'custom' ? 'custom' : json?.keySource === 'env' ? 'env' : undefined,
        envModel: normalizeModelName(json?.envModel || DEFAULT_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL,
        preferredModel: normalizeModelName(json?.preferredModel || options.preferredModel || ''),
        selectedModel: normalizeModelName(json?.selectedModel || ''),
        availableModels: Array.isArray(json?.availableModels)
          ? json.availableModels.map((model: string) => normalizeModelName(model)).filter(Boolean)
          : [],
        orderedModels: Array.isArray(json?.orderedModels)
          ? json.orderedModels.map((model: string) => normalizeModelName(model)).filter(Boolean)
          : [],
        fallbackModels: Array.isArray(json?.fallbackModels)
          ? json.fallbackModels.map((model: string) => normalizeModelName(model)).filter(Boolean)
          : [],
        generationChecked: Boolean(json?.generationChecked),
      };
    }

    return buildFallbackError(json?.error || `Error ${response.status} validando Gemini.`);
  } catch {
    return buildFallbackError(
      'No fue posible validar Gemini desde el servidor. Revisa que el backend local o Vercel este disponible.'
    );
  }
}
