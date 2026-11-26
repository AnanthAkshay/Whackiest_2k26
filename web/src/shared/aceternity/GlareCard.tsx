import { useRef, type MouseEvent, type ReactNode } from "react";

interface GlareCardProps {
  children: ReactNode;
  className?: string;
}

export function GlareCard({ children, className = "" }: GlareCardProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--glare-x", `${x.toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${y.toFixed(1)}%`);
    el.style.setProperty("--glare-opacity", "1");
  }

  function handleMouseLeave(): void {
    ref.current?.style.setProperty("--glare-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={`ac-glare-card ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="ac-glare-overlay" aria-hidden="true" />
      {children}
    </div>
  );
}
