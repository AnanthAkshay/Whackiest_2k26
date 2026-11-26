import type { ReactNode } from "react";

export function BentoGrid({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return <div className={`ac-bento-grid ${className}`.trim()}>{children}</div>;
}

export function BentoGridItem({
  children,
  className = "",
  span = 1
}: {
  children: ReactNode;
  className?: string;
  span?: 1 | 2;
}): JSX.Element {
  const spanClass = span === 2 ? "ac-bento-span-2" : "";
  return <div className={`${spanClass} ${className}`.trim()}>{children}</div>;
}
