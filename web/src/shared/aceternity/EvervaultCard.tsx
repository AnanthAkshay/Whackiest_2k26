import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";

const MATRIX_CHARS = "0123456789abcdefSHA256JWS";

function buildMatrix(seed: string, length = 320): string {
  let out = "";
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < length; i++) {
    h = Math.imul(h ^ i, 16777619);
    out += MATRIX_CHARS[Math.abs(h) % MATRIX_CHARS.length];
  }
  return out;
}

interface EvervaultCardProps {
  seed: string;
  children: ReactNode;
  className?: string;
}

export function EvervaultCard({ seed, children, className = "" }: EvervaultCardProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverCount, setHoverCount] = useState(0);
  const matrix = useMemo(() => buildMatrix(`${seed}:${hoverCount}`, 360), [seed, hoverCount]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--ev-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--ev-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--ev-opacity", "1");
    setHoverCount((c) => (c + 1) % 12);
  }

  function handleMouseLeave(): void {
    ref.current?.style.setProperty("--ev-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={`ac-evervault-wrap ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="ac-evervault-matrix" aria-hidden="true">
        {matrix}
      </div>
      <div className="ac-evervault-body">{children}</div>
    </div>
  );
}
