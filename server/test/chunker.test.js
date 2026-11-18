const test = require('node:test');
const assert = require('node:assert');
const { chunkText } = require('../src/services/chunker');

test('returns no chunks for empty text', () => {
  assert.deepStrictEqual(chunkText('   '), []);
});

test('keeps short text as one chunk', () => {
  assert.deepStrictEqual(chunkText('Hello world.'), ['Hello world.']);
});

test('splits long text into bounded overlapping chunks', () => {
  const sentence = 'The quick brown fox jumps over the lazy dog. ';
  const chunks = chunkText(sentence.repeat(100), { size: 300, overlap: 50 });
  assert.ok(chunks.length > 5);
  for (const c of chunks) assert.ok(c.length <= 300 * 1.5 + 60, `chunk too long: ${c.length}`);
});

test('splits on paragraphs', () => {
  const para = 'word '.repeat(80).trim();
  const chunks = chunkText([para, para, para].join('\n\n'), { size: 500, overlap: 50 });
  assert.ok(chunks.length >= 2);
});
