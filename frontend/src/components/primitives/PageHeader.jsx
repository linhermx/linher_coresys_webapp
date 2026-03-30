function PageHeader({ actions, eyebrow, title, description }) {
  return (
    <header className="page-header">
      <div className="page-header__content">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? (
          <p className="page-header__description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
