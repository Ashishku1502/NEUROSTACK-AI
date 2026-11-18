const test = require('node:test');
const assert = require('node:assert');
const { extractJson, toHistory } = require('../src/services/agents');

test('extractJson finds JSON inside prose', () => {
  assert.deepStrictEqual(extractJson('Sure! {"intent":"document_qa","query":"x"} done'), { intent: 'document_qa', query: 'x' });
  assert.strictEqual(extractJson('no json here'), null);
});

test('toHistory drops leading assistant messages and keeps the last 6', () => {
  const msgs = [{ role: 'assistant', content: 'a' }, ...Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: String(i) }))];
  const h = toHistory(msgs);
  assert.strictEqual(h[0].role, 'user');
  assert.ok(h.length <= 6);
});
