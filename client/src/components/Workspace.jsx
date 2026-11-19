import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken } from '../api.js';
import Sidebar from './Sidebar.jsx';
import SourcesPanel from './SourcesPanel.jsx';
import AssistantTurn from './AssistantTurn.jsx';
import Composer from './Composer.jsx';
import {
  LogoIcon,
  SparklesIcon,
  PlannerIcon,
  RetrieverIcon,
  WriterIcon,
  CriticIcon,
  ShieldCheckIcon,
} from './Icons.jsx';
import { SAMPLE_DOC_NAME, SAMPLE_DOC_CONTENT, SAMPLE_PROMPTS } from '../sampleDoc.js';

const upsertStep = (trace = [], step) => {
  const safe = Array.isArray(trace) ? trace : [];
  const i = safe.findIndex((t) => t.agent === step.agent);
  if (i === -1) return [...safe, step];
  const next = [...safe];
  next[i] = step;
  return next;
};

export default function Workspace({ user, onLogout }) {
  const [chats, setChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [live, setLive] = useState(null); // { text, trace, sources }
  const [focusSources, setFocusSources] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const socketRef = useRef(null);
  const threadRef = useRef(null);

  const refreshChats = useCallback(() => api.listChats().then(setChats).catch(() => {}), []);
  const refreshDocs = useCallback(() => api.listDocs().then(setDocs).catch(() => {}), []);

  useEffect(() => {
    refreshChats();
    refreshDocs();
    const socket = io({ auth: { token: getToken() } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
      setError('Live socket connection failed. Check backend server.');
    });

    socket.on('chat:started', ({ chatId }) => {
      setActiveId(chatId);
      refreshChats();
    });

    socket.on('chat:agent', (step) =>
      setLive((l) => (l ? { ...l, trace: upsertStep(l.trace, step) } : l))
    );

    socket.on('chat:sources', ({ sources }) => {
      setLive((l) => (l ? { ...l, sources } : l));
      setFocusSources(sources);
    });

    socket.on('chat:token', ({ token }) =>
      setLive((l) => (l ? { ...l, text: l.text + token } : l))
    );

    socket.on('chat:done', ({ message }) => {
      setMessages((m) => [...m, message]);
      setLive(null);
      setFocusSources(message.sources || []);
      refreshChats();
    });

    socket.on('chat:error', ({ error: msg }) => {
      setLive(null);
      setError(msg);
    });

    return () => socket.disconnect();
  }, [refreshChats, refreshDocs]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, live?.text]);

  function send(text) {
    setError('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLive({ text: '', trace: [], sources: [] });
    setHighlight(null);
    socketRef.current?.emit('chat:send', { chatId: activeId, message: text });
  }

  async function selectChat(id) {
    setError('');
    try {
      const chat = await api.getChat(id);
      setActiveId(id);
      setMessages(chat.messages);
      const lastAnswer = [...chat.messages].reverse().find((m) => m.role === 'assistant');
      setFocusSources(lastAnswer?.sources || []);
    } catch (e) {
      setError(e.message);
    }
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setFocusSources([]);
    setError('');
  }

  async function deleteChat(id) {
    await api.deleteChat(id).catch((e) => setError(e.message));
    if (id === activeId) newChat();
    refreshChats();
  }

  async function upload(file) {
    setUploading(true);
    setUploadError('');
    try {
      await api.uploadDoc(file);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
      refreshDocs();
    }
  }

  async function loadSampleDoc() {
    setUploading(true);
    setUploadError('');
    try {
      const blob = new Blob([SAMPLE_DOC_CONTENT], { type: 'text/markdown' });
      const file = new File([blob], SAMPLE_DOC_NAME, { type: 'text/markdown' });
      await api.uploadDoc(file);
      await refreshDocs();
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(id) {
    await api.deleteDoc(id).catch((e) => setUploadError(e.message));
    refreshDocs();
  }

  const showSources = (message) => setFocusSources(message.sources || []);
  const cite = (n) => {
    setHighlight(n);
    document.getElementById(`src-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const hasReadyDocs = docs.some((d) => d.status === 'ready');

  return (
    <div className="shell">
      <Sidebar
        user={user}
        chats={chats}
        activeId={activeId}
        docs={docs}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onUpload={upload}
        onDeleteDoc={deleteDoc}
        onLoadSampleDoc={loadSampleDoc}
        uploading={uploading}
        uploadError={uploadError}
        onLogout={onLogout}
      />

      <main className="stage">
        {/* Stage Top Bar */}
        <header className="stage-topbar">
          <div className="stage-title-wrap">
            <span className="stage-title">Workspace</span>
            <span className="stage-badge">
              <span className={`status-dot ${socketConnected ? 'is-online' : 'is-offline'}`} />
              {socketConnected ? 'Live Orchestration' : 'Connecting…'}
            </span>
          </div>

          <div className="stage-metrics">
            <span className="metric-tag" title="Agent Pipeline Active">
              <span className="metric-dot planner" />
              <span>4 Autonomous Agents</span>
            </span>
            <span className="metric-tag" title="Grounding & Zero Hallucination Mode">
              <ShieldCheckIcon size={13} style={{ color: '#34d399' }} />
              <span>Fact-Checked</span>
            </span>
          </div>
        </header>

        {/* Message Thread */}
        <div className="thread" ref={threadRef}>
          {messages.length === 0 && !live && (
            <div className="hero-empty">
              <div className="hero-icon-bubble">
                <LogoIcon size={38} />
              </div>
              <h1>{hasReadyDocs ? 'What would you like to explore?' : 'Upload your first document'}</h1>
              <p>
                {hasReadyDocs
                  ? 'Ask any question in natural language. Four collaborative AI agents will coordinate to synthesize a verified, cited answer.'
                  : 'Start by uploading a PDF, TXT, or Markdown document from the knowledge base sidebar, or launch our one-click enterprise sample.'}
              </p>

              {/* 4 Agent Pipeline Cards in Empty State */}
              <div className="agent-grid-preview">
                <div className="agent-preview-card card-planner">
                  <div className="preview-icon-box">
                    <PlannerIcon size={16} />
                  </div>
                  <div className="preview-card-info">
                    <div className="preview-card-name">1. Planner</div>
                    <div className="preview-card-desc">Decomposes questions into semantic queries</div>
                  </div>
                </div>

                <div className="agent-preview-card card-retriever">
                  <div className="preview-icon-box">
                    <RetrieverIcon size={16} />
                  </div>
                  <div className="preview-card-info">
                    <div className="preview-card-name">2. Retriever</div>
                    <div className="preview-card-desc">Scans vector index for top-k passages</div>
                  </div>
                </div>

                <div className="agent-preview-card card-writer">
                  <div className="preview-icon-box">
                    <WriterIcon size={16} />
                  </div>
                  <div className="preview-card-info">
                    <div className="preview-card-name">3. Writer</div>
                    <div className="preview-card-desc">Synthesizes answer with inline citations</div>
                  </div>
                </div>

                <div className="agent-preview-card card-critic">
                  <div className="preview-icon-box">
                    <CriticIcon size={16} />
                  </div>
                  <div className="preview-card-info">
                    <div className="preview-card-name">4. Critic</div>
                    <div className="preview-card-desc">Audits facts to eliminate hallucinations</div>
                  </div>
                </div>
              </div>

              {hasReadyDocs ? (
                <div className="prompt-suggestions">
                  {SAMPLE_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      className="prompt-pill"
                      onClick={() => send(p.prompt)}
                    >
                      <SparklesIcon size={14} className="spark" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                  <button
                    className="btn btn-primary"
                    style={{
                      padding: '12px 26px',
                      fontSize: '14.5px',
                      boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
                      borderRadius: '12px',
                    }}
                    onClick={loadSampleDoc}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                        <span>Indexing Enterprise Sample Doc…</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon size={18} />
                        <span>Try Sample Document (10s Instant Demo)</span>
                      </>
                    )}
                  </button>
                  <span className="muted" style={{ fontSize: '12.5px' }}>
                    Automatically chunks, embeds, and indexes a sample policy document to test the multi-agent pipeline immediately.
                  </span>
                </div>
              )}
            </div>
          )}

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div className="turn turn-user" key={m._id || i}>
                <p>{m.content}</p>
              </div>
            ) : (
              <AssistantTurn key={m._id || i} message={m} onCite={cite} onSelect={() => showSources(m)} />
            )
          )}

          {live && (
            <AssistantTurn
              live
              message={{ content: live.text, trace: live.trace }}
              onCite={cite}
              onSelect={() => {}}
            />
          )}
        </div>

        {error && (
          <div className="form-error" style={{ margin: '0 24px 12px' }} role="alert">
            {error}
          </div>
        )}

        <Composer onSend={send} disabled={Boolean(live)} />
      </main>

      <SourcesPanel sources={focusSources} highlight={highlight} />
    </div>
  );
}
