import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Check, ChevronDown } from 'lucide-react';

const clampIndex = (index, length) => {
  if (length <= 0) return -1;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
};

const setRef = (ref, value) => {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  ref.current = value;
};

export const FilterSelect = forwardRef(function FilterSelect(
  {
    id,
    name,
    label,
    value,
    options,
    onChange,
    showLabel = false,
    className = 'filter-select',
    variant = 'filter',
    labelId: externalLabelId,
    placeholder = '',
    disabled = false,
    ariaDescribedBy = '',
    invalid = false
  },
  forwardedRef
) {
  const reactId = useId();
  const baseId = id || `filter-select-${reactId.replace(/:/g, '')}`;
  const listboxId = `${baseId}-listbox`;
  const generatedLabelId = `${baseId}-label`;
  const resolvedLabelId = externalLabelId || generatedLabelId;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.key === value),
    [options, value]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const displayValue = selectedOption?.label ?? placeholder;
  const compactAriaLabel = displayValue ? `${label}: ${displayValue}` : label;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setIsOpen(false);
      setFocusIndex(-1);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || focusIndex < 0) return;
    optionRefs.current[focusIndex]?.focus();
  }, [isOpen, focusIndex]);

  const closeMenu = ({ restoreFocus = false } = {}) => {
    setIsOpen(false);
    setFocusIndex(-1);
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const openMenu = ({ focusOption = false, optionIndex = selectedIndex } = {}) => {
    setIsOpen(true);
    if (focusOption) {
      setFocusIndex(clampIndex(optionIndex, options.length));
    }
  };

  const commitValue = (nextValue) => {
    onChange(nextValue);
    closeMenu({ restoreFocus: true });
  };

  const moveFocus = (nextIndex) => {
    setFocusIndex(clampIndex(nextIndex, options.length));
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        openMenu({ focusOption: true, optionIndex: selectedIndex >= 0 ? selectedIndex : 0 });
        break;
      case 'ArrowUp':
        event.preventDefault();
        openMenu({ focusOption: true, optionIndex: selectedIndex >= 0 ? selectedIndex : options.length - 1 });
        break;
      case 'Home':
        event.preventDefault();
        openMenu({ focusOption: true, optionIndex: 0 });
        break;
      case 'End':
        event.preventDefault();
        openMenu({ focusOption: true, optionIndex: options.length - 1 });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
        break;
      case 'Escape':
        if (!isOpen) return;
        event.preventDefault();
        closeMenu();
        break;
      default:
        break;
    }
  };

  const handleOptionKeyDown = (event, index, optionKey) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveFocus(0);
        break;
      case 'End':
        event.preventDefault();
        moveFocus(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commitValue(optionKey);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        break;
      case 'Tab':
        closeMenu();
        break;
      default:
        break;
    }
  };

  const triggerClassName = [
    'filter-select__trigger',
    showLabel ? '' : 'filter-select__trigger--compact',
    variant === 'field' ? 'filter-select__trigger--field' : '',
    disabled ? 'filter-select__trigger--disabled' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${className}${variant === 'field' ? ' filter-select--field' : ''}`} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        id={baseId}
        ref={(node) => {
          triggerRef.current = node;
          setRef(forwardedRef, node);
        }}
        type="button"
        className={triggerClassName}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-describedby={ariaDescribedBy || undefined}
        aria-invalid={invalid || undefined}
        aria-labelledby={
          showLabel
            ? `${resolvedLabelId} ${baseId}-value`
            : externalLabelId
              ? `${externalLabelId} ${baseId}-value`
              : `${baseId}-value`
        }
        aria-label={!showLabel && !externalLabelId ? compactAriaLabel : undefined}
        onClick={(event) => {
          if (disabled) return;
          event.preventDefault();
          event.stopPropagation();
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
      >
        {showLabel ? <span id={resolvedLabelId} className="filter-select__label">{label}</span> : null}
        <span id={`${baseId}-value`} className="filter-select__value">{displayValue}</span>
        <ChevronDown className="filter-select__chevron" size={16} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="filter-select__menu"
          role="listbox"
          id={listboxId}
          {...(showLabel ? { 'aria-labelledby': resolvedLabelId } : { 'aria-label': label })}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option.key === value;
            return (
              <div
                key={option.key}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={focusIndex === index ? 0 : -1}
                className={`filter-select__option${isSelected ? ' filter-select__option--selected' : ''}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  commitValue(option.key);
                }}
                onKeyDown={(event) => handleOptionKeyDown(event, index, option.key)}
              >
                <span className="filter-select__option-label">{option.label}</span>
                {isSelected ? <Check className="filter-select__option-check" size={14} aria-hidden="true" /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

FilterSelect.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  showLabel: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['filter', 'field']),
  labelId: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  ariaDescribedBy: PropTypes.string,
  invalid: PropTypes.bool
};
