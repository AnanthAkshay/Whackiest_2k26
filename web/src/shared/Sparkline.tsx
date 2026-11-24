import type { MeterTraceEntry } from "../types";

export function Sparkline({ trace }: { trace: MeterTraceEntry[] }): JSX.Element {
  if (trace.length < 2) return <></>;
  const w = 200;
  const h = 40;
  const pad = 2;
  const step = (w - pad * 2) / (trace.length - 1);
  const points = trace
    .map((entry, i) => `${pad + i * step},${pad + (h - pad * 2) * (1 - entry.value / 100)}`)
    .join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Understanding meter progress">
      <polyline
        fill="none"
        stroke="var(--meter-high)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
