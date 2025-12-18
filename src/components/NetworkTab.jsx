import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

  // 필터링 적용
  const filteredRequests = requests.filter(req => {
    const method = (req.method || 'GET').toLowerCase();
    // 정의되지 않은 메소드는 일단 보여주거나, 기타로 처리 (여기서는 매칭되는 것만)
    return filters[method] !== false; // Default to true if unknown, or strict? Let's assume standard methods.
    // simpler: return filters[method]; if we strictly map keys.
    // Let's handle generic case:
    if (filters[method] === undefined) return true;
    return filters[method];
  });

  // 최근 5개만 표시 (필터링 된 결과 중에서)
  const recentRequests = filteredRequests.slice(-5);

  return (
    <div className="network-container animate-fade-in">
      <header className="glass-panel toolbar">
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
      <div className="request-list">
        {recentRequests.map((req, i) => (
          <div key={i} className={`request-item glass-panel ${expandedId === i ? 'expanded' : ''}`}>
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
                  <h4>Payload</h4>
                  <pre className="code-block json-formatted">
                    {formatJson(req.payload) || 'No Payload'}
                  </pre>
                </div>
                <div className="detail-section">
                  <h4>Response</h4>
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
