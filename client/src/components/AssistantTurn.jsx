import React, { useState } from 'react';
import PipelineRail from './PipelineRail.jsx';
import { SparklesIcon, CopyIcon, CheckIcon, ChevronDownIcon, BookOpenIcon } from './Icons.jsx';

function Answer({ text, onCite }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="answer">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split(/(\[\d+\])/g).map((part, j) => {
            const m = part.match(/^\[(\d+)\]$/);
            return m ? (
              <button
                key={j}
                className="cite"
                onClick={(e) => {
                  e.stopPropagation();
                  onCite(Number(m[1]));
                }}
                title={`Jump to Source [${m[1]}]`}
                aria-label={`Show source passage ${m[1]}`}
              >
                {m[1]}
              </button>
            ) : (
              part
            );
          })}
        </p>
      ))}
    </div>
  );
}

export default function AssistantTurn({ message, live, onCite, onSelect }) {
  const [copied, setCopied] = useState(false);
  const steps = (message.trace || []).map((t) => ({ ...t, status: t.status || 'done' }));

  const copyAnswer = (e) => {
    e.stopPropagation();
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="turn turn-assistant" onClick={onSelect}>
      {/* Header */}
      <div className="assistant-header">
        <SparklesIcon size={14} style={{ color: '#818cf8' }} />
        <span>NeuroStack AI Pipeline</span>
      </div>

      {/* Live Pipeline Rail or Collapsible Completed Trace */}
      {live ? (
        <div style={{ marginBottom: '8px' }}>
          <PipelineRail steps={steps} />
        </div>
      ) : (
        steps.length > 0 && (
          <details className="trace-accordion">
            <summary className="trace-summary">
              <span>View Multi-Agent Reasoning Trace ({steps.length} steps)</span>
              <ChevronDownIcon size={14} />
            </summary>
            <div style={{ padding: '4px' }}>
              <PipelineRail steps={steps} />
            </div>
          </details>
        )
      )}

      {/* Answer Body */}
      <div className="answer-card">
        {message.content ? (
          <Answer text={message.content} onCite={onCite} />
        ) : (
          live && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              <span>Agents are analyzing sources and drafting response…</span>
            </div>
          )
        )}

        {/* Footer info & actions */}
        {message.content && (
          <div className="answer-footer-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="critic-badge">
                <CheckIcon size={13} />
                <span>Fact-checked against sources</span>
              </span>
              {message.sources?.length > 0 && (
                <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpenIcon size={13} />
                  <span>{message.sources.length} sources cited</span>
                </span>
              )}
            </div>

            <button className="copy-btn" onClick={copyAnswer} title="Copy response">
              {copied ? (
                <>
                  <CheckIcon size={13} style={{ color: '#34d399' }} />
                  <span style={{ color: '#34d399' }}>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
