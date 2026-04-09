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
  if (!modelName) return '';
  return modelName.replace(/^models\//, '').trim();
}

const TEXT_GENERATION_MODEL_PATTERNS = [
  /^gemini-2\.5-flash$/i,
  /^gemini-3-flash-preview$/i,
  /^gemini-2\.5-flash-lite$/i,
  /^gemini-3\.1-flash-lite-preview$/i,
  /^gemini-2\.5-pro$/i,
  /^gemini-3\.1-pro-preview(?:-customtools)?$/i,
  /^gemini-2\.0-flash(?:-001)?$/i,
  /^gemini-2\.0-flash-lite(?:-001)?$/i,
  /^gemini-flash-latest$/i,
  /^gemini-flash-lite-latest$/i,
  /^gemini-pro-latest$/i,
];
const MODEL_PRIORITY_MATCHERS = [
  /^gemini-2\.5-flash$/i,
  /^gemini-3-flash-preview$/i,
  /^gemini-2\.5-flash-lite$/i,
  /^gemini-3\.1-flash-lite-preview$/i,
  /^gemini-2\.0-flash(?:-001)?$/i,
  /^gemini-2\.0-flash-lite(?:-001)?$/i,
  /^gemini-2\.5-pro$/i,
  /^gemini-3\.1-pro-preview(?:-customtools)?$/i,
  /^gemini-flash-latest$/i,
  /^gemini-flash-lite-latest$/i,
  /^gemini-pro-latest$/i,
];

function modelSupportsGenerateContent(model: any) {
  return (model?.supportedGenerationMethods || []).includes('generateContent');
}

function isTextGenerationModel(modelName: string) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  return TEXT_GENERATION_MODEL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getModelFamilyKey(name: string) {
  return normalizeModelName(name)
    .toLowerCase()
    .replace(/-001$/i, '')
    .replace(/-customtools$/i, '');
}

function getUniqueModelNames(modelNames: string[], preferredModelRaw?: string) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const rawUniqueNames = [...new Set(modelNames.map((name) => normalizeModelName(name)).filter(Boolean))];
  const sourceNames = preferredModel ? [preferredModel, ...rawUniqueNames] : rawUniqueNames;
  const seenFamilies = new Set<string>();
  const uniqueNames: string[] = [];

  sourceNames.forEach((name) => {
    if (!rawUniqueNames.includes(name)) {
      return;
    }

    const familyKey = getModelFamilyKey(name);
    if (seenFamilies.has(familyKey)) {
      return;
    }

    seenFamilies.add(familyKey);
    uniqueNames.push(name);
  });

  return uniqueNames;
}

function getOrderedModels(models: any[], preferredModelRaw?: string) {
  const preferredModel = normalizeModelName(preferredModelRaw || '');
  const remaining = getUniqueModelNames(
    models.map((model) => normalizeModelName(model.name)),
    preferredModelRaw
  );
  const ordered: string[] = [];

  if (preferredModel && remaining.includes(preferredModel)) {
    ordered.push(preferredModel);
  }

  MODEL_PRIORITY_MATCHERS.forEach((matcher) => {
    const match = remaining.find((name) => matcher.test(name) && !ordered.includes(name));
    if (match) {
      ordered.push(match);
    }
  });

  remaining.forEach((name) => {
    if (!ordered.includes(name)) {
      ordered.push(name);
    }
  });

  return ordered;
}

async function listAvailableModelsDirect(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error?.message || `Error ${response.status} validando Gemini.`);
  }

  return (json?.models || []).filter(
    (model: any) => modelSupportsGenerateContent(model) && isTextGenerationModel(model?.name)
  );
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
