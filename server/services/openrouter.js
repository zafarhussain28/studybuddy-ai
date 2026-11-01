const { OPENROUTER_MODEL, assertFreeModel } = require('../config/ai');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([408, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 60_000;

class OpenRouterError extends Error {
  constructor(message, { code = 'OPENROUTER_ERROR', status, retryAfterSeconds } = {}) {
    super(message);
    this.name = 'OpenRouterError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const getFriendlyErrorMessage = (error) => {
  if (error?.code === 'OPENROUTER_CONFIG' || error?.status === 401 || error?.status === 403) {
    return 'The AI service is unavailable due to a configuration issue. Please contact support.';
  }
  if (error?.status === 429) {
    if (Number.isFinite(error.retryAfterSeconds)) {
      return `The AI service is temporarily unavailable. Please try again in about ${error.retryAfterSeconds} seconds.`;
    }
    return 'The AI service is temporarily unavailable. Please try again shortly.';
  }
  if (error?.status === 400 || error?.status === 413) {
    return 'The AI service could not process this request. Try shortening your input.';
  }
  return 'The AI service is temporarily unavailable. Please try again shortly.';
};

const parseRetryAfterSeconds = (value) => {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
};

const extractText = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }
  return '';
};

const getDataLines = (eventText) => {
  const dataLines = [];
  for (const line of eventText.split(/\r\n|\n|\r/)) {
    if (!line || line.startsWith(':')) continue;
    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    if (field !== 'data') continue;
    let value = separator === -1 ? '' : line.slice(separator + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    dataLines.push(value);
  }
  return dataLines;
};

const parseProviderEvent = (eventData) => {
  if (eventData === '[DONE]') return { done: true };

  let payload;
  try {
    payload = JSON.parse(eventData);
  } catch {
    throw new OpenRouterError('Invalid streaming response from OpenRouter.', {
      code: 'OPENROUTER_PROTOCOL',
    });
  }

  if (payload?.error) {
    throw new OpenRouterError('OpenRouter returned a streaming error.', {
      code: 'OPENROUTER_PROVIDER',
    });
  }

  const content = extractText(payload?.choices?.[0]?.delta?.content);
  return { content };
};

async function* parseOpenRouterStream(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  const separator = /(?:\r\n|\n|\r){2}/;
  let buffer = '';
  let streamFinished = false;

  const completeEvents = () => {
    const events = [];
    let match = separator.exec(buffer);
    while (match) {
      events.push(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
      match = separator.exec(buffer);
    }
    return events;
  };

  const parseEvent = (eventText) => getDataLines(eventText).map(parseProviderEvent);

  try {
    while (!streamFinished) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });

      for (const eventText of completeEvents()) {
        for (const event of parseEvent(eventText)) {
          if (event.done) {
            streamFinished = true;
            await reader.cancel();
            return;
          }
          if (event.content) yield event.content;
        }
      }

      if (done) {
        buffer += decoder.decode();
        if (buffer) {
          for (const event of parseEvent(buffer)) {
            if (event.done) return;
            if (event.content) yield event.content;
          }
        }
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const createOpenRouterClient = ({
  model = OPENROUTER_MODEL,
  apiKey = () => process.env.OPENROUTER_API_KEY,
  fetchImpl = (...args) => fetch(...args),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  random = Math.random,
  maxRetries = MAX_RETRIES,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
} = {}) => {
  assertFreeModel(model);

  const request = async (messages, options = {}) => {
    assertFreeModel(model);
    const key = typeof apiKey === 'function' ? apiKey() : apiKey;
    if (!key) {
      throw new OpenRouterError('OPENROUTER_API_KEY is not configured.', {
        code: 'OPENROUTER_CONFIG',
      });
    }

    const body = JSON.stringify({
      model,
      messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream === true,
      provider: { allow_fallbacks: false },
    });

    for (let attempt = 0; ; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'X-Title': 'StudyBuddy AI',
          },
          body,
          signal: AbortSignal.timeout(requestTimeoutMs),
        });
      } catch {
        if (attempt < maxRetries) {
          const delay = Math.min(250 * (2 ** attempt) + random() * 250, 3000);
          await sleep(delay);
          continue;
        }
        throw new OpenRouterError('OpenRouter request failed.', { code: 'OPENROUTER_NETWORK' });
      }

      if (response.ok) return response;

      if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
        await response.body?.cancel().catch(() => {});
        const delay = Math.min(250 * (2 ** attempt) + random() * 250, 3000);
        await sleep(delay);
        continue;
      }

      let retryAfterSeconds;
      if (response.status === 429) {
        retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'));
        if (retryAfterSeconds === undefined) {
          let payload;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          retryAfterSeconds = parseRetryAfterSeconds(payload?.error?.metadata?.retry_after);
        }
      }

      await response.body?.cancel().catch(() => {});
      throw new OpenRouterError('OpenRouter rejected the generation request.', {
        code: 'OPENROUTER_HTTP',
        status: response.status,
        retryAfterSeconds,
      });
    }
  };

  const complete = async (messages, options = {}) => {
    const response = await request(messages, options);
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new OpenRouterError('Invalid generation response from OpenRouter.', {
        code: 'OPENROUTER_PROTOCOL',
      });
    }

    const content = extractText(payload?.choices?.[0]?.message?.content);
    if (!content) {
      throw new OpenRouterError('OpenRouter returned an empty generation response.', {
        code: 'OPENROUTER_PROTOCOL',
      });
    }
    return content;
  };

  const openStream = async (messages, options = {}) => {
    const response = await request(messages, { ...options, stream: true });
    if (!response.body) {
      throw new OpenRouterError('OpenRouter returned an empty streaming response.', {
        code: 'OPENROUTER_PROTOCOL',
      });
    }
    return parseOpenRouterStream(response.body);
  };

  return { complete, openStream };
};

module.exports = {
  createOpenRouterClient,
  getFriendlyErrorMessage,
  OpenRouterError,
};
