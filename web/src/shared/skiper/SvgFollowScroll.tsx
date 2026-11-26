interface SvgFollowScrollProps {
  progressPct: number;
  label?: string;
}

export function SvgFollowScroll({ progressPct, label }: SvgFollowScrollProps): JSX.Element {
  const clamped = Math.min(100, Math.max(0, progressPct));
  return (
    <div className="sk-svg-scroll-wrap" aria-label={label}>
      <svg className="sk-svg-scroll-svg" viewBox="0 0 600 18" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M 4 9 Q 150 2 300 9 T 596 9"
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 4 9 Q 150 2 300 9 T 596 9"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - clamped}
          style={{ transition: "stroke-dashoffset 0.35s ease" }}
        />
      </svg>
    </div>
  );
}
