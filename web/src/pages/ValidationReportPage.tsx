import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Copy, XCircle } from "lucide-react";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { Badge, Button, Card, ProgressRing } from "../shared/ui";
import type { ValidationCheckStatus } from "../types";

function formatShaPreview(sha: string): string {
  if (sha.length <= 16) return sha;
  return `${sha.slice(0, 8)}…${sha.slice(-6)}`;
}

export function ValidationReportPage(): JSX.Element {
  const { validationReport, setValidationReport, inputMode, chooseInputMode } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [shaCopied, setShaCopied] = useState(false);

  if (!validationReport) {
    return (
      <main className="shell">
        <JourneyNav activeStage="validation" />
        <h1>{t("validationEmptyTitle")}</h1>
        <p className="lede">{t("validationEmptyBody")}</p>
        <div className="cta-stack">
          <Button variant="primary" fullWidth onClick={() => navigate("/challenge")}>
            {t("goToChallenge")}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setValidationReport(createMockValidationReport("retail_sales_cleaned_demo.xlsx", 42500))}
          >
            {t("loadDemoReport")}
          </Button>
        </div>
      </main>
    );
  }

  function statusBadgeLabel(status: ValidationCheckStatus): string {
    if (status === "pass") return t("checkPass");
    if (status === "issue") return t("checkIssue");
    return t("checkNotApplicable");
  }

  function statusIcon(status: ValidationCheckStatus): JSX.Element {
    if (status === "pass") {
      return <CheckCircle2 size={18} className="check-icon--ok" aria-hidden="true" />;
    }
    if (status === "issue") {
      return <XCircle size={18} className="check-icon--bad" aria-hidden="true" />;
    }
    return <AlertTriangle size={18} className="check-icon--warn" aria-hidden="true" />;
  }

  function toggleRow(id: string): void {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleCopySha(): Promise<void> {
    if (!validationReport || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(validationReport.sha256);
    setShaCopied(true);
    window.setTimeout(() => setShaCopied(false), 1800);
  }

  return (
    <main className="shell validation-shell">
      <JourneyNav activeStage="validation" />

      <p className="eyebrow">{t("validationEyebrow")}</p>
      <h1>{t("validationTitle")}</h1>
      <p className="lede">{t("validationBody")}</p>

      {validationReport.isMock && (
        <p className="fineprint mock-disclosure">{t("mockValidationNotice")}</p>
      )}

      <Card as="section">
        <div className="result-hero-row">
          <div>
            <div className="meter-heading">
              <span>{t("practicalScoreLabel")}</span>
              <strong>{validationReport.practicalScore} / 100</strong>
            </div>
            <p className="fineprint">
              File: <strong>{validationReport.fileName}</strong> · Validator v{validationReport.validatorVersion}
            </p>
            <div className="sha-chip-row">
              <span className="fineprint">SHA-256:</span>
              <button
                type="button"
                className="sha-copy-chip"
                onClick={() => void handleCopySha()}
                title={validationReport.sha256}
                aria-label="Copy SHA-256 fingerprint"
              >
                <code className="mono">{formatShaPreview(validationReport.sha256)}</code>
                {shaCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <ProgressRing
            value={validationReport.practicalScore}
            size={80}
            strokeWidth={7}
            tone={validationReport.practicalScore >= 75 ? "ok" : "warn"}
            label={t("practicalScoreLabel")}
          />
        </div>
      </Card>

      <Card as="section" padding="sm" className="check-rows-card" aria-label={t("objectiveChecksLabel")}>
        <div className="check-rows-list">
          {validationReport.checks.map((chk) => {
            const isOpen = Boolean(expandedIds[chk.id]);
            const tone = chk.status === "pass" ? "ok" : chk.status === "issue" ? "bad" : "warn";
            return (
              <div key={chk.id} className="check-row">
                <button
                  type="button"
                  className="check-row-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleRow(chk.id)}
                >
                  <span className="check-row-left">
                    {statusIcon(chk.status)}
                    <strong>{chk.title}</strong>
                  </span>
                  <span className="check-row-right">
                    <Badge tone={tone}>{statusBadgeLabel(chk.status)}</Badge>
                    <ChevronDown
                      size={16}
                      className={"check-row-chevron" + (isOpen ? " is-open" : "")}
                      aria-hidden="true"
                    />
                  </span>
                </button>
                {isOpen && (
                  <div className="check-row-details">
                    <p>{chk.explanation}</p>
                    <p className="fineprint mono">{chk.detail}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="sticky-action-bar">
        <div className="sticky-action-bar-inner">
          <Button
            variant="primary"
            size="lg"
            className="sticky-primary-cta"
            onClick={() => {
              chooseInputMode("voice");
              navigate("/session");
            }}
          >
            Continue to Viva
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              chooseInputMode("text");
              navigate("/session");
            }}
          >
            {inputMode === "text" ? t("startTextMode") : t("useTextInstead")}
          </Button>
        </div>
      </div>

      <Button variant="ghost" fullWidth onClick={() => navigate("/challenge")}>
        {t("back")}
      </Button>
    </main>
  );
}
