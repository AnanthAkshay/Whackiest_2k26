import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import type { ValidationCheckStatus } from "../types";

export function ValidationReportPage(): JSX.Element {
  const { validationReport, setValidationReport, inputMode, chooseInputMode } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!validationReport) {
    return (
      <main className="shell">
        <JourneyNav activeStage="validation" />
        <h1>{t("validationEmptyTitle")}</h1>
        <p className="lede">{t("validationEmptyBody")}</p>
        <button type="button" className="primary" onClick={() => navigate("/challenge")}>
          {t("goToChallenge")}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setValidationReport(createMockValidationReport("retail_sales_cleaned_demo.xlsx", 42500))}
        >
          {t("loadDemoReport")}
        </button>
      </main>
    );
  }

  function statusBadgeLabel(status: ValidationCheckStatus): string {
    if (status === "pass") return t("checkPass");
    if (status === "issue") return t("checkIssue");
    return t("checkNotApplicable");
  }

  return (
    <main className="shell">
      <JourneyNav activeStage="validation" />

      <p className="eyebrow">{t("validationEyebrow")}</p>
      <h1>{t("validationTitle")}</h1>
      <p className="lede">{t("validationBody")}</p>

      {validationReport.isMock && (
        <p className="fineprint mock-disclosure">{t("mockValidationNotice")}</p>
      )}

      <section className="info-card">
        <div className="meter-heading">
          <span>{t("practicalScoreLabel")}</span>
          <strong>{validationReport.practicalScore} / 100</strong>
        </div>
        <p className="fineprint">
          File: <strong>{validationReport.fileName}</strong> · Validator v{validationReport.validatorVersion}
        </p>
        <p className="fineprint sha-line">
          SHA-256: <code>{validationReport.sha256.slice(0, 16)}…</code>
        </p>
      </section>

      <section className="card-list" aria-label={t("objectiveChecksLabel")}>
        {validationReport.checks.map((chk) => (
          <article key={chk.id} className="info-card check-card">
            <div className="card-header-row">
              <strong>{chk.title}</strong>
              <span className={`check-badge check-badge--${chk.status}`}>
                {statusBadgeLabel(chk.status)}
              </span>
            </div>
            <p>{chk.explanation}</p>
            <p className="fineprint">{chk.detail}</p>
          </article>
        ))}
      </section>

      <div className="cta-stack">
        <button
          type="button"
          className="primary large-button"
          onClick={() => {
            chooseInputMode("voice");
            navigate("/session");
          }}
        >
          {t("continueToVoiceViva")}
        </button>
        <button
          type="button"
          className="secondary text-mode-button"
          onClick={() => {
            chooseInputMode("text");
            navigate("/session");
          }}
        >
          {inputMode === "text" ? t("startTextMode") : t("useTextInstead")}
        </button>
      </div>

      <button type="button" className="text-button" onClick={() => navigate("/challenge")}>
        {t("back")}
      </button>
    </main>
  );
}
