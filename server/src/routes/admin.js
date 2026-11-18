const express = require('express');
const User = require('../models/User');
const Document = require('../models/Document');
const Chat = require('../models/Chat');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const router = express.Router();

router.get(
  '/stats',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const [users, documents, chats] = await Promise.all([
      User.countDocuments(),
      Document.countDocuments(),
      Chat.countDocuments(),
    ]);
    res.json({ users, documents, chats });
  })
);

module.exports = router;
