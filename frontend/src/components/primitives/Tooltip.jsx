import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { CircleHelp } from 'lucide-react';

const VIEWPORT_OFFSET = 12;
const TOOLTIP_GAP = 10;

const canHoverPrecisely = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(hover: hover) and (pointer: fine)').matches
);

export const Tooltip = ({
  label,
  title = '',
  body = '',
  example = '',
  preview = '',
  placement = 'top',
  className = '',
  triggerClassName = ''
}) => {
  const reactId = useId().replace(/:/g, '');
  const tooltipId = `tooltip-panel-${reactId}`;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState(placement);
  const [position, setPosition] = useState({ top: 0, left: 0, arrowLeft: 16 });

  const hasContent = Boolean(title || body || example || preview);

  const hideTooltip = ({ keepPinned = false } = {}) => {
    setIsOpen(false);
    if (!keepPinned) {
      setIsPinned(false);
    }
  };

  const showTooltip = ({ pinned = false } = {}) => {
    if (!hasContent) {
      return;
    }

    setIsOpen(true);
    if (pinned) {
      setIsPinned(true);
    }
  };

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !panelRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceAbove = triggerRect.top - VIEWPORT_OFFSET;
    const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_OFFSET;
    const nextPlacement = placement === 'top'
      ? (spaceAbove >= panelRect.height + TOOLTIP_GAP || spaceAbove >= spaceBelow ? 'top' : 'bottom')
      : (spaceBelow >= panelRect.height + TOOLTIP_GAP || spaceBelow >= spaceAbove ? 'bottom' : 'top');

    const centeredLeft = triggerRect.left + (triggerRect.width / 2) - (panelRect.width / 2);
    const boundedLeft = Math.min(
      Math.max(centeredLeft, VIEWPORT_OFFSET),
      viewportWidth - panelRect.width - VIEWPORT_OFFSET
    );
    const nextTop = nextPlacement === 'top'
      ? Math.max(VIEWPORT_OFFSET, triggerRect.top - panelRect.height - TOOLTIP_GAP)
      : Math.min(viewportHeight - panelRect.height - VIEWPORT_OFFSET, triggerRect.bottom + TOOLTIP_GAP);
    const arrowLeft = Math.min(
      Math.max((triggerRect.left + (triggerRect.width / 2)) - boundedLeft, 18),
      panelRect.width - 18
    );

    setResolvedPlacement(nextPlacement);
    setPosition({
      top: nextTop,
      left: boundedLeft,
      arrowLeft
    });
  }, [placement]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    updatePosition();
    const handleViewportChange = () => updatePosition();

    window.addEventListener('resize', handleViewportChange);
    document.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      document.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDownOutside = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      hideTooltip();
    };

    document.addEventListener('mousedown', handlePointerDownOutside, true);
    document.addEventListener('touchstart', handlePointerDownOutside, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside, true);
      document.removeEventListener('touchstart', handlePointerDownOutside, true);
    };
  }, [isOpen]);

  if (!hasContent) {
    return null;
  }

  const tooltipPanel = isOpen ? createPortal(
    <div
      ref={panelRef}
      id={tooltipId}
      role="tooltip"
      className={`tooltip tooltip--${resolvedPlacement}${className ? ` ${className}` : ''}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        '--tooltip-arrow-left': `${position.arrowLeft}px`
      }}
    >
      {title ? <strong className="tooltip__title">{title}</strong> : null}
      {body ? <p className="tooltip__body">{body}</p> : null}
      {example ? <p className="tooltip__example">Ejemplo: {example}</p> : null}
      {preview ? <p className="tooltip__preview">{preview}</p> : null}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`tooltip__trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={isOpen ? tooltipId : undefined}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={() => {
          if (canHoverPrecisely() && !isPinned) {
            showTooltip();
          }
        }}
        onMouseLeave={() => {
          if (canHoverPrecisely() && !isPinned) {
            hideTooltip({ keepPinned: true });
          }
        }}
        onFocus={() => {
          showTooltip({ pinned: isPinned });
        }}
        onBlur={() => {
          if (!isPinned) {
            hideTooltip({ keepPinned: true });
          }
        }}
        onClick={(event) => {
          event.preventDefault();
          if (isPinned) {
            hideTooltip();
          } else {
            showTooltip({ pinned: true });
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            hideTooltip();
          }
        }}
      >
        <CircleHelp size={15} strokeWidth={1.9} aria-hidden="true" />
      </button>
      {tooltipPanel}
    </>
  );
};

Tooltip.propTypes = {
  label: PropTypes.string.isRequired,
  title: PropTypes.string,
  body: PropTypes.string,
  example: PropTypes.string,
  preview: PropTypes.string,
  placement: PropTypes.oneOf(['top', 'bottom']),
  className: PropTypes.string,
  triggerClassName: PropTypes.string
};
