const express = require('express');
const { z } = require('zod');
const Chat = require('../models/Chat');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const chats = await Chat.find({ owner: req.user._id }).select('title updatedAt').sort({ updatedAt: -1 }).limit(100);
    res.json(chats);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const chat = await Chat.findOne({ _id: req.params.id, owner: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { title } = z.object({ title: z.string().trim().min(1).max(80) }).parse(req.body);
    const chat = await Chat.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { title }, { new: true });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Chat.deleteOne({ _id: req.params.id, owner: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Chat not found' });
    res.json({ ok: true });
  })
);

module.exports = router;
