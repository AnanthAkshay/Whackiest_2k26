import { Check, Minus, Warning, X } from "@phosphor-icons/react";

export type StatusTone = "ok" | "warn" | "bad" | "review" | "neutral";

export function StatusMark({
  tone = "neutral",
  size = 16
}: {
  tone?: StatusTone;
  size?: number;
}): JSX.Element {
  const cls = `pf-status-mark pf-status-mark--${tone}`;
  if (tone === "ok") return <Check size={size} weight="regular" className={cls} aria-hidden="true" />;
  if (tone === "warn") return <Warning size={size} weight="regular" className={cls} aria-hidden="true" />;
  if (tone === "bad") return <X size={size} weight="regular" className={cls} aria-hidden="true" />;
  return <Minus size={size} weight="regular" className={cls} aria-hidden="true" />;
}
