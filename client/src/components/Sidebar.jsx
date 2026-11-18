import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import {
  LogoIcon,
  PlusIcon,
  ChatIcon,
  UploadIcon,
  TrashIcon,
  DocIcon,
  LogoutIcon,
} from './Icons.jsx';

const fmtSize = (n = 0) => {
  if (n > 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
};

export default function Sidebar({
  user,
  chats = [],
  activeId,
  docs = [],
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onUpload,
  onDeleteDoc,
  uploading,
  uploadError,
  onLogout,
}) {
  const fileRef = useRef(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user.role === 'admin') {
      api.stats().then(setStats).catch(() => {});
    }
  }, [user.role, docs.length, chats.length]);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <LogoIcon size={28} />
        <div>
          <span className="brand-title">NeuroStack</span>
          <span className="brand-tag" style={{ marginLeft: '6px' }}>AI</span>
        </div>
      </div>

      {/* New Chat Button */}
      <button className="btn btn-primary" onClick={onNewChat} style={{ width: '100%' }}>
        <PlusIcon size={16} />
        <span>New Conversation</span>
      </button>

      {/* Conversations List */}
      <nav className="side-section" aria-label="Chats">
        <div className="section-header">
          <h2>Conversations</h2>
          {chats.length > 0 && <span className="count-badge">{chats.length}</span>}
        </div>
        {chats.length === 0 ? (
          <p className="muted" style={{ padding: '4px 6px' }}>No conversations yet. Start one above!</p>
        ) : (
          <ul className="list">
            {chats.map((c) => (
              <li key={c._id} className={c._id === activeId ? 'item is-active' : 'item'}>
                <button className="item-main" onClick={() => onSelectChat(c._id)} title={c.title}>
                  <ChatIcon size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
                  <span className="item-title">{c.title}</span>
                </button>
                <button
                  className="icon-btn"
                  aria-label={`Delete chat ${c.title}`}
                  onClick={() => onDeleteChat(c._id)}
                  title="Delete chat"
                >
                  <TrashIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Documents Knowledge Base */}
      <section className="side-section" aria-label="Documents">
        <div className="section-header">
          <h2>Knowledge Base</h2>
          {docs.length > 0 && <span className="count-badge">{docs.length}</span>}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />

        <button
          className="upload-card-btn"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload PDF, Markdown, or TXT"
        >
          {uploading ? (
            <>
              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              <span>Embedding & Chunking…</span>
            </>
          ) : (
            <>
              <UploadIcon size={16} />
              <span>Add Document (.pdf, .txt, .md)</span>
            </>
          )}
        </button>

        {uploadError && <p className="form-error" role="alert">{uploadError}</p>}

        {docs.length === 0 ? (
          <p className="muted" style={{ padding: '4px 6px' }}>
            Upload documentation to ground answers in verified context.
          </p>
        ) : (
          <ul className="list">
            {docs.map((d) => (
              <li key={d._id} className="item">
                <div className="item-main doc" title={d.title}>
                  <div className="doc-header-row">
                    <DocIcon ext={d.filename || d.title} size={15} />
                    <span className="item-title" style={{ fontWeight: 600 }}>{d.title}</span>
                  </div>
                  <span className={`badge badge-${d.status}`}>
                    {d.status === 'ready'
                      ? `${d.chunkCount} passages · ${fmtSize(d.size)}`
                      : d.status === 'failed'
                      ? 'Failed to process'
                      : 'Indexing…'}
                  </span>
                </div>
                <button
                  className="icon-btn"
                  aria-label={`Delete document ${d.title}`}
                  onClick={() => onDeleteDoc(d._id)}
                  title="Delete document"
                >
                  <TrashIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* User Footer */}
      <footer className="side-foot">
        {stats && (
          <div className="admin-chip">
            System: {stats.users} Users • {stats.documents} Docs • {stats.chats} Chats
          </div>
        )}
        <div className="user-profile-row">
          <div className="user-avatar-wrap">
            <div className="user-avatar">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-meta">
              <span className="user-name">{user.name}</span>
              <span className="user-badge">{user.role === 'admin' ? 'Administrator' : 'Researcher'}</span>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={onLogout}
            title="Sign out"
            style={{ width: '32px', height: '32px' }}
          >
            <LogoutIcon size={16} />
          </button>
        </div>
      </footer>
    </aside>
  );
}
