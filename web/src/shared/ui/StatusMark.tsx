export type StatusTone = "ok" | "warn" | "bad" | "review" | "neutral";

export function StatusMark({
  tone = "neutral",
  label,
}: {
  tone?: StatusTone;
  size?: number;
  label?: string;
}): JSX.Element {
  const sqClass = `pf-status-square pf-status-square--${tone}`;
  if (!label) {
    return <span className={sqClass} aria-hidden="true" />;
  }
  return (
    <span className="pf-status-mark-wrap">
      <span className={sqClass} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
