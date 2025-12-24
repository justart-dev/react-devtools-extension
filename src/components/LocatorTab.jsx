import { useState, useEffect } from 'react';
import { MousePointer2, Monitor } from 'lucide-react';
import './LocatorTab.css';

const IDES = [
  { id: 'vscode', name: 'VS Code' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'windsurf', name: 'Windsurf' },
  { id: 'idea', name: 'IntelliJ' },
  { id: 'antigravity', name: 'Antigravity' }
];

const LocatorTab = () => {
  const [preferredIDE, setPreferredIDE] = useState('vscode');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    chrome.storage.local.get(['preferredIDE', 'locatorEnabled'], (result) => {
      if (result.preferredIDE) setPreferredIDE(result.preferredIDE);
      if (result.locatorEnabled !== undefined) setIsEnabled(result.locatorEnabled);
    });
  }, []);

  const handleIDEChange = (ide) => {
    setPreferredIDE(ide);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ preferredIDE: ide });
    }
  };

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ locatorEnabled: newState });
    }
  };

  return (
    <div className="locator-container animate-fade-in">
      <header className="toolbar">
        <div className="toolbar-info">
          <MousePointer2 size={16} />
          <span>Component Locator</span>
        </div>
        <button
          className={`toggle-btn ${isEnabled ? 'active' : ''}`}
          onClick={handleToggle}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </header>

      <div className="locator-content">
        <section className="settings-section">
          <h4><Monitor size={14} /> Preferred IDE</h4>
          <div className="ide-grid">
            {IDES.map((ide, index) => (
              <button
                key={ide.id}
                className={`ide-btn ${preferredIDE === ide.id ? 'selected' : ''} ${index === 0 ? 'wide' : ''}`}
                onClick={() => handleIDEChange(ide.id)}
              >
                {ide.name}
              </button>
            ))}
          </div>
        </section>

        <section className="usage-section">
          <h4>How to Use</h4>
          <ol>
            <li>
              <kbd>Alt</kbd> (or <kbd>Option</kbd> on Mac) Hold
            </li>
            <li>Hover over React components to highlight</li>
            <li>Click to open source in your IDE</li>
          </ol>
        </section>

        <section className="info-section">
          <h4>Component Types</h4>
          <div className="info-item">
            <span className="info-dot blue"></span>
            <span>Client Component - direct source link</span>
          </div>
          <div className="info-item">
            <span className="info-dot orange"></span>
            <span>Server Component (RSC) - search by name</span>
          </div>
          <div className="info-item">
            <span className="info-dot gray"></span>
            <span>No React component detected</span>
          </div>
          <p className="info-tip"> Works best with development builds that include source maps.</p>
          <p className="info-feedback"> Feedback : <a href="mailto:hbd9425@gmail.com">hbd9425@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default LocatorTab;
