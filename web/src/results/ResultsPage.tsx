import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Info } from "@phosphor-icons/react";
import { createCredential, getSkillRecord } from "../api";
import { useTranslation } from "../i18n";
import { computeECVEResult } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { ScoreList } from "../shared/ScoreList";
import { Sparkline } from "../shared/Sparkline";
import {
  Button,
  Card,
  CurrentRow,
  RuledRow,
  Skeleton,
  StatusMark,
  type StatusTone
} from "../shared/ui";
import type { ECVEOutcome, SkillRecord } from "../types";

const OUTCOME_TONE: Record<ECVEOutcome, StatusTone> = {
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
        <div className="pf-frame">
          <p className="loading">{t("loading")}</p>
          <div className="form-stack" style={{ marginTop: "16px" }}>
            <Skeleton variant="title" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        </div>
      </main>
    );
  }

  if (record.tooShort) {
    return (
      <main className="shell">
        <div className="pf-frame">
          <p className="pf-label">
            {isDemo && <span>{t("replayBadge")} · </span>}
            {t("resultsEyebrow")}
          </p>
          <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("tooShortTitle")}</h1>
          <p className="pf-lead" style={{ marginTop: "16px" }}>{t("tooShortBody")}</p>
          <Link className="pf-btn pf-btn--primary" to="/">
            {t("startAgain")}
          </Link>
          <p className="fineprint basis">{t("rubricBasis")}</p>
        </div>
      </main>
    );
  }

  const weakScores = record.scores.filter((s) => s.status !== "correct" && s.improveTip);
  const tone = OUTCOME_TONE[ecve.outcome];

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

  // Highlight the deciding / weakest pillar with CurrentRow lavender
  const weakestKey = pillars.reduce((min, p) => (p.score < min.score ? p : min), pillars[0]).key;

  return (
    <main className="shell results-shell">
      <div className="pf-frame">
        <JourneyNav activeStage="results" />

        <p className="pf-label">
          {isDemo && <span>{t("replayBadge")} · </span>}
          {t("resultsEyebrow")}
        </p>

        <section className="results-hero-left" aria-label={t("totalLabel")}>
          <div style={{ marginBottom: "12px" }}>
            <StatusMark tone={tone} label={ecve.outcome} />
          </div>
          <h1 className="pf-page-title">{ecve.outcome}</h1>
          <div className="results-composite-line tabular-nums">
            <span className="pf-page-title">{ecve.composite}</span>
            <span className="fineprint">/ 100</span>
          </div>
          <p className="pf-lead" style={{ marginTop: "16px", marginBottom: 0 }}>{t("resultIntro")}</p>
        </section>

        {ecve.outcome === "Pending Human Review" && (
          <Card as="section" variant="lavender" className="rule-feedback" role="status">
            <div>
              <StatusMark tone="review" label="Pending human review" />
              <p className="fineprint" style={{ margin: "8px 0 0", color: "#0B0B0B" }}>
                {ecve.reviewExplanation} A reviewer will inspect the evidence before finalizing your outcome.
              </p>
            </div>
          </Card>
        )}

        <section aria-label={t("ecveTitle")} className="pillars-section">
          <div className="pillars-header">
            <h2 className="pf-section-title">{t("ecveTitle")}</h2>
            <div className="popover-anchor">
              <button
                type="button"
                className="info-popover-btn"
                aria-expanded={weightsOpen}
                aria-label="Explain ECVE weights"
                onClick={() => setWeightsOpen((open) => !open)}
              >
                <Info size={16} weight="regular" aria-hidden="true" />
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

          <div className="ruled-table">
            {pillars.map((pillar) => {
              const isDeciding = pillar.key === weakestKey;
              const left = (
                <div>
                  <strong>{pillar.label}</strong> <span className="fineprint">({pillar.weight})</span>
                  <div className="pillar-track" aria-hidden="true" style={{ marginTop: "8px", minWidth: "160px" }}>
                    <div className="pillar-fill" style={{ width: `${pillar.score}%` }} />
                  </div>
                  <p className="fineprint" style={{ margin: "6px 0 0" }}>{pillar.reason}</p>
                </div>
              );
              const right = <strong className="numeral-md tabular-nums">{pillar.score}%</strong>;
              return isDeciding ? (
                <CurrentRow key={pillar.key} label={left} value={right} />
              ) : (
                <RuledRow key={pillar.key} label={left} value={right} />
              );
            })}
          </div>
        </section>

        <Card as="section" className="scoring-open-panel">
          <h2 className="pf-section-title" style={{ marginBottom: "16px" }}>How we scored this</h2>
          <RuledRow
            label={t("criticalGatesLabel")}
            value={ecve.criticalGatesPassed ? t("criticalGatesPassed") : t("criticalGatesFailed")}
          />
          <RuledRow label="Outcome rationale" value={ecve.reviewExplanation} />
          {record.meterTrace.length >= 2 && (
            <div className="sparkline-section" style={{ marginTop: "16px" }}>
              <p className="pf-label">{t("meterProgress")}</p>
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
        </Card>

        <div className="cta-stack" style={{ marginTop: "24px" }}>
          {ecve.outcome === "Demonstrated" && (
            <Button
              variant="dark"
              size="lg"
              fullWidth
              disabled={creating}
              onClick={() => void handleCreatePage()}
            >
              {creating ? t("creatingPage") : "ISSUE MY SKILL PASSPORT"}
            </Button>
          )}
          <Link className="hero-plain-link" to="/">
            {t("startAgain")}
          </Link>
        </div>

        <p className="fineprint basis">{t("rubricBasis")}</p>
      </div>
    </main>
  );
}
