const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { extractText } = require('../services/textExtract');
const { chunkText } = require('../services/chunker');
const { embedTexts } = require('../services/embeddings');
const vectorStore = require('../services/vectorStore');
const storage = require('../services/storage');
const config = require('../config');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const docs = await Document.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  })
);

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Choose a file to upload' });
    const { originalname, mimetype, size, buffer } = req.file;
    const doc = await Document.create({
      owner: req.user._id,
      title: (req.body.title || originalname).trim(),
      filename: originalname,
      mimeType: mimetype,
      size,
      status: 'processing',
    });

    let chunkCount = 0;
    try {
      const text = await extractText(req.file);
      const chunks = chunkText(text, config.chunk);
      if (!chunks.length) throw new Error('No readable text found in this file');
      chunkCount = chunks.length;
      const embeddings = await embedTexts(chunks);
      await vectorStore.upsert({ ownerId: req.user._id, documentId: doc._id, chunks, embeddings });
      if (storage.enabled()) {
        doc.s3Key = await storage.save({ key: `${req.user._id}/${doc._id}-${originalname}`, buffer, contentType: mimetype });
      }
      doc.chunkCount = chunks.length;
      doc.status = 'ready';
      await doc.save();
      res.status(201).json(doc);
    } catch (err) {
      doc.status = 'failed';
      doc.error = err.message;
      await doc.save();
      await vectorStore.removeDocument({ ownerId: req.user._id, documentId: doc._id, count: chunkCount }).catch(() => {});
      res.status(422).json({ error: err.message, document: doc });
    }
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await vectorStore.removeDocument({ ownerId: req.user._id, documentId: doc._id, count: doc.chunkCount });
    if (doc.s3Key && storage.enabled()) await storage.remove(doc.s3Key).catch(() => {});
    await doc.deleteOne();
    res.json({ ok: true });
  })
);

module.exports = router;
