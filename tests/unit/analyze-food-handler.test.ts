import test from 'node:test';
import assert from 'node:assert/strict';

import handler from '../../api/analyze-food.js';

function createMockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as any,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

function createMockReq(body: unknown) {
  return {
    method: 'POST',
    body,
    headers: { origin: 'http://localhost:5173', host: 'localhost:5173' },
    socket: { remoteAddress: '127.0.0.1' },
  } as any;
}

const VALID_ANALYSIS = {
  nombre: 'Tacos de pollo',
  detalle: 'Dos tacos de pollo asado con salsa y aguacate.',
  porciones: '2 piezas (220 g)',
  caloriasKcal: 420,
  proteinaG: 28,
  grasasG: 16,
  carbohidratosG: 48,
  confianza: 'media',
  supuestos: ['La cantidad de aceite no es visible.'],
  super: ['pollo', 'tortilla', 'aguacate'],
  tags: ['casero'],
};

test('analyze-food rechaza requests sin foto ni descripcion', async () => {
  const res = createMockRes();
  await handler(createMockReq({}), res as any);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.code, 'NO_INPUT');
});

test('analyze-food rechaza body invalido', async () => {
  const res = createMockRes();
  await handler(createMockReq('not-json{{{'), res as any);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.code, 'BAD_JSON');
});

test('analyze-food con foto sin key de vision devuelve VISION_UNAVAILABLE', async () => {
  delete process.env.VISION_API_KEY;
  delete process.env.QWEN_API_KEY;
  delete process.env.ZHIPU_API_KEY;
  delete process.env.VISION_PROVIDER;
  const res = createMockRes();
  await handler(
    createMockReq({ imageBase64: 'aGVsbG8=', imageMimeType: 'image/jpeg' }),
    res as any
  );

  assert.equal(res.statusCode, 422);
  assert.equal(res.body?.code, 'VISION_UNAVAILABLE');
  assert.match(res.body?.error, /describe tu comida/i);
});

test('analyze-food analiza texto via DeepSeek y sanitiza la respuesta', async () => {
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  delete process.env.AI_PROVIDER;

  const capturedBodies: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url === 'https://api.deepseek.com/chat/completions') {
      capturedBodies.push(JSON.parse(options.body));
      return createMockResponse(200, {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                ...VALID_ANALYSIS,
                caloriasKcal: '420',
                nombre: `   ${VALID_ANALYSIS.nombre}   `,
              }),
            },
          },
        ],
      }) as any;
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as any;

  try {
    const res = createMockRes();
    await handler(createMockReq({ description: '2 tacos de pollo con aguacate' }), res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.ok, true);
    assert.equal(res.body?.source, 'text');
    assert.equal(res.body?.providerUsed, 'deepseek');
    assert.equal(res.body?.analysis?.nombre, VALID_ANALYSIS.nombre);
    assert.equal(res.body?.analysis?.caloriasKcal, 420);
    assert.equal(typeof res.body?.analysis?.proteinaG, 'number');
    assert.ok(Array.isArray(res.body?.analysis?.super));

    assert.equal(capturedBodies.length, 1);
    assert.equal(capturedBodies[0].model, 'deepseek-v4-flash');
    assert.match(capturedBodies[0].messages[1].content, /tacos de pollo/i);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.DEEPSEEK_API_KEY;
  }
});

test('analyze-food mapea saldo insuficiente de DeepSeek a NO_BALANCE', async () => {
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  delete process.env.AI_PROVIDER;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    if (url === 'https://api.deepseek.com/chat/completions') {
      return createMockResponse(402, {
        error: { message: 'Insufficient Balance', type: 'unknown_error', code: 'invalid_request_error' },
      }) as any;
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as any;

  try {
    const res = createMockRes();
    await handler(createMockReq({ description: 'ensalada de atun' }), res as any);

    assert.equal(res.statusCode, 402);
    assert.equal(res.body?.code, 'NO_BALANCE');
    assert.match(res.body?.error, /saldo/i);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.DEEPSEEK_API_KEY;
  }
});

test('analyze-food usa GLM como respaldo de texto cuando DeepSeek no tiene saldo', async () => {
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  process.env.ZHIPU_API_KEY = 'test-zhipu-key';
  delete process.env.AI_PROVIDER;
  delete process.env.VISION_PROVIDER;

  const requestedUrls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    requestedUrls.push(url);
    if (url === 'https://api.deepseek.com/chat/completions') {
      return createMockResponse(402, {
        error: { message: 'Insufficient Balance' },
      }) as any;
    }
    if (url === 'https://open.bigmodel.cn/api/paas/v4/chat/completions') {
      return createMockResponse(200, {
        choices: [{ message: { role: 'assistant', content: JSON.stringify(VALID_ANALYSIS) } }],
      }) as any;
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as any;

  try {
    const res = createMockRes();
    await handler(createMockReq({ description: 'ensalada de atun' }), res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.ok, true);
    assert.equal(res.body?.source, 'text');
    assert.equal(res.body?.providerUsed, 'zhipu');
    assert.deepEqual(requestedUrls, [
      'https://api.deepseek.com/chat/completions',
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.ZHIPU_API_KEY;
  }
});

test('analyze-food analiza foto via proveedor OpenAI-compatible (GLM-4.6V)', async () => {
  process.env.VISION_API_KEY = 'test-vision-key';
  delete process.env.VISION_API_BASE_URL;
  delete process.env.VISION_MODEL;

  const capturedBodies: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url === 'https://open.bigmodel.cn/api/paas/v4/chat/completions') {
      capturedBodies.push({ body: JSON.parse(options.body), headers: options.headers });
      return createMockResponse(200, {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `Aqui esta el analisis: ${JSON.stringify(VALID_ANALYSIS)}`,
            },
          },
        ],
      }) as any;
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as any;

  try {
    const res = createMockRes();
    await handler(
      createMockReq({ imageBase64: 'aGVsbG8=', imageMimeType: 'image/jpeg', description: 'mis tacos' }),
      res as any
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.ok, true);
    assert.equal(res.body?.source, 'image');
    assert.equal(res.body?.providerUsed, 'zhipu');
    assert.equal(res.body?.modelUsed, 'glm-4.6v-flash');
    assert.equal(res.body?.analysis?.nombre, VALID_ANALYSIS.nombre);
    assert.ok(res.body?.analysis?.tags?.includes('foto'));

    assert.equal(capturedBodies.length, 1);
    const content = capturedBodies[0].body.messages[0].content;
    assert.equal(content[1].type, 'image_url');
    assert.match(content[1].image_url.url, /^data:image\/jpeg;base64,/);
    assert.match(capturedBodies[0].headers.Authorization, /^Bearer test-vision-key/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.VISION_API_KEY;
    delete process.env.VISION_PROVIDER;
    delete process.env.VISION_API_BASE_URL;
    delete process.env.VISION_MODEL;
  }
});

test('analyze-food usa Qwen3-VL Flash y solicita JSON estructurado cuando existe QWEN_API_KEY', async () => {
  process.env.QWEN_API_KEY = 'test-qwen-key';
  delete process.env.VISION_PROVIDER;
  delete process.env.VISION_API_BASE_URL;
  delete process.env.VISION_MODEL;

  const capturedBodies: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: any) => {
    if (url === 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions') {
      capturedBodies.push({ body: JSON.parse(options.body), headers: options.headers });
      return createMockResponse(200, {
        choices: [{ message: { role: 'assistant', content: JSON.stringify(VALID_ANALYSIS) } }],
      }) as any;
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as any;

  try {
    const res = createMockRes();
    await handler(
      createMockReq({ imageBase64: 'aGVsbG8=', imageMimeType: 'image/jpeg' }),
      res as any
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.providerUsed, 'qwen');
    assert.equal(res.body?.modelUsed, 'qwen3-vl-flash');
    assert.equal(res.body?.analysis?.confianza, 'media');
    assert.equal(res.body?.analysis?.carbohidratosG, 48);
    assert.deepEqual(capturedBodies[0].body.response_format, { type: 'json_object' });
    assert.equal(capturedBodies[0].body.enable_thinking, false);
    assert.equal('max_tokens' in capturedBodies[0].body, false);
    assert.match(capturedBodies[0].headers.Authorization, /^Bearer test-qwen-key/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.QWEN_API_KEY;
  }
});
