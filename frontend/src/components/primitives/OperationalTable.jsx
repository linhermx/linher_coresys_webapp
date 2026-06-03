import PropTypes from 'prop-types';

export const OperationalTable = ({
  children,
  pagination = null,
  className = '',
  tone = '',
  id,
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaBusy,
  hidden,
  scrollClassName = 'data-table__scroll'
}) => {
  const toneClass = tone ? ` data-table--${tone}` : '';
  const resolvedClassName = `workspace-panel__content data-table${toneClass}${className ? ` ${className}` : ''}`;

  return (
    <div
      className={resolvedClassName}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-busy={ariaBusy}
      hidden={hidden}
    >
      <div className={scrollClassName}>
        {children}
      </div>
      {pagination}
    </div>
  );
};

OperationalTable.propTypes = {
  children: PropTypes.node.isRequired,
  pagination: PropTypes.node,
  className: PropTypes.string,
  tone: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  ariaBusy: PropTypes.bool,
  hidden: PropTypes.bool,
  scrollClassName: PropTypes.string
};

OperationalTable.defaultProps = {
  pagination: null,
  className: '',
  tone: '',
  id: undefined,
  role: undefined,
  ariaLabel: undefined,
  ariaLabelledBy: undefined,
  ariaBusy: undefined,
  hidden: undefined,
  scrollClassName: 'data-table__scroll'
};
