const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { retrieve } = require('../services/retriever');

const router = express.Router();

// Semantic search without the LLM: handy for debugging retrieval quality.
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { q, k } = z
      .object({ q: z.string().trim().min(1, 'Enter a search query'), k: z.coerce.number().int().min(1).max(20).default(5) })
      .parse(req.query);
    res.json(await retrieve(req.user._id, q, k));
  })
);

module.exports = router;
