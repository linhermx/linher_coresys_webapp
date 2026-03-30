function Card({
  actions,
  children,
  className = "",
  description,
  title,
  variant = "default",
}) {
  return (
    <section className={`card card--${variant} ${className}`.trim()}>
      {title || description || actions ? (
        <header className="card__header">
          <div>
            {title ? <h3 className="card__title">{title}</h3> : null}
            {description ? <p className="card__description">{description}</p> : null}
          </div>
          {actions ? <div className="card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  );
}

export default Card;

