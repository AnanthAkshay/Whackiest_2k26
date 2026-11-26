import { Link } from "react-router-dom";
import { GlassPanel } from "../shared/ui";

export function NotFoundPage(): JSX.Element {
  return (
    <main className="shell">
      <div className="pf-frame">
        <div className="ref-error-page">
          <GlassPanel className="ref-error-inner">
            <span className="pf-label">PROOFFOLIO · 404</span>
            <h1 className="pf-page-title" style={{ marginTop: "12px" }}>
              That page isn&apos;t here.
            </h1>
            <p className="pf-lead" style={{ marginTop: "16px" }}>
              Check the link or return to the start of the Prooffolio journey.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginTop: "24px" }}>
              <Link to="/" className="pf-text-link pf-text-link--bold">
                Return home →
              </Link>
              <Link to="/" className="pf-btn pf-btn--primary">
                BACK HOME
              </Link>
            </div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
