import PropTypes from 'prop-types';

export const ShellCanvasPage = ({ item }) => (
  <section className="workspace" aria-label={`Área de trabajo de ${item.label}`}>
    <div className="workspace__meta">
      <span className="workspace__group">{item.groupLabel}</span>
      <h1 className="workspace__title">{item.label}</h1>
    </div>

    <div className="workspace__surface">
      <div className="workspace__toolbar" aria-hidden="true">
        <span className="workspace__chip" />
        <span className="workspace__chip workspace__chip--wide" />
        <span className="workspace__chip" />
      </div>

      <div className="workspace__canvas" aria-hidden="true">
        <div className="workspace__lane" />
        <div className="workspace__lane" />
        <div className="workspace__lane" />
      </div>
    </div>
  </section>
);

ShellCanvasPage.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    groupLabel: PropTypes.string.isRequired
  }).isRequired
};
