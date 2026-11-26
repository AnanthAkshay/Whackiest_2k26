import { useState, type ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";

export interface CardStackItem {
  id: string;
  eyebrow: string;
  title: string;
  body: ReactNode;
}

export function CardStack({
  items,
  className = ""
}: {
  items: readonly CardStackItem[];
  className?: string;
}): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  if (items.length === 0) return <></>;

  function next(): void {
    setActiveIndex((i) => (i + 1) % items.length);
  }

  const ordered = items.map((item, idx) => {
    const offset = (idx - activeIndex + items.length) % items.length;
    return { item, offset };
  });

  return (
    <div className={`ac-card-stack-wrap ${className}`.trim()}>
      <div className="ac-card-stack">
        {ordered.map(({ item, offset }) => {
          const visible = offset < 3;
          if (!visible) return null;
          return (
            <article
              key={item.id}
              className="ac-card-stack-item glass-panel"
              style={{
                zIndex: items.length - offset,
                transform: `translateY(${offset * 10}px) scale(${1 - offset * 0.04})`,
                opacity: 1 - offset * 0.22
              }}
            >
              <div className="ac-card-stack-head">
                <span className="pf-label">{item.eyebrow}</span>
                <span className="mono fineprint">
                  {activeIndex + 1} / {items.length}
                </span>
              </div>
              <h3 className="ac-card-stack-title">{item.title}</h3>
              <div className="ac-card-stack-body">{item.body}</div>
            </article>
          );
        })}
      </div>
      {items.length > 1 && (
        <button type="button" className="pf-btn pf-btn--secondary" onClick={next}>
          <span>Next evidence card</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
