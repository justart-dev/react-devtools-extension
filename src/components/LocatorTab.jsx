import { useEffect, useState } from 'react';
import { Monitor, MousePointer2, TriangleAlert } from 'lucide-react';
import PanelHeader from './ui/PanelHeader';
import SummaryBar from './ui/SummaryBar';
import './LocatorTab.css';

const IDES = [
  { id: 'vscode', name: 'VS Code' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'windsurf', name: 'Windsurf' },
  { id: 'idea', name: 'IntelliJ' },
  { id: 'antigravity', name: 'Antigravity' },
];

const LocatorTab = () => {
  const [preferredIDE, setPreferredIDE] = useState('vscode');
  const [isEnabled, setIsEnabled] = useState(true);
  const extensionChrome = globalThis.chrome;

  useEffect(() => {
    if (!extensionChrome?.storage) return;

    extensionChrome.storage.local.get(['preferredIDE', 'locatorEnabled'], (result) => {
      if (result.preferredIDE) setPreferredIDE(result.preferredIDE);
      if (result.locatorEnabled !== undefined) setIsEnabled(result.locatorEnabled);
    });
  }, [extensionChrome]);

  const handleIDEChange = (ide) => {
    setPreferredIDE(ide);
    if (extensionChrome?.storage) {
      extensionChrome.storage.local.set({ preferredIDE: ide });
    }
  };

  const handleToggle = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    if (extensionChrome?.storage) {
      extensionChrome.storage.local.set({ locatorEnabled: nextState });
    }
  };

  const summaryItems = [
    { label: 'Status', value: isEnabled ? 'Enabled' : 'Paused', tone: isEnabled ? 'success' : 'warning' },
    { label: 'Open with', value: IDES.find((ide) => ide.id === preferredIDE)?.name || 'VS Code' },
    { label: 'Trigger', value: 'Alt/Option + Hover', tone: 'neutral' },
  ];

  return (
    <section className="panel-shell">
      <PanelHeader
        eyebrow="Utility"
        title="React component locator settings"
        description="Keep the setup light: one toggle, one editor preference, and only the instructions that matter when you need them."
        actions={
          <button className={`locator-toggle ${isEnabled ? 'active' : ''}`} onClick={handleToggle}>
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        }
      />

      <SummaryBar items={summaryItems} />

      <div className="locator-layout">
        <div className="locator-card notice">
          <div className="notice-icon">
            <TriangleAlert size={16} />
          </div>
          <div>
            <h3>Works in development builds with React source metadata available.</h3>
            <p>Use Alt or Option to inspect components, then click to jump into your editor when source info exists.</p>
          </div>
        </div>

        <div className="locator-card">
          <div className="section-heading">
            <Monitor size={14} />
            <span>Preferred editor</span>
          </div>
          <div className="ide-grid">
            {IDES.map((ide) => (
              <button
                key={ide.id}
                className={`ide-choice ${preferredIDE === ide.id ? 'selected' : ''}`}
                onClick={() => handleIDEChange(ide.id)}
              >
                {ide.name}
              </button>
            ))}
          </div>
        </div>

        <div className="locator-card">
          <div className="section-heading">
            <MousePointer2 size={14} />
            <span>How to use</span>
          </div>
          <ol className="usage-list">
            <li>Hold Alt or Option.</li>
            <li>Hover over a React component to reveal the highlight overlay.</li>
            <li>Click the highlighted area to open the source file in your selected editor.</li>
          </ol>
        </div>

        <div className="locator-card compact">
          <div className="section-heading">
            <span>Limits</span>
          </div>
          <div className="fact-list">
            <div className="fact-row">
              <span>Runtime</span>
              <strong>React 17+ development mode</strong>
            </div>
            <div className="fact-row">
              <span>Best with</span>
              <strong>Next.js, Vite, CRA, Remix</strong>
            </div>
            <div className="fact-row">
              <span>When unavailable</span>
              <strong>Production builds or stripped source metadata</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocatorTab;
