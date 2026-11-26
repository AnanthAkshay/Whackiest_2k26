import { useEffect, useRef, type ReactNode } from "react";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
  className = ""
}: SheetProps): JSX.Element | null {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const sheetEl = sheetRef.current;

    const getFocusable = (): HTMLElement[] => {
      if (!sheetEl) return [];
      return Array.from(
        sheetEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const initial = getFocusable();
    if (initial.length > 0) {
      initial[0].focus();
    } else {
      sheetEl?.focus();
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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
    <div className="pf-sheet-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
        className={["pf-sheet", className].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pf-sheet-handle" aria-hidden="true" />
        <div className="pf-sheet-header">
          {title ? <h2 className="pf-sheet-title">{title}</h2> : <span />}
          <button
            type="button"
            className="pf-btn pf-btn--ghost pf-sheet-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ✕
          </button>
        </div>
        <div className="pf-sheet-body">{children}</div>
      </div>
    </div>
  );
}
