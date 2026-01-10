import React, { useState, useEffect } from 'react';
import { Terminal, Globe, History, MousePointer2, Maximize2 } from 'lucide-react';
import ConsoleTab from './components/ConsoleTab';
import NetworkTab from './components/NetworkTab';
import StashTab from './components/StashTab';
import LocatorTab from './components/LocatorTab';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('console');
  const [logs, setLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // 별도 윈도우에서 열렸는지 감지
  const isStandaloneWindow = window.location.search.includes('window=true');

  // 별도 윈도우에서 열렸으면 body에 클래스 추가
  useEffect(() => {
    if (isStandaloneWindow) {
      document.body.classList.add('standalone-window');
    }
    return () => {
      document.body.classList.remove('standalone-window');
    };
  }, [isStandaloneWindow]);

  // 별도 창으로 열기
  const openInWindow = () => {
    if (typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.create({
        url: chrome.runtime.getURL('index.html?window=true'),
        type: 'popup',
        width: 600,
        height: 700
      });
      window.close();
    }
  };

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.connect) {
      return;
    }

    // 현재 활성 탭 찾기
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (!activeTabId) return;

      const port = chrome.runtime.connect({ name: "popup-panel" });
      
      // 초기화 및 디버거 연결 요청
      port.postMessage({ name: "init", tabId: activeTabId });
      port.postMessage({ name: "getAll" });
      
      setIsConnected(true);

      const messageListener = (msg) => {
        if (msg.type === 'console') {
          setLogs(prev => [...prev, msg].slice(-100));
        } else if (msg.type === 'network') {
          setRequests(prev => [...prev, msg].slice(-100));
        } else if (msg.type === 'allData') {
          setLogs(msg.logs || []);
          setRequests(msg.requests || []);
        }
      };

      port.onMessage.addListener(messageListener);

      return () => {
        port.onMessage.removeListener(messageListener);
        port.disconnect();
      };
    });

  }, []);

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-tabs">
          <button
            className={`nav-item ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            <Terminal size={18} />
            <span>Console</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <Globe size={18} />
            <span>Network</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'stash' ? 'active' : ''}`}
            onClick={() => setActiveTab('stash')}
          >
            <History size={18} />
            <span>Stash</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'locator' ? 'active' : ''}`}
            onClick={() => setActiveTab('locator')}
          >
            <MousePointer2 size={18} />
            <span>Locator</span>
          </button>
        </div>
        {!isStandaloneWindow && (
          <button
            className="open-window-btn"
            onClick={openInWindow}
            title="별도 창으로 열기"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </nav>
      
      <main className="content-area">
        {!isConnected && <div className="connection-status">Connecting to tab...</div>}
        {activeTab === 'console' && <ConsoleTab logs={logs} />}
        {activeTab === 'network' && <NetworkTab requests={requests} />}
        {activeTab === 'stash' && <StashTab />}
        {activeTab === 'locator' && <LocatorTab />}
      </main>
    </div>
  );
}

export default App;
