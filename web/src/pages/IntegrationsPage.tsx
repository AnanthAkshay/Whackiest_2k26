import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clientConfig, getClientIntegrations, type ClientIntegrationItem } from "../config/integrations";
import { JourneyNav } from "../shared/JourneyNav";
import { GlassCard, StatusMark, type StatusTone } from "../shared/ui";

function stateForIntegration(status: string): { label: string; tone: StatusTone } {
  if (/live|active|configured/i.test(status) && !/not configured/i.test(status)) {
    return { label: status, tone: "ok" };
  }
  if (/mock|simulated/i.test(status)) {
    return { label: status, tone: "review" };
  }
  return { label: status, tone: "neutral" };
}

export function IntegrationsPage(): JSX.Element {
  const [items, setItems] = useState<ClientIntegrationItem[]>(getClientIntegrations);
  const [sourceNote, setSourceNote] = useState("Client configuration view");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${clientConfig.apiBase}/api/integrations`);
        if (!res.ok) return;
        const data = (await res.json()) as { integrations?: ClientIntegrationItem[] };
        if (!cancelled && Array.isArray(data.integrations)) {
          setItems(data.integrations);
          setSourceNote("Live backend /api/integrations");
        }
      } catch {
        // Fallback to clientConfig safely
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="shell">
      <div className="pf-frame">
        <JourneyNav activeStage="welcome" />

        <p className="pf-label">Internal Demo · Sponsor &amp; Integration Status</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>Integrations &amp; Sponsor Touchpoints</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>
          Honest status of runtime providers, community sponsors, and optional external link-outs ({sourceNote}).
        </p>

      <GlassCard as="section" className="ruled-list" aria-label="Sponsor integration statuses">
        {items.map((item) => {
          const { label, tone } = stateForIntegration(item.status);
          return (
            <article key={item.id} className="ruled-row status-two-col">
              <div>
                <strong>{item.name}</strong>
                <p style={{ margin: "4px 0" }}>{item.role}</p>
                <p className="fineprint" style={{ margin: 0 }}>{item.note}</p>
                {item.externalUrl && (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-plain-link"
                  >
                    Open External Link ({item.status})
                  </a>
                )}
              </div>
              <div className="status-state-cell">
                <StatusMark tone={tone} size={15} />
                <span className={`status-text status-text--${tone}`}>{label}</span>
              </div>
            </article>
          );
        })}
      </GlassCard>

      <div className="cta-stack" style={{ marginTop: "24px" }}>
        <Link to="/health" className="pf-btn pf-btn--secondary">
          Open System Health (/health)
        </Link>
        <Link to="/" className="hero-plain-link">
          Back to Home
        </Link>
      </div>
      </div>
    </main>
  );
}
