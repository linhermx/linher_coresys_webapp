import PropTypes from 'prop-types';

export const EmptyState = ({
  title,
  copy,
  children = null,
  className = 'tickets-empty-state',
  id,
  role,
  ariaLabelledBy,
  hidden
}) => (
  <div
    className={className}
    id={id}
    role={role}
    aria-labelledby={ariaLabelledBy}
    hidden={hidden}
  >
    <p className="tickets-empty-state__title">{title}</p>
    <p className="tickets-empty-state__copy">{copy}</p>
    {children}
  </div>
);

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  copy: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  hidden: PropTypes.bool
};

EmptyState.defaultProps = {
  id: undefined,
  role: undefined,
  ariaLabelledBy: undefined,
  hidden: undefined
};

