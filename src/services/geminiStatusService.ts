export interface GeminiStatusResponse {
  ok: boolean;
  error?: string;
  message?: string;
  keySource?: 'custom' | 'env';
  envModel?: string;
  preferredModel?: string;
  selectedModel: string;
  availableModels: string[];
  generationChecked?: boolean;
}

interface FetchGeminiStatusOptions {
  customApiKey?: string;
  preferredModel?: string;
  checkGeneration?: boolean;
}

export async function fetchGeminiStatus(options: FetchGeminiStatusOptions = {}): Promise<GeminiStatusResponse> {
  const res = await fetch('/api/gemini-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customApiKey: options.customApiKey?.trim() || undefined,
      preferredModel: options.preferredModel || undefined,
      checkGeneration: options.checkGeneration || false,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error || `Error ${res.status} validando Gemini.`,
      selectedModel: '',
      availableModels: [],
    };
  }

  return {
    ok: Boolean(json?.ok),
    error: json?.error,
    message: json?.message,
    keySource: json?.keySource,
    envModel: json?.envModel,
    preferredModel: json?.preferredModel,
    selectedModel: json?.selectedModel || '',
    availableModels: Array.isArray(json?.availableModels) ? json.availableModels : [],
    generationChecked: Boolean(json?.generationChecked),
  };
}
