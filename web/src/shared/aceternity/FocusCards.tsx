import { useState, type ReactNode } from "react";

export function useFocusCards<T extends string | number>() {
  const [hovered, setHovered] = useState<T | null>(null);
  return {
    hovered,
    setHovered,
    gridClassName: hovered !== null ? "ac-focus-grid has-focus" : "ac-focus-grid",
    getCardProps: (id: T) => ({
      className: `ac-focus-card${hovered === id ? " is-focused" : ""}`,
      onMouseEnter: () => setHovered(id),
      onMouseLeave: () => setHovered(null)
    })
  };
}

export function FocusCard({
  children,
  focused,
  onEnter,
  onLeave,
  className = ""
}: {
  children: ReactNode;
  focused: boolean;
  onEnter: () => void;
  onLeave: () => void;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={`ac-focus-card${focused ? " is-focused" : ""} ${className}`.trim()}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
