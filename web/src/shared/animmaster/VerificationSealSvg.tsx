export function VerificationSealSvg({ size = 44 }: { size?: number }): JSX.Element {
  return (
    <svg
      className="am-seal-svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <circle
        className="am-seal-ring"
        cx="24"
        cy="24"
        r="20"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <path
        className="am-seal-check"
        d="M16 24.5L21.5 30L33 18.5"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
