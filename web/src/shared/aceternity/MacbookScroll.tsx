import { useEffect, useRef, useState, type ReactNode } from "react";

interface MacbookScrollProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function MacbookScroll({ title, subtitle, children }: MacbookScrollProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(14);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId = 0;

    const update = (): void => {
      rafId = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const ratio = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (vh * 0.55)));
      setTilt(Number(((1 - ratio) * 16).toFixed(2)));
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
    <div ref={wrapRef} className="ac-macbook-wrap">
      {(title || subtitle) && (
        <div className="ac-macbook-head">
          {subtitle && <span className="pf-label">{subtitle}</span>}
          {title && <h2 className="pf-section-title" style={{ marginTop: "8px" }}>{title}</h2>}
        </div>
      )}
      <div className="ac-macbook-stage">
        <div
          className="ac-macbook-screen"
          style={{ transform: `rotateX(${tilt}deg)` }}
        >
          <div className="ac-macbook-notch" aria-hidden="true">
            <span className="ac-macbook-cam" />
          </div>
          <div className="ac-macbook-content">{children}</div>
        </div>
        <div className="ac-macbook-base" aria-hidden="true">
          <div className="ac-macbook-lip" />
        </div>
      </div>
    </div>
  );
}
