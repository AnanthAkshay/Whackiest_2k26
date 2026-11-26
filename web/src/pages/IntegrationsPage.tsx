import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import {
  clientConfig,
  getClientIntegrations,
  type ClientIntegrationItem
} from "../config/integrations";
import { JourneyNav } from "../shared/JourneyNav";
import { Badge, Card, type BadgeTone } from "../shared/ui";

function badgeToneForStatus(status: string): { tone: BadgeTone; isLive: boolean } {
  if (/live|active|configured/i.test(status) && !/not configured/i.test(status)) {
    return { tone: "ok", isLive: true };
  }
  if (/mock|simulated/i.test(status)) {
    return { tone: "lavender", isLive: false };
  }
  return { tone: "neutral", isLive: false };
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
      <JourneyNav activeStage="welcome" />

      <p className="eyebrow">Internal Demo · Sponsor &amp; Integration Status</p>
      <h1>Integrations &amp; Sponsor Touchpoints</h1>
      <p className="lede">
        Honest status of runtime providers, community sponsors, and optional external link-outs ({sourceNote}).
      </p>

      <section className="status-grid" aria-label="Sponsor integration statuses">
        {items.map((item) => {
          const { tone, isLive } = badgeToneForStatus(item.status);
          return (
            <Card as="article" key={item.id} className="status-grid-card" padding="sm">
              <div className="card-header-row">
                <strong>{item.name}</strong>
                <Badge tone={tone} className="status-badge-with-dot">
                  {isLive && <span className="status-pulse-dot" aria-hidden="true" />}
                  <span>{item.status}</span>
                </Badge>
              </div>
              <p style={{ margin: "4px 0" }}>{item.role}</p>
              <p className="fineprint" style={{ margin: 0 }}>{item.note}</p>
              {item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary link-button"
                >
                  Open External Link ({item.status})
                  <ExternalLink size={14} style={{ marginLeft: "6px" }} aria-hidden="true" />
                </a>
              )}
            </Card>
          );
        })}
      </section>

      <div className="cta-stack" style={{ marginTop: "24px" }}>
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
