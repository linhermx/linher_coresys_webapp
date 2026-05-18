import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

const findNextEnabledIndex = (items, startIndex, step) => {
  const total = items.length;
  if (!total) {
    return -1;
  }

  let index = startIndex;
  for (let attempts = 0; attempts < total; attempts += 1) {
    const item = items[index];
    if (item && !item.disabled) {
      return index;
    }
    index = (index + step + total) % total;
  }

  return -1;
};

export const WorkspaceActionMenu = ({
  label = 'Más acciones',
  items,
  className = '',
  triggerClassName = 'workspace-action workspace-action--ghost',
  triggerRef
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const internalTriggerRef = useRef(null);
  const panelRef = useRef(null);
  const itemRefs = useRef([]);
  const generatedId = useId().replace(/:/g, '');
  const panelId = `action-menu-panel-${generatedId}`;
  const visibleItems = useMemo(() => items.filter(Boolean), [items]);
  const resolvedTriggerRef = triggerRef || internalTriggerRef;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const firstEnabledIndex = visibleItems.findIndex((item) => !item.disabled);
      if (firstEnabledIndex >= 0) {
        itemRefs.current[firstEnabledIndex]?.focus?.();
      }
    });

    const handlePointerDown = (event) => {
      if (
        panelRef.current?.contains(event.target)
        || resolvedTriggerRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
      resolvedTriggerRef.current?.focus?.();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, visibleItems]);

  if (!visibleItems.length) {
    return null;
  }

  const resolvedClassName = ['action-menu', className].filter(Boolean).join(' ');

  const focusMenuItem = (nextIndex) => {
    if (nextIndex < 0) {
      return;
    }
    itemRefs.current[nextIndex]?.focus?.();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      const lastEnabledIndex = findNextEnabledIndex(visibleItems, visibleItems.length - 1, -1);
      window.requestAnimationFrame(() => {
        focusMenuItem(lastEnabledIndex);
      });
    }
  };

  const handleItemKeyDown = (event, currentIndex) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = findNextEnabledIndex(visibleItems, (currentIndex + 1) % visibleItems.length, 1);
      focusMenuItem(nextIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = findNextEnabledIndex(
        visibleItems,
        (currentIndex - 1 + visibleItems.length) % visibleItems.length,
        -1
      );
      focusMenuItem(nextIndex);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(findNextEnabledIndex(visibleItems, 0, 1));
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(findNextEnabledIndex(visibleItems, visibleItems.length - 1, -1));
      return;
    }

    if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className={resolvedClassName}>
      <button
        type="button"
        className={`${triggerClassName} action-menu__trigger`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((currentState) => !currentState)}
        onKeyDown={handleTriggerKeyDown}
        ref={resolvedTriggerRef}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="action-menu__panel"
          role="menu"
          aria-label={label}
          ref={panelRef}
        >
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className="action-menu__item"
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onSelect?.();
                }}
                onKeyDown={(event) => handleItemKeyDown(event, index)}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
              >
                {Icon ? (
                  <span className="action-menu__item-icon" aria-hidden="true">
                    <Icon size={15} />
                  </span>
                ) : null}
                <span className="action-menu__item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

WorkspaceActionMenu.propTypes = {
  label: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func
  })).isRequired,
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  triggerRef: PropTypes.shape({ current: PropTypes.any })
};
