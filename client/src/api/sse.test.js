import assert from 'node:assert/strict';
import test from 'node:test';
import { createSSEParser } from './sse.js';

const parseChunks = (chunks) => {
  const events = [];
  const parser = createSSEParser((data) => events.push(data));

  for (const chunk of chunks) parser.push(chunk);
  parser.finish();
  return events;
};

const encode = (text) => new TextEncoder().encode(text);

test('parses an event split across reads', () => {
  const events = parseChunks([
    encode('data: {"content":"Hello'),
    encode(' world"}\n'),
    encode('\n'),
  ]);

  assert.deepEqual(events, ['{"content":"Hello world"}']);
});

test('parses multiple events from one read', () => {
  const events = parseChunks([
    encode('data: {"content":"one"}\n\ndata: {"content":"two"}\n\n'),
  ]);

  assert.deepEqual(events, ['{"content":"one"}', '{"content":"two"}']);
});

test('preserves the completion sentinel', () => {
  const events = parseChunks([encode('data: [DONE]\n\n')]);

  assert.deepEqual(events, ['[DONE]']);
});

test('parses server error events', () => {
  const events = parseChunks([encode('data: {"error":"provider failed"}\n\n')]);

  assert.deepEqual(JSON.parse(events[0]), { error: 'provider failed' });
});

test('dispatches a valid final event without a blank-line terminator', () => {
  const events = parseChunks([encode('data: {"content":"final"}')]);

  assert.deepEqual(events, ['{"content":"final"}']);
});

test('preserves Unicode split across byte chunks', () => {
  const text = 'data: {"content":"cafe\u0301 ☕"}\n\n';
  const bytes = encode(text);
  const splitAt = bytes.indexOf(0xE2) + 1;
  const events = parseChunks([bytes.slice(0, splitAt), bytes.slice(splitAt)]);

  assert.deepEqual(JSON.parse(events[0]), { content: 'cafe\u0301 ☕' });
});