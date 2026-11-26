import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { finishSession, getHealth, sendTurn, startSession, type HealthReport } from "../api";
import { useTranslation } from "../i18n";
import { Button, Card, GlassCard, Skeleton, StatusMark, type StatusTone } from "../shared/ui";

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
      setTestResult({ sessionId: sid, total: record.total, overallLevel: record.overallLevel });
      void loadHealth();
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Test session failed");
    } finally {
      setRunningTest(false);
    }
  }

  function stateInfo(svc: { status: "ok" | "mock" | "error"; displayState?: string }): {
    label: string;
    tone: StatusTone;
  } {
    if (svc.status === "ok") return { label: svc.displayState || "LIVE", tone: "ok" };
    if (svc.status === "mock") return { label: svc.displayState || "MOCK", tone: "review" };
    return { label: svc.displayState || "NOT CONFIGURED", tone: "neutral" };
  }

  return (
    <main className="shell">
      <div className="pf-frame">
        <p className="pf-label">{t("healthTitle")}</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("healthTitle")}</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>{t("healthSubtitle")}</p>

      {loading && (
        <div className="ruled-list" aria-label={t("loading")}>
          <div className="ruled-row"><Skeleton variant="text" /></div>
          <div className="ruled-row"><Skeleton variant="text" /></div>
          <div className="ruled-row"><Skeleton variant="text" /></div>
        </div>
      )}

      {error && (
        <Card as="div" variant="error" role="alert">
          <p style={{ margin: "0 0 12px" }}>{error}</p>
          <Button variant="secondary" onClick={() => void loadHealth()}>
            {t("retry")}
          </Button>
        </Card>
      )}

      {report && (
        <GlassCard as="section" className="ruled-list" aria-label="Service statuses">
          {Object.values(report.services)
            .filter((svc): svc is NonNullable<typeof svc> => Boolean(svc))
            .map((svc) => {
              const { label, tone } = stateInfo(svc);
              return (
                <article key={svc.name} className="ruled-row status-two-col">
                  <div>
                    <strong>{svc.name}</strong>
                    <p className="fineprint" style={{ margin: "2px 0 0" }}>{svc.message}</p>
                  </div>
                  <div className="status-state-cell">
                    <StatusMark tone={tone} size={15} />
                    <span className={`status-text status-text--${tone}`}>{label}</span>
                  </div>
                </article>
              );
            })}
        </GlassCard>
      )}

      <div className="health-actions" style={{ marginTop: "24px" }}>
        <Button variant="dark" size="lg" fullWidth disabled={runningTest} onClick={() => void handleRunTestSession()}>
          {runningTest ? t("runningTest") : t("runTestSession")}
        </Button>

        {testResult && (
          <Card as="div" className="cta-spacer" role="status">
            <strong>{t("testSessionSuccess")}</strong>
            <p className="fineprint">
              Session ID: <code className="mono">{testResult.sessionId}</code>
            </p>
            <p className="fineprint">
              Score: <strong>{testResult.total}/100</strong> ({testResult.overallLevel})
            </p>
            <Link className="pf-btn pf-btn--primary" to={`/results/${testResult.sessionId}`}>
              {t("viewTestResults")}
            </Link>
          </Card>
        )}

        {testError && (
          <Card as="div" variant="error" className="cta-spacer" role="alert">
            <strong>{t("testSessionFailed")}</strong>
            <p style={{ margin: "4px 0 0" }}>{testError}</p>
          </Card>
        )}
      </div>

      <Link className="hero-plain-link" style={{ marginTop: "16px" }} to="/">
        {t("backToHome")}
      </Link>
      </div>
    </main>
  );
}
