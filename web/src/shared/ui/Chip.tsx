import type { HTMLAttributes, ReactNode } from "react";

export type ChipTone = "neutral" | "lavender" | "ok" | "warn" | "bad" | "review";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  children: ReactNode;
}

export function Chip({
  tone = "neutral",
  className = "",
  children,
  ...rest
}: ChipProps): JSX.Element {
  return (
    <span className={["pf-chip", `pf-chip--${tone}`, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}

export const Badge = Chip;
export type BadgeProps = ChipProps;
export type BadgeTone = ChipTone;
