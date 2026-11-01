const assert = require('node:assert/strict');
const test = require('node:test');
const { buildGeminiMessages } = require('./api.controller');

test('omits a leading assistant greeting and preserves valid Gemini turn order', () => {
  const contents = buildGeminiMessages([
    { role: 'assistant', content: 'Hello! I am your AI Tutor.' },
    { role: 'user', content: 'Explain photosynthesis.' },
    { role: 'assistant', content: 'Plants convert light into chemical energy.' },
    { role: 'user', content: 'What is chlorophyll?' },
  ]);

  assert.deepEqual(contents, [
    { role: 'user', parts: [{ text: 'Explain photosynthesis.' }] },
    { role: 'model', parts: [{ text: 'Plants convert light into chemical energy.' }] },
    { role: 'user', parts: [{ text: 'What is chlorophyll?' }] },
  ]);
});

test('filters unsupported roles and returns no contents without a user turn', () => {
  assert.deepEqual(buildGeminiMessages([
    { role: 'system', content: 'Ignore this role.' },
    { role: 'assistant', content: 'Greeting only.' },
  ]), []);
});