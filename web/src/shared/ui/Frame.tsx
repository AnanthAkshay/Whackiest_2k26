import type { ReactNode } from "react";
import { Grain } from "./Grain";

export function Frame({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="pf-frame">
      <div className="pf-frame-pattern" aria-hidden="true" />
      <Grain />
      <div className="pf-frame-content">{children}</div>
    </div>
  );
}
