import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import PanelHeader from './ui/PanelHeader';
import SummaryBar from './ui/SummaryBar';
import EmptyState from './ui/EmptyState';
import './StashTab.css';

const MAX_PREVIEW_LENGTH = 220;

const StashTab = () => {
  const [stashHistory, setStashHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const textareaRef = useRef(null);
  const extensionChrome = globalThis.chrome;

  useEffect(() => {
    if (!extensionChrome?.storage) {
      return;
    }

    extensionChrome.storage.local.get(['clipboardHistory'], (result) => {
      if (result.clipboardHistory) {
        setStashHistory(result.clipboardHistory);
      }
    });

    const storageListener = (changes, areaName) => {
      if (areaName === 'local' && changes.clipboardHistory) {
        setStashHistory(changes.clipboardHistory.newValue || []);
      }
    };

    extensionChrome.storage.onChanged.addListener(storageListener);

    return () => {
      extensionChrome.storage.onChanged.removeListener(storageListener);
    };
  }, [extensionChrome]);

  const orderedHistory = useMemo(
    () =>
      [...stashHistory].sort((a, b) => {
        const aTime = new Date(a.timestamp || 0).getTime();
        const bTime = new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      }),
    [stashHistory]
  );

  const saveToStorage = (history) => {
    if (extensionChrome?.storage) {
      extensionChrome.storage.local.set({ clipboardHistory: history });
    }
  };

  const copyToClipboard = (content, index) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.value = content;
    textarea.select();
    document.execCommand('copy');
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 2000);
  };

  const deleteItem = (id) => {
    const newHistory = stashHistory.filter((item) => item.id !== id);
    setStashHistory(newHistory);
    saveToStorage(newHistory);
  };

  const clearAll = () => {
    setStashHistory([]);
    saveToStorage([]);
  };

  const formatContent = (content) => {
    if (content.length <= MAX_PREVIEW_LENGTH) {
      return content;
    }

    return `${content.slice(0, MAX_PREVIEW_LENGTH)}...`;
  };

  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Unknown source';
    }
  };

  const summaryItems = [
    { label: 'Status', value: 'Auto capture on', tone: 'success' },
    { label: 'Saved', value: stashHistory.length.toString() },
    { label: 'Retention', value: 'Last 10 items', tone: 'neutral' },
  ];

  return (
    <section className="panel-shell">
      <PanelHeader
        eyebrow="Utility"
        title="Clipboard history for quick re-use"
        description="Keep recent copied snippets close by without competing with the main debugging feeds."
        actions={
          <button className="utility-button danger" onClick={clearAll} disabled={stashHistory.length === 0}>
            Clear all
          </button>
        }
      />

      <SummaryBar items={summaryItems} />

      <textarea
        ref={textareaRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
        aria-hidden="true"
      />

      <div className="stash-list">
        {orderedHistory.map((item, index) => (
          <article key={item.id} className="stash-row">
            <div className="stash-topline">
              <div className="stash-source">
                <span className="stash-host">{getHostname(item.url)}</span>
                <span className="stash-time">
                  {new Date(item.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>

              <div className="stash-actions">
                <button
                  className={`icon-action ${copiedIndex === index ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(item.content, index)}
                  aria-label="Copy stash item"
                >
                  {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  className="icon-action delete"
                  onClick={() => deleteItem(item.id)}
                  aria-label="Delete stash item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <pre className="stash-preview mono-text">{formatContent(item.content)}</pre>
          </article>
        ))}

        {orderedHistory.length === 0 && (
          <EmptyState
            title="Nothing in your stash yet"
            description="Copy text on any page and Taillog will keep the latest entries ready for a quick paste-back."
          />
        )}
      </div>
    </section>
  );
};

export default StashTab;
