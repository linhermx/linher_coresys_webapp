import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const toneIconMap = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info
};

const toneLiveMap = {
  error: 'assertive',
  success: 'polite',
  info: 'polite'
};

const toneRoleMap = {
  error: 'alert',
  success: 'status',
  info: 'status'
};

export const InlineNotice = ({
  tone = 'info',
  title = '',
  children,
  actions = null,
  className = '',
  role = '',
  live = ''
}) => {
  const resolvedTone = toneIconMap[tone] ? tone : 'info';
  const Icon = toneIconMap[resolvedTone];
  const resolvedRole = role || toneRoleMap[resolvedTone];
  const resolvedLive = live || toneLiveMap[resolvedTone];

  return (
    <div
      className={`inline-notice inline-notice--${resolvedTone}${className ? ` ${className}` : ''}`}
      role={resolvedRole}
      aria-live={resolvedLive}
    >
      <span className="inline-notice__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="inline-notice__body">
        {title ? <strong className="inline-notice__title">{title}</strong> : null}
        <div className="inline-notice__message">{children}</div>
      </div>
      {actions ? <div className="inline-notice__actions">{actions}</div> : null}
    </div>
  );
};

InlineNotice.propTypes = {
  tone: PropTypes.oneOf(['error', 'success', 'info']),
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  className: PropTypes.string,
  role: PropTypes.string,
  live: PropTypes.oneOf(['off', 'polite', 'assertive', ''])
};
