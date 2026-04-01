import { useId } from "react";

function Select({
  className = "",
  error,
  hint,
  id,
  label,
  name,
  options,
  placeholder = "Selecciona una opción",
  ...props
}) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;
  const hintId = hint ? `${selectId}-hint` : null;
  const errorId = error ? `${selectId}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`.trim()}>
      {label ? (
        <label className="field__label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}

      <div className="field__control">
        <select
          id={selectId}
          name={name ?? selectId}
          className="field__select"
          aria-describedby={describedBy}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

export default Select;
