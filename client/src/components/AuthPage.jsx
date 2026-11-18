import React, { useState } from 'react';
import { api } from '../api.js';
import PipelineRail from './PipelineRail.jsx';
import { LogoIcon, PlannerIcon, RetrieverIcon, WriterIcon, CriticIcon } from './Icons.jsx';

const SAMPLE_STEPS = [
  { agent: 'planner', status: 'done', detail: 'Decomposed: "Identify annual plan refund eligibility"' },
  { agent: 'retriever', status: 'done', detail: 'Retrieved 4 relevant passages from indexed documents' },
  { agent: 'writer', status: 'done', detail: 'Generated answer with citations [1] [2]' },
  { agent: 'critic', status: 'done', detail: '100% grounded against uploaded source documentation' },
];

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      onAuth(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-story">
        <div className="auth-story-content">
          <div className="brand-badge">
            <LogoIcon size={20} />
            <span>NEUROSTACK AI</span>
            <span className="pill">v1.0 Multi-Agent</span>
          </div>

          <h1>Intelligence Grounded in Your Documents</h1>
          <p className="auth-lede">
            Ask complex questions and watch four specialized agents plan, retrieve, write, and verify answers with precision citations.
          </p>

          <div style={{ marginTop: '12px' }}>
            <PipelineRail steps={SAMPLE_STEPS} />
          </div>

          <div className="auth-features-grid">
            <div className="feature-card">
              <div className="icon-wrap" style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>
                <PlannerIcon size={18} />
              </div>
              <h3>Autonomous Planner</h3>
              <p>Re-formulates complex user prompts into targeted semantic queries.</p>
            </div>
            <div className="feature-card">
              <div className="icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <RetrieverIcon size={18} />
              </div>
              <h3>Vector Retriever</h3>
              <p>Cosine similarity search with chunk overlapping and high recall.</p>
            </div>
            <div className="feature-card">
              <div className="icon-wrap" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                <WriterIcon size={18} />
              </div>
              <h3>Synthesis Writer</h3>
              <p>Streams answers with numbered inline citations tied to source docs.</p>
            </div>
            <div className="feature-card">
              <div className="icon-wrap" style={{ background: 'rgba(251, 113, 133, 0.15)', color: '#fb7185' }}>
                <CriticIcon size={18} />
              </div>
              <h3>Grounded Critic</h3>
              <p>Verifies generated claims to eliminate model hallucinations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>{mode === 'login' ? 'Welcome Back' : 'Get Started'}</h2>
            <p>{mode === 'login' ? 'Sign in to access your knowledge base' : 'Create an account to start asking questions'}</p>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: '14px' }}>
            {mode === 'register' && (
              <label>
                Full Name
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </label>
            )}

            <label>
              Email Address
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder={mode === 'login' ? 'Enter your password' : 'Min. 8 characters'}
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'login' ? 1 : 8}
              />
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '11px' }} disabled={busy}>
              {busy ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  <span>Processing…</span>
                </>
              ) : mode === 'login' ? (
                'Sign In to Workspace'
              ) : (
                'Create My Account'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {mode === 'login'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
