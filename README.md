# NeuroStack AI

A full-stack RAG platform with multi-agent LLM orchestration, vector search, and real-time streaming.
Upload documents, ask questions, and watch a Planner → Retriever → Writer → Critic pipeline build each answer, with citations.

**Stack:** React 18 + Vite · Node.js + Express · MongoDB · Socket.IO · Claude API · Pinecone / Atlas Vector Search · AWS (S3, EC2) · Docker · GitHub Actions

```
┌────────── React client ──────────┐        ┌──────────────── Node.js server ─────────────────┐
│ Auth · Chat · Documents · Sources│ ─REST─▶│ JWT auth · RBAC · uploads · chats               │
│ Live pipeline rail               │ ◀─WS── │ Socket.IO: stream tokens + agent steps          │
└──────────────────────────────────┘        │                                                 │
                                            │  Planner ─▶ Retriever ─▶ Writer ─▶ Critic       │
                                            │  (Haiku)    (embed +     (Sonnet,  (Haiku,      │
                                            │              vector      streams)   grounding   │
                                            │              search)                check)      │
                                            └───────┬───────────────┬───────────────┬─────────┘
                                                MongoDB       Pinecone / Atlas    S3 (optional)
```

## Quick start (Docker, easiest)

```bash
cp .env.example .env        # set JWT_SECRET, optionally ANTHROPIC_API_KEY
docker compose up --build
# open http://localhost:8080
```

The first account you register becomes the **admin**.

## Quick start (local dev)

Requires Node 18+ and a MongoDB instance (`docker run -d -p 27017:27017 mongo:7` works).

```bash
# terminal 1
cd server
cp .env.example .env        # add ANTHROPIC_API_KEY for real answers
npm install
npm run dev                 # http://localhost:4000

# terminal 2
cd client
npm install
npm run dev                 # http://localhost:5173
```

**No API keys?** It still runs. Without `ANTHROPIC_API_KEY` the app is in *demo mode*: retrieval works (local hashed embeddings), and the Writer returns the top passages instead of a written answer. Add a key to switch on the full agent pipeline.

## Configuration (`server/.env`)

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | empty | Empty = demo mode |
| `CLAUDE_MODEL` / `CLAUDE_FAST_MODEL` | `claude-sonnet-5-5` / `claude-haiku-5-5` | Writer vs. Planner and Critic |
| `ENABLE_CRITIC` | `true` | Extra grounding check after each answer |
| `EMBEDDING_PROVIDER` | `local` | `local` (offline) or `openai` (needs `OPENAI_API_KEY`). Anthropic has no embeddings endpoint |
| `EMBEDDING_DIM` | `384` | Must match your vector index dimension |
| `VECTOR_STORE` | `mongo` | `mongo`, `atlas`, or `pinecone` |
| `S3_BUCKET` | empty | If set, original uploads are stored in S3 |

Changing the embedding provider or dimension later means re-uploading your documents.

### Using Pinecone
1. Create a **serverless index**, metric `cosine`, dimension = `EMBEDDING_DIM` (384 for local, or e.g. 1024/1536 for OpenAI).
2. Set `VECTOR_STORE=pinecone`, `PINECONE_API_KEY`, and `PINECONE_INDEX_HOST` (the index's host URL).
3. Each user gets their own namespace, so documents are isolated per account.

### Using MongoDB Atlas Vector Search
1. Set `VECTOR_STORE=atlas` and point `MONGODB_URI` at your Atlas cluster.
2. Create a Search index named `chunk_vector_index` on the `chunks` collection:
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "owner" }
  ]
}
```
Set `numDimensions` to your `EMBEDDING_DIM`.

## API

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Returns `{ token, user }` |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/documents` | List, or upload (`multipart`, field `file`; PDF/TXT/MD, 10 MB) |
| DELETE | `/api/documents/:id` | Removes the document and its vectors |
| GET | `/api/chats`, `/api/chats/:id` | List chats, or one chat with messages and sources |
| PATCH / DELETE | `/api/chats/:id` | Rename, delete |
| GET | `/api/search?q=...&k=5` | Semantic search without the LLM (debug retrieval) |
| GET | `/api/admin/stats` | Admin only |

**Socket.IO** (auth via `io({ auth: { token } })`): client sends `chat:send { chatId?, message }`; server emits `chat:started`, `chat:agent`, `chat:sources`, `chat:token`, `chat:done`, `chat:error`.

## Project layout

```
server/src
  config.js  app.js  index.js  db.js
  models/        User, Document, Chunk, Chat
  middleware/    auth (JWT + roles), error handling
  routes/        auth, documents, chats, search, admin
  services/      chunker, textExtract, embeddings, vectorStore, retriever, llm, agents, storage
  realtime/      socket.js (streaming chat)
server/test      unit tests (node:test)
client/src       App, api.js, components/ (Workspace, Sidebar, AssistantTurn, PipelineRail, SourcesPanel, ...)
```

## How it was built, step by step

1. **Server skeleton:** Express, Mongoose, config loader, central error handler, Helmet, CORS, rate limiting.
2. **Auth and roles:** bcrypt password hashing, JWT, `requireAuth` / `requireRole`, first user becomes admin.
3. **Ingestion:** upload → extract text (PDF/TXT/MD) → chunk (~900 chars, 150 overlap) → embed → store vectors.
4. **Vector store abstraction:** one interface, three backends (MongoDB, Atlas Vector Search, Pinecone).
5. **Agents:** Planner rewrites the question into a search query, Retriever finds passages, Writer streams a cited answer, Critic checks it is grounded.
6. **Real-time:** Socket.IO streams agent steps and tokens; messages and sources persist in MongoDB.
7. **Client:** React workspace with chat, documents, the live pipeline rail, and a sources panel linked to inline citations.
8. **Ship it:** Dockerfiles, `docker-compose.yml`, GitHub Actions for test, build, and deploy.

## Deploy to AWS (EC2 + Docker)

1. Launch an Ubuntu EC2 instance, open ports 22 and 80/8080, install Docker + the compose plugin.
2. `git clone` this repo to `~/neurostack-ai`, create `.env`, run `docker compose up -d --build`.
3. (Optional) Create an S3 bucket, attach an IAM role to the instance with `s3:PutObject` / `s3:DeleteObject`, and set `S3_BUCKET`.
4. For automatic deploys, add repo secrets `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` and the variable `DEPLOY_ENABLED=true`.
5. Put an Application Load Balancer or Caddy/Nginx with HTTPS in front, and set `CLIENT_ORIGIN` to your domain.

## Tests

```bash
cd server && npm test
```

## Resume line

> **NeuroStack AI:** Full-stack RAG platform with multi-agent LLM orchestration (Planner/Retriever/Writer/Critic), vector search on Pinecone/Atlas, and real-time token streaming over WebSockets; React + Node.js + MongoDB, deployed on AWS with Docker and GitHub Actions CI/CD.

## Known limits

- The `mongo` store compares vectors in-process, so use `atlas` or `pinecone` beyond a few thousand chunks.
- Local embeddings match on shared words; use OpenAI embeddings for meaning-based search.
- Uploads are indexed during the request, so very large PDFs will take a while.
