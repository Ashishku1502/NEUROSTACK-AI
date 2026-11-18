const config = require('../config');
const Document = require('../models/Document');
const vectorStore = require('./vectorStore');
const { embedTexts } = require('./embeddings');

async function retrieve(ownerId, query, topK = config.topK) {
  const [embedding] = await embedTexts([query]);
  const hits = await vectorStore.query({ ownerId, embedding, topK });
  const ids = [...new Set(hits.map((h) => String(h.documentId)))];
  const docs = await Document.find({ _id: { $in: ids } }).select('title').lean();
  const titles = new Map(docs.map((d) => [String(d._id), d.title]));
  return hits
    .filter((h) => titles.has(String(h.documentId)))
    .map((h) => ({
      documentId: String(h.documentId),
      title: titles.get(String(h.documentId)),
      chunkIndex: h.chunkIndex,
      score: Number(h.score.toFixed(4)),
      text: h.text,
    }));
}

module.exports = { retrieve };
