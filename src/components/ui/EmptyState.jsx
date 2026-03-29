import './PanelLayout.css';

const EmptyState = ({ title, description, kicker = 'No data yet' }) => {
  return (
    <div className="empty-panel">
      <span className="empty-kicker">{kicker}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
};

export default EmptyState;
