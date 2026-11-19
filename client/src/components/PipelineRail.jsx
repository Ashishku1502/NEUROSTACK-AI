import React from 'react';
import {
  PlannerIcon,
  RetrieverIcon,
  WriterIcon,
  CriticIcon,
  CheckIcon,
} from './Icons.jsx';

const AGENT_ORDER = ['planner', 'retriever', 'writer', 'critic'];

const AGENT_META = {
  planner: {
    label: 'Planner',
    title: 'Query Decomposition & Routing',
    engine: 'Claude 3.5 Sonnet',
    Icon: PlannerIcon,
    accent: '#818cf8',
    glowClass: 'agent-planner-glow',
    description: 'Analyzes intent, breaks multi-part queries into atomic search tasks.',
  },
  retriever: {
    label: 'Retriever',
    title: 'Semantic Vector Retrieval',
    engine: 'Pinecone / Cosine 1536d',
    Icon: RetrieverIcon,
    accent: '#38bdf8',
    glowClass: 'agent-retriever-glow',
    description: 'Embeds query and fetches top-k highest similarity passage chunks.',
  },
  writer: {
    label: 'Writer',
    title: 'Grounded Citation Synthesis',
    engine: 'Claude 3.5 Sonnet',
    Icon: WriterIcon,
    accent: '#34d399',
    glowClass: 'agent-writer-glow',
    description: 'Drafts grounded response using numbered inline citations.',
  },
  critic: {
    label: 'Critic',
    title: 'Hallucination & Fact Audit',
    engine: 'Zero-Hallucination Guard',
    Icon: CriticIcon,
    accent: '#fb7185',
    glowClass: 'agent-critic-glow',
    description: 'Verifies every claim against source passages to prevent hallucination.',
  },
};

export default function PipelineRail({ steps = [] }) {
  // Map incoming steps by agent name
  const stepMap = {};
  for (const s of steps) {
    stepMap[s.agent] = s;
  }

  return (
    <div className="pipeline-orchestrator" aria-label="Multi-Agent Pipeline Trace">
      {/* Horizontal Agent Flow Diagram */}
      <div className="flow-track">
        {AGENT_ORDER.map((agentKey, idx) => {
          const meta = AGENT_META[agentKey];
          const step = stepMap[agentKey];
          const isRunning = step?.status === 'running';
          const isDone = step && step.status !== 'running';
          const isIdle = !step;
          const { Icon } = meta;

          const stateClass = isRunning
            ? 'node-running'
            : isDone
            ? 'node-done'
            : 'node-idle';

          return (
            <React.Fragment key={agentKey}>
              <div className={`flow-node ${stateClass}`} title={`${meta.label} - ${meta.engine}`}>
                <div className="flow-node-icon" style={{ borderColor: isRunning || isDone ? meta.accent : undefined }}>
                  {isDone ? (
                    <CheckIcon size={14} className="node-check-icon" />
                  ) : (
                    <Icon size={15} />
                  )}
                  {isRunning && <span className="node-pulse-ring" style={{ borderColor: meta.accent }} />}
                </div>
                <div className="flow-node-text">
                  <span className="flow-node-label">{meta.label}</span>
                  <span className="flow-node-engine">{meta.engine.split(' ')[0]}</span>
                </div>
              </div>

              {idx < AGENT_ORDER.length - 1 && (
                <div className={`flow-connector ${isDone ? 'connector-done' : isRunning ? 'connector-running' : ''}`}>
                  <div className="connector-line" />
                  {isRunning && <div className="connector-particle" />}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Detail Cards */}
      <ol className="rail-step-list">
        {AGENT_ORDER.map((agentKey) => {
          const step = stepMap[agentKey];
          if (!step) return null;
          const meta = AGENT_META[agentKey];
          const { Icon } = meta;
          const isRunning = step.status === 'running';

          return (
            <li
              key={agentKey}
              className={`rail-step rail-step-${agentKey} ${isRunning ? 'is-running' : 'is-done'}`}
            >
              <div className="rail-icon-wrap" style={{ color: meta.accent }}>
                <Icon size={16} />
              </div>
              <div className="rail-content">
                <div className="rail-header-row">
                  <span className="rail-name">{meta.label}</span>
                  <span className="rail-engine-tag">{meta.engine}</span>
                  <span className={`rail-status-pill ${isRunning ? 'status-running' : 'status-done'}`}>
                    {isRunning ? (
                      <>
                        <span className="tiny-spin" />
                        <span>Running</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon size={11} />
                        <span>Completed</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="rail-detail">
                  {isRunning
                    ? meta.description
                    : step.detail || meta.description}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
