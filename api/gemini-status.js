import { applyCorsHeaders, enforceRateLimit } from './_requestGuard.js';
import {
  DEFAULT_GEMINI_MODEL,
  getGeminiFallbackModels,
  getOrderedGeminiModels,
  isSupportedGeminiTextModel,
  modelSupportsGenerateContent,
  normalizeModelName,
} from './_geminiModels.js';

async function listAvailableModels(apiKey) {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: {
      'x-goog-api-key': apiKey,
    },
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || 'No fue posible listar modelos disponibles de Gemini.');
  }

  return (json?.models || []).filter(
    (model) => modelSupportsGenerateContent(model) && isSupportedGeminiTextModel(model?.name)
  );
}

async function verifyGeneration(apiKey, modelName) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Responde solo: ok' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 32,
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

function buildEnvModelMessage({ selectedModel, envModel, generationChecked }) {
  const modelText = selectedModel || envModel || 'sin modelo disponible';

  if (generationChecked) {
    return `Se valido GEMINI_API_KEY del entorno y el modelo ${modelText} respondio correctamente.`;
  }

  return `Se detecto GEMINI_API_KEY del entorno. Modelo recomendado disponible: ${modelText}.`;
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
    const apiKey = customApiKey || (process.env.GEMINI_API_KEY || '').trim();
    const keySource = customApiKey ? 'custom' : 'env';
    const envModel = normalizeModelName(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;
    const preferredModel =
      normalizeModelName(typeof payload.preferredModel === 'string' ? payload.preferredModel.trim() : '') ||
      envModel;
    const generationChecked = Boolean(payload.checkGeneration);

    if (!apiKey) {
      return res.status(400).json({
        ok: false,
        error: 'No hay una API key configurada. Define GEMINI_API_KEY en el entorno del servidor o usa una clave personalizada.',
        keySource,
        envModel,
        availableModels: [],
        selectedModel: '',
      });
    }

    const models = await listAvailableModels(apiKey);
    const availableModels = models.map((model) => normalizeModelName(model.name));
    const orderedModels = getOrderedGeminiModels(availableModels, preferredModel || envModel);
    let selectedModel = orderedModels[0] || '';
    let fallbackModels = getGeminiFallbackModels(availableModels, selectedModel || preferredModel || envModel);

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

    fallbackModels = getGeminiFallbackModels(availableModels, selectedModel);

    return res.status(200).json({
      ok: true,
      keySource,
      envModel,
      preferredModel,
      selectedModel,
      availableModels,
      orderedModels,
      fallbackModels,
      generationChecked,
      message: customApiKey
        ? buildUserMessage({ keySource, selectedModel, envModel, generationChecked })
        : buildEnvModelMessage({ selectedModel, envModel, generationChecked }),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'No fue posible validar la API key de Gemini.',
      availableModels: [],
      selectedModel: '',
      fallbackModels: [],
    });
  }
}
