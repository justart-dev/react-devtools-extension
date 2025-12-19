import { useState, useEffect, useRef } from 'react';
import { Archive, Copy, Trash2, Check } from 'lucide-react';
import './StashTab.css';

const StashTab = () => {
  const [stashHistory, setStashHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // 저장된 스태시 히스토리 불러오기
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['clipboardHistory'], (result) => {
        if (result.clipboardHistory) {
          setStashHistory(result.clipboardHistory);
        }
      });

      // storage 변경 감지 (실시간 업데이트)
      const storageListener = (changes, areaName) => {
        if (areaName === 'local' && changes.clipboardHistory) {
          setStashHistory(changes.clipboardHistory.newValue || []);
        }
      };
      chrome.storage.onChanged.addListener(storageListener);

      return () => {
        chrome.storage.onChanged.removeListener(storageListener);
      };
    }
  }, []);

  const saveToStorage = (history) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ clipboardHistory: history });
    }
  };

  const copyToClipboard = (content, index) => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.value = content;
      textarea.select();
      document.execCommand('copy');
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const deleteItem = (id) => {
    const newHistory = stashHistory.filter(item => item.id !== id);
    setStashHistory(newHistory);
    saveToStorage(newHistory);
  };

  const clearAll = () => {
    setStashHistory([]);
    saveToStorage([]);
  };

  const formatContent = (content) => {
    if (content.length > 200) {
      return content.substring(0, 200) + '...';
    }
    return content;
  };

  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  return (
    <div className="stash-container animate-fade-in">
      <textarea
        ref={textareaRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
        }}
        aria-hidden="true"
      />

      <header className="glass-panel toolbar">
        <div className="toolbar-info">
          <span>Auto-captured: {stashHistory.length} items</span>
          <span className="max-hint">Keeps last 10 captured</span>
        </div>
        <button
          className="action-btn clear"
          onClick={clearAll}
          disabled={stashHistory.length === 0}
        >
          <span>Clear</span>
        </button>
      </header>

      <div className="stash-list">
        {stashHistory.map((item, index) => (
          <div key={item.id} className="stash-item glass-panel">
            <div className="item-meta">
              <div className="meta-left">
                <span className="timestamp">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                {item.url && (
                  <span className="source-url">{getHostname(item.url)}</span>
                )}
              </div>
              <div className="item-actions">
                <button
                  className={`icon-btn ${copiedIndex === index ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(item.content, index)}
                  title="Copy"
                >
                  {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  className="icon-btn delete"
                  onClick={() => deleteItem(item.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="item-content">
              <pre>{formatContent(item.content)}</pre>
            </div>
          </div>
        ))}
        {stashHistory.length === 0 && (
          <div className="empty-state">
            <img src="/assets/space.png" alt="No stash" className="empty-image" />
            <p>No stashed items</p>
            <span className="hint">Copy text on any webpage to stash it automatically</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StashTab;
