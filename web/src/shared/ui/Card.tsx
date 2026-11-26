import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "subtle" | "lavender" | "error" | "glass" | "glass-strong" | "glass-soft";
export type CardPadding = "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "aside";
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  as: Tag = "div",
  variant = "default",
  padding = "md",
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps): JSX.Element {
  const classes = [
    "pf-card",
    variant !== "default" ? `pf-card--${variant}` : "",
    padding !== "md" ? `pf-card--pad-${padding}` : "",
    interactive ? "pf-card--interactive" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export function GlassCard({ variant = "glass", ...props }: CardProps): JSX.Element {
  return <Card variant={variant} {...props} />;
}

export function GlassPanel({ variant = "glass-strong", ...props }: CardProps): JSX.Element {
  return <Card variant={variant} {...props} />;
}
