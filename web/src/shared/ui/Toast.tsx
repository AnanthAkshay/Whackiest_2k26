import type { ChipTone } from "./Chip";

export interface ToastProps {
  open: boolean;
  message: string;
  tone?: Extract<ChipTone, "neutral" | "ok" | "warn" | "bad">;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

export function Toast({
  open,
  message,
  tone = "neutral",
  onDismiss,
  dismissLabel = "Dismiss",
  className = ""
}: ToastProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      aria-live={tone === "bad" ? "assertive" : "polite"}
      className={["pf-toast", `pf-toast--${tone}`, className].filter(Boolean).join(" ")}
    >
      <span className="pf-toast-msg">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="pf-toast-close"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          ✕
        </button>
      )}
    </div>
  );
}
