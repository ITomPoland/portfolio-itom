import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest } from '../functions/api/portrait-chat.js';

const createContext = ({
  message = '你好',
  history = [],
  env = {},
  signal
} = {}) => ({
  env,
  request: new Request('http://localhost/api/portrait-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
    signal
  })
});

test('returns a safe configuration error when the server secret is missing', async () => {
  const response = await onRequest(createContext());
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.code, 'GEMINI_NOT_CONFIGURED');
  assert.match(payload.message, /GEMINI_API_KEY/);
});

test('rejects an oversized JSON body even when no content-length header is trusted', async () => {
  const response = await onRequest(createContext({
    history: [{ role: 'user', text: 'x'.repeat(25000) }]
  }));
  const payload = await response.json();

  assert.equal(response.status, 413);
  assert.equal(payload.code, 'PAYLOAD_TOO_LARGE');
});

test('maps chat history to Gemini roles and returns generated text', async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;

  globalThis.fetch = async (url, options) => {
    capturedRequest = {
      url: String(url),
      headers: options.headers,
      body: JSON.parse(options.body)
    };

    return Response.json({
      candidates: [{
        content: {
          parts: [{ text: '你好，我已经收到你的文字消息。' }]
        }
      }]
    });
  };

  try {
    const response = await onRequest(createContext({
      message: '请介绍一下这里',
      history: [
        { role: 'user', text: '你好' },
        { role: 'assistant', text: '你好，需要我介绍什么？' },
        { role: 'user', text: '请介绍一下这里' }
      ],
      env: {
        GEMINI_API_KEY: 'server-only-test-key',
        GEMINI_MODEL: 'gemini-3.6-flash'
      }
    }));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.text, '你好，我已经收到你的文字消息。');
    assert.match(capturedRequest.url, /gemini-3\.6-flash:generateContent$/);
    assert.equal(capturedRequest.headers['x-goog-api-key'], 'server-only-test-key');
    const systemInstruction = capturedRequest.body.systemInstruction.parts[0].text;
    assert.match(systemInstruction, /吴桐/);
    assert.match(systemInstruction, /长沙师范学院大四学生/);
    assert.match(systemInstruction, /麻阳冰糖橙/);
    assert.match(systemInstruction, /没有地址的信/);
    assert.match(systemInstruction, /职爪 ZHIZHUA/);
    assert.match(systemInstruction, /123设计工作室知识库/);
    assert.match(systemInstruction, /不得泄露 API 密钥/);
    assert.match(systemInstruction, /作品集中暂未提供这项信息/);
    assert.equal(capturedRequest.body.generationConfig.temperature, 0.3);
    assert.equal(capturedRequest.body.generationConfig.maxOutputTokens, 1600);
    assert.equal(
      capturedRequest.body.generationConfig.thinkingConfig.thinkingLevel,
      'low'
    );
    assert.deepEqual(
      capturedRequest.body.contents.map(({ role }) => role),
      ['user', 'model', 'user']
    );
    assert.equal(
      capturedRequest.body.contents.at(-1).parts[0].text,
      '请介绍一下这里'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('removes the current user message before merging irregular consecutive history', async () => {
  const originalFetch = globalThis.fetch;
  let capturedContents;

  globalThis.fetch = async (_url, options) => {
    capturedContents = JSON.parse(options.body).contents;
    return Response.json({
      candidates: [{ content: { parts: [{ text: '收到。' }] } }]
    });
  };

  try {
    const response = await onRequest(createContext({
      message: '当前问题',
      history: [
        { role: 'user', text: '前一个问题' },
        { role: 'user', text: '当前问题' },
        { role: 'user', text: '当前问题' }
      ],
      env: { GEMINI_API_KEY: 'server-only-test-key' }
    }));

    assert.equal(response.status, 200);
    assert.equal(
      capturedContents.flatMap(({ parts }) => parts.map(({ text }) => text))
        .join('\n')
        .match(/当前问题/g)?.length,
      1
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cancels the upstream request when the browser request is aborted', async () => {
  const originalFetch = globalThis.fetch;
  const browserController = new AbortController();
  let upstreamSignal;
  let notifyFetchStarted;
  const fetchStarted = new Promise((resolve) => {
    notifyFetchStarted = resolve;
  });

  globalThis.fetch = async (_url, options) => {
    upstreamSignal = options.signal;
    notifyFetchStarted();

    return new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    });
  };

  try {
    const responsePromise = onRequest(createContext({
      env: { GEMINI_API_KEY: 'server-only-test-key' },
      signal: browserController.signal
    }));

    await fetchStarted;
    browserController.abort();

    const response = await responsePromise;
    const payload = await response.json();

    assert.equal(upstreamSignal.aborted, true);
    assert.equal(response.status, 499);
    assert.equal(payload.code, 'REQUEST_ABORTED');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not expose an upstream authentication response to the browser', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: 'upstream diagnostic details' } }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );

  try {
    const response = await onRequest(createContext({
      env: { GEMINI_API_KEY: 'server-only-test-key' }
    }));
    const payload = await response.json();

    assert.equal(response.status, 503);
    assert.equal(payload.code, 'GEMINI_CONFIGURATION_ERROR');
    assert.doesNotMatch(JSON.stringify(payload), /upstream diagnostic details/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
