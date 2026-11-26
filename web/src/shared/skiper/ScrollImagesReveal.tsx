import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function ScrollImagesReveal({
  items,
  className = ""
}: {
  items: { id: string; content: ReactNode }[];
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`sk-reveal-grid ${className}`.trim()}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={`sk-reveal-item${visible ? " is-visible" : ""}`}
          style={{ "--reveal-i": idx } as CSSProperties}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
