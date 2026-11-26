import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
  className?: string;
  onCopied?: () => void;
}

export function CopyButton({
  text,
  label = "COPY",
  copiedLabel = "COPIED",
  ariaLabel = "Copy to clipboard",
  className = "",
  onCopied
}: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        className={["pf-copy-btn", copied ? "is-copied" : "", className].filter(Boolean).join(" ")}
        onClick={() => void handleCopy()}
        aria-label={ariaLabel}
        title={text}
      >
        {copied ? <Check size={14} weight="regular" aria-hidden="true" /> : <Copy size={14} weight="regular" aria-hidden="true" />}
        <span>{copied ? copiedLabel : label}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
