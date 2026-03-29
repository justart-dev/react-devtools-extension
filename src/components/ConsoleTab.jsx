import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Info, Terminal, TriangleAlert } from 'lucide-react';
import PanelHeader from './ui/PanelHeader';
import SummaryBar from './ui/SummaryBar';
import EmptyState from './ui/EmptyState';
import './ConsoleTab.css';

const FILTERS = [
  { id: 'all', labelKey: 'console.filters.all' },
  { id: 'error', labelKey: 'console.filters.error' },
  { id: 'warn', labelKey: 'console.filters.warn' },
  { id: 'info', labelKey: 'console.filters.info' },
  { id: 'log', labelKey: 'console.filters.log' },
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

const getPreview = (payload, t) => {
  const text = stringifyPayload(payload).replace(/\s+/g, ' ').trim();
  return text || t('console.emptyPayload');
};

const ConsoleTab = ({ logs, isConnected, t, locale }) => {
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
      label: t('common.summaryConnection'),
      value: isConnected ? t('common.live') : t('common.disconnected'),
      tone: isConnected ? 'success' : 'warning',
    },
    { label: t('common.summaryVisible'), value: filteredLogs.length.toString() },
    { label: t('console.summaryFilter'), value: activeFilter === 'all' ? t('console.summaryAllLevels') : t(`console.filters.${activeFilter}`) },
  ];

  return (
    <section className="panel-shell">
      <PanelHeader
        eyebrow={t('console.eyebrow')}
        title={isConnected ? t('console.titleLive') : t('console.titleIdle')}
        description={t('console.description')}
      />

      <SummaryBar items={summaryItems} />

      <div className="panel-toolbar">
        <div className="panel-toolbar-group">
          <span className="toolbar-label">{t('console.levels')}</span>
          <div className="segmented-control">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`segment ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {t(filter.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="console-list" role="list">
        {filteredLogs.map((log, index) => {
          const rowId = `${log.timestamp || 'log'}-${index}`;
          const isExpanded = expandedId === rowId;
          const preview = getPreview(log.payload, t);
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
                        ? new Date(log.timestamp).toLocaleTimeString(locale, { hour12: false })
                        : t('common.noTime')}
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
                  <pre className="mono-text">{formattedPayload || t('console.noPayload')}</pre>
                </div>
              )}
            </article>
          );
        })}

        {filteredLogs.length === 0 && (
          <EmptyState
            kicker={t('common.noDataYet')}
            title={t('console.emptyTitle')}
            description={t('console.emptyDescription')}
          />
        )}
      </div>
    </section>
  );
};

export default ConsoleTab;
