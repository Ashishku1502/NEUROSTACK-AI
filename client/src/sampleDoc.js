export const SAMPLE_DOC_NAME = 'NeuroStack_Enterprise_Spec.md';

export const SAMPLE_DOC_CONTENT = `# NeuroStack Enterprise Architecture & Policy Specification

## 1. System Overview
NeuroStack AI is an autonomous, multi-agent Retrieval-Augmented Generation (RAG) platform designed to eliminate model hallucinations and provide verifiable, traceable answers for enterprise knowledge bases.

## 2. Multi-Agent Pipeline Orchestration
Instead of issuing a single massive prompt to a monolithic LLM, NeuroStack partitions cognitive duties among four specialized agents:
- **Planner Agent (Claude Haiku)**: Evaluates user conversation history and intent. It detects whether the input is conversational smalltalk or document Q&A, decomposing complex multi-part questions into standalone semantic search queries.
- **Retriever Agent (Vector Search)**: Executes cosine similarity search over chunked vector embeddings (dim: 384 or 1536). It returns the top-K highest-ranking passages.
- **Writer Agent (Claude Sonnet)**: Streams an answer synthesized exclusively from the numbered retrieved context passages. Inline citations such as [1] and [2] link every factual claim to its source chunk.
- **Critic Agent (Claude Haiku)**: Audits the draft answer against the original source context. It flags unsupported statements and issues a mathematical grounding score.

## 3. Subscription & Refund Policy
- **Annual Enterprise Licenses**: Eligible for a 100% full refund within 30 days of initial deployment, provided less than 50,000 vector queries were performed.
- **Monthly Professional Tier**: Cancellable at any time; refunds are prorated based on calendar days remaining in the billing period.
- **Data Retention upon Termination**: All vector indexes, chunk embeddings, and cached uploads are permanently scrubbed from MongoDB and Pinecone within 14 calendar days of account cancellation.

## 4. Security & Compliance
- Multi-tenant tenant namespace isolation ensures User A cannot access or query User B's documents.
- Encryption: All documents are encrypted in transit via TLS 1.3 and at rest with AES-256.
- Offline Demo Mode: When unconfigured, the server operates locally without cloud API calls, utilizing in-memory vector cosine ranking.
`;

export const SAMPLE_PROMPTS = [
  { label: 'Agent Pipeline Roles', prompt: 'What are the 4 agents in the pipeline and what is each agent responsible for?' },
  { label: '30-Day Refund Policy', prompt: 'What are the exact eligibility conditions for an annual license refund?' },
  { label: 'Critic & Hallucinations', prompt: 'How does the Critic agent verify that an answer is factual and grounded?' },
  { label: 'Data Retention Rules', prompt: 'How quickly are vector chunks and documents deleted after account termination?' },
];
