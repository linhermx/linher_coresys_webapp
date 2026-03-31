import { X } from "lucide-react";
import { useEffect, useId } from "react";

function Drawer({
  actions,
  children,
  description,
  onClose,
  open,
  title,
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="drawer" aria-hidden={!open}>
      <button
        type="button"
        className="drawer__backdrop"
        aria-label="Cerrar panel lateral"
        onClick={onClose}
      />

      <section
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="drawer__header">
          <div className="drawer__header-copy">
            <h2 id={titleId} className="drawer__title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="drawer__description">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="icon-button"
            aria-label="Cerrar panel"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        {actions ? <footer className="drawer__footer">{actions}</footer> : null}
      </section>
    </div>
  );
}

export default Drawer;
