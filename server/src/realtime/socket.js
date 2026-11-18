const { z } = require('zod');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { verify } = require('../utils/jwt');
const { runPipeline } = require('../services/agents');

const sendSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i).nullish(),
  message: z.string().trim().min(1, 'Write a message first').max(4000, 'Message is too long (4000 characters max)'),
});

function registerSocket(io) {
  io.use(async (socket, next) => {
    try {
      const payload = verify(socket.handshake.auth?.token);
      const user = await User.findById(payload.sub);
      if (!user) throw new Error('no user');
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    let busy = false;

    socket.on('chat:send', async (payload) => {
      if (busy) return socket.emit('chat:error', { error: 'Wait for the current answer to finish' });
      busy = true;
      try {
        const { chatId, message } = sendSchema.parse(payload || {});
        let chat = chatId ? await Chat.findOne({ _id: chatId, owner: socket.user._id }) : null;
        if (chatId && !chat) throw new Error('Chat not found');
        if (!chat) chat = new Chat({ owner: socket.user._id, title: message.slice(0, 60) });

        const history = chat.messages.map((m) => ({ role: m.role, content: m.content }));
        chat.messages.push({ role: 'user', content: message });
        await chat.save();
        socket.emit('chat:started', { chatId: String(chat._id) });

        const { answer, sources, trace } = await runPipeline({
          ownerId: socket.user._id,
          question: message,
          history,
          emit: (event, data) => socket.emit(event, data),
        });

        chat.messages.push({ role: 'assistant', content: answer, sources, trace });
        await chat.save();
        socket.emit('chat:done', { chatId: String(chat._id), message: chat.messages[chat.messages.length - 1].toObject() });
      } catch (err) {
        const text = err instanceof z.ZodError ? err.issues[0].message : err.message || 'Something went wrong';
        console.error('[chat:send]', err.message);
        socket.emit('chat:error', { error: text });
      } finally {
        busy = false;
      }
    });
  });
}

module.exports = { registerSocket };
