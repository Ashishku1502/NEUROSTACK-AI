import React from 'react';
import { BookOpenIcon, DocIcon } from './Icons.jsx';

export default function SourcesPanel({ sources = [], highlight }) {
  return (
    <aside className="sources" aria-label="Sources">
      <div className="section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpenIcon size={14} style={{ color: '#38bdf8' }} />
          <span>Cited Sources</span>
        </h2>
        {sources.length > 0 && <span className="count-badge">{sources.length}</span>}
      </div>

      {sources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 12px', display: 'grid', gap: '10px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto',
              color: '#64748b',
            }}
          >
            <BookOpenIcon size={22} />
          </div>
          <p className="muted">
            Passages retrieved by the vector agent will appear here. Click on any citation badge in an answer to inspect its original context.
          </p>
        </div>
      ) : (
        <ol className="source-list">
          {sources.map((s, i) => (
            <li
              key={`${s.documentId}-${s.chunkIndex}`}
              className={highlight === i + 1 ? 'source-card is-hot' : 'source-card'}
              id={`src-${i + 1}`}
            >
              <div className="source-card-header">
                <span className="cite" style={{ margin: 0 }}>{i + 1}</span>
                <DocIcon ext={s.title || ''} size={15} />
                <span className="source-card-title" title={s.title}>{s.title}</span>
                <span className="source-score-pill" title="Cosine Similarity Score">
                  {(s.score * 100).toFixed(0)}% Match
                </span>
              </div>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
