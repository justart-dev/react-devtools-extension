import './PanelLayout.css';

const EmptyState = ({ title, description }) => {
  return (
    <div className="empty-panel">
      <span className="empty-kicker">No data yet</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
};

export default EmptyState;
