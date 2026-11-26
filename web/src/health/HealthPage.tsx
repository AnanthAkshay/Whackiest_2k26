import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { finishSession, getHealth, sendTurn, startSession, type HealthReport } from "../api";
import { useTranslation } from "../i18n";
import { Badge, Button, Card, Skeleton } from "../shared/ui";

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

  function statusLabel(svc: { status: "ok" | "mock" | "error"; displayState?: string }): string {
    if (svc.displayState) return svc.displayState;
    if (svc.status === "ok") return t("serviceOk");
    if (svc.status === "mock") return t("serviceMock");
    return t("serviceError");
  }

  return (
    <main className="shell">
      <p className="brand">{t("appName")}</p>
      <p className="eyebrow">{t("healthTitle")}</p>
      <h1>{t("healthTitle")}</h1>
      <p className="lede">{t("healthSubtitle")}</p>

      {loading && (
        <div className="status-grid" aria-label={t("loading")}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
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
        <div className="status-grid">
          {Object.values(report.services)
            .filter((svc): svc is NonNullable<typeof svc> => Boolean(svc))
            .map((svc) => {
              const tone = svc.status === "ok" ? "ok" : svc.status === "mock" ? "lavender" : "neutral";
              return (
                <Card as="article" key={svc.name} className="status-grid-card" padding="sm">
                  <div className="health-card-header">
                    <strong>{svc.name}</strong>
                    <Badge tone={tone} className="status-badge-with-dot">
                      {svc.status === "ok" && <span className="status-pulse-dot" aria-hidden="true" />}
                      <span>{statusLabel(svc)}</span>
                    </Badge>
                  </div>
                  <p className="fineprint" style={{ margin: 0 }}>{svc.message}</p>
                </Card>
              );
            })}
        </div>
      )}

      <div className="health-actions" style={{ marginTop: "24px" }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={runningTest}
          onClick={() => void handleRunTestSession()}
        >
          {runningTest ? t("runningTest") : t("runTestSession")}
        </Button>

        {testResult && (
          <Card as="div" className="cta-spacer" role="status">
            <strong>✓ {t("testSessionSuccess")}</strong>
            <p className="fineprint">
              Session ID: <code className="mono">{testResult.sessionId}</code>
            </p>
            <p className="fineprint">
              Score: <strong>{testResult.total}/100</strong> ({testResult.overallLevel})
            </p>
            <Link className="primary link-button" to={`/results/${testResult.sessionId}`}>
              {t("viewTestResults")}
            </Link>
          </Card>
        )}

        {testError && (
          <Card as="div" variant="error" className="cta-spacer" role="alert">
            <strong>✕ {t("testSessionFailed")}</strong>
            <p style={{ margin: "4px 0 0" }}>{testError}</p>
          </Card>
        )}
      </div>

      <Link className="text-button text-link" to="/">
        {t("backToHome")}
      </Link>
    </main>
  );
}
