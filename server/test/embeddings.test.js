const test = require('node:test');
const assert = require('node:assert');
const { localEmbed } = require('../src/services/embeddings');

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

test('embeddings are unit length with the requested dimension', () => {
  const v = localEmbed('retrieval augmented generation with vector search', 384);
  assert.strictEqual(v.length, 384);
  assert.ok(Math.abs(Math.sqrt(dot(v, v)) - 1) < 1e-6);
});

test('related text scores higher than unrelated text', () => {
  const q = localEmbed('how do I reset my account password', 384);
  const related = localEmbed('To reset your account password, open settings and choose reset password.', 384);
  const unrelated = localEmbed('The quarterly revenue grew by twelve percent across all regions.', 384);
  assert.ok(dot(q, related) > dot(q, unrelated));
});
