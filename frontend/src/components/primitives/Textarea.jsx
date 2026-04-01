import { useId } from "react";

function Textarea({
  className = "",
  error,
  hint,
  id,
  label,
  name,
  rows = 5,
  ...props
}) {
  const generatedId = useId();
  const textareaId = id ?? `textarea-${generatedId}`;
  const hintId = hint ? `${textareaId}-hint` : null;
  const errorId = error ? `${textareaId}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`.trim()}>
      {label ? (
        <label className="field__label" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}

      <div className="field__control field__control--textarea">
        <textarea
          id={textareaId}
          name={name ?? textareaId}
          className="field__textarea"
          aria-describedby={describedBy}
          rows={rows}
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

export default Textarea;
