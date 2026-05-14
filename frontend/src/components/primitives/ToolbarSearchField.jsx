import PropTypes from 'prop-types';
import { Search } from 'lucide-react';

export const ToolbarSearchField = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  srLabel,
  className = '',
  inputClassName = ''
}) => {
  const resolvedClassName = `workspace-search${className ? ` ${className}` : ''}`;
  const resolvedInputClassName = `workspace-search__input${inputClassName ? ` ${inputClassName}` : ''}`;

  return (
    <label className={resolvedClassName} htmlFor={id}>
      <Search size={16} aria-hidden="true" />
      <span className="sr-only">{srLabel}</span>
      <input
        className={resolvedInputClassName}
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
};

ToolbarSearchField.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  srLabel: PropTypes.string.isRequired,
  className: PropTypes.string,
  inputClassName: PropTypes.string
};
