import { DEFAULT_GEMINI_MODEL, normalizeModelName } from '../utils/geminiModels';
import {
  API_BASE,
  AI_BACKEND_REQUIRED_MESSAGE,
  DIRECT_GEMINI_API_KEY,
  HAS_API_BASE,
  HAS_DIRECT_GEMINI_KEY,
} from './apiBase';

export type GeminiStatusMode = 'ready' | 'offline' | 'not-configured' | 'error';

export interface GeminiStatusResponse {
  ok: boolean;
  error?: string;
  message?: string;
  mode?: GeminiStatusMode;
  keySource?: 'env';
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
}

function buildFallbackError(error: string, mode: GeminiStatusMode): GeminiStatusResponse {
  return {
    ok: false,
    error,
    mode,
    envModel: DEFAULT_GEMINI_MODEL,
    selectedModel: '',
    availableModels: [],
    orderedModels: [],
    fallbackModels: [],
  };
}

function buildDirectKeyStatus(options: FetchGeminiStatusOptions): GeminiStatusResponse {
  const preferredModel = normalizeModelName(options.preferredModel || DEFAULT_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;

  return {
    ok: true,
    mode: 'ready',
    message: 'IA directa habilitada desde mobile con EXPO_PUBLIC_GEMINI_API_KEY.',
    envModel: preferredModel,
    preferredModel,
    selectedModel: preferredModel,
    availableModels: [preferredModel],
    orderedModels: [preferredModel],
    fallbackModels: [],
    generationChecked: false,
  };
}

async function fetchServerStatus(options: FetchGeminiStatusOptions): Promise<GeminiStatusResponse> {
  const response = await fetch(`${API_BASE}/api/gemini-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Platform': 'android',
    },
    body: JSON.stringify({
      preferredModel: normalizeModelName(options.preferredModel || '') || undefined,
      checkGeneration: Boolean(options.checkGeneration),
    }),
  });

  const json = await response.json().catch(() => null);

  if (response.ok) {
    return {
      ok: Boolean(json?.ok),
      error: json?.error,
      message: json?.message,
      mode: Boolean(json?.ok) ? 'ready' : 'error',
      keySource: json?.keySource === 'env' ? 'env' : undefined,
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

  return buildFallbackError(json?.error || `Error ${response.status} validando Gemini.`, 'error');
}

async function fetchDirectStatus(options: FetchGeminiStatusOptions): Promise<GeminiStatusResponse> {
  const preferredModel = normalizeModelName(options.preferredModel || DEFAULT_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;

  if (!options.checkGeneration) {
    return buildDirectKeyStatus(options);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${DIRECT_GEMINI_API_KEY}`
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return buildFallbackError(
      `No fue posible validar la API key directa de Gemini (${response.status}). ${body.slice(0, 180)}`,
      'error'
    );
  }

  const json = await response.json().catch(() => null);
  const names: string[] = Array.isArray(json?.models)
    ? json.models
        .map((item: any) => normalizeModelName(item?.name || ''))
        .filter(Boolean)
        .map((model: string) => model)
    : [];

  return {
    ok: true,
    mode: 'ready',
    message: 'IA directa validada desde la app mobile.',
    envModel: preferredModel,
    preferredModel,
    selectedModel: preferredModel,
    availableModels: names,
    orderedModels: names,
    fallbackModels: names.filter((model) => model !== preferredModel),
    generationChecked: true,
  };
}

export async function fetchGeminiStatus(
  options: FetchGeminiStatusOptions = {}
): Promise<GeminiStatusResponse> {
  if (!HAS_API_BASE && !HAS_DIRECT_GEMINI_KEY) {
    return buildFallbackError(AI_BACKEND_REQUIRED_MESSAGE, 'not-configured');
  }

  if (!HAS_API_BASE && HAS_DIRECT_GEMINI_KEY) {
    try {
      return await fetchDirectStatus(options);
    } catch {
      return buildFallbackError('No se pudo validar Gemini en modo directo.', 'offline');
    }
  }

  try {
    return await fetchServerStatus(options);
  } catch {
    return buildFallbackError('No fue posible validar Gemini desde el servidor.', 'offline');
  }
}
