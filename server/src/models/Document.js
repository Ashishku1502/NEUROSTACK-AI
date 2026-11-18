const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    filename: String,
    mimeType: String,
    size: Number,
    chunkCount: { type: Number, default: 0 },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    error: String,
    s3Key: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
