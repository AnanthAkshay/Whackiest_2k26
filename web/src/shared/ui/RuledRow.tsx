import type { ReactNode } from "react";

export function RuledRow({
  label,
  value,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={`pf-ruled-row ${className}`.trim()}>
      <span className="pf-ruled-label">{label}</span>
      <span className="pf-ruled-value">{value}</span>
    </div>
  );
}

export function CurrentRow({
  label,
  value,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={`pf-current-row ${className}`.trim()}>
      <span className="pf-ruled-label">{label}</span>
      <span className="pf-ruled-value">{value}</span>
    </div>
  );
}
