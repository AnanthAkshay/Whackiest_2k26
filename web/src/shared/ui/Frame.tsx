import type { ReactNode } from "react";

export function Frame({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="pf-frame">
      <div className="pf-frame-content">{children}</div>
    </div>
  );
}
