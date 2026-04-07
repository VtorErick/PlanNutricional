import { DEFAULT_GEMINI_MODEL } from '../utils/geminiKey';

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

function normalizeModelName(modelName: string) {
  return modelName.replace(/^models\//, '').trim();
}

function modelSupportsGenerateContent(model: any) {
  return (model?.supportedGenerationMethods || []).includes('generateContent');
}

function getModelPriority(name: string) {
  const normalized = normalizeModelName(name);
  const priorityMatchers = [
    /^gemini-2\.5-pro/i,
    /^gemini-2\.5-flash/i,
    /^gemini-2\.0-flash/i,
    /^gemini-2\.5-flash-lite/i,
    /^gemini-2\.0-flash-lite/i,
    /^gemini-1\.5-pro/i,
    /^gemini-1\.5-flash/i,
    /^gemini-flash-latest/i,
    /^gemini-2\.0-pro/i,
  ];

  const idx = priorityMatchers.findIndex((matcher) => matcher.test(normalized));
  return idx === -1 ? priorityMatchers.length + 1 : idx;
}

function getOrderedModels(models: any[], preferredModelRaw?: string) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const names = models.map((model) => normalizeModelName(model.name));

  return [...names].sort((a, b) => {
    if (preferredModel) {
      if (a === preferredModel) return -1;
      if (b === preferredModel) return 1;
    }

    return getModelPriority(a) - getModelPriority(b);
  });
}

async function listAvailableModelsDirect(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error?.message || `Error ${response.status} validando Gemini.`);
  }

  return (json?.models || []).filter(modelSupportsGenerateContent);
}

async function verifyGenerationDirect(apiKey: string, modelName: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Responde solo: ok' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4,
          temperature: 0,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();

    try {
      const json = JSON.parse(text);
      throw new Error(json?.error?.message || `Error ${response.status} validando Gemini.`);
    } catch {
      throw new Error(text || `Error ${response.status} validando Gemini.`);
    }
  }
}

function buildUserMessage({
  keySource,
  selectedModel,
  envModel,
  generationChecked,
}: {
  keySource: 'custom' | 'env';
  selectedModel: string;
  envModel?: string;
  generationChecked?: boolean;
}) {
  const sourceText = keySource === 'custom' ? 'clave personal' : 'clave del entorno';
  const modelText = selectedModel || envModel || 'sin modelo disponible';

  if (generationChecked) {
    return `Se valido la ${sourceText} y el modelo ${modelText} respondio correctamente.`;
  }

  return `Se detecto la ${sourceText}. Modelo recomendado disponible: ${modelText}.`;
}

async function fetchGeminiStatusDirect(
  options: FetchGeminiStatusOptions = {}
): Promise<GeminiStatusResponse> {
  const customApiKey = options.customApiKey?.trim() || '';
  const apiKey = customApiKey;
  const keySource: 'custom' | 'env' = 'custom';
  const envModel = DEFAULT_GEMINI_MODEL;

  if (!apiKey) {
    return {
      ok: false,
      error:
        'No hay una clave personalizada disponible en el navegador. Usa la API del servidor o pega tu propia clave.',
      keySource,
      envModel,
      selectedModel: '',
      availableModels: [],
    };
  }

  const models = await listAvailableModelsDirect(apiKey);
  const availableModels = models.map((model: any) => normalizeModelName(model.name));
  const orderedModels = getOrderedModels(models, options.preferredModel || envModel);
  let selectedModel = orderedModels[0] || '';

  if (!selectedModel) {
    return {
      ok: false,
      error: 'La API key es valida, pero no tiene modelos con generateContent disponibles.',
      keySource,
      envModel,
      preferredModel: options.preferredModel,
      selectedModel: '',
      availableModels,
      generationChecked: Boolean(options.checkGeneration),
    };
  }

  if (options.checkGeneration) {
    let lastError = '';

    for (const candidateModel of orderedModels) {
      try {
        await verifyGenerationDirect(apiKey, candidateModel);
        selectedModel = candidateModel;
        lastError = '';
        break;
      } catch (error: any) {
        lastError = error?.message || 'No fue posible validar el modelo.';
      }
    }

    if (lastError) {
      return {
        ok: false,
        error: lastError,
        keySource,
        envModel,
        preferredModel: options.preferredModel,
        selectedModel: '',
        availableModels,
        generationChecked: true,
      };
    }
  }

  return {
    ok: true,
    keySource,
    envModel,
    preferredModel: options.preferredModel,
    selectedModel,
    availableModels,
    generationChecked: Boolean(options.checkGeneration),
    message: buildUserMessage({
      keySource,
      selectedModel,
      envModel,
      generationChecked: options.checkGeneration,
    }),
  };
}

export async function fetchGeminiStatus(
  options: FetchGeminiStatusOptions = {}
): Promise<GeminiStatusResponse> {
  if (options.customApiKey?.trim()) {
    return fetchGeminiStatusDirect(options);
  }

  try {
    const response = await fetch('/api/gemini-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customApiKey: options.customApiKey?.trim() || undefined,
        preferredModel: options.preferredModel || undefined,
        checkGeneration: options.checkGeneration || false,
      }),
    });

    const json = await response.json().catch(() => null);

    if (response.ok) {
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

    if (response.status !== 404) {
      return {
        ok: false,
        error: json?.error || `Error ${response.status} validando Gemini.`,
        selectedModel: '',
        availableModels: [],
      };
    }
  } catch {
    // Fall back to direct validation only for user-supplied API keys.
  }

  return {
    ok: false,
    error:
      'No fue posible validar Gemini desde el servidor. Si quieres probar en cliente, pega una clave personalizada.',
    selectedModel: '',
    availableModels: [],
  };
}
