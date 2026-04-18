import PropTypes from 'prop-types';

export const SegmentedControl = ({
  label,
  options,
  activeKey,
  onActivate,
  onKeyDown,
  className = 'tickets-page__segmented',
  buttonClassName = 'tickets-page__segmented-button',
  activeButtonClassName = 'tickets-page__segmented-button--active',
  idPrefix = 'segmented-tab',
  panelIdByKey = () => undefined
}) => (
  <div className={className} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
    {options.map((option) => {
      const Icon = option.icon;
      const isActive = activeKey === option.key;

      return (
        <button
          key={option.key}
          type="button"
          className={`${buttonClassName}${isActive ? ` ${activeButtonClassName}` : ''}`}
          onClick={() => onActivate(option.key)}
          id={`${idPrefix}-${option.key}`}
          role="tab"
          aria-selected={isActive}
          aria-controls={panelIdByKey(option.key)}
          tabIndex={isActive ? 0 : -1}
        >
          {Icon ? <Icon size={16} aria-hidden="true" /> : null}
          <span>{option.label}</span>
        </button>
      );
    })}
  </div>
);

SegmentedControl.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType
    })
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onActivate: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  activeButtonClassName: PropTypes.string,
  idPrefix: PropTypes.string,
  panelIdByKey: PropTypes.func
};
