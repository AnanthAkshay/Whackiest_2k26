export function BackgroundBeams({ className = "" }: { className?: string }): JSX.Element {
  return (
    <div className={`ac-beams-wrap ${className}`.trim()} aria-hidden="true">
      <svg className="ac-beams-svg" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="pf-beam-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pf-beam-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--text-secondary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--text-secondary)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--text-secondary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="ac-beam-path ac-beam-path--1" d="M-80 120 C 260 40, 560 280, 1280 90" stroke="url(#pf-beam-1)" strokeWidth="1.5" />
        <path className="ac-beam-path ac-beam-path--2" d="M-40 310 C 340 210, 740 420, 1260 220" stroke="url(#pf-beam-1)" strokeWidth="1.2" />
        <path className="ac-beam-path ac-beam-path--3" d="M-100 470 C 310 380, 790 520, 1280 390" stroke="url(#pf-beam-2)" strokeWidth="1" />
      </svg>
    </div>
  );
}
