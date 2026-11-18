const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  { documentId: String, title: String, chunkIndex: Number, score: Number, text: String },
  { _id: false }
);

const traceSchema = new mongoose.Schema({ agent: String, detail: String }, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [sourceSchema],
    trace: [traceSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const chatSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New chat' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
