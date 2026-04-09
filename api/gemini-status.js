import { applyCorsHeaders, enforceRateLimit } from './_requestGuard.js';

function normalizeModelName(modelName) {
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

function modelSupportsGenerateContent(model) {
  const methods = model?.supportedGenerationMethods || [];
  return methods.includes('generateContent');
}

function isTextGenerationModel(modelName) {
  const normalized = normalizeModelName(modelName).toLowerCase();
  return TEXT_GENERATION_MODEL_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function listAvailableModels(apiKey) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || 'No fue posible listar modelos disponibles de Gemini.');
  }

  return (json?.models || []).filter(
    (model) => modelSupportsGenerateContent(model) && isTextGenerationModel(model?.name)
  );
}

function getModelFamilyKey(name) {
  return normalizeModelName(name)
    .toLowerCase()
    .replace(/-001$/i, '')
    .replace(/-customtools$/i, '');
}

function getUniqueModelNames(modelNames, preferredModelRaw) {
  const preferredModel = normalizeModelName(preferredModelRaw);
  const rawUniqueNames = [...new Set(modelNames.map((name) => normalizeModelName(name)).filter(Boolean))];
  const sourceNames = preferredModel ? [preferredModel, ...rawUniqueNames] : rawUniqueNames;
  const seenFamilies = new Set();
  const uniqueNames = [];

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

function getOrderedModels(models, preferredModelRaw) {
  const preferredModel = normalizeModelName(preferredModelRaw);
  const remaining = getUniqueModelNames(
    models.map((model) => normalizeModelName(model.name)),
    preferredModelRaw
  );
  const ordered = [];

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

async function verifyGeneration(apiKey, modelName) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
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
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json?.error?.message || `Error ${res.status} validando Gemini.`);
    } catch {
      throw new Error(text || `Error ${res.status} validando Gemini.`);
    }
  }

  return true;
}

function buildUserMessage({ keySource, selectedModel, envModel, generationChecked }) {
  const sourceText = keySource === 'custom' ? 'clave personal' : 'clave del entorno';
  const modelText = selectedModel || envModel || 'sin modelo disponible';

  if (generationChecked) {
    return `Se validó la ${sourceText} y el modelo ${modelText} respondió correctamente.`;
  }

  return `Se detectó la ${sourceText}. Modelo recomendado disponible: ${modelText}.`;
}

export default async function handler(req, res) {
  const requestMeta = applyCorsHeaders(req, res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    if (!requestMeta.trustedRequest) {
      return res.status(403).end();
    }
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!requestMeta.trustedRequest) {
    return res.status(403).json({
      ok: false,
      error: 'Origen no permitido. Usa la app desde el mismo dominio para validar Gemini.',
    });
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'gemini-status',
    windowMs: 60 * 1000,
    maxRequests: 20,
  });

  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  if (!rateLimit.ok) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      error: `Demasiadas validaciones seguidas. Intenta de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      availableModels: [],
      selectedModel: '',
    });
  }

  try {
    let payload = req.body;

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({
          ok: false,
          error: 'Body inválido. Debe ser JSON.',
          availableModels: [],
          selectedModel: '',
        });
      }
    }

    payload = payload && typeof payload === 'object' ? payload : {};

    const customApiKey = typeof payload.customApiKey === 'string' ? payload.customApiKey.trim() : '';
    const envApiKey = (process.env.GEMINI_API_KEY || '').trim();
    const apiKey = customApiKey || envApiKey;
    const keySource = customApiKey ? 'custom' : 'env';
    const envModel = (process.env.GEMINI_MODEL || '').trim();
    const preferredModel = typeof payload.preferredModel === 'string' ? payload.preferredModel.trim() : '';
    const generationChecked = Boolean(payload.checkGeneration);

    if (!apiKey) {
      return res.status(400).json({
        ok: false,
        error: 'No hay una API key configurada. Agrega tu GEMINI_API_KEY en Vercel o una clave personalizada.',
        keySource,
        envModel,
        availableModels: [],
        selectedModel: '',
      });
    }

    const models = await listAvailableModels(apiKey);
    const availableModels = models.map((model) => normalizeModelName(model.name));
    const orderedModels = getOrderedModels(models, preferredModel || envModel);
    let selectedModel = orderedModels[0] || '';

    if (!selectedModel) {
      return res.status(400).json({
        ok: false,
        error: 'La API key es válida, pero no tiene modelos con generateContent disponibles.',
        keySource,
        envModel,
        availableModels,
        selectedModel: '',
      });
    }

    if (generationChecked) {
      let lastError = '';

      for (const candidateModel of orderedModels) {
        try {
          await verifyGeneration(apiKey, candidateModel);
          selectedModel = candidateModel;
          lastError = '';
          break;
        } catch (error) {
          lastError = error?.message || 'No fue posible validar el modelo.';
        }
      }

      if (lastError) {
        throw new Error(lastError);
      }
    }

    return res.status(200).json({
      ok: true,
      keySource,
      envModel,
      preferredModel,
      selectedModel,
      availableModels,
      generationChecked,
      message: buildUserMessage({ keySource, selectedModel, envModel, generationChecked }),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'No fue posible validar la API key de Gemini.',
      availableModels: [],
      selectedModel: '',
    });
  }
}
