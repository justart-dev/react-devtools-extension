import './PanelLayout.css';

const PanelHeader = ({ eyebrow, title, description, actions }) => {
  return (
    <header className="panel-header">
      <div className="panel-header-copy">
        {eyebrow && <span className="panel-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions ? <div className="panel-header-actions">{actions}</div> : null}
    </header>
  );
};

export default PanelHeader;
