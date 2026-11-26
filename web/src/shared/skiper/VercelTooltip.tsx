import { useId, useState, type ReactNode } from "react";
import { Info } from "@phosphor-icons/react";

interface VercelTooltipProps {
  label: string;
  content: ReactNode;
}

export function VercelTooltip({ label, content }: VercelTooltipProps): JSX.Element {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="sk-tooltip-anchor">
      <button
        type="button"
        className="sk-tooltip-trigger"
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => setOpen(false)}
      >
        <Info size={14} weight="regular" aria-hidden="true" />
        <span>{label}</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className={`sk-tooltip-popover${open ? " is-open" : ""}`}
      >
        {content}
      </span>
    </span>
  );
}
