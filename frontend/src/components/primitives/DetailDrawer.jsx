export const DetailDrawer = ({
  as: Component = 'aside',
  className = '',
  tone = 'primary',
  children,
  ...props
}) => {
  const resolvedClassName = [
    'drawer-shell',
    'panel-detail',
    tone ? `drawer-shell--tone-${tone}` : '',
    tone ? `ticket-detail--tone-${tone}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={resolvedClassName} {...props}>
      {children}
    </Component>
  );
};

export const DetailDrawerHero = ({
  eyebrow,
  status,
  title,
  titleId,
  subtitle,
  summary,
  actions,
  className = '',
  titleClassName = '',
  subtitleClassName = ''
}) => {
  const resolvedClassName = [
    'drawer-hero',
    'panel-detail__header',
    className
  ].filter(Boolean).join(' ');

  return (
    <header className={resolvedClassName}>
      <div className="drawer-hero__toolbar panel-detail__header-top">
        <div className="drawer-hero__identity panel-detail__header-id">
          {eyebrow ? <span className="drawer-hero__eyebrow ticket-detail__ticket-id">{eyebrow}</span> : null}
          {status}
        </div>
        {actions ? (
          <div className="drawer-hero__actions panel-detail__header-actions">
            {actions}
          </div>
        ) : null}
      </div>

      <div className="drawer-hero__main">
        <h2 id={titleId} className={['drawer-hero__title', 'panel-detail__title', titleClassName].filter(Boolean).join(' ')}>
          {title}
        </h2>
        {subtitle ? (
          <p className={['drawer-hero__subtitle', 'panel-detail__summary-copy', subtitleClassName].filter(Boolean).join(' ')}>
            {subtitle}
          </p>
        ) : null}
        {summary ? (
          <p className="drawer-hero__summary panel-detail__summary-copy">
            {summary}
          </p>
        ) : null}
      </div>
    </header>
  );
};

export const DetailDrawerSection = ({
  title,
  titleIcon,
  actions,
  children,
  className = '',
  titleClassName = '',
  as: Component = 'section'
}) => {
  const resolvedClassName = [
    'drawer-section',
    'panel-detail__section',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={resolvedClassName}>
      {(title || actions) ? (
        <div className="drawer-section__header panel-detail__section-headline">
          {title ? (
            <h3 className={['drawer-section__title', 'panel-detail__section-title', titleClassName].filter(Boolean).join(' ')}>
              {titleIcon}
              <span>{title}</span>
            </h3>
          ) : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </Component>
  );
};

export const DetailDrawerFactGrid = ({
  children,
  className = ''
}) => (
  <dl className={['drawer-fact-grid', 'panel-detail__facts', className].filter(Boolean).join(' ')}>
    {children}
  </dl>
);

export const DetailDrawerFact = ({
  label,
  children,
  className = ''
}) => (
  <div className={['drawer-fact', 'panel-detail__fact', className].filter(Boolean).join(' ')}>
    <dt className="drawer-fact__label panel-detail__fact-label">{label}</dt>
    <dd>{children}</dd>
  </div>
);
