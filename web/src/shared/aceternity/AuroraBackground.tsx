import type { ReactNode } from "react";

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function AuroraBackground({ children, className = "" }: AuroraBackgroundProps): JSX.Element {
  return (
    <div className={`ac-aurora-wrap ${className}`.trim()}>
      <div className="ac-aurora-layer" aria-hidden="true" />
      {children}
    </div>
  );
}
