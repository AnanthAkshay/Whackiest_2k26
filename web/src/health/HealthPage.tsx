import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { finishSession, getHealth, sendTurn, startSession, type HealthReport } from "../api";
import { useTranslation } from "../i18n";

interface TestSessionResult {
  sessionId: string;
  total: number;
  overallLevel: string;
}

export function HealthPage(): JSX.Element {
  const { t } = useTranslation();
  const [report, setReport] = useState<HealthReport>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<TestSessionResult>();
  const [testError, setTestError] = useState<string>();

  async function loadHealth(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const data = await getHealth();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch health report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  async function handleRunTestSession(): Promise<void> {
    setRunningTest(true);
    setTestError(undefined);
    setTestResult(undefined);
    try {
      const started = await startSession("excel", "en", "new");
      const sid = started.session.id;
      await sendTurn(sid, "The SUM function adds up numbers in a range of cells, such as SUM(A1:A10).");
      const record = await finishSession(sid);
      setTestResult({
        sessionId: sid,
        total: record.total,
        overallLevel: record.overallLevel
      });
      void loadHealth();
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Test session failed");
    } finally {
      setRunningTest(false);
    }
  }

  function statusLabel(status: "ok" | "mock" | "error"): string {
    if (status === "ok") return t("serviceOk");
    if (status === "mock") return t("serviceMock");
    return t("serviceError");
  }

  return (
    <main className="shell">
      <p className="brand">{t("appName")}</p>
      <p className="eyebrow">{t("healthTitle")}</p>
      <h1>{t("healthTitle")}</h1>
      <p className="lede">{t("healthSubtitle")}</p>

      {loading && <p className="loading">{t("loading")}</p>}
      {error && (
        <div className="mic-help" role="alert">
          <p>{error}</p>
          <button className="primary" onClick={() => void loadHealth()}>{t("retry")}</button>
        </div>
      )}

      {report && (
        <div className="tap-stack">
          <article className="tap-card health-card">
            <div className="health-card-header">
              <strong>{report.services.elevenLabs.name}</strong>
              <span className={`status-pill status-${report.services.elevenLabs.status}`}>
                {statusLabel(report.services.elevenLabs.status)}
              </span>
            </div>
            <span>{report.services.elevenLabs.message}</span>
          </article>

          <article className="tap-card health-card">
            <div className="health-card-header">
              <strong>{report.services.bedrock.name}</strong>
              <span className={`status-pill status-${report.services.bedrock.status}`}>
                {statusLabel(report.services.bedrock.status)}
              </span>
            </div>
            <span>{report.services.bedrock.message}</span>
          </article>

          <article className="tap-card health-card">
            <div className="health-card-header">
              <strong>{report.services.store.name}</strong>
              <span className={`status-pill status-${report.services.store.status}`}>
                {statusLabel(report.services.store.status)}
              </span>
            </div>
            <span>{report.services.store.message}</span>
          </article>
        </div>
      )}

      <div className="health-actions">
        <button
          className="primary large-button"
          disabled={runningTest}
          onClick={() => void handleRunTestSession()}
        >
          {runningTest ? t("runningTest") : t("runTestSession")}
        </button>

        {testResult && (
          <div className="test-session-card success-card" role="status">
            <strong>✓ {t("testSessionSuccess")}</strong>
            <p>Session ID: <code>{testResult.sessionId}</code></p>
            <p>Score: <strong>{testResult.total}/100</strong> ({testResult.overallLevel})</p>
            <Link className="primary link-button" to={`/results/${testResult.sessionId}`}>
              {t("viewTestResults")}
            </Link>
          </div>
        )}

        {testError && (
          <div className="test-session-card error-card" role="alert">
            <strong>✕ {t("testSessionFailed")}</strong>
            <p>{testError}</p>
          </div>
        )}
      </div>

      <Link className="text-button text-link" to="/">{t("backToHome")}</Link>
    </main>
  );
}
