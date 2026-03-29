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
import { defaultLanguage, getLocale, supportedLanguages, translate } from './i18n';
import './App.css';

const PRIMARY_TABS = [
  { id: 'console', labelKey: 'tabs.console', icon: Terminal },
  { id: 'network', labelKey: 'tabs.network', icon: Globe },
];

const UTILITY_TABS = [
  { id: 'stash', labelKey: 'tabs.stash', icon: History },
  { id: 'locator', labelKey: 'tabs.locator', icon: MousePointer2 },
];

const TAB_IDS = [...PRIMARY_TABS, ...UTILITY_TABS].map((tab) => tab.id);

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = window.localStorage.getItem('activeTabPreference');
    return TAB_IDS.includes(savedTab) ? savedTab : 'network';
  });
  const [logs, setLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem('languagePreference');
    return savedLanguage === 'ko' || savedLanguage === 'en' ? savedLanguage : defaultLanguage;
  });
  const [languageReady, setLanguageReady] = useState(() => !globalThis.chrome?.storage?.local);
  const [tabReady, setTabReady] = useState(() => !globalThis.chrome?.storage?.local);

  const isStandaloneWindow = window.location.search.includes('window=true');
  const extensionChrome = globalThis.chrome;
  const locale = getLocale(language);
  const t = (path, params) => translate(language, path, params);

  useEffect(() => {
    if (isStandaloneWindow) {
      document.documentElement.classList.add('standalone-window');
      document.body.classList.add('standalone-window');
    }

    return () => {
      document.documentElement.classList.remove('standalone-window');
      document.body.classList.remove('standalone-window');
    };
  }, [isStandaloneWindow]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!extensionChrome?.storage?.local) {
      return;
    }

    extensionChrome.storage.local.get(['languagePreference', 'activeTabPreference'], (result) => {
      if (result.languagePreference === 'ko' || result.languagePreference === 'en') {
        setLanguage(result.languagePreference);
      }
      setLanguageReady(true);

      if (TAB_IDS.includes(result.activeTabPreference)) {
        setActiveTab(result.activeTabPreference);
      }
      setTabReady(true);
    });
  }, [extensionChrome]);

  useEffect(() => {
    if (!languageReady) {
      return;
    }

    if (extensionChrome?.storage?.local) {
      extensionChrome.storage.local.set({ languagePreference: language });
      return;
    }

    window.localStorage.setItem('languagePreference', language);
  }, [extensionChrome, language, languageReady]);

  useEffect(() => {
    if (!tabReady) {
      return;
    }

    if (extensionChrome?.storage?.local) {
      extensionChrome.storage.local.set({ activeTabPreference: activeTab });
      return;
    }

    window.localStorage.setItem('activeTabPreference', activeTab);
  }, [activeTab, extensionChrome, tabReady]);

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
        return <ConsoleTab logs={logs} isConnected={isConnected} t={t} locale={locale} />;
      case 'network':
        return <NetworkTab requests={requests} isConnected={isConnected} t={t} locale={locale} />;
      case 'stash':
        return <StashTab t={t} locale={locale} />;
      case 'locator':
        return <LocatorTab t={t} />;
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
        <span className="nav-copy">{t(tab.labelKey)}</span>
      </button>
    );
  };

  return (
    <div className="app-shell">
      <div className="app-header-fixed">
        <nav className="top-nav">
          <div className="nav-brand">
            <div className={`connection-dot ${isConnected ? 'live' : ''}`} aria-hidden="true" />
            <div>
              <span className="brand-title">Taillog</span>
              <span className="brand-subtitle">
                {isConnected ? t('app.brandSubtitleLive') : t('app.brandSubtitleIdle')}
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
            <div className="language-switcher" aria-label={t('app.languageLabel')}>
              {supportedLanguages.map((option) => (
                <button
                  key={option.code}
                  className={`language-option ${language === option.code ? 'active' : ''}`}
                  onClick={() => setLanguage(option.code)}
                  aria-pressed={language === option.code}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {!isStandaloneWindow && (
              <button
                className="chrome-action"
                onClick={openInWindow}
                title={t('app.openWindow')}
                aria-label={t('app.openWindow')}
              >
                <Maximize2 size={16} />
              </button>
            )}
          </div>
        </nav>

        <div className="shell-statusbar">
          <div className="status-pill">
            <PlugZap size={14} />
            <span>{isConnected ? t('app.connectedToTab') : t('app.noConnection')}</span>
          </div>
          <div className="status-pill quiet">
            <span>{t('app.requestsCount', { count: counts.network })}</span>
            <span className="status-separator" />
            <span>{t('app.logsCount', { count: counts.console })}</span>
          </div>
        </div>
      </div>

      <main className="tab-frame with-fixed-header">{renderTab()}</main>
    </div>
  );
}

export default App;
