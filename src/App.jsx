import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe,
  History,
  Maximize2,
  MousePointer2,
  PlugZap,
  Terminal,
} from 'lucide-react';
import ConsoleTab from './components/ConsoleTab';
import NetworkTab from './components/NetworkTab';
import StashTab from './components/StashTab';
import LocatorTab from './components/LocatorTab';
import './App.css';

const PRIMARY_TABS = [
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'network', label: 'Network', icon: Globe },
];

const UTILITY_TABS = [
  { id: 'stash', label: 'Stash', icon: History },
  { id: 'locator', label: 'Locator', icon: MousePointer2 },
];

function App() {
  const [activeTab, setActiveTab] = useState('network');
  const [logs, setLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const isStandaloneWindow = window.location.search.includes('window=true');
  const extensionChrome = globalThis.chrome;

  useEffect(() => {
    if (isStandaloneWindow) {
      document.body.classList.add('standalone-window');
    }

    return () => {
      document.body.classList.remove('standalone-window');
    };
  }, [isStandaloneWindow]);

  const openInWindow = () => {
    if (extensionChrome?.windows) {
      extensionChrome.windows.create({
        url: extensionChrome.runtime.getURL('index.html?window=true'),
        type: 'popup',
        width: 880,
        height: 760,
      });
      window.close();
    }
  };

  useEffect(() => {
    if (!extensionChrome?.runtime?.connect) {
      return;
    }

    let cleanup;

    extensionChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeChromeTabId = tabs[0]?.id;
      if (!activeChromeTabId) {
        setIsConnected(false);
        return;
      }

      const port = extensionChrome.runtime.connect({ name: 'popup-panel' });
      port.postMessage({ name: 'init', tabId: activeChromeTabId });
      port.postMessage({ name: 'getAll' });
      setIsConnected(true);

      const messageListener = (msg) => {
        if (msg.type === 'console') {
          setLogs((prev) => [...prev, msg].slice(-200));
        } else if (msg.type === 'network') {
          setRequests((prev) => [...prev, msg].slice(-200));
        } else if (msg.type === 'allData') {
          setLogs(msg.logs || []);
          setRequests(msg.requests || []);
        }
      };

      port.onMessage.addListener(messageListener);

      cleanup = () => {
        port.onMessage.removeListener(messageListener);
        port.disconnect();
      };
    });

    return () => cleanup?.();
  }, [extensionChrome]);

  const counts = useMemo(
    () => ({
      console: logs.length,
      network: requests.length,
    }),
    [logs.length, requests.length]
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'console':
        return <ConsoleTab logs={logs} isConnected={isConnected} />;
      case 'network':
        return <NetworkTab requests={requests} isConnected={isConnected} />;
      case 'stash':
        return <StashTab />;
      case 'locator':
        return <LocatorTab />;
      default:
        return null;
    }
  };

  const renderNavButton = (tab, isUtility = false) => {
    const Icon = tab.icon;

    return (
      <button
        key={tab.id}
        className={`nav-item ${isUtility ? 'utility' : ''} ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => setActiveTab(tab.id)}
      >
        <Icon size={16} />
        <span className="nav-copy">{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">
          <div className={`connection-dot ${isConnected ? 'live' : ''}`} aria-hidden="true" />
          <div>
            <span className="brand-title">Taillog</span>
            <span className="brand-subtitle">
              {isConnected ? 'Live debugging panel' : 'Waiting for active tab'}
            </span>
          </div>
        </div>

        <div className="nav-groups">
          <div className="nav-tabs">{PRIMARY_TABS.map((tab) => renderNavButton(tab))}</div>
          <div className="nav-divider" />
          <div className="nav-tabs utility-tabs">
            {UTILITY_TABS.map((tab) => renderNavButton(tab, true))}
          </div>
        </div>

        <div className="nav-actions">
          {!isStandaloneWindow && (
            <button
              className="chrome-action"
              onClick={openInWindow}
              title="Open in separate window"
              aria-label="Open in separate window"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      </nav>

      <div className="shell-statusbar">
        <div className="status-pill">
          <PlugZap size={14} />
          <span>{isConnected ? 'Connected to current tab' : 'No active page connection'}</span>
        </div>
        <div className="status-pill quiet">
          <span>{counts.network} requests</span>
          <span className="status-separator" />
          <span>{counts.console} logs</span>
        </div>
      </div>

      <main className="tab-frame">{renderTab()}</main>
    </div>
  );
}

export default App;
