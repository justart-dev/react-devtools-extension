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

  const toggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusClass = (statusCode) => {
    if (!statusCode) return '';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'error';
    return 'warning';
  };

  // 최근 5개만 표시
  const recentRequests = requests.slice(-5);

  return (
    <div className="network-container animate-fade-in">
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
                  {expandedId === i ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
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
        {recentRequests.length === 0 && <div className="empty-state">No requests captured</div>}
      </div>
    </div>
  );
};

export default NetworkTab;
