import type { HTMLAttributes, ReactNode } from "react";
import { IconButton, type IconButtonProps } from "./IconButton";
import { Modal, type ModalProps } from "./Modal";
import { Sheet, type SheetProps } from "./Sheet";

export function GlassHeader({ className = "", children, ...rest }: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <header className={`glass-panel ${className}`.trim()} {...rest}>
      {children}
    </header>
  );
}

export function GlassNavigation({ className = "", children, ...rest }: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <nav className={`glass-card ${className}`.trim()} {...rest}>
      {children}
    </nav>
  );
}

export function GlassIconButton({ className = "", ...props }: IconButtonProps): JSX.Element {
  return <IconButton className={`pf-btn--glass ${className}`.trim()} {...props} />;
}

export function GlassModal(props: ModalProps): JSX.Element | null {
  return <Modal {...props} />;
}

export function GlassSheet(props: SheetProps): JSX.Element | null {
  return <Sheet {...props} />;
}

export function GlassTooltip({
  content,
  children,
  className = "",
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <span className={`pf-tooltip ${className}`.trim()}>
      {children}
      <span role="tooltip" className="pf-tooltip-bubble">
        {content}
      </span>
    </span>
  );
}
