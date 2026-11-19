import React, { useState } from 'react';
import {
  BookOpenIcon,
  DocIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
  ZapIcon,
} from './Icons.jsx';

export default function SourcesPanel({ sources = [], highlight }) {
  const [filterText, setFilterText] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  const filteredSources = sources.filter((s) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.text && s.text.toLowerCase().includes(q))
    );
  });

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getScoreColor = (score) => {
    const pct = Math.round(score * 100);
    if (pct >= 85) return '#34d399'; // Emerald
    if (pct >= 70) return '#38bdf8'; // Sky blue
    return '#fbbf24'; // Amber
  };

  return (
    <aside className="sources" aria-label="Sources Inspector">
      {/* Header */}
      <div className="section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpenIcon size={15} style={{ color: '#38bdf8' }} />
          <span>Vector Sources</span>
        </h2>
        {sources.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="count-badge">{sources.length} retrieved</span>
          </div>
        )}
      </div>

      {/* Filter / Search Bar (only when sources exist) */}
      {sources.length > 0 && (
        <div className="sources-filter-bar">
          <SearchIcon size={14} className="filter-icon" />
          <input
            type="text"
            className="sources-filter-input"
            placeholder="Search within retrieved passages…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Filter passages"
          />
          {filterText && (
            <button
              className="sources-filter-clear"
              onClick={() => setFilterText('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {sources.length === 0 ? (
        <div className="sources-empty-state">
          <div className="sources-empty-icon">
            <BookOpenIcon size={24} />
          </div>
          <h3>No Citations Active</h3>
          <p className="muted">
            Passages retrieved by the vector agent will be inspected here with similarity match scores and original context snippets.
          </p>
          <div className="sources-empty-hint">
            <ZapIcon size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span>Click any inline citation badge like [1] to jump directly to its source.</span>
          </div>
        </div>
      ) : filteredSources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-sub)' }}>
          No passages match "{filterText}".
        </div>
      ) : (
        <ol className="source-list">
          {filteredSources.map((s, i) => {
            const originalIndex = sources.indexOf(s);
            const citationNumber = originalIndex + 1;
            const isHighlighted = highlight === citationNumber;
            const pct = Math.round((s.score || 0.85) * 100);
            const scoreColor = getScoreColor(s.score || 0.85);

            return (
              <li
                key={`${s.documentId}-${s.chunkIndex || i}`}
                className={`source-card ${isHighlighted ? 'is-hot' : ''}`}
                id={`src-${citationNumber}`}
              >
                {/* Source Card Header */}
                <div className="source-card-header">
                  <span className="cite" style={{ margin: 0 }}>
                    {citationNumber}
                  </span>
                  <DocIcon ext={s.title || ''} size={15} />
                  <span className="source-card-title" title={s.title}>
                    {s.title || 'Indexed Document'}
                  </span>
                  <button
                    className="source-copy-btn"
                    onClick={() => handleCopy(s.text, i)}
                    title="Copy passage text"
                  >
                    {copiedIdx === i ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                  </button>
                </div>

                {/* Similarity Score Meter Bar */}
                <div className="source-meter-wrap" title={`Cosine Match Score: ${pct}%`}>
                  <div className="source-meter-label">
                    <span>Relevance</span>
                    <span style={{ color: scoreColor, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="source-meter-track">
                    <div
                      className="source-meter-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: scoreColor,
                        boxShadow: `0 0 8px ${scoreColor}40`,
                      }}
                    />
                  </div>
                </div>

                {/* Passage Text */}
                <p className="source-passage-text">{s.text}</p>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
