import type { CSSProperties } from "react";

interface SpotlightProps {
  x?: string;
  y?: string;
  className?: string;
}

export function Spotlight({ x = "72%", y = "26%", className = "" }: SpotlightProps): JSX.Element {
  return (
    <div
      className={`ac-spotlight ${className}`.trim()}
      style={{ "--spot-x": x, "--spot-y": y } as CSSProperties}
      aria-hidden="true"
    />
  );
}
