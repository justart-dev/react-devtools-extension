import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy, Search, X } from 'lucide-react';
import PanelHeader from './ui/PanelHeader';
import SummaryBar from './ui/SummaryBar';
import EmptyState from './ui/EmptyState';
import './NetworkTab.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'get', label: 'GET' },
  { id: 'post', label: 'POST' },
  { id: 'put', label: 'PUT' },
  { id: 'delete', label: 'DELETE' },
];

const formatJson = (data) => {
  if (!data) return '';

  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return typeof data === 'string' ? data : String(data);
  }
};

const getStatusTone = (statusCode) => {
  if (!statusCode) return 'neutral';
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 400) return 'danger';
  return 'warning';
};

const getPathname = (url) => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return url || 'Unknown request';
  }
};

const getHostname = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

const copyText = async (content, sectionId, setCopiedSection) => {
  try {
    const textToCopy = formatJson(content) || '';

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopiedSection(sectionId);
    window.setTimeout(() => setCopiedSection(null), 2000);
  } catch (error) {
    console.error('Copy failed:', error);
  }
};

const NetworkTab = ({ requests, isConnected }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState(null);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return [...requests]
      .reverse()
      .filter((request) => {
        const method = (request.method || 'GET').toLowerCase();
        const methodMatches = activeFilter === 'all' || method === activeFilter;
        const urlMatches = !query || (request.url || '').toLowerCase().includes(query);

        return methodMatches && urlMatches;
      });
  }, [activeFilter, requests, searchQuery]);

  const summaryItems = [
    {
      label: 'Connection',
      value: isConnected ? 'Live' : 'Disconnected',
      tone: isConnected ? 'success' : 'warning',
    },
    { label: 'Visible', value: filteredRequests.length.toString() },
    { label: 'Filter', value: activeFilter === 'all' ? 'All methods' : activeFilter.toUpperCase() },
    { label: 'Search', value: searchQuery.trim() ? `"${searchQuery.trim()}"` : 'Not applied', tone: 'neutral' },
  ];

  return (
    <section className="panel-shell">
      <PanelHeader
        eyebrow="Primary feed"
        title={isConnected ? 'Network requests from the current page' : 'Waiting for network activity'}
        description="Keep the request list dense and readable, then expand only the entries you want to inspect."
      />

      <SummaryBar items={summaryItems} />

      <div className="panel-toolbar network-toolbar">
        <div className="panel-toolbar-group">
          <div className="search-field">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search URL or path"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="panel-toolbar-group">
          <span className="toolbar-label">Methods</span>
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

      <div className="request-list" role="list">
        {filteredRequests.map((request, index) => {
          const rowId = `${request.timestamp || 'request'}-${index}`;
          const isExpanded = expandedId === rowId;
          const method = (request.method || 'GET').toLowerCase();
          const path = getPathname(request.url);
          const hostname = getHostname(request.url);

          return (
            <article key={rowId} className={`request-row ${isExpanded ? 'expanded' : ''}`}>
              <button className="request-row-button" onClick={() => setExpandedId(isExpanded ? null : rowId)}>
                <div className={`request-method ${method}`}>{(request.method || 'GET').toUpperCase()}</div>
                <div className={`request-status ${getStatusTone(request.statusCode)}`}>
                  {request.statusCode || '--'}
                </div>
                <div className="request-main">
                  <div className="request-primary mono-text">{path}</div>
                  <div className="request-secondary">
                    <span>{hostname || 'Unknown host'}</span>
                    <span className="request-dot" />
                    <span>
                      {request.timestamp
                        ? new Date(request.timestamp).toLocaleTimeString('en-US', { hour12: false })
                        : 'No time'}
                    </span>
                  </div>
                </div>
                <div className="request-chevron">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {isExpanded && (
                <div className="request-detail">
                  <section className="detail-block">
                    <div className="detail-header">
                      <div>
                        <span className="detail-title">Payload</span>
                        <span className="detail-subtitle">Request body</span>
                      </div>
                      <button
                        className={`copy-button ${copiedSection === `${rowId}-payload` ? 'copied' : ''}`}
                        onClick={() => copyText(request.payload, `${rowId}-payload`, setCopiedSection)}
                      >
                        {copiedSection === `${rowId}-payload` ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedSection === `${rowId}-payload` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="mono-text">{formatJson(request.payload) || 'No payload'}</pre>
                  </section>

                  <section className="detail-block">
                    <div className="detail-header">
                      <div>
                        <span className="detail-title">Response</span>
                        <span className="detail-subtitle">Captured response body</span>
                      </div>
                      <button
                        className={`copy-button ${copiedSection === `${rowId}-response` ? 'copied' : ''}`}
                        onClick={() => copyText(request.response, `${rowId}-response`, setCopiedSection)}
                      >
                        {copiedSection === `${rowId}-response` ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedSection === `${rowId}-response` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="mono-text">{formatJson(request.response) || 'Response not available'}</pre>
                  </section>
                </div>
              )}
            </article>
          );
        })}

        {filteredRequests.length === 0 && (
          <EmptyState
            title="No requests match this view"
            description="Use the page normally, then narrow the list with method filters or URL search when traffic starts to appear."
          />
        )}
      </div>
    </section>
  );
};

export default NetworkTab;
