import PropTypes from 'prop-types';

export const FilterChipGroup = ({
  label,
  options,
  activeKey,
  onSelect,
  className = 'tickets-page__chip-group',
  chipClassName = 'tickets-page__chip',
  activeChipClassName = 'tickets-page__chip--active'
}) => (
  <div className={className} role="group" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.key}
        type="button"
        className={`${chipClassName}${activeKey === option.key ? ` ${activeChipClassName}` : ''}`}
        onClick={() => onSelect(option.key)}
        aria-pressed={activeKey === option.key}
      >
        {option.label}
      </button>
    ))}
  </div>
);

FilterChipGroup.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  className: PropTypes.string,
  chipClassName: PropTypes.string,
  activeChipClassName: PropTypes.string
};

