import { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

import { getFocusableElements, trapFocusInContainer } from '../../utils/focusTrap.js';

export const ModalDialog = ({
  open,
  title,
  onClose,
  children,
  returnFocusRef,
  initialFocusRef,
  titleId,
  size = 'default',
  closeAriaLabel = 'Cerrar modal'
}) => {
  const containerRef = useRef(null);
  const wasOpenRef = useRef(false);
  const generatedTitleId = useId().replace(/:/g, '');
  const resolvedTitleId = titleId || `modal-dialog-title-${generatedTitleId}`;
  const sizeClassName = size !== 'default' ? ` modal-dialog--${size}` : '';

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        returnFocusRef?.current?.focus?.();
      }
      wasOpenRef.current = false;
      return undefined;
    }

    wasOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      const fallbackTarget = getFocusableElements(containerRef.current)[0] || null;
      (initialFocusRef?.current || fallbackTarget)?.focus?.();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialFocusRef, open, returnFocusRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal-dialog${sizeClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        ref={containerRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
            return;
          }

          trapFocusInContainer(event, containerRef.current);
        }}
      >
        <header className="modal-dialog__header">
          <h2 id={resolvedTitleId} className="modal-dialog__title">{title}</h2>
          <button
            type="button"
            className="modal-dialog__close"
            onClick={onClose}
            aria-label={closeAriaLabel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
};

ModalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  returnFocusRef: PropTypes.shape({ current: PropTypes.any }),
  initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
  titleId: PropTypes.string,
  size: PropTypes.oneOf(['default', 'narrow', 'wide']),
  closeAriaLabel: PropTypes.string
};
