import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { SvgFollowScroll } from "./skiper";
import { Stepper } from "./ui";

export type JourneyStageKey =
  | "welcome"
  | "profile"
  | "role"
  | "learn"
  | "demonstrate"
  | "validation"
  | "explain"
  | "results"
  | "verify"
  | "connect";

const STAGES: { key: JourneyStageKey; label: string; to: string }[] = [
  { key: "learn", label: "1. Learn", to: "/learn" },
  { key: "demonstrate", label: "2. Demonstrate", to: "/challenge" },
  { key: "explain", label: "3. Explain", to: "/session" },
  { key: "verify", label: "4. Verify", to: "/skill/demo?demo=1" },
  { key: "connect", label: "5. Connect", to: "/opportunities" }
];

export function JourneyNav({ activeStage }: { activeStage: JourneyStageKey }): JSX.Element {
  const { t } = useTranslation();
  const activeIdx = STAGES.findIndex(
    (stage) =>
      stage.key === activeStage ||
      (stage.key === "demonstrate" && activeStage === "validation") ||
      (stage.key === "explain" && activeStage === "results")
  );
  const progressPct = activeIdx >= 0 ? Math.round(((activeIdx + 1) / STAGES.length) * 100) : 20;

  return (
    <header className="home-header">
      <div className="nav-top-row">
        <Link to="/" className="brand-link">
          <span className="brand">{t("appName")}</span>
        </Link>
        <Link to="/opportunities" className="nav-quick-link">
          {t("navOpportunities")}
        </Link>
      </div>
      <SvgFollowScroll progressPct={progressPct} label={`Journey progress ${progressPct}%`} />
      <Stepper
        variant="pills"
        ariaLabel={t("journeyNavLabel")}
        items={STAGES.map((stage) => ({
          key: stage.key,
          label: stage.label,
          to: stage.to,
          active:
            stage.key === activeStage ||
            (stage.key === "demonstrate" && activeStage === "validation") ||
            (stage.key === "explain" && activeStage === "results")
        }))}
      />
    </header>
  );
}
