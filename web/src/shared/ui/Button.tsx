import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "dark" | "secondary" | "ghost" | "glass";
export type ButtonSize = "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = ""
}: ButtonStyleOptions = {}): string {
  return [
    "pf-btn",
    `pf-btn--${variant}`,
    size === "lg" ? "pf-btn--lg" : "",
    fullWidth ? "pf-btn--full" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GlassButton({ variant = "glass", ...props }: ButtonProps): JSX.Element {
  return <Button variant={variant} {...props} />;
}
