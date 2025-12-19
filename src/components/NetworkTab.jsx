import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, X, Copy, Check } from 'lucide-react';
import './NetworkTab.css';

// JSON 포맷팅 함수
const formatJson = (data) => {
  if (!data) return null;

  try {
    // 이미 문자열인 경우 파싱 시도
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return JSON.stringify(parsed, null, 2);
  } catch {
    // JSON이 아닌 경우 그대로 반환
    return typeof data === 'string' ? data : String(data);
  }
};

const NetworkTab = ({ requests }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({
    get: true,
    post: true,
    put: true,
    delete: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState(null);

  const toggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleFilter = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getStatusClass = (statusCode) => {
    if (!statusCode) return '';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'error';
    return 'warning';
  };

  const copyToClipboard = async (content, sectionId) => {
    try {
      const textToCopy = formatJson(content) || '';

      if (navigator.clipboard && navigator.clipboard.writeText) {
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
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // 필터링 적용 (메소드 + URL 검색)
  const filteredRequests = requests.filter(req => {
    const method = (req.method || 'GET').toLowerCase();

    // 메소드 필터
    if (filters[method] !== undefined && !filters[method]) {
      return false;
    }

    // URL 검색 필터
    if (searchQuery.trim()) {
      const url = (req.url || '').toLowerCase();
      if (!url.includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
    }

    return true;
  });

  // 최근 5개만 표시 (필터링 된 결과 중에서)
  const recentRequests = filteredRequests.slice(-5);

  return (
    <div className="network-container animate-fade-in">
      <header className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Filter URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="filter-group">
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
        </div>
      </header>
      <div className="request-list">
        {recentRequests.map((req, i) => (
          <div key={i} className={`request-item ${expandedId === i ? 'expanded' : ''}`}>
            <div className="request-header" onClick={() => toggle(i)}>
              <div className={`method-badge ${(req.method || 'GET').toLowerCase()}`}>{req.method || 'GET'}</div>
              {req.statusCode && (
                <div className={`status-badge ${getStatusClass(req.statusCode)}`}>{req.statusCode}</div>
              )}
              <div className="url" title={req.url}>{req.url}</div>
              <div className="chevron">
                {expandedId === i ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>
            {expandedId === i && (
              <div className="request-details">
                <div className="detail-section">
                  <div className="section-header">
                    <h4>Payload</h4>
                    {req.payload && (
                      <button
                        className={`copy-btn ${copiedSection === `payload-${i}` ? 'copied' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(req.payload, `payload-${i}`);
                        }}
                        title="Copy"
                      >
                        {copiedSection === `payload-${i}` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                  <pre className="code-block json-formatted">
                    {formatJson(req.payload) || 'No Payload'}
                  </pre>
                </div>
                <div className="detail-section">
                  <div className="section-header">
                    <h4>Response</h4>
                    {req.response && (
                      <button
                        className={`copy-btn ${copiedSection === `response-${i}` ? 'copied' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(req.response, `response-${i}`);
                        }}
                        title="Copy"
                      >
                        {copiedSection === `response-${i}` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                  <pre className="code-block json-formatted">
                    {formatJson(req.response) || 'Response not available'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
        {recentRequests.length === 0 && (
          <div className="empty-state">
            <img src="/assets/space.png" alt="No requests" className="empty-image" />
            <p>No requests captured</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkTab;
