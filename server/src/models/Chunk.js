const mongoose = require('mongoose');

// Used by the "mongo" and "atlas" vector stores. Pinecone keeps vectors remotely.
const chunkSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  index: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], select: false },
});

module.exports = mongoose.model('Chunk', chunkSchema);
