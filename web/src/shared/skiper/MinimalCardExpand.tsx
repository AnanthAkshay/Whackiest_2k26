import { useState, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

interface MinimalCardExpandProps {
  title: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function MinimalCardExpand({
  title,
  rightSlot,
  children,
  defaultOpen = false
}: MinimalCardExpandProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`sk-expand-card${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="sk-expand-btn"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {title}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {rightSlot}
          <CaretDown size={16} className="sk-expand-chevron" aria-hidden="true" />
        </span>
      </button>
      <div className="sk-expand-panel">
        <div className="sk-expand-inner">
          <div className="sk-expand-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
