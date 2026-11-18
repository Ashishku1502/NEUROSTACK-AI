const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const hasValidKey = Boolean(
  config.anthropicKey &&
  !config.anthropicKey.includes('your-key') &&
  !config.anthropicKey.includes('placeholder') &&
  config.anthropicKey.trim().length > 15
);

const client = hasValidKey ? new Anthropic({ apiKey: config.anthropicKey }) : null;
const isLive = Boolean(client);

const textOf = (message) =>
  message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

// Single-shot completion (used by the planner and critic agents).
async function complete({ model, system, messages, maxTokens = 400 }) {
  const message = await client.messages.create({ model, max_tokens: maxTokens, system, messages });
  return textOf(message);
}

// Streaming completion (used by the writer agent). Calls onToken for each text delta.
async function stream({ model, system, messages, maxTokens = 1200, onToken }) {
  const s = client.messages.stream({ model, max_tokens: maxTokens, system, messages });
  s.on('text', (t) => onToken(t));
  const final = await s.finalMessage();
  return textOf(final);
}

module.exports = { isLive, complete, stream };
