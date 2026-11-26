import { useEffect, useRef, type ReactNode } from "react";

export function ScrollParallax({
  children,
  speed = 0.06,
  className = ""
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const update = (): void => {
      rafId = 0;
      const rect = el.getBoundingClientRect();
      const offset = Math.max(-24, Math.min(24, (rect.top - window.innerHeight * 0.3) * speed));
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };

    const onScroll = (): void => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`am-parallax ${className}`.trim()}>
      {children}
    </div>
  );
}
