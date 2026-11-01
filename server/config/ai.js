const OPENROUTER_MODEL = 'google/gemma-4-31b-it:free';

const assertFreeModel = (model = OPENROUTER_MODEL) => {
  if (typeof model !== 'string' || !model.endsWith(':free')) {
    throw new Error('The configured OpenRouter model must explicitly end with :free.');
  }
};

module.exports = {
  OPENROUTER_MODEL,
  assertFreeModel,
};
