const config = require('../config');

const STOP = new Set(
  'a an and are as at be by for from has have in is it its of on or that the this to was were will with you your i we they he she not but if then so do does did can could should would about into over than also'.split(' ')
);

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalize(v) {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

// Deterministic "feature hashing" embedding. Works offline, good enough for keyword-ish retrieval.
function localEmbed(text, dim) {
  const v = new Array(dim).fill(0);
  const tokens = (String(text).toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => !STOP.has(t));
  const add = (feature, weight) => {
    const idx = fnv1a(feature) % dim;
    const sign = fnv1a('s:' + feature) & 1 ? 1 : -1;
    v[idx] += sign * weight;
  };
  for (let i = 0; i < tokens.length; i++) {
    add(tokens[i], 1);
    if (i < tokens.length - 1) add(tokens[i] + '_' + tokens[i + 1], 0.5);
  }
  return normalize(v);
}

async function openaiEmbed(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 64) {
    const batch = texts.slice(i, i + 64);
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.embedding.openaiKey}` },
      body: JSON.stringify({ model: config.embedding.openaiModel, input: batch, dimensions: config.embedding.dim }),
    });
    if (!res.ok) throw new Error(`Embedding request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    json.data.sort((a, b) => a.index - b.index).forEach((d) => out.push(normalize(d.embedding)));
  }
  return out;
}

async function embedTexts(texts) {
  if (config.embedding.provider === 'openai') return openaiEmbed(texts);
  return texts.map((t) => localEmbed(t, config.embedding.dim));
}

module.exports = { embedTexts, localEmbed };
