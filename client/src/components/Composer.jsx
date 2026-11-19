import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './Icons.jsx';

export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const send = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    // Auto grow textarea up to max height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder="Ask a question about your indexed documents…"
          aria-label="Message prompt"
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />
        <div className="composer-actions">
          <button
            className="composer-send-btn"
            onClick={send}
            disabled={disabled || !text.trim()}
            title="Ask NeuroStack (Enter ↵)"
          >
            {disabled ? (
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            ) : (
              <SendIcon size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
