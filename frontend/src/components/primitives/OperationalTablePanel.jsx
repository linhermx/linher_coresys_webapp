import PropTypes from 'prop-types';

import { EmptyState } from './EmptyState.jsx';
import { OperationalPanel } from './OperationalPanel.jsx';
import { OperationalTable } from './OperationalTable.jsx';

export const OperationalTablePanel = ({
  isLoading = false,
  hasData,
  tone = '',
  className = '',
  id,
  role,
  ariaLabel,
  ariaLabelledBy,
  hidden,
  scrollClassName = 'data-table__scroll',
  table,
  pagination = null,
  emptyTitle,
  emptyCopy,
  emptyId,
  emptyRole = 'region',
  emptyAriaLabelledBy,
  emptyAriaDescribedBy,
  emptyAriaLive,
  emptyAriaAtomic,
  emptyAriaBusy,
  emptyHidden,
  emptyClassName = 'workspace-empty-state',
  emptyActions = null,
  loadingTitle = 'Cargando información',
  loadingCopy = 'Estamos preparando esta vista. Esto puede tardar unos segundos.',
  loadingId,
  loadingRole = 'status',
  loadingAriaLabelledBy,
  loadingAriaDescribedBy,
  loadingAriaLive = 'polite',
  loadingAriaAtomic = true,
  loadingAriaBusy = true,
  loadingHidden,
  loadingClassName = 'workspace-empty-state',
  preserveShell = false
}) => {
  if (preserveShell) {
    return (
      <OperationalPanel
        isLoading={isLoading}
        hasData={hasData}
        tone={tone}
        className={className}
        id={id}
        role={role}
        ariaLabel={ariaLabel}
        ariaLabelledBy={ariaLabelledBy}
        hidden={hidden}
        scrollClassName={scrollClassName}
        content={table}
        pagination={pagination}
        emptyTitle={emptyTitle}
        emptyCopy={emptyCopy}
        emptyId={emptyId}
        emptyRole={emptyRole}
        emptyAriaLabelledBy={emptyAriaLabelledBy}
        emptyAriaDescribedBy={emptyAriaDescribedBy}
        emptyAriaLive={emptyAriaLive}
        emptyAriaAtomic={emptyAriaAtomic}
        emptyAriaBusy={emptyAriaBusy}
        emptyHidden={emptyHidden}
        emptyClassName={emptyClassName}
        emptyActions={emptyActions}
        loadingTitle={loadingTitle}
        loadingCopy={loadingCopy}
        loadingId={loadingId}
        loadingRole={loadingRole}
        loadingAriaLabelledBy={loadingAriaLabelledBy}
        loadingAriaDescribedBy={loadingAriaDescribedBy}
        loadingAriaLive={loadingAriaLive}
        loadingAriaAtomic={loadingAriaAtomic}
        loadingAriaBusy={loadingAriaBusy}
        loadingHidden={loadingHidden}
        loadingClassName={loadingClassName}
      />
    );
  }

  if (isLoading) {
    return (
      <EmptyState
        title={loadingTitle}
        copy={loadingCopy}
        id={loadingId}
        role={loadingRole}
        ariaLabelledBy={loadingAriaLabelledBy}
        ariaDescribedBy={loadingAriaDescribedBy}
        ariaLive={loadingAriaLive}
        ariaAtomic={loadingAriaAtomic}
        ariaBusy={loadingAriaBusy}
        hidden={loadingHidden}
        className={loadingClassName}
      />
    );
  }

  if (!hasData) {
    return (
      <EmptyState
        title={emptyTitle}
        copy={emptyCopy}
        id={emptyId}
        role={emptyRole}
        ariaLabelledBy={emptyAriaLabelledBy}
        ariaDescribedBy={emptyAriaDescribedBy}
        ariaLive={emptyAriaLive}
        ariaAtomic={emptyAriaAtomic}
        ariaBusy={emptyAriaBusy}
        hidden={emptyHidden}
        className={emptyClassName}
      >
        {emptyActions}
      </EmptyState>
    );
  }

  return (
    <OperationalTable
      tone={tone}
      className={className}
      id={id}
      role={role}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      ariaBusy={isLoading ? true : undefined}
      hidden={hidden}
      scrollClassName={scrollClassName}
      pagination={pagination}
    >
      {table}
    </OperationalTable>
  );
};

OperationalTablePanel.propTypes = {
  isLoading: PropTypes.bool,
  hasData: PropTypes.bool.isRequired,
  tone: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  hidden: PropTypes.bool,
  scrollClassName: PropTypes.string,
  table: PropTypes.node.isRequired,
  pagination: PropTypes.node,
  emptyTitle: PropTypes.string.isRequired,
  emptyCopy: PropTypes.string.isRequired,
  emptyId: PropTypes.string,
  emptyRole: PropTypes.string,
  emptyAriaLabelledBy: PropTypes.string,
  emptyAriaDescribedBy: PropTypes.string,
  emptyAriaLive: PropTypes.oneOf(['off', 'polite', 'assertive']),
  emptyAriaAtomic: PropTypes.bool,
  emptyAriaBusy: PropTypes.bool,
  emptyHidden: PropTypes.bool,
  emptyClassName: PropTypes.string,
  emptyActions: PropTypes.node,
  loadingTitle: PropTypes.string,
  loadingCopy: PropTypes.string,
  loadingId: PropTypes.string,
  loadingRole: PropTypes.string,
  loadingAriaLabelledBy: PropTypes.string,
  loadingAriaDescribedBy: PropTypes.string,
  loadingAriaLive: PropTypes.oneOf(['off', 'polite', 'assertive']),
  loadingAriaAtomic: PropTypes.bool,
  loadingAriaBusy: PropTypes.bool,
  loadingHidden: PropTypes.bool,
  loadingClassName: PropTypes.string,
  preserveShell: PropTypes.bool
};

OperationalTablePanel.defaultProps = {
  id: undefined,
  role: undefined,
  ariaLabel: undefined,
  ariaLabelledBy: undefined,
  hidden: undefined,
  emptyId: undefined,
  emptyRole: 'region',
  emptyAriaLabelledBy: undefined,
  emptyAriaDescribedBy: undefined,
  emptyAriaLive: undefined,
  emptyAriaAtomic: undefined,
  emptyAriaBusy: undefined,
  emptyHidden: undefined,
  loadingId: undefined,
  loadingRole: 'status',
  loadingAriaLabelledBy: undefined,
  loadingAriaDescribedBy: undefined,
  loadingAriaLive: 'polite',
  loadingAriaAtomic: true,
  loadingAriaBusy: true,
  loadingHidden: undefined
};
