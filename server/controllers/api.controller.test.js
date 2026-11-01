const assert = require('node:assert/strict');
const test = require('node:test');
const { OPENROUTER_MODEL, assertFreeModel } = require('../config/ai');
const { createApiController, buildChatMessages } = require('./api.controller');
const { createOpenRouterClient } = require('../services/openrouter');

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

const createResponse = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  headersSent: false,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(payload) {
    this.payload = payload;
    this.headersSent = true;
    return this;
  },
  write(chunk) {
    this.body += chunk;
    this.headersSent = true;
  },
  end() {
    this.ended = true;
  },
});

const createRequest = (body) => ({ body });

const createClient = (fetchImpl, extraOptions = {}) => createOpenRouterClient({
  apiKey: 'test-key-not-a-real-secret',
  fetchImpl,
  sleep: async () => {},
  random: () => 0,
  ...extraOptions,
});

test('rejects paid model IDs before making an API request', () => {
  let fetchCalls = 0;

  assert.throws(() => assertFreeModel('google/gemma-4-31b-it'), /must explicitly end with :free/);
  assert.throws(() => createOpenRouterClient({
    model: 'google/gemma-4-31b-it',
    fetchImpl: async () => {
      fetchCalls += 1;
    },
  }), /must explicitly end with :free/);
  assert.equal(fetchCalls, 0);
  assert.match(OPENROUTER_MODEL, /:free$/);
});

test('mocked summarizer, quiz, and planner keep their response fields and use only the free model', async () => {
  const requests = [];
  const client = createClient(async (url, options) => {
    requests.push({ url, options, payload: JSON.parse(options.body) });
    return jsonResponse({ choices: [{ message: { content: `result-${requests.length}` } }] });
  });
  const controller = createApiController(client);

  const summaryResponse = createResponse();
  await controller.summarize(createRequest({ notes: 'Cell respiration notes' }), summaryResponse);
  assert.deepEqual(summaryResponse.payload, { success: true, summary: 'result-1' });

  const quizResponse = createResponse();
  await controller.quiz(createRequest({ notes: 'Cell respiration notes' }), quizResponse);
  assert.deepEqual(quizResponse.payload, { success: true, quiz: 'result-2' });

  const plannerResponse = createResponse();
  await controller.planner(createRequest({
    subject: 'Biology',
    date: '2026-12-01',
    hours: '8',
  }), plannerResponse);
  assert.deepEqual(plannerResponse.payload, { success: true, plan: 'result-3' });

  assert.equal(requests.length, 3);
  for (const { url, options, payload } of requests) {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(payload.model, OPENROUTER_MODEL);
    assert.match(payload.model, /:free$/);
    assert.deepEqual(payload.provider, { allow_fallbacks: false });
    assert.equal(payload.stream, false);
    assert.equal(options.headers.Authorization, 'Bearer test-key-not-a-real-secret');
    assert.equal(options.body.includes('test-key-not-a-real-secret'), false);
  }
  assert.match(requests[0].payload.messages[1].content, /Please summarize these notes/);
  assert.match(requests[1].payload.messages[1].content, /Generate a quiz based on these notes/);
  assert.match(requests[2].payload.messages[1].content, /Available Hours per week: 8/);
});

test('mocked Chat streams OpenAI-compatible chunks using the existing SSE event contract', async () => {
  const requests = [];
  const streamText = [
    'data: {"choices":[{"delta":{"content":"Plants "}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"use sunlight."}}]}\n\n',
    'data: [DONE]\n\n',
  ].join('');
  const client = createClient(async (url, options) => {
    requests.push({ url, options, payload: JSON.parse(options.body) });
    return new Response(streamText, { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const controller = createApiController(client);
  const response = createResponse();
  const messages = [
    { role: 'assistant', content: 'Hello! I am your AI Tutor.' },
    { role: 'user', content: 'Explain photosynthesis.' },
    { role: 'assistant', content: 'Plants convert light into chemical energy.' },
    { role: 'user', content: 'What is chlorophyll?' },
  ];

  await controller.chat(createRequest({ messages, model: 'a-paid-model' }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Content-Type'], 'text/event-stream');
  assert.match(response.body, /data: \{"content":"Plants "\}\n\n/);
  assert.match(response.body, /data: \{"content":"use sunlight\."\}\n\n/);
  assert.match(response.body, /data: \[DONE\]\n\n$/);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.stream, undefined);
  assert.equal(requests[0].payload.stream, true);
  assert.equal(requests[0].payload.model, OPENROUTER_MODEL);
  assert.deepEqual(requests[0].payload.provider, { allow_fallbacks: false });
  assert.deepEqual(requests[0].payload.messages.slice(1), [
    { role: 'user', content: 'Explain photosynthesis.' },
    { role: 'assistant', content: 'Plants convert light into chemical energy.' },
    { role: 'user', content: 'What is chlorophyll?' },
  ]);
});

test('mocked transient HTTP failures retry the same free model with bounded backoff', async () => {
  for (const status of [408, 500, 502, 503, 504]) {
    let fetchCalls = 0;
    const delays = [];
    const client = createClient(async (_url, options) => {
      fetchCalls += 1;
      if (fetchCalls === 1) return new Response('provider details are not public', { status });
      return jsonResponse({ choices: [{ message: { content: 'recovered' } }] });
    }, { sleep: async (delay) => delays.push(delay) });

    assert.equal(await client.complete([{ role: 'user', content: 'test' }]), 'recovered');
    assert.equal(fetchCalls, 2);
    assert.deepEqual(delays, [250]);
  }
});

test('mocked upstream 429 fails once and returns a friendly Retry-After message', async () => {
  let fetchCalls = 0;
  const delays = [];
  const client = createClient(async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      error: {
        message: 'Provider returned error',
        metadata: {
          provider_name: 'Google AI Studio',
          raw: 'private upstream rate-limit details',
        },
      },
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '30' },
    });
  }, { sleep: async (delay) => delays.push(delay) });
  const controller = createApiController(client);
  const response = createResponse();

  await controller.summarize(createRequest({ notes: 'short notes' }), response);

  assert.equal(fetchCalls, 1);
  assert.deepEqual(delays, []);
  assert.equal(response.statusCode, 503);
  assert.match(response.payload.message, /temporarily unavailable/i);
  assert.match(response.payload.message, /30 seconds/);
  assert.doesNotMatch(JSON.stringify(response.payload), /Google AI Studio|private upstream rate-limit details/);
});

test('mocked upstream 429 reads Retry-After metadata without retrying', async () => {
  let fetchCalls = 0;
  const client = createClient(async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      error: { metadata: { retry_after: '12' } },
    }), { status: 429 });
  });
  const controller = createApiController(client);
  const response = createResponse();

  await controller.planner(createRequest({
    subject: 'Biology',
    date: '2026-12-01',
    hours: '5',
  }), response);

  assert.equal(fetchCalls, 1);
  assert.equal(response.statusCode, 503);
  assert.match(response.payload.message, /12 seconds/);
});

test('mocked exhausted retries stop after two retries on the same free model', async () => {
  let fetchCalls = 0;
  const delays = [];
  const client = createClient(async () => {
    fetchCalls += 1;
    return new Response('private provider details', { status: 503 });
  }, { sleep: async (delay) => delays.push(delay) });
  const controller = createApiController(client);
  const response = createResponse();

  await controller.summarize(createRequest({ notes: 'short notes' }), response);

  assert.equal(fetchCalls, 3);
  assert.deepEqual(delays, [250, 500]);
  assert.equal(response.statusCode, 503);
  assert.match(response.payload.message, /temporarily unavailable/i);
  assert.doesNotMatch(JSON.stringify(response.payload), /private provider details/);
});

test('mocked unavailable free model fails safely without trying another model', async () => {
  let fetchCalls = 0;
  const client = createClient(async () => {
    fetchCalls += 1;
    return new Response('private provider response', { status: 404 });
  });
  const controller = createApiController(client);
  const response = createResponse();

  await controller.planner(createRequest({ subject: 'Math', date: '2026-12-01', hours: '5' }), response);

  assert.equal(fetchCalls, 1);
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.success, false);
  assert.match(response.payload.message, /temporarily unavailable/i);
  assert.doesNotMatch(JSON.stringify(response.payload), /private provider response/);
});

test('mocked invalid keys and malformed provider requests are not retried or exposed', async () => {
  for (const status of [400, 401]) {
    let fetchCalls = 0;
    const client = createClient(async () => {
      fetchCalls += 1;
      return new Response('raw provider JSON with private details', { status });
    });
    const controller = createApiController(client);
    const response = createResponse();

    await controller.summarize(createRequest({ notes: 'test notes' }), response);

    assert.equal(fetchCalls, 1);
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.success, false);
    assert.doesNotMatch(JSON.stringify(response.payload), /raw provider JSON|private details/);
  }
});

test('mocked stream errors after content do not restart or duplicate a partial response', async () => {
  let fetchCalls = 0;
  let pullCount = 0;
  const encoder = new TextEncoder();
  const streamBody = new ReadableStream({
    pull(controller) {
      pullCount += 1;
      if (pullCount > 1) {
        controller.error(new Error('private stream failure details'));
      } else {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));
      }
    },
  });
  const client = createClient(async () => {
    fetchCalls += 1;
    return new Response(streamBody, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  });
  const controller = createApiController(client);
  const response = createResponse();

  await controller.chat(createRequest({
    messages: [{ role: 'user', content: 'continue' }],
  }), response);

  assert.equal(fetchCalls, 1);
  assert.equal((response.body.match(/"content":"partial"/g) || []).length, 1);
  assert.match(response.body, /AI service is temporarily unavailable/);
  assert.doesNotMatch(response.body, /private stream failure details/);
});

test('Chat history omits the initial assistant greeting and preserves valid turn order', () => {
  assert.deepEqual(buildChatMessages([
    { role: 'assistant', content: 'Hello! I am your AI Tutor.' },
    { role: 'user', content: 'Explain photosynthesis.' },
    { role: 'assistant', content: 'Plants convert light into chemical energy.' },
    { role: 'user', content: 'What is chlorophyll?' },
    { role: 'system', content: 'Ignore this unsupported role.' },
  ]), [
    { role: 'user', content: 'Explain photosynthesis.' },
    { role: 'assistant', content: 'Plants convert light into chemical energy.' },
    { role: 'user', content: 'What is chlorophyll?' },
  ]);
});
