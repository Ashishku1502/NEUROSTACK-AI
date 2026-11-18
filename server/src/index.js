const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const { connectDb, disconnectDb } = require('./db');
const { createApp } = require('./app');
const { registerSocket } = require('./realtime/socket');
const llm = require('./services/llm');

async function main() {
  await connectDb();
  const server = http.createServer(createApp());
  const io = new Server(server, { cors: { origin: config.clientOrigin, credentials: true } });
  registerSocket(io);

  server.listen(config.port, () => {
    console.log(`[server] http://localhost:${config.port}`);
    console.log(`[server] LLM: ${llm.isLive ? config.model : 'demo mode (set ANTHROPIC_API_KEY)'}`);
    console.log(`[server] embeddings: ${config.embedding.provider} | vector store: ${config.vectorStore}`);
  });

  const shutdown = async () => {
    try {
      await disconnectDb();
    } catch {}
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
