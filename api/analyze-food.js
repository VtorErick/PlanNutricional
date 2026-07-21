import { applyCorsHeaders, enforceRateLimit } from './_requestGuard.js';
import { AI_PROVIDER_GEMINI, normalizeAiProvider } from './_aiProvider.js';
import { DEFAULT_DEEPSEEK_MODEL, isSupportedDeepSeekModel, normalizeDeepSeekModelName } from './_deepseekModels.js';
import { callDeepSeekChatCompletion } from './_deepseekClient.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DESCRIPTION_CHARS = 600;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Vision providers use the OpenAI-compatible chat-completions shape.
// Qwen is preferred when QWEN_API_KEY exists. Zhipu GLM-4.6V-Flash remains the
// no-cost option and the default for a generic VISION_API_KEY.
const VISION_PROVIDER_QWEN = 'qwen';
const VISION_PROVIDER_ZHIPU = 'zhipu';
const QWEN_VISION_API_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN_VISION_MODEL = 'qwen3-vl-flash';
const ZHIPU_VISION_API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const ZHIPU_VISION_MODEL = 'glm-4.6v-flash';

const ANALYSIS_JSON_CONTRACT = `{
  "nombre": "Nombre corto y apetitoso del platillo",
  "detalle": "Descripcion de 1-2 lineas con ingredientes visibles o mencionados",
  "porciones": "Cantidad estimada legible, ej. '1 porcion (350 g)'",
  "caloriasKcal": 0,
  "proteinaG": 0,
  "grasasG": 0,
  "carbohidratosG": 0,
  "confianza": "alta|media|baja",
  "supuestos": ["supuesto importante sobre porcion o preparacion"],
  "super": ["ingrediente 1", "ingrediente 2"],
  "tags": ["casero"]
}`;

function buildAnalysisPrompt({ source, description }) {
  const intro = source === 'image'
    ? `Analiza la foto de comida adjunta e identifica el platillo principal.${description ? ` El usuario agrega este contexto: "${description}".` : ''}`
    : `Analiza esta descripcion de comida: "${description}".`;

  return `${intro}
Estima sus valores nutricionales de forma conservadora para UNA porcion individual (lo que una persona comeria).
Si hay varios alimentos, resume el plato completo en un solo platillo.
Responde SOLO con un objeto JSON valido (sin markdown, sin texto extra) con exactamente esta estructura:
${ANALYSIS_JSON_CONTRACT}
Reglas:
- "caloriasKcal", "proteinaG", "grasasG" y "carbohidratosG" deben ser numeros enteros, nunca strings.
- Calcula las calorias de forma coherente con los macros (aprox. 4 kcal/g de proteina y carbohidrato, 9 kcal/g de grasa).
- No inventes marcas, ingredientes ocultos ni cantidades que la foto no permita sostener.
- Usa "confianza": "alta" solo si alimento y porcion son claros; "media" si estimas parte de la porcion; "baja" si hay ingredientes, aceite o cantidades ambiguas.
- "supuestos" contiene maximo 3 dudas concretas y cortas; usa [] si no hay ninguna relevante.
- "super" es la lista de ingredientes de supermercado detectados (maximo 8, en espanol, cortos).
- "detalle" maximo 2 lineas, en espanol.
- Si no puedes identificar la comida, responde tu mejor estimacion con el nombre mas generico razonable.`;
}

function toSafeInt(value, { min = 0, max = 5000, fallback = 0 } = {}) {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function toSafeString(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeConfidence(value) {
  const normalized = toSafeString(value, 16).toLowerCase();
  if (normalized === 'alta' || normalized === 'high') return 'alta';
  if (normalized === 'baja' || normalized === 'low') return 'baja';
  return 'media';
}

function sanitizeAnalysis(raw, source) {
  if (!raw || typeof raw !== 'object') return null;

  const nombre = toSafeString(raw.nombre, 90);
  if (!nombre) return null;

  const superList = Array.isArray(raw.super)
    ? raw.super.map((item) => toSafeString(item, 60)).filter(Boolean).slice(0, 8)
    : [];
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((item) => toSafeString(item, 24)).filter(Boolean).slice(0, 5)
    : [];
  const assumptions = Array.isArray(raw.supuestos)
    ? raw.supuestos.map((item) => toSafeString(item, 120)).filter(Boolean).slice(0, 3)
    : [];
  const protein = toSafeInt(raw.proteinaG, { max: 300 });
  const fat = toSafeInt(raw.grasasG, { max: 300 });
  const carbs = toSafeInt(raw.carbohidratosG, { max: 500 });
  const reportedCalories = toSafeInt(raw.caloriasKcal, { max: 3000 });
  const caloriesFromMacros = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
  const calories = reportedCalories > 0 ? reportedCalories : caloriesFromMacros;
  if (calories <= 0) return null;

  const confidence = normalizeConfidence(raw.confianza || raw.confidence);
  const energyDelta = caloriesFromMacros > 0
    ? Math.abs(calories - caloriesFromMacros) / Math.max(calories, caloriesFromMacros)
    : 0;

  return {
    nombre,
    detalle: toSafeString(raw.detalle, 300) || 'Registro analizado con IA.',
    porciones: toSafeString(raw.porciones, 120) || '1 porcion estimada',
    caloriasKcal: calories,
    proteinaG: protein,
    grasasG: fat,
    carbohidratosG: carbs,
    confianza: confidence,
    necesitaRevision: confidence === 'baja' || energyDelta > 0.35,
    supuestos: assumptions,
    super: superList,
    tags: Array.from(new Set([...(source === 'image' ? ['foto'] : []), ...tags])).slice(0, 5),
  };
}

function extractJsonObject(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function classifyProviderError(status, message) {
  const normalized = String(message || '').toLowerCase();
  if (status === 402 || normalized.includes('insufficient balance') || normalized.includes('saldo') || normalized.includes('balance')) {
    return {
      code: 'NO_BALANCE',
      error: 'Tu cuenta de IA no tiene saldo disponible. Recarga saldo en el panel de tu proveedor y vuelve a intentar.',
    };
  }
  if (status === 401 || status === 403 || normalized.includes('api key') || normalized.includes('unauthorized') || normalized.includes('invalid apikey')) {
    return {
      code: 'INVALID_KEY',
      error: 'La API key configurada no es valida. Revisala en Configuracion.',
    };
  }
  if (status === 429) {
    return {
      code: 'RATE_LIMIT',
      error: 'La IA esta ocupada. Espera unos segundos e intenta de nuevo.',
    };
  }
  return {
    code: 'PROVIDER_ERROR',
    error: 'No se pudo analizar la comida ahora. Intenta de nuevo en un momento.',
  };
}

function normalizeVisionProvider(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (value === VISION_PROVIDER_QWEN || value === 'dashscope' || value === 'alibaba') {
    return VISION_PROVIDER_QWEN;
  }
  return VISION_PROVIDER_ZHIPU;
}

function resolveVisionConfig(customApiKey = '') {
  const qwenApiKey = customApiKey || String(process.env.QWEN_API_KEY || '').trim();
  const zhipuApiKey = customApiKey || String(process.env.ZHIPU_API_KEY || '').trim();
  const genericApiKey = customApiKey || String(process.env.VISION_API_KEY || '').trim();
  const explicitProvider = String(process.env.VISION_PROVIDER || '').trim();
  const provider = !explicitProvider && qwenApiKey
    ? VISION_PROVIDER_QWEN
    : normalizeVisionProvider(explicitProvider);

  if (provider === VISION_PROVIDER_QWEN) {
    const model = String(process.env.VISION_MODEL || process.env.QWEN_VISION_MODEL || '').trim() || QWEN_VISION_MODEL;
    return {
      provider,
      apiKey: qwenApiKey || genericApiKey,
      baseUrl: String(process.env.VISION_API_BASE_URL || process.env.QWEN_VISION_API_BASE_URL || '').trim() || QWEN_VISION_API_BASE_URL,
      modelCandidates: [model, QWEN_VISION_MODEL],
    };
  }

  const model = String(process.env.VISION_MODEL || process.env.ZHIPU_VISION_MODEL || '').trim() || ZHIPU_VISION_MODEL;
  return {
    provider,
    apiKey: zhipuApiKey || genericApiKey,
    baseUrl: String(process.env.VISION_API_BASE_URL || process.env.ZHIPU_VISION_API_BASE_URL || '').trim() || ZHIPU_VISION_API_BASE_URL,
    modelCandidates: [model, ZHIPU_VISION_MODEL],
  };
}

function getAssistantText(parsedResponse) {
  const content = parsedResponse?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || '').join('');
  }
  return '';
}

async function analyzeWithVisionOpenAiCompat({ imageBase64, imageMimeType, description, config }) {
  const candidates = config.modelCandidates
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .slice(0, 2);

  let lastError = null;

  for (const modelName of candidates) {
    try {
      const requestBody = {
        model: modelName,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildAnalysisPrompt({ source: 'image', description }) },
              { type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } },
            ],
          },
        ],
        temperature: 0,
        stream: false,
        ...(config.provider === VISION_PROVIDER_QWEN
          ? { enable_thinking: false, response_format: { type: 'json_object' } }
          : { max_tokens: 1200 }),
      };
      const response = await fetch(config.baseUrl.replace(/\/+$/, ''), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
      const responseText = await response.text();

      if (!response.ok) {
        const parsed = extractJsonObject(responseText);
        const providerMessage = parsed?.error?.message || responseText;
        lastError = { status: response.status, message: providerMessage };
        if (response.status === 401 || response.status === 402 || response.status === 403) break;
        continue;
      }

      const parsed = extractJsonObject(responseText);
      const content = getAssistantText(parsed);
      const analysis = sanitizeAnalysis(extractJsonObject(content), 'image');

      if (analysis) {
        return { analysis, modelUsed: modelName, providerUsed: config.provider };
      }

      lastError = { status: 200, message: 'Respuesta sin JSON util' };
    } catch (error) {
      lastError = { status: 0, message: error?.message };
    }
  }

  const classified = classifyProviderError(lastError?.status, lastError?.message);
  return { error: classified };
}

async function analyzeTextWithVisionProvider({ description, config }) {
  const candidates = config.modelCandidates
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .slice(0, 2);
  let lastError = null;

  for (const modelName of candidates) {
    try {
      const requestBody = {
        model: modelName,
        messages: [
          { role: 'user', content: buildAnalysisPrompt({ source: 'text', description }) },
        ],
        temperature: 0,
        stream: false,
        ...(config.provider === VISION_PROVIDER_QWEN
          ? { enable_thinking: false, response_format: { type: 'json_object' } }
          : { max_tokens: 1200 }),
      };
      const response = await fetch(config.baseUrl.replace(/\/+$/, ''), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
      const responseText = await response.text();

      if (!response.ok) {
        const parsed = extractJsonObject(responseText);
        lastError = { status: response.status, message: parsed?.error?.message || responseText };
        if ([401, 402, 403].includes(response.status)) break;
        continue;
      }

      const parsed = extractJsonObject(responseText);
      const analysis = sanitizeAnalysis(extractJsonObject(getAssistantText(parsed)), 'text');
      if (analysis) {
        return { analysis, modelUsed: modelName, providerUsed: config.provider };
      }
      lastError = { status: 200, message: 'Respuesta sin JSON util' };
    } catch (error) {
      lastError = { status: 0, message: error?.message };
    }
  }

  return { error: classifyProviderError(lastError?.status, lastError?.message) };
}

async function analyzeWithDeepSeekText({ description, apiKey }) {
  const envModel = normalizeDeepSeekModelName(process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL);
  const modelName = isSupportedDeepSeekModel(envModel) ? envModel : DEFAULT_DEEPSEEK_MODEL;

  const { response, responseText } = await callDeepSeekChatCompletion({
    parts: [{ text: buildAnalysisPrompt({ source: 'text', description }) }],
    apiKey,
    modelName,
    systemInstruction: 'Eres un nutriologo experto en estimar porciones y macros de platillos caseros.',
    requestMode: 'adjust',
  });

  if (!response.ok) {
    const parsed = extractJsonObject(responseText);
    const classified = classifyProviderError(response.status, parsed?.error?.message || responseText);
    return { error: classified };
  }

  const parsed = extractJsonObject(responseText);
  const content = parsed?.choices?.[0]?.message?.content || '';
  const analysis = sanitizeAnalysis(extractJsonObject(content), 'text');

  if (!analysis) {
    return {
      error: {
        code: 'PROVIDER_ERROR',
        error: 'La IA no devolvio un analisis util. Intenta con otra descripcion.',
      },
    };
  }

  return { analysis, modelUsed: modelName, providerUsed: 'deepseek' };
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
    return res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' });
  }

  if (!requestMeta.trustedRequest) {
    return res.status(403).json({
      ok: false,
      code: 'FORBIDDEN',
      error: 'Origen no permitido. Usa la app desde el mismo dominio.',
    });
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'analyze-food',
    windowMs: 60 * 1000,
    maxRequests: 12,
  });

  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  if (!rateLimit.ok) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      code: 'RATE_LIMIT',
      error: `Demasiados analisis seguidos. Intenta de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
    });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({ ok: false, code: 'BAD_JSON', error: 'Body no es JSON valido.' });
      }
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ ok: false, code: 'BAD_BODY', error: 'Body vacio o invalido.' });
    }

    const description = toSafeString(payload.description, MAX_DESCRIPTION_CHARS);
    const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64.replace(/^data:[^,]+,/, '').trim() : '';
    const imageMimeType = ALLOWED_IMAGE_MIME_TYPES.has(payload.imageMimeType)
      ? payload.imageMimeType
      : 'image/jpeg';
    const customApiKey = typeof payload.customApiKey === 'string' ? payload.customApiKey.trim() : '';

    if (!imageBase64 && !description) {
      return res.status(400).json({
        ok: false,
        code: 'NO_INPUT',
        error: 'Envia una foto o una descripcion de tu comida.',
      });
    }

    if (imageBase64) {
      const estimatedBytes = Math.floor((imageBase64.length * 3) / 4);
      if (estimatedBytes > MAX_IMAGE_BYTES) {
        return res.status(413).json({
          ok: false,
          code: 'IMAGE_TOO_LARGE',
          error: 'La foto es demasiado pesada. Intenta con una imagen mas ligera.',
        });
      }
    }

    const aiProvider = normalizeAiProvider(process.env.AI_PROVIDER);
    const deepseekApiKey = (process.env.DEEPSEEK_API_KEY || '').trim();

    // ── Vision path: photo via OpenAI-compatible Chinese provider (GLM-4.6V / Qwen-VL) ──
    if (imageBase64) {
      const visionConfig = resolveVisionConfig(customApiKey);
      if (!visionConfig.apiKey) {
        return res.status(422).json({
          ok: false,
          code: 'VISION_UNAVAILABLE',
          error: 'La foto aun no esta disponible. Describe tu comida y la IA la analizara por texto.',
        });
      }

      const result = await analyzeWithVisionOpenAiCompat({
        imageBase64,
        imageMimeType,
        description,
        config: visionConfig,
      });

      if (result.error) {
        const status = result.error.code === 'NO_BALANCE' ? 402 : result.error.code === 'INVALID_KEY' ? 401 : 502;
        return res.status(status).json({ ok: false, ...result.error });
      }

      return res.status(200).json({ ok: true, source: 'image', ...result });
    }

    // ── Text path: use the active provider (DeepSeek by default) ──
    if (aiProvider === AI_PROVIDER_GEMINI) {
      const geminiApiKey = customApiKey || (process.env.GEMINI_API_KEY || '').trim();
      if (!geminiApiKey) {
        return res.status(500).json({
          ok: false,
          code: 'INVALID_KEY',
          error: 'Falta configurar GEMINI_API_KEY en el servidor.',
        });
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: buildAnalysisPrompt({ source: 'text', description }) }] }],
              generationConfig: { temperature: 0, maxOutputTokens: 1200, responseMimeType: 'application/json' },
            }),
          }
        );
        const responseText = await response.text();

        if (!response.ok) {
          const parsed = extractJsonObject(responseText);
          const classified = classifyProviderError(response.status, parsed?.error?.message || responseText);
          const status = classified.code === 'NO_BALANCE' ? 402 : classified.code === 'INVALID_KEY' ? 401 : 502;
          return res.status(status).json({ ok: false, ...classified });
        }

        const parsed = extractJsonObject(responseText);
        const text = parsed?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';
        const analysis = sanitizeAnalysis(extractJsonObject(text), 'text');

        if (!analysis) {
          return res.status(502).json({
            ok: false,
            code: 'PROVIDER_ERROR',
            error: 'La IA no devolvio un analisis util. Intenta con otra descripcion.',
          });
        }

        return res.status(200).json({ ok: true, source: 'text', analysis, modelUsed: 'gemini-3-flash-preview', providerUsed: 'gemini' });
      } catch {
        return res.status(502).json({
          ok: false,
          code: 'PROVIDER_ERROR',
          error: 'No se pudo analizar la comida ahora. Intenta de nuevo en un momento.',
        });
      }
    }

    const textFallbackConfig = resolveVisionConfig(customApiKey);

    if (!deepseekApiKey && textFallbackConfig.apiKey) {
      const fallbackResult = await analyzeTextWithVisionProvider({
        description,
        config: textFallbackConfig,
      });
      if (!fallbackResult.error) {
        return res.status(200).json({ ok: true, source: 'text', ...fallbackResult });
      }
    }

    if (!deepseekApiKey) {
      return res.status(500).json({
        ok: false,
        code: 'INVALID_KEY',
        error: 'Falta configurar DEEPSEEK_API_KEY en el servidor.',
      });
    }

    const result = await analyzeWithDeepSeekText({ description, apiKey: deepseekApiKey });
    if (result.error) {
      if (textFallbackConfig.apiKey) {
        const fallbackResult = await analyzeTextWithVisionProvider({
          description,
          config: textFallbackConfig,
        });
        if (!fallbackResult.error) {
          return res.status(200).json({ ok: true, source: 'text', ...fallbackResult });
        }
      }
      const status = result.error.code === 'NO_BALANCE' ? 402 : result.error.code === 'INVALID_KEY' ? 401 : 502;
      return res.status(status).json({ ok: false, ...result.error });
    }

    return res.status(200).json({ ok: true, source: 'text', ...result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      code: 'INTERNAL',
      error: 'No se pudo analizar la comida. Intenta de nuevo.',
    });
  }
}
