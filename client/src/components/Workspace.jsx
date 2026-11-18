import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken } from '../api.js';
import Sidebar from './Sidebar.jsx';
import SourcesPanel from './SourcesPanel.jsx';
import AssistantTurn from './AssistantTurn.jsx';
import Composer from './Composer.jsx';
import { LogoIcon, SparklesIcon } from './Icons.jsx';

const upsertStep = (trace = [], step) => {
  const safe = Array.isArray(trace) ? trace : [];
  const i = safe.findIndex((t) => t.agent === step.agent);
  if (i === -1) return [...safe, step];
  const next = [...safe];
  next[i] = step;
  return next;
};

const SUGGESTED_PROMPTS = [
  { label: 'Summarize Document', prompt: 'Provide a concise executive summary of the uploaded document with key points.' },
  { label: 'Extract Key Findings', prompt: 'What are the core findings, metrics, and actionable takeaways in this document?' },
  { label: 'Verify Claims & Policies', prompt: 'What specific requirements or policies are outlined in these documents?' },
  { label: 'Deep Semantic Q&A', prompt: 'Explain the main concepts and their relationships as described in the text.' },
];

export default function Workspace({ user, onLogout }) {
  const [chats, setChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [live, setLive] = useState(null); // { text, trace, sources }
  const [focusSources, setFocusSources] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [error, setError] = useState('');
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

    socket.on('connect_error', () => setError('Live connection failed. Check that the server is running.'));
    socket.on('chat:started', ({ chatId }) => {
      setActiveId(chatId);
      refreshChats();
    });
    socket.on('chat:agent', (step) => setLive((l) => (l ? { ...l, trace: upsertStep(l.trace, step) } : l)));
    socket.on('chat:sources', ({ sources }) => {
      setLive((l) => (l ? { ...l, sources } : l));
      setFocusSources(sources);
    });
    socket.on('chat:token', ({ token }) => setLive((l) => (l ? { ...l, text: l.text + token } : l)));
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
    socketRef.current.emit('chat:send', { chatId: activeId, message: text });
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
        uploading={uploading}
        uploadError={uploadError}
        onLogout={onLogout}
      />

      <main className="stage">
        <div className="thread" ref={threadRef}>
          {messages.length === 0 && !live && (
            <div className="hero-empty">
              <div className="hero-icon-bubble">
                <LogoIcon size={34} />
              </div>
              <h1>{hasReadyDocs ? 'What would you like to explore?' : 'Upload your first document'}</h1>
              <p>
                {hasReadyDocs
                  ? 'Ask any question in natural language. Four collaborative AI agents will coordinate to synthesize a verified, cited answer.'
                  : 'Start by uploading a PDF, TXT, or Markdown document from the knowledge base sidebar. Once indexed into vector chunks, you can ask in-depth questions.'}
              </p>

              {hasReadyDocs && (
                <div className="prompt-suggestions">
                  {SUGGESTED_PROMPTS.map((p, idx) => (
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
