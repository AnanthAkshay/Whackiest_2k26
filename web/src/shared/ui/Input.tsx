import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...rest
}: InputProps): JSX.Element {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="pf-field">
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={["pf-input", error ? "pf-input--error" : "", className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...rest}
      />
      {error && (
        <p id={errorId} className="pf-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
