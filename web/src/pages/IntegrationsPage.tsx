import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  clientConfig,
  getClientIntegrations,
  type ClientIntegrationItem
} from "../config/integrations";
import { JourneyNav } from "../shared/JourneyNav";

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
      <JourneyNav activeStage="welcome" />

      <p className="eyebrow">Internal Demo · Sponsor & Integration Status</p>
      <h1>Integrations & Sponsor Touchpoints</h1>
      <p className="lede">
        Honest status of runtime providers, community sponsors, and optional external link-outs ({sourceNote}).
      </p>

      <section className="card-list" aria-label="Sponsor integration statuses">
        {items.map((item) => (
          <article key={item.id} className="info-card">
            <div className="card-header-row">
              <strong>{item.name}</strong>
              <span className="sample-pill">{item.status}</span>
            </div>
            <p>{item.role}</p>
            <p className="fineprint">{item.note}</p>
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary link-button"
              >
                Open External Link ({item.status})
              </a>
            )}
          </article>
        ))}
      </section>

      <div className="cta-stack">
        <Link to="/health" className="secondary link-button">
          Open System Health (/health)
        </Link>
        <Link to="/" className="text-link">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
