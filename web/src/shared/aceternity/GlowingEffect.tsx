import { useRef, type MouseEvent, type ReactNode } from "react";

interface GlowingEffectProps {
  children: ReactNode;
  className?: string;
}

export function GlowingEffect({ children, className = "" }: GlowingEffectProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--glow-opacity", "1");
  }

  function handleMouseLeave(): void {
    ref.current?.style.setProperty("--glow-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={`ac-glow-card ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="ac-glow-ring" aria-hidden="true" />
      {children}
    </div>
  );
}
