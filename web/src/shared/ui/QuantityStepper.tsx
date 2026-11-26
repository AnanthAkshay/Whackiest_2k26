import { IconMinus, IconPlus } from "./Icons";

export function QuantityStepper({
  value,
  min = 0,
  max = 99,
  unit,
  onChange,
  decrementLabel = "Decrease",
  incrementLabel = "Increase",
}: {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (next: number) => void;
  decrementLabel?: string;
  incrementLabel?: string;
}): JSX.Element {
  return (
    <div className="pf-qty-stepper">
      <button
        type="button"
        className="pf-icon-btn"
        aria-label={decrementLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <IconMinus size={18} />
      </button>
      <span className="pf-qty-stepper-val tabular-nums">{value}</span>
      {unit && <span className="pf-qty-stepper-unit">{unit}</span>}
      <button
        type="button"
        className="pf-icon-btn"
        aria-label={incrementLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <IconPlus size={18} />
      </button>
    </div>
  );
}
