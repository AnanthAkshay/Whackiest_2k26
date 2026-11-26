import { useEffect, useRef, useState, type ReactNode } from "react";

interface TracingBeamProps {
  children: ReactNode;
  className?: string;
}

export function TracingBeam({ children, className = "" }: TracingBeamProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0.18);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId = 0;

    const update = (): void => {
      rafId = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = rect.height + vh * 0.4;
      const passed = vh * 0.65 - rect.top;
      const next = Math.min(1, Math.max(0.08, passed / Math.max(1, total)));
      setProgress(next);
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
  }, []);

  return (
    <div ref={wrapRef} className={`ac-tracing-beam-wrap ${className}`.trim()}>
      <div className="ac-tracing-rail" aria-hidden="true">
        <div className="ac-tracing-track">
          <div className="ac-tracing-fill" style={{ transform: `scaleY(${progress})` }} />
          <div className="ac-tracing-dot" />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
