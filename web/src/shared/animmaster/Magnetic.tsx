import { useRef, type MouseEvent, type ReactNode } from "react";

export function Magnetic({
  children,
  strength = 0.18,
  className = ""
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  }

  function handleMouseLeave(): void {
    if (ref.current) {
      ref.current.style.transform = "translate3d(0, 0, 0)";
    }
  }

  return (
    <div
      ref={ref}
      className={`am-magnetic ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
