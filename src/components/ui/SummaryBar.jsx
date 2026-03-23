import './PanelLayout.css';

const SummaryBar = ({ items }) => {
  const visibleItems = items.filter((item) => item && item.label);

  return (
    <div className="summary-bar" role="status" aria-live="polite">
      {visibleItems.map((item) => (
        <div key={item.label} className="summary-chip">
          <span className="summary-label">{item.label}</span>
          <span className={`summary-value ${item.tone || ''}`.trim()}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default SummaryBar;
