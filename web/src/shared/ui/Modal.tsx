import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = "Close"
}: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const el = dialogRef.current;

    const getFocusable = (): HTMLElement[] => {
      if (!el) return [];
      return Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    // Focus Cancel / first safe button if present
    const focusable = getFocusable();
    const cancelBtn = focusable.find((node) => /cancel|keep/i.test(node.textContent ?? ""));
    (cancelBtn ?? focusable[0] ?? el)?.focus();

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const list = getFocusable();
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pf-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pf-modal-head">
          <h2 className="pf-modal-title">{title}</h2>
          <button
            type="button"
            className="pf-btn pf-btn--ghost pf-modal-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={18} weight="regular" aria-hidden="true" />
          </button>
        </div>
        <div className="pf-modal-body">{children}</div>
      </div>
    </div>
  );
}
