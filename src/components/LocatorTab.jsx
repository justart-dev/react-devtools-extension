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

const LocatorTab = ({ t, previewSettings = null }) => {
  const [preferredIDE, setPreferredIDE] = useState(previewSettings?.preferredIDE || 'vscode');
  const [isEnabled, setIsEnabled] = useState(previewSettings?.isEnabled ?? true);
  const extensionChrome = globalThis.chrome;

  useEffect(() => {
    if (previewSettings) return;

    if (!extensionChrome?.storage) return;

    extensionChrome.storage.local.get(['preferredIDE', 'locatorEnabled'], (result) => {
      if (result.preferredIDE) setPreferredIDE(result.preferredIDE);
      if (result.locatorEnabled !== undefined) setIsEnabled(result.locatorEnabled);
    });
  }, [extensionChrome, previewSettings]);

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
    { label: t('locator.summaryStatus'), value: isEnabled ? t('locator.enabled') : t('locator.paused'), tone: isEnabled ? 'success' : 'warning' },
    { label: t('locator.summaryOpenWith'), value: IDES.find((ide) => ide.id === preferredIDE)?.name || 'VS Code' },
    { label: t('locator.summaryTrigger'), value: t('locator.triggerValue'), tone: 'neutral' },
  ];

  return (
    <section className="panel-shell">
      <PanelHeader
        eyebrow={t('locator.eyebrow')}
        title={t('locator.title')}
        description={t('locator.description')}
        actions={
          <button className={`locator-toggle ${isEnabled ? 'active' : ''}`} onClick={handleToggle}>
            {isEnabled ? t('common.on') : t('common.off')}
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
            <h3>{t('locator.noticeTitle')}</h3>
            <p>{t('locator.noticeDescription')}</p>
          </div>
        </div>

        <div className="locator-card">
          <div className="section-heading">
            <Monitor size={14} />
            <span>{t('locator.preferredEditor')}</span>
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
            <span>{t('locator.howToUse')}</span>
          </div>
          <ol className="usage-list">
            <li>{t('locator.step1')}</li>
            <li>{t('locator.step2')}</li>
            <li>{t('locator.step3')}</li>
          </ol>
        </div>

        <div className="locator-card compact">
          <div className="section-heading">
            <span>{t('locator.limits')}</span>
          </div>
          <div className="fact-list">
            <div className="fact-row">
              <span>{t('locator.runtime')}</span>
              <strong>{t('locator.runtimeValue')}</strong>
            </div>
            <div className="fact-row">
              <span>{t('locator.bestWith')}</span>
              <strong>{t('locator.bestWithValue')}</strong>
            </div>
            <div className="fact-row">
              <span>{t('locator.unavailable')}</span>
              <strong>{t('locator.unavailableValue')}</strong>
            </div>
          </div>
        </div>

        <div className="locator-card compact feedback-card">
          <div className="section-heading">
            <span>{t('locator.feedbackTitle')}</span>
          </div>
          <p>{t('locator.feedbackDescription')}</p>
          <a
            className="feedback-link"
            href={`mailto:hbd9425@gmail.com?subject=${encodeURIComponent('Taillog feedback')}`}
          >
            {t('locator.feedbackAction')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default LocatorTab;
