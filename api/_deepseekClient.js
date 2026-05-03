const DEEPSEEK_CHAT_COMPLETIONS_URL = 'https://api.deepseek.com/chat/completions';

function getTextFromPart(part) {
  if (part?.text) {
    return part.text;
  }

  if (part?.inlineData?.mimeType) {
    return `[Archivo ${part.inlineData.mimeType} omitido del transporte DeepSeek OpenAI-compatible.]`;
  }

  return '';
}

function buildDeepSeekUserContent(parts) {
  return (parts || [])
    .map(getTextFromPart)
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function getDeepSeekMaxOutputTokens(requestMode) {
  return requestMode === 'adjust' ? 4096 : 8192;
}

export function buildDeepSeekChatRequest({
  parts,
  modelName,
  systemInstruction,
  requestMode,
}) {
  return {
    model: modelName,
    messages: [
      {
        role: 'system',
        content: `${systemInstruction}

Responde solo JSON valido. No uses markdown ni texto fuera del JSON.
Contrato estricto para comidas:
- En cada opcion devuelve SOLO "idRef" con un ID valido del catalogo.
- No redactes porciones, detalle, ingredientes, kcal ni macros; la app los calcula de forma deterministica.`,
      },
      {
        role: 'user',
        content: buildDeepSeekUserContent(parts),
      },
    ],
    temperature: 0,
    max_tokens: getDeepSeekMaxOutputTokens(requestMode),
    response_format: { type: 'json_object' },
    thinking: { type: 'disabled' },
    stream: false,
  };
}

export async function callDeepSeekChatCompletion({
  parts,
  apiKey,
  modelName,
  systemInstruction,
  requestMode,
}) {
  const body = buildDeepSeekChatRequest({
    parts,
    modelName,
    systemInstruction,
    requestMode,
  });

  const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();

  return {
    body,
    response,
    responseText,
  };
}
