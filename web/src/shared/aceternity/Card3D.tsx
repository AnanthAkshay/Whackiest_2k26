import { createContext, useContext, useRef, useState, type MouseEvent, type ReactNode } from "react";

const MouseEnterContext = createContext<boolean>(false);

export function CardContainer({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntered, setIsEntered] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 28;
    const y = (e.clientY - rect.top - rect.height / 2) / 28;
    el.style.transform = `rotateY(${x.toFixed(2)}deg) rotateX(${(-y).toFixed(2)}deg)`;
  }

  function handleMouseEnter(): void {
    setIsEntered(true);
  }

  function handleMouseLeave(): void {
    setIsEntered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
    }
  }

  return (
    <MouseEnterContext.Provider value={isEntered}>
      <div className={`ac-3d-perspective ${className}`.trim()}>
        <div
          ref={containerRef}
          className="ac-3d-body"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

export function CardBody({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return <div className={className}>{children}</div>;
}

export function CardItem({
  children,
  className = "",
  translateZ = 0
}: {
  children: ReactNode;
  className?: string;
  translateZ?: number;
}): JSX.Element {
  const isEntered = useContext(MouseEnterContext);
  return (
    <div
      className={`ac-3d-item ${className}`.trim()}
      style={{
        transform: isEntered && translateZ ? `translateZ(${translateZ}px)` : "translateZ(0px)"
      }}
    >
      {children}
    </div>
  );
}
