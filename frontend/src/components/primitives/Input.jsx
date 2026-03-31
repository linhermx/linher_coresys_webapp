import { useId } from "react";

function Input({
  className = "",
  error,
  hint,
  id,
  label,
  leadingIcon: LeadingIcon,
  name,
  ...props
}) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : null;
  const errorId = error ? `${inputId}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const hasLeadingIcon = Boolean(LeadingIcon);

  return (
    <div
      className={`field ${error ? "field--error" : ""} ${hasLeadingIcon ? "field--with-icon" : ""} ${className}`.trim()}
    >
      {label ? (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <div className="field__control">
        {LeadingIcon ? (
          <span className="field__icon" aria-hidden="true">
            <LeadingIcon size={16} strokeWidth={1.9} />
          </span>
        ) : null}

        <input
          id={inputId}
          name={name ?? inputId}
          className="field__input"
          aria-describedby={describedBy}
          {...props}
        />
      </div>

      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
