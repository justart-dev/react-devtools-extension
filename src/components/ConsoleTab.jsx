import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Info, Terminal, TriangleAlert } from 'lucide-react';
import PanelHeader from './ui/PanelHeader';
import SummaryBar from './ui/SummaryBar';
import EmptyState from './ui/EmptyState';
import './ConsoleTab.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'error', label: 'Error' },
  { id: 'warn', label: 'Warn' },
  { id: 'info', label: 'Info' },
  { id: 'log', label: 'Log' },
];

const getLevelIcon = (level) => {
  switch (level) {
    case 'error':
      return <AlertCircle size={14} />;
    case 'warn':
      return <TriangleAlert size={14} />;
    case 'info':
      return <Info size={14} />;
    default:
      return <Terminal size={14} />;
  }
};

const stringifyPayload = (payload) => {
  if (!Array.isArray(payload)) {
    if (payload == null) return '';
    if (typeof payload === 'object') {
      return JSON.stringify(payload, null, 2);
    }
    return String(payload);
  }

  return payload
    .map((part) => {
      if (typeof part === 'string') {
        try {
          return JSON.stringify(JSON.parse(part), null, 2);
        } catch {
          return part;
        }
      }

      if (typeof part === 'object' && part !== null) {
        return JSON.stringify(part, null, 2);
      }

      return String(part);
    })
    .join('\n');
};

const getPreview = (payload) => {
  const text = stringifyPayload(payload).replace(/\s+/g, ' ').trim();
  return text || 'Empty log payload';
};

const ConsoleTab = ({ logs, isConnected }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filteredLogs = useMemo(() => {
    const orderedLogs = [...logs].reverse();
    if (activeFilter === 'all') {
      return orderedLogs;
    }

    return orderedLogs.filter((log) => log.level === activeFilter);
  }, [activeFilter, logs]);

  const summaryItems = [
    {
      label: 'Connection',
      value: isConnected ? 'Live' : 'Disconnected',
      tone: isConnected ? 'success' : 'warning',
    },
    { label: 'Visible', value: filteredLogs.length.toString() },
    { label: 'Filter', value: activeFilter === 'all' ? 'All levels' : activeFilter.toUpperCase() },
  ];

  return (
    <section className="panel-shell">
      <PanelHeader
        eyebrow="Primary feed"
        title={isConnected ? 'Console activity from the current page' : 'Waiting for console activity'}
        description="Scan recent logs quickly and open an entry only when you need the full payload."
      />

      <SummaryBar items={summaryItems} />

      <div className="panel-toolbar">
        <div className="panel-toolbar-group">
          <span className="toolbar-label">Levels</span>
          <div className="segmented-control">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`segment ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="console-list" role="list">
        {filteredLogs.map((log, index) => {
          const rowId = `${log.timestamp || 'log'}-${index}`;
          const isExpanded = expandedId === rowId;
          const preview = getPreview(log.payload);
          const formattedPayload = stringifyPayload(log.payload);

          return (
            <article key={rowId} className={`console-row ${log.level || 'log'} ${isExpanded ? 'expanded' : ''}`}>
              <button className="console-row-button" onClick={() => setExpandedId(isExpanded ? null : rowId)}>
                <div className={`console-level ${log.level || 'log'}`}>
                  {getLevelIcon(log.level)}
                  <span>{(log.level || 'log').toUpperCase()}</span>
                </div>
                <div className="console-main">
                  <div className="console-topline">
                    <span className="console-timestamp">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })
                        : 'No time'}
                    </span>
                  </div>
                  <p className="console-preview mono-text">{preview}</p>
                </div>
                <div className="console-chevron">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {isExpanded && (
                <div className="console-detail">
                  <pre className="mono-text">{formattedPayload || 'No payload'}</pre>
                </div>
              )}
            </article>
          );
        })}

        {filteredLogs.length === 0 && (
          <EmptyState
            title="No logs match this view"
            description="Open the page, trigger some activity, or switch the level filter to see incoming console events."
          />
        )}
      </div>
    </section>
  );
};

export default ConsoleTab;
