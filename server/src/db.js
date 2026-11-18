const mongoose = require('mongoose');
const config = require('./config');

let memoryServer = null;

async function connectDb() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[db] connected to ${config.mongoUri}`);
  } catch (err) {
    if (config.env === 'production' && process.env.MONGODB_URI) {
      throw err;
    }
    console.warn(`[db] Could not connect to ${config.mongoUri}: ${err.message}`);
    console.log('[db] Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    });
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`[db] connected to in-memory MongoDB (${uri})`);
  }
}

async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

module.exports = { connectDb, disconnectDb };

