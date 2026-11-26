import type { ReactNode } from "react";

interface MovingBorderProps {
  children: ReactNode;
  className?: string;
}

export function MovingBorder({ children, className = "" }: MovingBorderProps): JSX.Element {
  return (
    <div className={`ac-moving-border-wrap ${className}`.trim()}>
      <span className="ac-moving-border-spin" aria-hidden="true" />
      <div className="ac-moving-border-inner">{children}</div>
    </div>
  );
}
