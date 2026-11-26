import type { ReactNode } from "react";
import { IconInfoFilled } from "./Icons";

export function InfoNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={`pf-info-note ${className}`.trim()}>
      <IconInfoFilled size={18} style={{ flexShrink: 0, marginTop: "3px" }} />
      <span>{children}</span>
    </div>
  );
}
