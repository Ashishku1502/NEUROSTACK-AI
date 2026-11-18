const mongoose = require('mongoose');
const config = require('../config');
const Chunk = require('../models/Chunk');

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

// ---------- MongoDB (brute-force cosine, fine for demos and small corpora) ----------
const mongoStore = {
  async upsert({ ownerId, documentId, chunks, embeddings }) {
    await Chunk.insertMany(
      chunks.map((text, index) => ({ owner: ownerId, document: documentId, index, text, embedding: embeddings[index] }))
    );
  },
  async query({ ownerId, embedding, topK }) {
    const rows = await Chunk.find({ owner: ownerId }).select('+embedding').lean();
    return rows
      .map((r) => ({ documentId: r.document, chunkIndex: r.index, text: r.text, score: dot(embedding, r.embedding || []) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },
  async removeDocument({ documentId }) {
    await Chunk.deleteMany({ document: documentId });
  },
};

// ---------- MongoDB Atlas Vector Search ----------
const atlasStore = {
  upsert: mongoStore.upsert,
  removeDocument: mongoStore.removeDocument,
  async query({ ownerId, embedding, topK }) {
    const rows = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: config.atlasIndex,
          path: 'embedding',
          queryVector: embedding,
          numCandidates: Math.max(100, topK * 20),
          limit: topK,
          filter: { owner: new mongoose.Types.ObjectId(String(ownerId)) },
        },
      },
      { $project: { document: 1, index: 1, text: 1, score: { $meta: 'vectorSearchScore' } } },
    ]);
    return rows.map((r) => ({ documentId: r.document, chunkIndex: r.index, text: r.text, score: r.score }));
  },
};

// ---------- Pinecone (REST, one namespace per user) ----------
async function pinecone(path, body) {
  const res = await fetch(`${config.pinecone.host}${path}`, {
    method: 'POST',
    headers: { 'Api-Key': config.pinecone.apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2024-07' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Pinecone ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const pineconeStore = {
  async upsert({ ownerId, documentId, chunks, embeddings }) {
    const vectors = chunks.map((text, i) => ({
      id: `${documentId}:${i}`,
      values: embeddings[i],
      metadata: { documentId: String(documentId), chunkIndex: i, text },
    }));
    for (let i = 0; i < vectors.length; i += 100) {
      await pinecone('/vectors/upsert', { namespace: String(ownerId), vectors: vectors.slice(i, i + 100) });
    }
  },
  async query({ ownerId, embedding, topK }) {
    const json = await pinecone('/query', {
      namespace: String(ownerId),
      vector: embedding,
      topK,
      includeMetadata: true,
    });
    return (json.matches || []).map((m) => ({
      documentId: m.metadata.documentId,
      chunkIndex: m.metadata.chunkIndex,
      text: m.metadata.text,
      score: m.score,
    }));
  },
  async removeDocument({ ownerId, documentId, count }) {
    const ids = Array.from({ length: count || 0 }, (_, i) => `${documentId}:${i}`);
    for (let i = 0; i < ids.length; i += 500) {
      await pinecone('/vectors/delete', { namespace: String(ownerId), ids: ids.slice(i, i + 500) });
    }
  },
};

const stores = { mongo: mongoStore, atlas: atlasStore, pinecone: pineconeStore };
const store = stores[config.vectorStore];
if (!store) throw new Error(`Unknown VECTOR_STORE "${config.vectorStore}". Use mongo, atlas, or pinecone.`);

module.exports = store;
