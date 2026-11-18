# ⚡ NeuroStack AI

> **Next-Generation Full-Stack Multi-Agent RAG Platform with Real-Time Streaming & Modern Luminous UI**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=flat-square&logo=socketdotio)](https://socket.io/)
[![Claude AI](https://img.shields.io/badge/Anthropic-Claude%203.5-D97706?style=flat-square)](https://anthropic.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

NeuroStack AI is an autonomous, multi-agent Retrieval-Augmented Generation (RAG) system. Upload your documents, ask questions, and watch a **Planner → Retriever → Writer → Critic** multi-agent pipeline plan, search, synthesize, and mathematically verify each answer with inline clickable citations.

---

## ✨ Modern UI Design & Visual System

NeuroStack AI features a handcrafted, high-contrast, modern UI built from the ground up:

- 🌌 **Luminous Obsidian Theme**: Deep-space background (`#0a0e17`) accented with electric indigo (`#6366f1`), cyber violet (`#8b5cf6`), and neon cyan (`#06b6d4`).
- 🔮 **Custom SVG Visual Assets & Icons**: Handcrafted vector graphics including the geometric neural logo, agent status emblems, document type indicators, and action triggers.
- ⚡ **Interactive Multi-Agent Pipeline Rail**: Live visualizer cards that pulse with glowing animations while agents work:
  - 🟣 **Planner Agent**: Analyzes intent and rewrites complex prompts into targeted semantic queries.
  - 🔵 **Retriever Agent**: Executes high-dimensional vector search across indexed document chunks.
  - 🟢 **Writer Agent**: Synthesizes structured prose with inline citation tags (`[1]`, `[2]`).
  - 🔴 **Critic Agent**: Audits generated claims against retrieved context to eliminate hallucinations.
- 🎯 **Interactive Inline Citations**: Clickable numbered badges (`[1]`, `[2]`) in the answer that automatically jump to and illuminate the exact source passage in the inspection panel.
- 📊 **Real-Time Sources Inspector**: Dedicated side panel showcasing retrieved passages, cosine similarity percentages (e.g. `94% Match`), and document metadata.
- 💬 **Floating Command Composer**: Minimalist floating composer with auto-expanding textarea, keyboard shortcuts (`Enter ↵` to send, `Shift + Enter` for multiline), and clickable starter prompt pills.
- 🛡️ **Critic Grounding Badge**: Visual confirmation on completed answers indicating verified source alignment.
- 📋 **One-Click Answer Actions**: Copy-to-clipboard button with visual feedback and conversation management.

---

## 🏛️ Architecture Overview

```
┌──────────────────────── React 18 + Vite Client ────────────────────────┐
│                                                                        │
│   • Luminous Obsidian Theme         • Live Multi-Agent Pipeline Rail   │
│   • Drag & Drop Document Ingestion  • Interactive Citation Inspector   │
│   • Floating Command Composer       • Real-Time Token Streaming        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  REST + Socket.IO (WebSockets)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Node.js + Express Server                        │
│                                                                        │
│   ┌───────────────────── Multi-Agent Orchestration ─────────────────┐  │
│   │                                                                 │  │
│   │   [Planner] ──────▶ [Retriever] ──────▶ [Writer] ──────▶ [Critic]│  │
│   │   (Decompose)       (Vector Search)     (Stream + Cite)  (Audit)│  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│   • Auto In-Memory MongoDB Fallback (Runs without Docker or local DB)  │
│   • Local TF-IDF Vector Store + MongoDB Atlas + Pinecone Adapters      │
│   • JWT Session Authentication & Role-Based Access Control             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
         [MongoDB / Atlas]                    [Pinecone / S3]
        (Chunks & Metadata)                 (High-Scale Vectors)
```

---

## 🚀 Quick Start

### Option 1: Automatic Local Dev (Recommended - No Docker Required!)

NeuroStack AI includes an **automatic in-memory MongoDB fallback**, meaning you can start developing immediately without installing MongoDB or Docker.

```bash
# 1. Clone the repository
git clone https://github.com/Ashishku1502/NEUROSTACK-AI.git
cd NEUROSTACK-AI

# 2. Launch both services with one command (Windows):
.\run.bat

# Or run via npm workspaces:
npm install --prefix server
npm install --prefix client

# Start Backend (Terminal 1)
npm run server

# Start Frontend (Terminal 2)
npm run client
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

> 💡 **Demo Mode:** If `ANTHROPIC_API_KEY` is not provided, the app runs in **Demo Mode** using local vector embeddings and document passages. Add your Claude API key to `.env` to activate the full multi-agent generative pipeline.

---

### Option 2: Docker Compose

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build and run all containers
docker compose up --build

# Open http://localhost:8080
```

---

## ⚙️ Configuration (`.env`)

| Environment Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | *(auto-generated)* | Key for signing session authentication tokens |
| `ANTHROPIC_API_KEY` | *(empty)* | Claude API key (Leave empty for zero-setup demo mode) |
| `CLAUDE_MODEL` | `claude-sonnet-5-5` | High-capability model for the **Writer Agent** |
| `CLAUDE_FAST_MODEL` | `claude-haiku-5-5` | Fast model for the **Planner & Critic Agents** |
| `ENABLE_CRITIC` | `true` | Enables zero-hallucination fact verification audit |
| `EMBEDDING_PROVIDER` | `local` | `local` (offline deterministic hashing) or `openai` |
| `VECTOR_STORE` | `mongo` | `mongo` (in-memory/local), `atlas`, or `pinecone` |
| `PINECONE_API_KEY` | *(empty)* | Optional Pinecone API key |
| `PINECONE_INDEX_HOST` | *(empty)* | Optional Pinecone index endpoint |
| `S3_BUCKET` | *(empty)* | Optional AWS S3 bucket for original file storage |

---

## 🔌 API & Real-Time Events

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Fetch active user session |
| `GET` | `/api/documents` | List uploaded user documents |
| `POST` | `/api/documents` | Upload and chunk PDF, TXT, or Markdown file |
| `DELETE` | `/api/documents/:id` | Delete document and remove vector chunks |
| `GET` | `/api/chats` | Retrieve conversation history |
| `GET` | `/api/chats/:id` | Retrieve chat messages with sources and agent trace |
| `GET` | `/api/search?q=...` | Direct semantic vector search test endpoint |
| `GET` | `/api/health` | Health check endpoint |

### Socket.IO Real-Time Stream

- **Client Emits**: `chat:send` `{ chatId?, message }`
- **Server Streams**:
  - `chat:started` → Session initialization
  - `chat:agent` → Live agent status (`planner` → `retriever` → `writer` → `critic`)
  - `chat:sources` → Retrieved document passages
  - `chat:token` → Real-time streaming answer tokens
  - `chat:done` → Final message persistence with citations and trace

---

## 🧪 Testing

```bash
cd server
npm test
```

All unit tests for the agent pipeline, boundary-aware text chunking, and local vector embeddings pass automatically.

---

## 📂 Project Structure

```
NEUROSTACK-AI/
├── client/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AssistantTurn.jsx   # Message turn with citations & trace
│   │   │   ├── AuthPage.jsx        # Graphic split auth screen
│   │   │   ├── Composer.jsx        # Floating prompt card
│   │   │   ├── Icons.jsx           # Custom SVG icon library
│   │   │   ├── PipelineRail.jsx    # Multi-agent live visualizer
│   │   │   ├── Sidebar.jsx         # Chats & document knowledge base
│   │   │   ├── SourcesPanel.jsx    # Cited sources inspector drawer
│   │   │   └── Workspace.jsx       # Main interactive stage & hero
│   │   ├── styles.css              # Luminous Obsidian design system
│   │   └── api.js                  # REST API client
│   └── vite.config.js
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── models/                 # Mongoose schemas (User, Document, Chunk, Chat)
│   │   ├── routes/                 # REST routing (Auth, Docs, Chats, Search)
│   │   ├── services/
│   │   │   ├── agents.js           # Multi-agent orchestration pipeline
│   │   │   ├── chunker.js          # Boundary-aware text chunker
│   │   │   ├── embeddings.js       # Vector embedding generation
│   │   │   ├── llm.js              # Anthropic Claude client & stream
│   │   │   ├── retriever.js        # Vector retrieval logic
│   │   │   └── vectorStore.js      # Mongo, Atlas, & Pinecone adapters
│   │   ├── db.js                   # MongoDB connection with in-memory fallback
│   │   └── index.js                # Server entrypoint with Socket.IO
│   └── test/                       # Node test runner test suites
├── docker-compose.yml          # Container orchestration
├── package.json                # Root workspace configuration
└── run.bat                     # Windows one-click service launcher
```

---

## 📄 License

MIT License © 2026 NeuroStack AI. Built with precision for intelligent document analysis.
