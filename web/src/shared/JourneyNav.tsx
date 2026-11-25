import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";

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
      <nav className="journey-pill-stack" aria-label={t("journeyNavLabel")}>
        {STAGES.map((stage) => {
          const isCurrent =
            stage.key === activeStage ||
            (stage.key === "demonstrate" && activeStage === "validation") ||
            (stage.key === "explain" && activeStage === "results");
          return (
            <Link
              key={stage.key}
              to={stage.to}
              className={"journey-pill" + (isCurrent ? " active" : "")}
              aria-current={isCurrent ? "step" : undefined}
            >
              {stage.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
