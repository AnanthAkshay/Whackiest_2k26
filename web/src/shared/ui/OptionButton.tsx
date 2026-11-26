import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  unavailable?: boolean;
  children: ReactNode;
}

export function OptionButton({
  selected = false,
  unavailable = false,
  className = "",
  type = "button",
  disabled,
  children,
  ...rest
}: OptionButtonProps): JSX.Element {
  const isDisabled = Boolean(disabled || unavailable);
  return (
    <button
      type={type}
      aria-pressed={selected}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      className={["pf-option-btn", selected ? "is-selected" : "", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
