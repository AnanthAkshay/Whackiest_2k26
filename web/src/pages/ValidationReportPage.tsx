import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretDown } from "@phosphor-icons/react";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import {
  Accordion,
  Button,
  Card,
  CopyButton,
  GlassBadge,
  GlassCard,
  GlassPanel,
  InfoNote,
  RuledRow,
  StatusMark
} from "../shared/ui";
import type { ValidationCheckStatus } from "../types";

function formatShaPreview(sha: string): string {
  if (sha.length <= 16) return sha;
  return `${sha.slice(0, 8)}...${sha.slice(-6)}`;
}

export function ValidationReportPage(): JSX.Element {
  const { validationReport, setValidationReport, inputMode, chooseInputMode, language } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  if (!validationReport) {
    return (
      <main className="shell">
        <div className="pf-frame">
          <JourneyNav activeStage="validation" />
          <GlassPanel as="div" className="empty-ghost-wrap" style={{ padding: "32px" }}>
            <span className="pf-label">STEP 3 OF 7: DEMONSTRATE</span>
            <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("validationEmptyTitle")}</h1>
            <p className="pf-lead" style={{ marginTop: "16px" }}>{t("validationEmptyBody")}</p>
            <div className="cta-stack" style={{ maxWidth: "420px", marginTop: "24px" }}>
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
          </GlassPanel>
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

  const passedCount = validationReport.checks.filter((c) => c.status === "pass").length;
  const blockedChecks = validationReport.checks.filter((c) => c.status === "issue");
  const naCount = validationReport.checks.filter((c) => c.status === "not_applicable").length;

  const summaryRows = (
    <>
      <RuledRow label="Role" value="Data Entry Operator" />
      <RuledRow label="Language" value={language.toUpperCase()} />
      <RuledRow label="Mode" value={inputMode === "voice" ? "Voice" : "Text"} />
      <RuledRow label="Workbook" value={validationReport.fileName} />
      <RuledRow label="SHA-256" value={<code className="mono">{formatShaPreview(validationReport.sha256)}</code>} />
      <RuledRow label="Practical score" value={<span className="tabular-nums">{validationReport.practicalScore} / 100</span>} />
    </>
  );

  return (
    <main className="shell validation-shell">
      <div className="pf-frame">
        <JourneyNav activeStage="validation" />

        <GlassPanel as="section" style={{ marginBottom: "24px" }}>
          <div className="card-header-row">
            <span className="pf-label">{t("validationEyebrow")}</span>
            <GlassBadge>{validationReport.isMock ? "Simulated (Mock Mode)" : "Verified"}</GlassBadge>
          </div>
          <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("validationTitle")}</h1>
          <p className="pf-lead" style={{ marginTop: "12px", marginBottom: "16px" }}>{t("validationBody")}</p>
          <div className="meter-heading">
            <span>{t("practicalScoreLabel")}</span>
            <strong className="numeral-md tabular-nums">{validationReport.practicalScore} / 100</strong>
          </div>
          <p className="fineprint" style={{ margin: "4px 0 12px" }}>
            File: <strong>{validationReport.fileName}</strong> · Validator v{validationReport.validatorVersion}
          </p>
          <div className="sha-chip-row">
            <span className="fineprint">SHA-256:</span>
            <code className="mono">{formatShaPreview(validationReport.sha256)}</code>
            <CopyButton text={validationReport.sha256} ariaLabel="Copy SHA-256 fingerprint" />
          </div>
        </GlassPanel>

        <div className="validation-summary-grid">
          <GlassCard as="div" padding="sm">
            <span className="pf-label">Passed</span>
            <div className="ecve-big-num tabular-nums" style={{ margin: "6px 0 0" }}>{passedCount}</div>
          </GlassCard>
          <GlassCard as="div" padding="sm">
            <span className="pf-label">Issues</span>
            <div className="ecve-big-num tabular-nums" style={{ margin: "6px 0 0" }}>{blockedChecks.length}</div>
          </GlassCard>
          <GlassCard as="div" padding="sm">
            <span className="pf-label">Not applicable</span>
            <div className="ecve-big-num tabular-nums" style={{ margin: "6px 0 0" }}>{naCount}</div>
          </GlassCard>
        </div>

        {validationReport.isMock && (
          <p className="fineprint mock-disclosure">{t("mockValidationNotice")}</p>
        )}

        <div className="form-with-summary-grid">
          <div className="form-main-col">
            {/* Solid opaque report surface for technical findings */}
            <Card as="section" aria-label={t("objectiveChecksLabel")}>
              <span className="pf-label">Technical findings</span>
              <div className="ruled-list check-rows-section">
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
                          <StatusMark tone={tone} />
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
                          <span className="cell-ref-chip mono">{chk.detail}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {blockedChecks.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <InfoNote>
                  {blockedChecks.length} check(s) flagged issues in your workbook. Expand any row above to see exact cell references, or continue to explain your work in the AI Viva.
                </InfoNote>
              </div>
            )}
          </div>

          <aside className="summary-col" aria-label="Summary">
            <GlassCard className="summary-panel summary-desktop-only">
              <span className="pf-label">SUMMARY</span>
              <div style={{ marginTop: "12px" }}>{summaryRows}</div>
            </GlassCard>
            <div className="summary-mobile-only">
              <Accordion title="SUMMARY">{summaryRows}</Accordion>
            </div>
          </aside>
        </div>

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
              CONTINUE TO AI VIVA
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
      </div>
    </main>
  );
}
