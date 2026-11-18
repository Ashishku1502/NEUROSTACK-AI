import React from 'react';
import { PlannerIcon, RetrieverIcon, WriterIcon, CriticIcon, CheckIcon } from './Icons.jsx';

const AGENT_CONFIG = {
  planner: {
    label: 'Planner Agent',
    Icon: PlannerIcon,
    className: 'planner',
    description: 'Query decomposition & intent analysis',
  },
  retriever: {
    label: 'Retriever Agent',
    Icon: RetrieverIcon,
    className: 'retriever',
    description: 'Semantic vector similarity search',
  },
  writer: {
    label: 'Writer Agent',
    Icon: WriterIcon,
    className: 'writer',
    description: 'Grounded citation synthesis',
  },
  critic: {
    label: 'Critic Agent',
    Icon: CriticIcon,
    className: 'critic',
    description: 'Zero-hallucination fact verification',
  },
};

const ORDER = ['planner', 'retriever', 'writer', 'critic'];

export default function PipelineRail({ steps = [] }) {
  const sorted = [...steps].sort((a, b) => ORDER.indexOf(a.agent) - ORDER.indexOf(b.agent));

  return (
    <ol className="rail" aria-label="Multi-Agent Pipeline Trace">
      {sorted.map((s) => {
        const conf = AGENT_CONFIG[s.agent] || {
          label: s.agent,
          Icon: PlannerIcon,
          className: 'planner',
          description: '',
        };
        const { Icon } = conf;
        const isRunning = s.status === 'running';

        return (
          <li key={s.agent} className={`rail-step ${conf.className} ${isRunning ? 'is-running' : 'is-done'}`}>
            <div className="rail-icon-wrap">
              <Icon size={16} />
            </div>
            <div className="rail-name">{conf.label}</div>
            <div className="rail-detail">{isRunning ? 'Synthesizing analysis…' : s.detail || conf.description}</div>
            <span className={`rail-status-pill ${isRunning ? 'status-running' : 'status-done'}`}>
              {isRunning ? 'Running' : 'Done'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
