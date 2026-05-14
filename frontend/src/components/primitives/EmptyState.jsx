import { useId } from 'react';
import PropTypes from 'prop-types';

export const EmptyState = ({
  title,
  copy,
  children = null,
  className = 'workspace-empty-state',
  id,
  role,
  ariaLabelledBy,
  ariaDescribedBy,
  ariaLive,
  ariaAtomic,
  ariaBusy,
  titleAs = 'h2',
  hidden
}) => {
  const fallbackId = useId().replace(/:/g, '');
  const resolvedId = id ?? `empty-state-${fallbackId}`;
  const resolvedTitleId = `${resolvedId}-title`;
  const resolvedCopyId = `${resolvedId}-copy`;
  const resolvedAriaLabelledBy = ariaLabelledBy ?? resolvedTitleId;
  const resolvedAriaDescribedBy = ariaDescribedBy ?? resolvedCopyId;
  const TitleTag = titleAs;

  return (
    <div
      className={className}
      id={resolvedId}
      role={role}
      aria-labelledby={resolvedAriaLabelledBy}
      aria-describedby={resolvedAriaDescribedBy}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      aria-busy={ariaBusy}
      hidden={hidden}
    >
      <TitleTag className="workspace-empty-state__title" id={resolvedTitleId}>{title}</TitleTag>
      <p className="workspace-empty-state__copy" id={resolvedCopyId}>{copy}</p>
      {children}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  copy: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  ariaLive: PropTypes.oneOf(['off', 'polite', 'assertive']),
  ariaAtomic: PropTypes.bool,
  ariaBusy: PropTypes.bool,
  titleAs: PropTypes.string,
  hidden: PropTypes.bool
};

EmptyState.defaultProps = {
  id: undefined,
  role: undefined,
  ariaLabelledBy: undefined,
  ariaDescribedBy: undefined,
  ariaLive: undefined,
  ariaAtomic: undefined,
  ariaBusy: undefined,
  titleAs: 'h2',
  hidden: undefined
};
