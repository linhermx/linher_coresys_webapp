import PropTypes from 'prop-types';

import { InlineNotice } from './InlineNotice.jsx';

export const WorkspaceNoticeRail = ({
  notices = [],
  className = ''
}) => {
  const visibleNotices = notices.filter(Boolean);

  if (visibleNotices.length === 0) {
    return null;
  }

  return (
    <div className={`workspace-notice-rail${className ? ` ${className}` : ''}`}>
      {visibleNotices.map((notice) => (
        <InlineNotice
          key={notice.key}
          tone={notice.tone}
          title={notice.title}
          role={notice.role}
          live={notice.live}
          actions={notice.actions}
        >
          {notice.message}
        </InlineNotice>
      ))}
    </div>
  );
};

WorkspaceNoticeRail.propTypes = {
  notices: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['error', 'success', 'info']),
    title: PropTypes.string,
    message: PropTypes.node.isRequired,
    role: PropTypes.string,
    live: PropTypes.oneOf(['off', 'polite', 'assertive', '']),
    actions: PropTypes.node
  })),
  className: PropTypes.string
};
