import type { ReactNode } from "react";
import { IconChevronDown } from "./Icons";

export function Accordion({
  title,
  defaultOpen = false,
  children,
  className = "",
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <details open={defaultOpen} className={`pf-accordion ${className}`.trim()}>
      <summary className="pf-accordion-summary">
        <span>{title}</span>
        <IconChevronDown size={18} className="pf-accordion-chevron" />
      </summary>
      <div className="pf-accordion-body">{children}</div>
    </details>
  );
}
