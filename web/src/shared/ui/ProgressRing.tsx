export type ProgressRingTone = "violet" | "ok" | "warn" | "bad";

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: ProgressRingTone;
  label?: string;
  sublabel?: string;
  className?: string;
}

const TONE_COLOR: Record<ProgressRingTone, string> = {
  violet: "var(--violet)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)"
};

export function ProgressRing({
  value,
  size = 84,
  strokeWidth = 7,
  tone = "violet",
  label,
  sublabel,
  className = ""
}: ProgressRingProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={["pf-ring", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pf-ring-svg" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_COLOR[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="pf-ring-arc"
        />
      </svg>
      <div className="pf-ring-center">
        <strong className="pf-ring-value">{clamped}%</strong>
        {sublabel && <span className="pf-ring-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}
