import type { ReactNode } from "react";

interface PinBadgeProps {
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function PinBadge({ label, icon, className = "" }: PinBadgeProps): JSX.Element {
  return (
    <div className={`ac-pin-wrap ${className}`.trim()}>
      <div className="ac-pin-pill">
        <span className="ac-pin-dot" aria-hidden="true" />
        {icon}
        <span>{label}</span>
      </div>
      <div className="ac-pin-stem" aria-hidden="true" />
    </div>
  );
}
