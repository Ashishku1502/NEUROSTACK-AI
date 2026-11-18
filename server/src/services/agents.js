// Multi-agent pipeline: Planner -> Retriever -> Writer -> Critic
const config = require('../config');
const llm = require('./llm');
const { retrieve } = require('./retriever');

const PLANNER_SYSTEM = `You are the Planner agent in a retrieval pipeline.
Given the chat history and the latest user message, reply with ONLY a JSON object:
{"intent":"document_qa" | "smalltalk","query":"a standalone search query"}
Use "smalltalk" only for greetings or thanks. Otherwise rewrite the user's message into a self-contained query.`;

const CRITIC_SYSTEM = `You are the Critic agent. Given a question, numbered context passages and a draft answer,
check whether every claim in the answer is supported by the passages.
Reply with ONLY a JSON object: {"grounded":true|false,"note":"one short sentence"}`;

function writerSystem(intent, sources) {
  if (intent === 'smalltalk') {
    return 'You are NeuroStack AI. Reply briefly and warmly, and mention that you can answer questions about the user\'s uploaded documents.';
  }
  const context = sources.length
    ? sources.map((s, i) => `[${i + 1}] (${s.title})\n${s.text}`).join('\n\n')
    : '(no passages found)';
  return `You are NeuroStack AI, an assistant that answers questions using the user's uploaded documents.
Rules:
- Use only the numbered passages below. Cite them inline like [1] or [2][3].
- If the passages do not contain the answer, say so plainly and suggest what to upload or ask.
- Be concise and well structured. No filler.

Passages:
${context}`;
}

function extractJson(text) {
  const m = text && text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function toHistory(messages) {
  const h = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
  while (h.length && h[0].role !== 'user') h.shift();
  return h;
}

async function demoAnswer(sources, onToken) {
  const text = sources.length
    ? 'Demo mode: no ANTHROPIC_API_KEY is set, so here are the most relevant passages instead of a written answer.\n\n' +
      sources.slice(0, 3).map((s, i) => `[${i + 1}] ${s.text.slice(0, 280).trim()}…`).join('\n\n')
    : 'Demo mode: no ANTHROPIC_API_KEY is set, and no documents match yet. Upload a document, then ask again.';
  for (const word of text.split(/(\s+)/)) {
    onToken(word);
    await new Promise((r) => setTimeout(r, 8));
  }
  return text;
}

async function runPipeline({ ownerId, question, history, emit }) {
  const trace = [];
  const step = (agent, status, detail = '') => {
    if (status === 'done') trace.push({ agent, detail });
    emit('chat:agent', { agent, status, detail });
  };
  const past = toHistory(history);
  const turn = [...past, { role: 'user', content: question }];

  // 1. Planner
  step('planner', 'running');
  let intent = 'document_qa';
  let query = question;
  if (llm.isLive) {
    try {
      const out = await llm.complete({ model: config.fastModel, system: PLANNER_SYSTEM, messages: turn, maxTokens: 200 });
      const plan = extractJson(out);
      if (plan?.intent === 'smalltalk') intent = 'smalltalk';
      if (typeof plan?.query === 'string' && plan.query.trim()) query = plan.query.trim();
    } catch (e) {
      console.warn('[planner]', e.message);
    }
  }
  step('planner', 'done', intent === 'smalltalk' ? 'Small talk, no search needed' : `Searching for: ${query}`);

  // 2. Retriever
  let sources = [];
  if (intent !== 'smalltalk') {
    step('retriever', 'running');
    sources = await retrieve(ownerId, query, config.topK);
    emit('chat:sources', { sources });
    const docs = new Set(sources.map((s) => s.title)).size;
    step('retriever', 'done', sources.length ? `${sources.length} passages from ${docs} document${docs === 1 ? '' : 's'}` : 'No documents indexed yet');
  }

  // 3. Writer (streams tokens)
  step('writer', 'running');
  const onToken = (token) => emit('chat:token', { token });
  let answer;
  if (llm.isLive) {
    try {
      answer = await llm.stream({ model: config.model, system: writerSystem(intent, sources), messages: turn, onToken });
      step('writer', 'done', `Written by ${config.model}`);
    } catch (err) {
      console.warn('[writer] LLM stream failed, falling back to demo mode:', err.message);
      answer = await demoAnswer(sources, onToken);
      step('writer', 'done', `Demo mode (LLM: ${err.message})`);
    }
  } else {
    answer = await demoAnswer(sources, onToken);
    step('writer', 'done', 'Demo mode, no LLM key');
  }

  // 4. Critic
  if (config.enableCritic && llm.isLive && sources.length && intent !== 'smalltalk') {
    step('critic', 'running');
    let note = 'Could not verify this answer';
    try {
      const context = sources.map((s, i) => `[${i + 1}] ${s.text}`).join('\n\n');
      const out = await llm.complete({
        model: config.fastModel,
        system: CRITIC_SYSTEM,
        messages: [{ role: 'user', content: `Question: ${question}\n\nPassages:\n${context}\n\nDraft answer:\n${answer}` }],
        maxTokens: 150,
      });
      const verdict = extractJson(out);
      if (verdict) note = `${verdict.grounded ? 'Supported by your documents' : 'Check this answer'}: ${verdict.note}`;
    } catch (e) {
      console.warn('[critic]', e.message);
    }
    step('critic', 'done', note);
  }

  return { answer, sources, trace };
}

module.exports = { runPipeline, extractJson, toHistory };
