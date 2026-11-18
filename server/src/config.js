require('dotenv').config();

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neurostack',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
  fastModel: process.env.CLAUDE_FAST_MODEL || 'claude-haiku-5-5',
  enableCritic: bool(process.env.ENABLE_CRITIC, true),

  embedding: {
    provider: process.env.EMBEDDING_PROVIDER || 'local',
    dim: num(process.env.EMBEDDING_DIM, 384),
    openaiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },

  vectorStore: process.env.VECTOR_STORE || 'mongo',
  atlasIndex: process.env.ATLAS_VECTOR_INDEX || 'chunk_vector_index',
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    host: (process.env.PINECONE_INDEX_HOST || '').replace(/\/$/, ''),
  },

  s3: { bucket: process.env.S3_BUCKET || '', region: process.env.AWS_REGION || 'ap-south-1' },

  chunk: { size: 900, overlap: 150 },
  topK: 5,
};

if (config.env === 'production' && config.jwtSecret === 'dev-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}
if (config.embedding.provider === 'openai' && !config.embedding.openaiKey) {
  console.warn('[config] EMBEDDING_PROVIDER=openai but OPENAI_API_KEY is empty. Falling back to local embeddings.');
  config.embedding.provider = 'local';
}
if (config.vectorStore === 'pinecone' && (!config.pinecone.apiKey || !config.pinecone.host)) {
  throw new Error('VECTOR_STORE=pinecone requires PINECONE_API_KEY and PINECONE_INDEX_HOST');
}

module.exports = config;
