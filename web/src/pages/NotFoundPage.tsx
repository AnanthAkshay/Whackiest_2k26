import { Link } from "react-router-dom";

export function NotFoundPage(): JSX.Element {
  return (
    <main className="shell">
      <div className="ref-error-page">
        <span className="ghost-numeral" aria-hidden="true">404</span>
        <div className="ref-error-inner">
          <span className="numeral-hero">404</span>
          <p className="lede">That page isn&apos;t here. Check the link or head back.</p>
          <Link to="/" className="pf-btn pf-btn--primary">
            BACK HOME
          </Link>
        </div>
      </div>
    </main>
  );
}
