export const WorkspaceSplitLayout = ({
  viewKey = 'list',
  detailOpen = false,
  detailAriaLabel = 'Panel contextual de detalle',
  detailAriaLabelledBy,
  detailId,
  detailRole,
  detailRef,
  main,
  detail,
  className = ''
}) => {
  const resolvedClassName = [
    'workspace-split',
    `workspace-split--${viewKey}`,
    detailOpen ? 'workspace-split--detail-open' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={resolvedClassName}>
      <div className="workspace-split__main">{main}</div>
      {detailOpen ? (
        <div
          className="workspace-split__detail"
          id={detailId}
          role={detailRole}
          aria-label={detailRole && !detailAriaLabelledBy ? detailAriaLabel : undefined}
          aria-labelledby={detailRole ? detailAriaLabelledBy : undefined}
          ref={detailRef}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
};
