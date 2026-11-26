import { useState, type ReactNode } from "react";

interface DynamicIslandProps {
  label: string;
  meta?: string;
  tone?: "ok" | "warn" | "bad";
  pulse?: boolean;
  details?: ReactNode;
}

export function DynamicIsland({
  label,
  meta,
  tone = "ok",
  pulse = false,
  details
}: DynamicIslandProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="sk-island-wrap">
      <button
        type="button"
        className={`sk-island${expanded && details ? " is-expanded" : ""}`}
        aria-expanded={details ? expanded : undefined}
        onClick={() => details && setExpanded((prev) => !prev)}
      >
        <span className="sk-island-top">
          <span className="sk-island-lead">
            <span
              className={`sk-island-dot is-${tone}${pulse ? " is-pulse" : ""}`}
              aria-hidden="true"
            />
            <span>{label}</span>
          </span>
          {meta && <span className="sk-island-meta">{meta}</span>}
        </span>
        {expanded && details && <div className="sk-island-body">{details}</div>}
      </button>
    </div>
  );
}
