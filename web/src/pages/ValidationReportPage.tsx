import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretDown } from "@phosphor-icons/react";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { Button, Card, CopyButton, StatusMark } from "../shared/ui";
import type { ValidationCheckStatus } from "../types";

function formatShaPreview(sha: string): string {
  if (sha.length <= 16) return sha;
  return `${sha.slice(0, 8)}...${sha.slice(-6)}`;
}

export function ValidationReportPage(): JSX.Element {
  const { validationReport, setValidationReport, inputMode, chooseInputMode } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  if (!validationReport) {
    return (
      <main className="shell">
        <JourneyNav activeStage="validation" />
        <div className="empty-ghost-wrap">
          <span className="ghost-numeral" aria-hidden="true">0</span>
          <h1>{t("validationEmptyTitle")}</h1>
          <p className="lede">{t("validationEmptyBody")}</p>
          <div className="cta-stack">
            <Button variant="primary" onClick={() => navigate("/challenge")}>
              {t("goToChallenge")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setValidationReport(createMockValidationReport("retail_sales_cleaned_demo.xlsx", 42500))}
            >
              {t("loadDemoReport")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  function statusBadgeLabel(status: ValidationCheckStatus): string {
    if (status === "pass") return t("checkPass");
    if (status === "issue") return t("checkIssue");
    return t("checkNotApplicable");
  }

  function toneForStatus(status: ValidationCheckStatus): "ok" | "bad" | "warn" {
    if (status === "pass") return "ok";
    if (status === "issue") return "bad";
    return "warn";
  }

  function toggleRow(id: string): void {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
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
        <div className="meter-heading">
          <span>{t("practicalScoreLabel")}</span>
          <strong className="numeral-md">{validationReport.practicalScore} / 100</strong>
        </div>
        <p className="fineprint">
          File: <strong>{validationReport.fileName}</strong> · Validator v{validationReport.validatorVersion}
        </p>
        <div className="sha-chip-row">
          <span className="fineprint">SHA-256:</span>
          <code className="mono">{formatShaPreview(validationReport.sha256)}</code>
          <CopyButton text={validationReport.sha256} ariaLabel="Copy SHA-256 fingerprint" />
        </div>
      </Card>

      <section className="ruled-list check-rows-section" aria-label={t("objectiveChecksLabel")}>
        {validationReport.checks.map((chk) => {
          const isOpen = Boolean(expandedIds[chk.id]);
          const tone = toneForStatus(chk.status);
          return (
            <div key={chk.id} className={`ruled-row check-row check-row--${tone}`}>
              <button
                type="button"
                className="check-row-trigger"
                aria-expanded={isOpen}
                onClick={() => toggleRow(chk.id)}
              >
                <span className="check-row-left">
                  <StatusMark tone={tone} size={17} />
                  <strong>{chk.title}</strong>
                </span>
                <span className="check-row-right">
                  <span className={`status-text status-text--${tone}`}>{statusBadgeLabel(chk.status)}</span>
                  <CaretDown
                    size={16}
                    weight="regular"
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
      </section>

      <div className="sticky-action-bar">
        <div className="sticky-action-bar-inner">
          <Button
            variant="dark"
            size="lg"
            className="sticky-primary-cta"
            onClick={() => {
              chooseInputMode("voice");
              navigate("/session");
            }}
          >
            CONTINUE TO VIVA
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
