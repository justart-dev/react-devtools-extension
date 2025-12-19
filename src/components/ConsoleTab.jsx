import React, { useState } from 'react';
import { AlertCircle, Info, TriangleAlert, Terminal } from 'lucide-react';
import './ConsoleTab.css';

// JSON formatting function
const formatPayload = (payload) => {
  if (!payload) return '';

  return payload.map((p, idx) => {
    // Try parsing if already a string
    if (typeof p === 'string') {
      try {
        const parsed = JSON.parse(p);
        return (
          <pre key={idx} className="json-formatted">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch {
        return <span key={idx} className="log-part">{p}</span>;
      }
    }
    // Format if object
    if (typeof p === 'object') {
      return (
        <pre key={idx} className="json-formatted">
          {JSON.stringify(p, null, 2)}
        </pre>
      );
    }
    return <span key={idx} className="log-part">{String(p)}</span>;
  });
};

const ConsoleTab = ({ logs }) => {
  const [filters, setFilters] = useState({
    log: true,
    info: false,
    warn: false,
    error: false
  });

  const toggleFilter = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Filter and show only last 5
  const filteredLogs = logs
    .filter(l => filters[l.level])
    .slice(-5);

  const getIcon = (level) => {
    switch (level) {
      case 'error': return <AlertCircle size={14} color="var(--console-error)" />;
      case 'warn': return <TriangleAlert size={14} color="var(--console-warn)" />;
      case 'info': return <Info size={14} color="var(--console-info)" />;
      default: return <Terminal size={14} color="var(--console-log)" />;
    }
  };

  return (
    <div className="console-container animate-fade-in">
      <header className="toolbar">
        {Object.keys(filters).map(f => (
          <label key={f} className={`filter-badge ${f} ${filters[f] ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={filters[f]}
              onChange={() => toggleFilter(f)}
              hidden
            />
            {f.toUpperCase()}
          </label>
        ))}
      </header>
      <div className="logs-list">
        {filteredLogs.map((log, i) => (
          <div key={i} className={`log-item ${log.level}`}>
            <div className="log-meta">
              <span className="timestamp">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false }) : ''}</span>
              <span className="icon">{getIcon(log.level)}</span>
            </div>
            <div className="payload">
              {formatPayload(log.payload)}
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="empty-state">
            <img src="/assets/space.png" alt="No logs" className="empty-image" />
            <p>No logs to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsoleTab;
