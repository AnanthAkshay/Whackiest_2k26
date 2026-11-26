import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Info } from "lucide-react";
import { createCredential, getSkillRecord } from "../api";
import { useTranslation } from "../i18n";
import { computeECVEResult } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { ScoreList } from "../shared/ScoreList";
import { Sparkline } from "../shared/Sparkline";
import { Badge, Button, Card, Skeleton, type BadgeTone } from "../shared/ui";
import type { ECVEOutcome, SkillRecord } from "../types";

const OUTCOME_COLOR: Record<ECVEOutcome, string> = {
  Demonstrated: "#2F8F6B",
  "Partially demonstrated": "#E0A33A",
  "Not yet demonstrated": "#E26D5A",
  "Pending Human Review": "#6C7A9C"
};

const OUTCOME_TONE: Record<ECVEOutcome, BadgeTone> = {
  Demonstrated: "ok",
  "Partially demonstrated": "warn",
  "Not yet demonstrated": "bad",
  "Pending Human Review": "review"
};

export function ResultsPage(): JSX.Element {
  const { id = "" } = useParams();
  const { validationReport } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [record, setRecord] = useState<SkillRecord>();
  const [creating, setCreating] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [ringDrawn, setRingDrawn] = useState(false);

  const isDemo =
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1") ||
    id === "demo";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await getSkillRecord(id);
        if (!cancelled) setRecord(res);
      } catch {
        if (isDemo) {
          try {
            const resp = await fetch("/demo/session.json");
            const data = (await resp.json()) as { record: SkillRecord };
            if (!cancelled) setRecord(data.record);
            return;
          } catch {
            // Ignore demo fallback failure
          }
        }
        if (!cancelled) setRecord(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isDemo]);

  const ecve = record
    ? computeECVEResult(validationReport?.practicalScore ?? record.total, record.total, 85)
    : undefined;

  useEffect(() => {
    if (!ecve) return;
    const target = Math.max(0, Math.min(100, ecve.composite));
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setRingDrawn(true);
    if (reduced) {
      setAnimatedScore(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(target * eased));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [ecve?.composite]);

  async function handleCreatePage(): Promise<void> {
    if (creating) return;
    setCreating(true);
    try {
      const { pageId } = await createCredential(id);
      navigate(`/skill/${pageId}${isDemo ? "?demo=1" : ""}`);
    } catch {
      if (isDemo) {
        navigate(`/skill/demo?demo=1`);
      } else {
        setCreating(false);
      }
    }
  }

  if (!record || !ecve) {
    return (
      <main className="shell">
        <p className="loading">{t("loading")}</p>
        <div className="form-stack" style={{ marginTop: "16px" }}>
          <Skeleton variant="title" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </main>
    );
  }

  if (record.tooShort) {
    return (
      <main className="shell">
        <p className="eyebrow">
          {isDemo && <Badge tone="lavender">{t("replayBadge")}</Badge>} {t("resultsEyebrow")}
        </p>
        <h1>{t("tooShortTitle")}</h1>
        <p className="lede">{t("tooShortBody")}</p>
        <Link className="primary link-button" to="/">
          {t("startAgain")}
        </Link>
        <p className="fineprint basis">{t("rubricBasis")}</p>
      </main>
    );
  }

  const weakScores = record.scores.filter((s) => s.status !== "correct" && s.improveTip);
  const ringSize = 200;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = ringDrawn
    ? circumference - (ecve.composite / 100) * circumference
    : circumference;
  const strokeColor = OUTCOME_COLOR[ecve.outcome];

  const pillars = [
    {
      key: "P",
      label: t("ecvePracticalLabel"),
      weight: "60%",
      score: ecve.P,
      reason: "Measured by deterministic checks on your submitted .xlsx workbook."
    },
    {
      key: "U",
      label: t("ecveUnderstandingLabel"),
      weight: "25%",
      score: ecve.U,
      reason: "Evaluated from your AI Viva explanations across rubric criteria."
    },
    {
      key: "C",
      label: t("ecveConsistencyLabel"),
      weight: "15%",
      score: ecve.C,
      reason: "Cross-checked between your spoken claims and spreadsheet facts."
    }
  ];

  return (
    <main className="shell results-shell">
      <JourneyNav activeStage="results" />

      <p className="eyebrow">
        {isDemo && <Badge tone="lavender">{t("replayBadge")}</Badge>} {t("resultsEyebrow")}
      </p>

      <section className="results-hero" aria-label={t("totalLabel")}>
        <div
          className="results-hero-ring"
          role="progressbar"
          aria-valuenow={ecve.composite}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${t("totalLabel")}: ${ecve.composite} out of 100`}
        >
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} aria-hidden="true">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--line)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              className="results-hero-arc"
            />
          </svg>
          <div className="results-hero-center">
            <span className="results-hero-num">{animatedScore}</span>
            <span className="results-hero-denom">/ 100</span>
          </div>
        </div>

        <Badge tone={OUTCOME_TONE[ecve.outcome]} className="results-outcome-pill">
          {ecve.outcome}
        </Badge>
        <p className="lede" style={{ marginBottom: 0 }}>{t("resultIntro")}</p>
      </section>

      {ecve.outcome === "Pending Human Review" && (
        <Card as="section" className="review-calm-card" role="status">
          <strong>A quick human check is needed</strong>
          <p className="fineprint" style={{ margin: "6px 0 0" }}>
            {ecve.reviewExplanation} A reviewer will look over the evidence calmly before finalizing your outcome.
          </p>
        </Card>
      )}

      <section aria-label={t("ecveTitle")} className="pillars-section">
        <div className="pillars-header">
          <h2>{t("ecveTitle")}</h2>
          <div className="popover-anchor">
            <button
              type="button"
              className="info-popover-btn"
              aria-expanded={weightsOpen}
              aria-label="Explain ECVE weights"
              onClick={() => setWeightsOpen((open) => !open)}
            >
              <Info size={16} aria-hidden="true" />
              <span>Weights</span>
            </button>
            {weightsOpen && (
              <div className="info-popover" role="dialog" aria-label="ECVE weight formula">
                <strong>Composite = 0.60P + 0.25U + 0.15C</strong>
                <p className="fineprint" style={{ margin: "4px 0 0" }}>{t("ecveWeightsNote")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="pillars-grid">
          {pillars.map((pillar) => (
            <Card as="article" key={pillar.key} className="pillar-card" padding="sm">
              <div className="pillar-card-top">
                <span className="pillar-label">
                  {pillar.label} <span className="fineprint">({pillar.weight})</span>
                </span>
                <strong className="pillar-score">{pillar.score}%</strong>
              </div>
              <div className="criterion-bar-track" aria-hidden="true">
                <div
                  className="criterion-bar-fill"
                  style={{ width: `${pillar.score}%`, background: strokeColor }}
                />
              </div>
              <p className="fineprint" style={{ margin: "8px 0 0" }}>{pillar.reason}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card as="section" padding="sm" className="scoring-accordion">
        <button
          type="button"
          className="check-row-trigger"
          aria-expanded={accordionOpen}
          onClick={() => setAccordionOpen((open) => !open)}
        >
          <strong>How we scored this</strong>
          <ChevronDown
            size={18}
            className={"check-row-chevron" + (accordionOpen ? " is-open" : "")}
            aria-hidden="true"
          />
        </button>

        {accordionOpen && (
          <div className="scoring-accordion-body">
            <p className="fineprint">
              <strong>{t("criticalGatesLabel")}:</strong>{" "}
              {ecve.criticalGatesPassed ? t("criticalGatesPassed") : t("criticalGatesFailed")}
            </p>
            <p className="fineprint">{ecve.reviewExplanation}</p>
            {record.meterTrace.length >= 2 && (
              <div className="sparkline-section">
                <p className="label">{t("meterProgress")}</p>
                <Sparkline trace={record.meterTrace} />
              </div>
            )}
            <ScoreList record={record} />
            {weakScores.length > 0 && (
              <section className="improve-list">
                <h2>{t("whereToImprove")}</h2>
                {weakScores.map((s) => (
                  <article key={s.criterionId}>
                    <strong>{s.label}</strong>
                    <p>{s.improveTip}</p>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}
      </Card>

      <div className="cta-stack" style={{ marginTop: "24px" }}>
        {ecve.outcome === "Demonstrated" && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={creating}
            onClick={() => void handleCreatePage()}
          >
            {creating ? t("creatingPage") : "Issue my Skill Passport"}
          </Button>
        )}
        <Link className="text-link" to="/">
          {t("startAgain")}
        </Link>
      </div>

      <p className="fineprint basis">{t("rubricBasis")}</p>
    </main>
  );
}
