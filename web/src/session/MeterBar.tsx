import { useTranslation } from "../i18n";

interface MeterBarProps {
  value: number;
  stalled: boolean;
}

function meterColor(value: number): string {
  if (value >= 65) return "var(--meter-high, #1f8a70)";
  if (value >= 35) return "var(--meter-mid, #c5940a)";
  return "var(--meter-low, #c24832)";
}

function meterLabel(value: number, t: (key: string) => string): string {
  if (value >= 65) return t("meterHigh");
  if (value >= 35) return t("meterMid");
  return t("meterLow");
}

export function MeterBar({ value, stalled }: MeterBarProps): JSX.Element {
  const { t } = useTranslation();
  const color = meterColor(value);
  const label = meterLabel(value, t as (key: string) => string);
  const accessibleText = `${t("meter")}: ${value}%. ${label}.${stalled ? " " + t("meterStalled") : ""}`;

  return (
    <section className="meter-card" aria-label={t("meter")}>
      <div className="meter-heading">
        <span>{t("meter")}</span>
        <strong aria-live="polite">{value}%</strong>
      </div>
      <p className="fineprint meter-provisional-note">{t("meterProvisionalNote")}</p>
      <div
        className={"meter" + (stalled ? " meter--stalled" : "")}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={accessibleText}
      >
        <span
          className="meter-fill"
          style={{ width: value + "%", background: color }}
        />
      </div>
      {stalled && (
        <p className="meter-stall-hint" role="status">
          {t("meterStalled")}
        </p>
      )}
      <span className="sr-only">{accessibleText}</span>
    </section>
  );
}
